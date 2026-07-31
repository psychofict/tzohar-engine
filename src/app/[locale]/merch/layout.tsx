import type { Metadata } from "next";
import { merchStoreName, merchDescription } from "@/data/merch";
import { setRequestLocale } from "next-intl/server";
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
  const path = "/merch";
  
  return {
    title: `Merch Store — ${merchStoreName}`,
    description: merchDescription || `Official ${merchStoreName} merchandise.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Merch Store — Coming Soon | ${site.name}`,
      description: merchDescription || `Official ${merchStoreName} merchandise.`,
      url: canonicalUrl(locale, path),
    },
  };
}

export default function MerchLayout({ children }: { children: React.ReactNode }) {
  requireModule("merch");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Merch", url: canonicalUrl(site.locales.default, "/merch") },
        ])}
      />
      {children}
    </>
  );
}
