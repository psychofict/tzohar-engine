import type { Metadata } from "next";
import { labelName } from "@/data/roster";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { canonicalUrl } from "@/config/site";
import { routeAlternates } from "@/lib/route-meta";

async function getSpotifyToken(): Promise<string | null> {
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
    next: { revalidate: 3600 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token;
}

async function getArtistMeta(id: string) {
  const token = await getSpotifyToken();
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 86400 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.name as string,
    image: (data.images?.[0]?.url as string) || null,
    genres: (data.genres as string[]) || [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; artist: string }>;
}): Promise<Metadata> {
  const { locale, artist: id } = await params;
  const artist = await getArtistMeta(id);
  const path = `/label/${id}`;
  
  if (!artist) {
    return {
      title: `Artist Profile | ${labelName}`,
      description: `Artist profile on ${labelName}.`,
      alternates: routeAlternates(path, locale),
    };
  }

  const genreText = artist.genres.length > 0
    ? ` — ${artist.genres.slice(0, 3).join(", ")} artist`
    : "";

  return {
    title: `${artist.name}${genreText} | ${labelName}`,
    description: `${artist.name} on ${labelName}. Listen to their latest music, top tracks, and full discography.${genreText ? ` Genres: ${artist.genres.slice(0, 5).join(", ")}.` : ""}`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `${artist.name} | ${labelName}`,
      description: `${artist.name} on ${labelName}. Listen to their latest music and discography.`,
      url: canonicalUrl(locale, path),
      ...(artist.image ? { images: [{ url: artist.image, width: 640, height: 640, alt: artist.name }] } : {}),
    },
  };
}

export default async function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; artist: string }>;
}) {
  const { locale, artist: id } = await params;
  const artist = await getArtistMeta(id);
  const artistName = artist?.name || "Artist";

  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(locale) },
          { name: "Record Label", url: canonicalUrl(locale, "/label") },
          { name: artistName, url: canonicalUrl(locale, `/label/${id}`) },
        ])}
      />
      {children}
    </>
  );
}
