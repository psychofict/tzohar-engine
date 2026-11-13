import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import JsonLd from "@/components/JsonLd";
import { getBreadcrumbSchema } from "@/lib/structured-data";
import { requireModule } from "@/lib/modules";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle, routeAlternates } from "@/lib/route-meta";
import { heroes } from "@/data/artist";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/ai";
  
  return {
    title: fitTitle(`AI/ML & Software Engineer — ${site.name}`, site.name),
    description: clampDescription("MSc in AI, Korea University. Five papers in computer vision, machine learning and large language models in top AI conferences and journals."),
    alternates: routeAlternates(path, locale),
    openGraph: {
      title: `AI/ML & Software Engineer — ${site.name}`,
      description:
        "AI/ML and Software Engineer. MSc in AI, Korea University. Five papers in computer vision, machine learning and large language models in top AI conferences and journals. 10+ shipped products.",
      url: canonicalUrl(locale, path),
      ...(heroes.ai
        ? { images: [{ url: heroes.ai.image, width: 1200, height: 630, alt: `${site.name} — AI/ML engineering` }] }
        : {}),
    },
  };
}

export default function AILayout({ children }: { children: React.ReactNode }) {
  requireModule("ai");
  return (
    <>
      <JsonLd
        data={getBreadcrumbSchema([
          { name: "Home", url: canonicalUrl(site.locales.default) },
          { name: "AI/ML Engineer", url: canonicalUrl(site.locales.default, "/ai") },
        ])}
      />
      {children}
    </>
  );
}
