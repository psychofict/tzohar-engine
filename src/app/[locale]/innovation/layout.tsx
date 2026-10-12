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
  const canonical = canonicalUrl(locale, "/innovation");

  return {
    title: fitTitle(`Innovation — ${site.name}`, site.name),
    description: clampDescription(`${site.name}'s innovation projects, from research breakthroughs to real-world solutions.`),
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, "/innovation")]),
        ["x-default", canonicalUrl(site.locales.default, "/innovation")],
      ]),
    },
  };
}

export default function InnovationLayout({ children }: { children: React.ReactNode }) {
  requireModule("innovation");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: site.url },
          { name: "Innovation", url: canonicalUrl(site.locales.default, "/innovation") },
        ])}
      />
      {children}
    </>
  );
}
