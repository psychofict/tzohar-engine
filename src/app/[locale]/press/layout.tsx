import type { Metadata } from "next";
import { pressHeroImage } from "@/data/press";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { requireModule } from "@/lib/modules";
import { site, canonicalUrl } from "@/config/site";
import { routeAlternates } from "@/lib/route-meta";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/press";
  
  return {
    title: `Press & Media Kit — ${site.name} EPK`,
    description:
      `Download ${site.name}'s electronic press kit — bio, press photos, logo assets, and streaming links.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Press & Media Kit — ${site.name} EPK`,
      description:
        `Download ${site.name}'s electronic press kit — bio, press photos, logo assets, and streaming links.`,
      url: canonicalUrl(locale, path),
      ...(pressHeroImage
        ? { images: [{ url: pressHeroImage, width: 1200, height: 630, alt: `${site.name} — Press & Media Kit` }] }
        : {}),
    },
  };
}

export default function PressLayout({ children }: { children: React.ReactNode }) {
  requireModule("press");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Press", url: canonicalUrl(site.locales.default, "/press") },
        ])}
      />
      {children}
    </>
  );
}
