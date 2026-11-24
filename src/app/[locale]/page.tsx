import type { Metadata, ResolvingMetadata } from "next";
import { customHome } from "@/lib/custom-pages";
import { clampDescription } from "@/lib/route-meta";
import { hasModule } from "@/config/site";
import { getComposedPage } from "@/data/pages";
import HomeDefault from "@/components/home/HomeDefault";
import { postCategories, posts, postSummaries } from "@/data/posts";

/*
 * The home route. A client's own front page (`customHome` in src/custom/pages.tsx,
 * see src/lib/custom-pages.ts) wins; otherwise the composed "home" page or the
 * default composition renders, as before. This file stays a server component so
 * a client page may be async; the default home is a client component of its own.
 */
export async function generateMetadata(_props: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  /*
   * The words come from the client's own front page, else from the composed home page's `seo`
   * (title and description, as Studio's page settings write them), else the layout's site-wide
   * ones stand. The composed home's description was ignored, so the Kopje Light demo's home page
   * published the site description instead of the one written for it.
   */
  const composed = !customHome && hasModule("pages") ? getComposedPage("home") : undefined;
  const words = customHome
    ? { title: customHome.title, description: customHome.description }
    : { title: composed?.seo?.title, description: composed?.seo?.description };
  if (!words.title && !words.description) return {};
  // A page's openGraph and twitter replace the layout's whole objects, so carry the
  // layout's (its share image included) and change only the words.
  const resolved = await parent;
  const title = words.title?.trim() || undefined;
  const description = words.description?.trim() ? clampDescription(words.description) : undefined;
  return {
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    openGraph: { ...resolved.openGraph, ...(title ? { title } : {}), ...(description ? { description } : {}) },
    twitter: { ...resolved.twitter, ...(title ? { title } : {}), ...(description ? { description } : {}) },
  } as Metadata;
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (customHome) {
    const ClientHome = customHome.component;
    return <ClientHome locale={locale} />;
  }
  // Resolved to summaries here, on the server, and handed down: the home tree is a client component.
  return <HomeDefault postData={{ posts: postSummaries(posts), postCategories }} />;
}
