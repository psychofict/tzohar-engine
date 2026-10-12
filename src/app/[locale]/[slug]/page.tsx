import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle } from "@/lib/route-meta";
import { requireModule } from "@/lib/modules";
import { getComposedPage, routedPages } from "@/data/pages";
import { postCategories, posts, postSummaries } from "@/data/posts";
import PreviewablePage from "@/components/preview/PreviewablePage";
import { customPageSlugs, getCustomPage } from "@/lib/custom-pages";

/**
 * Composed pages — arbitrary block compositions from src/data/pages.json
 * (`pages` module). Static routes always win over this dynamic segment, so a
 * composed page can never shadow a built-in module route; unknown slugs 404.
 *
 * The same route serves the client's own pages from `src/custom/pages.tsx`
 * (see src/lib/custom-pages.ts). A client page wins over a composed page of the
 * same slug, so a composed page with that slug and a `nav` entry is how a client
 * page gets a tab in the bar.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = [...new Set([...routedPages.map((p) => p.slug), ...customPageSlugs])];
  return site.locales.enabled.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

function alternatesFor(locale: string, slug: string): Metadata["alternates"] {
  return {
    canonical: canonicalUrl(locale, `/${slug}`),
    languages: Object.fromEntries([
      ...site.locales.enabled.map((l) => [l, canonicalUrl(l, `/${slug}`)]),
      ["x-default", canonicalUrl(site.locales.default, `/${slug}`)],
    ]),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const custom = getCustomPage(slug);
  if (custom) {
    return {
      title: fitTitle(custom.title, site.name),
      description: clampDescription(custom.description ?? site.description),
      alternates: alternatesFor(locale, slug),
    };
  }
  const page = getComposedPage(slug);
  if (!page) return {};
  return {
    title: fitTitle(page.seo?.title ?? page.title, site.name),
    description: clampDescription(page.seo?.description ?? site.description),
    alternates: alternatesFor(locale, slug),
  };
}

export default async function ComposedPageRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  requireModule("pages");
  const { locale, slug } = await params;
  const custom = getCustomPage(slug);
  if (custom) {
    const ClientPage = custom.component;
    return <ClientPage locale={locale} />;
  }
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
