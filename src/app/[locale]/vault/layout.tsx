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
  const path = "/vault";
  
  return {
    title: `The Vault — ${site.name} Inner Circle`,
    description:
      "Join the Inner Circle for first listens, presale access, behind-the-scenes drops and invite-only moments — before they go public.",
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `The Vault — ${site.name} Inner Circle`,
      description: "First listens, presale access and behind-the-scenes drops for superfans.",
      url: canonicalUrl(locale, path),
      images: ["/images/og-image.jpg"],
    },
  };
}

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  requireModule("vault");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "The Vault", url: canonicalUrl(site.locales.default, "/vault") },
        ])}
      />
      {children}
    </>
  );
}
