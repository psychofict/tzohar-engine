import type { Metadata } from "next";
import { requireModule } from "@/lib/modules";
import { setRequestLocale } from "next-intl/server";
import { site, canonicalUrl } from "@/config/site";
import { routeAlternates } from "@/lib/route-meta";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/links";
  
  return {
    title: "All Platforms & Socials",
    description:
      `Find ${site.name} on all platforms — Spotify, Apple Music, Instagram, Twitter, SoundCloud, and more. One link for everything.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `All Platforms & Socials | ${site.name}`,
      description: `Find ${site.name} on all platforms. One link for everything.`,
      url: canonicalUrl(locale, path),
    },
  };
}

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  requireModule("links");
  return <>{children}</>;
}
