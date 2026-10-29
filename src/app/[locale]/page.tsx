import type { Metadata, ResolvingMetadata } from "next";
import { customHome } from "@/lib/custom-pages";
import { clampDescription } from "@/lib/route-meta";
import HomeDefault from "@/components/home/HomeDefault";

/*
 * The home route. A client's own front page (`customHome` in src/custom/pages.tsx,
 * see src/lib/custom-pages.ts) wins; otherwise the composed "home" page or the
 * default composition renders, as before. This file stays a server component so
 * a client page may be async; the default home is a client component of its own.
 */
export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  if (!customHome) return {};
  // A page's openGraph and twitter replace the layout's whole objects, so carry the
  // layout's (its share image included) and change only the words.
  const resolved = await parent;
  const title = customHome.title;
  const description = customHome.description ? clampDescription(customHome.description) : undefined;
  return {
    title: { absolute: title },
    ...(description ? { description } : {}),
    openGraph: { ...resolved.openGraph, title, ...(description ? { description } : {}) },
    twitter: { ...resolved.twitter, title, ...(description ? { description } : {}) },
  } as Metadata;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (customHome) {
    const ClientHome = customHome.component;
    return <ClientHome locale={locale} />;
  }
  return <HomeDefault />;
}
