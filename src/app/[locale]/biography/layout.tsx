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
  const canonical = canonicalUrl(locale, "/biography");

  return {
    title: `Biography — ${site.name}`,
    description: site.description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, "/biography")]),
        ["x-default", canonicalUrl(site.locales.default, "/biography")],
      ]),
    },
  };
}

export default function BiographyLayout({ children }: { children: React.ReactNode }) {
  requireModule("biography");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: site.url },
          { name: "Biography", url: canonicalUrl(site.locales.default, "/biography") },
        ])}
      />
      {children}
    </>
  );
}
