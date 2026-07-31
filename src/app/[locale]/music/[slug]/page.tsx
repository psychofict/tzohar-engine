import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { releases, getReleaseBySlug } from "@/data/releases";
import ReleaseClient from "./ReleaseClient";
import { routeAlternates } from "@/lib/route-meta";
import { canonicalUrl } from "@/config/site";
import { site } from "@/config/site";
import { artist } from "@/data/artist";

const artistName = artist.name || site.name;

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return releases.flatMap((r) =>
    routing.locales.map((locale) => ({ locale, slug: r.slug }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const release = getReleaseBySlug(slug);
  if (!release) return {};
  const title = `${release.title} — ${artistName}`;
  const description = `Listen to ${release.title} (${release.year}) by ${artistName}. ${release.tracklist.length} track ${release.type} featuring ${release.genres.join(", ")}.`;
  const path = `/music/${slug}`;
  
  return {
    title: release.title,
    description,
    openGraph: {
      title,
      description,
      type: "music.album",
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

export default async function ReleasePage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const release = getReleaseBySlug(slug);

  if (!release) {
    notFound();
  }

  return <ReleaseClient release={release} />;
}
