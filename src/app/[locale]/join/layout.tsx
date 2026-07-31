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
  const path = "/join";
  
  return {
    title: `Membership — Join the Inner Circle | ${site.name}`,
    description:
      `Become an ${site.name} Insider: first listens, presale access, behind-the-scenes drops and invite-only moments. Plans from $6/mo, cancel anytime.`,
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `Membership — Join the Inner Circle | ${site.name}`,
      description: "First listens, presale access and behind-the-scenes drops. Plans from $6/mo.",
      url: canonicalUrl(locale, path),
      images: ["/images/og-image.jpg"],
    },
  };
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  requireModule("membership");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "Membership", url: canonicalUrl(site.locales.default, "/join") },
        ])}
      />
      {children}
    </>
  );
}
