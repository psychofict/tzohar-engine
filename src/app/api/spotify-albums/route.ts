import { NextResponse } from "next/server";

let tokenCache: { token: string; expiry: number } | null = null;
let albumCache: { data: Record<string, AlbumInfo>; expiry: number } | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

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

  // Return cached data if fresh
  if (albumCache && Date.now() < albumCache.expiry) {
    const idList = rawIds;
    const allCached = idList.every((id) => id in albumCache!.data);
    if (allCached) {
      const result: Record<string, AlbumInfo> = {};
      idList.forEach((id) => { result[id] = albumCache!.data[id]; });
      return NextResponse.json(result, {
        headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
      });
    }
  }

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Spotify credentials not configured" }, { status: 500 });
  }

  const idList = rawIds;
  const result: Record<string, AlbumInfo> = {};
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch albums individually to avoid 403 on batch endpoint
  const fetchAlbum = async (id: string) => {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/albums/${id}?market=US`,
        { headers }
      );
      if (!res.ok) return;
      const album = await res.json();
      result[album.id] = {
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
  for (let i = 0; i < idList.length; i += 5) {
    await Promise.all(idList.slice(i, i + 5).map(fetchAlbum));
  }

  // Merge into cache
  if (!albumCache) {
    albumCache = { data: result, expiry: Date.now() + CACHE_DURATION };
  } else {
    albumCache.data = { ...albumCache.data, ...result };
    albumCache.expiry = Date.now() + CACHE_DURATION;
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" },
  });
}
