import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site, canonicalUrl } from "@/config/site";
import { requireModule } from "@/lib/modules";
import { getComposedPage, routedPages } from "@/data/pages";
import { postCategories, posts, postSummaries } from "@/data/posts";
import PreviewablePage from "@/components/preview/PreviewablePage";

/**
 * Composed pages — arbitrary block compositions from src/data/pages.json
 * (`pages` module). Static routes always win over this dynamic segment, so a
 * composed page can never shadow a built-in module route; unknown slugs 404.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return site.locales.enabled.flatMap((locale) =>
    routedPages.map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getComposedPage(slug);
  if (!page) return {};
  const canonical = canonicalUrl(locale, `/${slug}`);
  return {
    title: page.seo?.title ?? `${page.title} — ${site.name}`,
    description: page.seo?.description ?? site.description,
    alternates: {
      canonical,
      languages: Object.fromEntries([
        ...site.locales.enabled.map((l) => [l, canonicalUrl(l, `/${slug}`)]),
        ["x-default", canonicalUrl(site.locales.default, `/${slug}`)],
      ]),
    },
  };
}

export default async function ComposedPageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  requireModule("pages");
  const { slug } = await params;
  const page = getComposedPage(slug);
  if (!page || page.slug === "home") notFound();
  /*
   * The block tree is a client component, so a `postList` block can't read the
   * posts store itself without shipping every body (and every draft) to the
   * browser. Resolve to summaries here and pass them down.
   */
  return (
    <PreviewablePage
      slug={page.slug}
      page={page}
      data={{ posts: postSummaries(posts), postCategories }}
    />
  );
}
