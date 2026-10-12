import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle } from "@/lib/route-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/about";
  const canonical = canonicalUrl(locale, path);

  /*
   * This page used to carry `site.description`, which is the HOME page's
   * description — so every client site published two pages claiming to be about
   * the same thing, and a search engine picks one and drops the other. The
   * `metadata` namespace already holds per-page copy the client has approved;
   * it just was not being read. Falling back keeps a site that has not written
   * one working.
   */
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t.has("aboutTitle") ? t("aboutTitle") : "About";
  const description = t.has("aboutDescription") ? t("aboutDescription") : site.description;

  return {
    /*
     * `aboutTitle` in the reference build reads "About Ebstar", and the locale
     * layout's `%s | <site>` template turned that into "About Ebstar | Ebstar" in
     * all five locales. fitTitle leaves a title that already names the site alone
     * and appends the name to one that does not, so the engine's own "About"
     * fallback still gets it.
     */
    title: fitTitle(title, site.name),
    description: clampDescription(description),
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, path)]),
        ["x-default", canonicalUrl(site.locales.default, path)],
      ]),
    },
    openGraph: {
      title: `${title} — ${site.name}`,
      description,
      url: canonical,
      images: [{ url: site.brand.ogImage, width: 1200, height: 630, alt: site.name }],
    },
  };
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: site.url },
          { name: "About", url: canonicalUrl(site.locales.default, "/about") },
        ])}
      />
      {children}
    </>
  );
}
