import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { site, canonicalUrl } from "@/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/contact";
  const canonical = canonicalUrl(locale, path);
  const description = `Get in touch with ${site.name} — speaking invitations, research collaboration, press, and general inquiries.`;

  return {
    title: "Contact",
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, path)]),
        ["x-default", canonicalUrl(site.locales.default, path)],
      ]),
    },
    openGraph: {
      title: `Contact — ${site.name}`,
      description,
      url: canonical,
      images: [{ url: site.brand.ogImage, width: 1200, height: 630, alt: site.name }],
    },
  };
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: site.url },
          { name: "Contact", url: canonicalUrl(site.locales.default, "/contact") },
        ])}
      />
      {children}
    </>
  );
}
