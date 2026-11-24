import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle, pageOpenGraph, routeAlternates } from "@/lib/route-meta";
import { optionalMessage } from "@/lib/optional-message";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/contact";

  /*
   * The site's own words, from the `metadata` namespace (Copy field `metadata.contactDescription`),
   * as /about reads its own. This was a fixed sentence written for a researcher ("speaking
   * invitations, research collaboration, press"), which a ceramics studio's contact page then
   * published to search engines.
   */
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = optionalMessage(t, "contactTitle", "Contact");
  const description = clampDescription(optionalMessage(t, "contactDescription", `Get in touch with ${site.name}.`));

  const fitted = fitTitle(title, site.name);
  return {
    title: fitted,
    description,
    alternates: routeAlternates(path, locale),
    openGraph: pageOpenGraph({ title: fitted.absolute, description, path, locale }),
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
