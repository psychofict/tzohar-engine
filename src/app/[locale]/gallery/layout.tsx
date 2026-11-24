import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { requireModule } from "@/lib/modules";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle, pageOpenGraph, routeAlternates } from "@/lib/route-meta";
import { optionalMessage } from "@/lib/optional-message";

/*
 * The gallery's search and share text is the site's own: its title is the page's (Copy field
 * `gallery.title`), its description the Copy field `metadata.galleryDescription`, else the page's
 * subtitle. It was a musician's sentence about "the stage, the road" and "tours, travel, press and
 * releases", with the reference build's share picture by path, on every site that turned the
 * gallery on.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/gallery";
  const tg = await getTranslations({ locale, namespace: "gallery" });
  const tm = await getTranslations({ locale, namespace: "metadata" });
  const title = optionalMessage(tg, "title", "Gallery");
  const fitted = fitTitle(title, site.name);
  const description = clampDescription(
    optionalMessage(tm, "galleryDescription", optionalMessage(tg, "subtitle", `Pictures from ${site.name}.`)),
  );

  return {
    title: fitted,
    description,
    alternates: routeAlternates(path, locale),
    openGraph: pageOpenGraph({ title: fitted.absolute, description, path, locale }),
  };
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  requireModule("gallery");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Gallery", url: canonicalUrl(site.locales.default, "/gallery") },
        ])}
      />
      {children}
    </>
  );
}
