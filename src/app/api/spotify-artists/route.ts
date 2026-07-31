import { NextResponse } from "next/server";
import { rosterArtists } from "@/data/roster";

interface SpotifyArtistResult {
  name: string;
  image: string | null;
  url: string | null;
}

let tokenCache: { token: string; expiry: number } | null = null;
let artistCache: { data: Record<string, SpotifyArtistResult>; expiry: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

async function searchArtist(token: string, name: string): Promise<SpotifyArtistResult> {
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=3`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return { name, image: null, url: null };

  const data = await res.json();
  const artists = data.artists?.items;
  if (!artists || artists.length === 0) return { name, image: null, url: null };

  // Try to find exact name match first
  const exact = artists.find(
    (a: { name: string }) => a.name.toLowerCase() === name.toLowerCase()
  );
  const artist = exact || artists[0];

  return {
    name: artist.name,
    image: artist.images?.[0]?.url || null,
    url: artist.external_urls?.spotify || null,
  };
}

export async function GET() {
  // Return cached data if fresh
  if (artistCache && Date.now() < artistCache.expiry) {
    return NextResponse.json(artistCache.data, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
    });
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Spotify credentials not configured" }, { status: 500 });
  }

  /*
   * The label's own roster, from roster.json. It was an eighteen-name literal
   * here, so this endpoint searched Spotify for the reference build's artists
   * on every client's domain and cached the results as if they were theirs.
   */
  const roster = rosterArtists.map((a) => a.name);
  if (roster.length === 0) {
    return NextResponse.json({}, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
    });
  }

  const results: Record<string, SpotifyArtistResult> = {};

  // Fetch in batches of 5 to avoid rate limits
  for (let i = 0; i < roster.length; i += 5) {
    const batch = roster.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map((name) => searchArtist(token, name))
    );
    batch.forEach((name, j) => {
      results[name] = batchResults[j];
    });
  }

  artistCache = { data: results, expiry: Date.now() + CACHE_DURATION };

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
  });
}
