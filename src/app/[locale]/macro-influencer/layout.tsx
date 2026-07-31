import type { Metadata } from "next";
import { influencerHeroImage } from "@/data/influencer";
import { setRequestLocale } from "next-intl/server";
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
  const path = "/macro-influencer";
  
  return {
    title: "Macro Influencer — Partnerships, Events & Government",
    description: `Partnerships, events and public roles — ${site.name}.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Macro Influencer — Partnerships, Events & Government | ${site.name}`,
      description: `Partnerships, events and public roles — ${site.name}.`,
      url: canonicalUrl(locale, path),
      ...(influencerHeroImage
        ? { images: [{ url: influencerHeroImage, width: 1200, height: 630, alt: `${site.name} — partnerships and public roles` }] }
        : {}),
    },
  };
}

export default function MacroInfluencerLayout({ children }: { children: React.ReactNode }) {
  requireModule("influencer");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Macro Influencer", url: canonicalUrl(site.locales.default, "/macro-influencer") },
        ])}
      />
      {children}
    </>
  );
}
