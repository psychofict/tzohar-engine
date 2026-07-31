import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { requireModule } from "@/lib/modules";
import { getOrganizationSchema } from "@/lib/structured-data-label";
import { site, canonicalUrl } from "@/config/site";
import { routeAlternates } from "@/lib/route-meta";
import { label, labelName } from "@/data/roster";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/label";

  // From roster.json. These were the reference build's label name, artist count
  // and stream total, hardcoded — so a client's own label page was titled and
  // described as somebody else's, in the two places SEO actually reads.
  const title = label.name ? `${labelName} — Independent Record Label` : "Record Label";
  const description = label.description || `The record label of ${site.name}.`;

  return {
    title,
    description,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: canonicalUrl(locale, path),
      ...(label.ogImage
        ? { images: [{ url: label.ogImage, width: 1200, height: 630, alt: title }] }
        : {}),
    },
  };
}

export default function LabelLayout({ children }: { children: React.ReactNode }) {
  requireModule("label");
  const organization = getOrganizationSchema();
  return (
    <>
      {/* The label's Organization schema belongs on the label's pages, not sitewide.
          Omitted entirely when no label is configured: a nameless Organization is
          worse than none, because structured data is machine-read and believed. */}
      {organization && <JsonLd data={organization} />}
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Record Label", url: canonicalUrl(site.locales.default, "/label") },
        ])}
      />
      {children}
    </>
  );
}
