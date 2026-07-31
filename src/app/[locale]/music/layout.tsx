import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { getMusicGroupSchema } from "@/lib/structured-data-music";
import { requireModule } from "@/lib/modules";
import { site, canonicalUrl } from "@/config/site";
import { routeAlternates } from "@/lib/route-meta";
import { heroes } from "@/data/artist";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/music";
  
  return {
    title: `Music & Releases — ${site.name}`,
    description:
      `Stream ${site.name}'s (엡스타) music — 5M+ streams across piano house, dance-pop, and Amapiano. Latest singles, albums & playlists.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Music & Releases — ${site.name}`,
      description:
        `Stream ${site.name}'s music — 5M+ streams across piano house, dance-pop, and Amapiano. Latest singles, albums & playlists.`,
      url: canonicalUrl(locale, path),
      type: "profile",
      ...(heroes.music
        ? { images: [{ url: heroes.music.image, width: 1200, height: 630, alt: `${site.name} — music` }] }
        : {}),
    },
  };
}

export default function MusicLayout({ children }: { children: React.ReactNode }) {
  const musicGroup = getMusicGroupSchema();
  requireModule("music");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Music", url: canonicalUrl(site.locales.default, "/music") },
        ])}
      />
      {/*
        The MusicGroup schema belongs here rather than in the root layout. Emitted
        sitewide it claimed every page was about a music group, and it forced the
        discography into a core file that shipped to every client — including the
        ones with no music module.
      */}
      {musicGroup && <JsonLd data={musicGroup} />}
      {children}
    </>
  );
}
