import type { Metadata } from "next";
import { site, canonicalUrl } from "@/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = canonicalUrl(locale, "/privacy");

  return {
    title: "Privacy Policy",
    description: `How ${site.name}'s website handles the data it collects directly — newsletter, contact, analytics and cookies.`,
    alternates: { canonical },
  };
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
