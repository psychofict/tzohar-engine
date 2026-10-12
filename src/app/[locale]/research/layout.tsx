import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { requireModule } from "@/lib/modules";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle } from "@/lib/route-meta";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = canonicalUrl(locale, "/research");

  return {
    title: fitTitle(`Research — ${site.name}`, site.name),
    description: clampDescription(`${site.name}'s research interests, publications, and academic credentials.`),
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, "/research")]),
        ["x-default", canonicalUrl(site.locales.default, "/research")],
      ]),
    },
  };
}

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  requireModule("research");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: site.url },
          { name: "Research", url: canonicalUrl(site.locales.default, "/research") },
        ])}
      />
      {children}
    </>
  );
}
