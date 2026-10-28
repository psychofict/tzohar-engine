import { NextResponse } from "next/server";
import { BoundedCache, SPOTIFY_MISS_TTL_MS, allowSpotifyCall, knownAlbumIds, noteSpotifyAnswer, spotifyResting } from "@/lib/spotify-guard";

let tokenCache: { token: string; expiry: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;
// One entry per album, each with its own fixed expiry; only the discography's albums are ever
// stored, so the cap is a backstop (TZS-11).
const albumCache = new BoundedCache<AlbumInfo>(500, CACHE_DURATION);
// Albums Spotify says do not exist (400 or 404), left alone for an hour; a 429 or an error is
// tried again next time.
const albumMisses = new BoundedCache<true>(500, SPOTIFY_MISS_TTL_MS);

interface AlbumInfo {
  image: string | null;
  name: string;
  tracks: number;
  releaseDate: string;
  label: string;
}

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");

  if (!ids) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  // Validate ids: max 50, alphanumeric only
  const rawIds = ids.split(",").filter(Boolean);
  if (rawIds.length === 0 || rawIds.length > 50 || rawIds.some((id) => !/^[a-zA-Z0-9]+$/.test(id))) {
    return NextResponse.json({ error: "Invalid ids parameter" }, { status: 400 });
  }

  // Only albums the site's own discography names are looked up: the site's Spotify app is not a
  // proxy for anyone's ids (TZS-11).
  const known = knownAlbumIds();
  if (rawIds.some((id) => !known.has(id))) {
    return NextResponse.json({ error: "Invalid ids parameter" }, { status: 400 });
  }
  const idList = [...new Set(rawIds)];

  // Return cached data if fresh
  const result: Record<string, AlbumInfo> = {};
  const missing: string[] = [];
  for (const id of idList) {
    const hit = albumCache.get(id);
    if (hit) result[id] = hit;
    else if (!albumMisses.get(id)) missing.push(id);
  }
  // Only a complete answer is cached at the edge for a day; one whose missing covers Spotify said
  // do not exist (left alone for an hour) for an hour; one that lacks a cover Spotify did not give
  // this time is sent uncached, so the next visitor's request can fill it in.
  const cacheHeader = () => ({
    "Cache-Control": idList.every((id) => id in result)
      ? "public, s-maxage=86400, stale-while-revalidate=172800"
      : idList.every((id) => id in result || albumMisses.get(id))
        ? "public, s-maxage=3600"
        : "no-store",
  });
  if (missing.length === 0) return NextResponse.json(result, { headers: cacheHeader() });

  // Refused (the caller's limit, or a store that does not answer): the covers already cached are
  // still sent, uncached, so only the missing ones are left out of the page.
  // While Spotify is limiting the site's app, nobody's request goes to it.
  if (spotifyResting()) return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  const allowed = await allowSpotifyCall(request);
  if (!allowed.ok) return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Spotify credentials not configured" }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${token}` };

  const notFound = new Set<string>();
  // Fetch albums individually to avoid 403 on batch endpoint
  const fetchAlbum = async (id: string) => {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/albums/${id}?market=US`,
        { headers }
      );
      noteSpotifyAnswer(res);
      if (!res.ok) {
        if (res.status === 400 || res.status === 404) notFound.add(id);
        return;
      }
      const album = await res.json();
      // Stored under the id asked for, which the site's data names, never under one Spotify sent.
      result[id] = {
        image: album.images?.[0]?.url || null,
        name: album.name,
        tracks: album.total_tracks,
        releaseDate: album.release_date,
        label: album.label || "",
      };
    } catch {
      // skip failed albums
    }
  };

  // Fetch in batches of 5 to avoid rate limits
  for (let i = 0; i < missing.length; i += 5) {
    await Promise.all(missing.slice(i, i + 5).map(fetchAlbum));
  }
  for (const id of missing) {
    if (result[id]) albumCache.set(id, result[id]);
    else if (notFound.has(id)) albumMisses.set(id, true);
  }

  return NextResponse.json(result, { headers: cacheHeader() });
}
