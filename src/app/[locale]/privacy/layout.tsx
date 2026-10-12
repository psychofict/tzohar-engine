import type { Metadata } from "next";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle } from "@/lib/route-meta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = canonicalUrl(locale, "/privacy");

  return {
    title: fitTitle("Privacy Policy", site.name),
    description: clampDescription(`How ${site.name}'s website handles the data it collects directly — newsletter, contact, analytics and cookies.`),
    alternates: { canonical },
  };
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
