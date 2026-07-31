import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { rosterArtists, getRosterArtistById, labelName } from "@/data/roster";
import ArtistClient from "./ArtistClient";
import { routeAlternates } from "@/lib/route-meta";
import { canonicalUrl } from "@/config/site";

interface Props {
  params: Promise<{ artist: string; locale: string }>;
}

export async function generateStaticParams() {
  return rosterArtists.flatMap((a) =>
    routing.locales.map((locale) => ({ locale, artist: a.spotifyId }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artist, locale } = await params;
  const rosterArtist = getRosterArtistById(artist);
  const name = rosterArtist?.name ?? "Artist";
  const path = `/label/${artist}`;
  
  // labelName, not a literal — this route used to title every client's artist
  // pages after the reference build's label.
  const title = `${name} — ${labelName}`;
  const description = `${name} artist profile on ${labelName}. Explore top tracks, discography, and related artists.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonicalUrl(locale, path),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: routeAlternates(path, locale),
  };
}

export default async function ArtistProfilePage({ params }: Props) {
  const { artist, locale } = await params;
  setRequestLocale(locale);
  const rosterArtist = getRosterArtistById(artist);

  if (!rosterArtist) {
    notFound();
  }

  return <ArtistClient artistId={artist} />;
}
