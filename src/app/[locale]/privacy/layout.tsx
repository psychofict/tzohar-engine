import type { Metadata } from "next";
import { site } from "@/config/site";
import { clampDescription, fitTitle, pageOpenGraph, routeAlternates } from "@/lib/route-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = "/privacy";
  const fitted = fitTitle("Privacy Policy", site.name);
  // True of every site: the notice lists only what this one collects (src/lib/privacy-facts.ts),
  // so the description no longer promises a newsletter or a contact form it may not have.
  const description = clampDescription(
    `How the ${site.name} website handles the personal data it collects, who runs it and how to reach them.`,
  );

  return {
    title: fitted,
    description,
    alternates: routeAlternates(path, locale),
    openGraph: pageOpenGraph({ title: fitted.absolute, description, path, locale }),
  };
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
