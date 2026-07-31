import type { Metadata } from "next";
import { site, canonicalUrl } from "@/config/site";
import { posts, postCategories, postSummaries } from "@/data/posts";
import PageHero from "@/components/ui/PageHero";
import PostListBlock from "@/components/blocks/PostListBlock";

/**
 * Post index. A server component so `posts.json` — bodies and drafts included —
 * stays out of the client bundle; only trimmed summaries cross into the (client)
 * list component.
 */

export function generateStaticParams() {
  return site.locales.enabled.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `Publications & Blog — ${site.name}`,
    description:
      "Opinion articles, research commentary, policy briefs and blog posts on nanoscience, green chemistry and Africa–Korea science diplomacy.",
    alternates: { canonical: canonicalUrl(locale, "/posts") },
  };
}

export default function PostsIndexRoute() {
  return (
    <main id="main-content" className="bg-bg min-h-screen">
      <PageHero
        eyebrow="Writing"
        title="Publications & Blog"
        subtitle="Opinion articles, research commentary and policy briefs — on the science, and on the partnerships that carry it."
      />
      {/* PostListBlock supplies its own Container — wrapping it in another would
          double the gutter and break the single left edge the pages share. */}
      <section className="band">
        <PostListBlock
          block={{ type: "postList", columns: 3, showFilters: true }}
          posts={postSummaries(posts)}
          categories={postCategories}
        />
      </section>
    </main>
  );
}
