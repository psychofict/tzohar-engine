import type { Metadata } from "next";
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
  const path = "/gallery";
  
  return {
    title: `Gallery — ${site.name}`,
    description:
      `Photos from the stage, the road, and the milestones — ${site.name} across tours, travel, press and releases.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Gallery — ${site.name}`,
      description: "Photos from the stage, the road, and the milestones.",
      url: canonicalUrl(locale, path),
      images: ["/images/og-image.jpg"],
    },
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
