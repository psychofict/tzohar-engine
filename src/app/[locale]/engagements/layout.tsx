import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { requireModule } from "@/lib/modules";
import { site, canonicalUrl } from "@/config/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = canonicalUrl(locale, "/engagements");

  return {
    title: `Engagements — ${site.name}`,
    description: `${site.name}'s public engagements, talks, and features.`,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, "/engagements")]),
        ["x-default", canonicalUrl(site.locales.default, "/engagements")],
      ]),
    },
  };
}

export default function EngagementsLayout({ children }: { children: React.ReactNode }) {
  requireModule("engagements");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: site.url },
          { name: "Engagements", url: canonicalUrl(site.locales.default, "/engagements") },
        ])}
      />
      {children}
    </>
  );
}
