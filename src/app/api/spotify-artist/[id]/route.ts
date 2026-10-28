import { NextResponse } from "next/server";
import { BoundedCache, SPOTIFY_MISS_TTL_MS, allowSpotifyCall, knownArtistIds, noteSpotifyAnswer, spotifyResting } from "@/lib/spotify-guard";

let tokenCache: { token: string; expiry: number } | null = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
// Only the roster's artists are ever stored, so the cap is a backstop (TZS-11).
const artistDetailCache = new BoundedCache<unknown>(200, CACHE_DURATION);
// Artists Spotify says do not exist (400 or 404), left alone for an hour.
const artistMisses = new BoundedCache<true>(200, SPOTIFY_MISS_TTL_MS);

async function getAccessToken(): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expiry) {
    return tokenCache.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) return null;

  const data = await res.json();
  tokenCache = { token: data.access_token, expiry: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^[a-zA-Z0-9]+$/.test(id)) {
    return NextResponse.json({ error: "Invalid artist ID" }, { status: 400 });
  }

  // Only an artist on the site's own roster is looked up: the site's Spotify app is not a proxy
  // for anyone's ids (TZS-11).
  if (!knownArtistIds().has(id) || artistMisses.get(id)) {
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }

  // Return cached data if fresh
  const cached = artistDetailCache.get(id);
  if (cached !== undefined) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
    });
  }

  // While Spotify is limiting the site's app, nobody's request goes to it.
  if (spotifyResting()) return NextResponse.json({ error: "Temporarily unavailable." }, { status: 503, headers: { "retry-after": "60" } });
  const allowed = await allowSpotifyCall(request);
  if (!allowed.ok) {
    return NextResponse.json(
      { error: allowed.status === 429 ? "Too many requests. Try again later." : "Temporarily unavailable." },
      { status: allowed.status, headers: allowed.status === 429 ? { "retry-after": "600" } : undefined },
    );
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Spotify credentials not configured" }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [artistRes, tracksRes, albumsRes, relatedRes] = await Promise.all([
      fetch(`https://api.spotify.com/v1/artists/${id}`, { headers }),
      fetch(`https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`, { headers }),
      fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album,single&limit=20`, { headers }),
      fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, { headers }),
    ]);

    for (const r of [artistRes, tracksRes, albumsRes, relatedRes]) noteSpotifyAnswer(r);
    if (!artistRes.ok) {
      if (artistRes.status === 400 || artistRes.status === 404) artistMisses.set(id, true);
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // A passing failure (429, 5xx) of one of the three lists makes the answer partial: sent, but
    // not cached here or at the edge. A 404 is a real "none" (Spotify no longer serves related
    // artists to new apps), so it does not.
    const partial = [tracksRes, albumsRes, relatedRes].some((r) => r.status === 429 || r.status >= 500);
    const [artistData, tracksData, albumsData, relatedData] = await Promise.all([
      artistRes.json(),
      tracksRes.ok ? tracksRes.json() : { tracks: [] },
      albumsRes.ok ? albumsRes.json() : { items: [] },
      relatedRes.ok ? relatedRes.json() : { artists: [] },
    ]);

    const result = {
      name: artistData.name,
      image: artistData.images?.[0]?.url || null,
      url: artistData.external_urls?.spotify || null,
      followers: artistData.followers?.total || 0,
      genres: artistData.genres || [],
      popularity: artistData.popularity || 0,
      topTracks: (tracksData.tracks || []).map(
        (t: {
          name: string;
          album: { name: string; images: { url: string }[] };
          duration_ms: number;
          external_urls: { spotify: string };
        }) => ({
          name: t.name,
          albumName: t.album?.name || "",
          albumImage: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
          durationMs: t.duration_ms,
          spotifyUrl: t.external_urls?.spotify || null,
        })
      ),
      albums: (albumsData.items || []).map(
        (a: {
          name: string;
          images: { url: string }[];
          release_date: string;
          total_tracks: number;
          album_type: string;
          id: string;
          external_urls: { spotify: string };
        }) => ({
          name: a.name,
          image: a.images?.[0]?.url || null,
          releaseDate: a.release_date,
          totalTracks: a.total_tracks,
          type: a.album_type,
          spotifyId: a.id,
          spotifyUrl: a.external_urls?.spotify || null,
        })
      ),
      relatedArtists: (relatedData.artists || []).slice(0, 8).map(
        (r: {
          name: string;
          id: string;
          images: { url: string }[];
          genres: string[];
          followers: { total: number };
        }) => ({
          name: r.name,
          spotifyId: r.id,
          image: r.images?.[1]?.url || r.images?.[0]?.url || null,
          genres: (r.genres || []).slice(0, 2),
          followers: r.followers?.total || 0,
        })
      ),
    };

    if (partial) return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
    artistDetailCache.set(id, result);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch artist data" }, { status: 500 });
  }
}
