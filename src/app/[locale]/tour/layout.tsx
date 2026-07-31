import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
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
  const path = "/tour";
  
  return {
    title: `Tour Dates 2026 — ${site.name} Live`,
    description:
      `${site.name} (엡스타) live tour dates and performances for 2026. Find upcoming shows, venues, and ticket links worldwide.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Tour Dates 2026 — ${site.name} Live`,
      description:
        `${site.name} (엡스타) live tour dates and performances for 2026. Find upcoming shows, venues, and ticket links.`,
      url: canonicalUrl(locale, path),
      ...(heroes.tour ?? heroes.music
        ? { images: [{ url: (heroes.tour ?? heroes.music)!.image, width: 1200, height: 630, alt: `${site.name} Live — Tour Dates & Performances` }] }
        : {}),
    },
  };
}

export default function TourLayout({ children }: { children: React.ReactNode }) {
  requireModule("tour");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Tour", url: canonicalUrl(site.locales.default, "/tour") },
        ])}
      />
      {children}
    </>
  );
}
