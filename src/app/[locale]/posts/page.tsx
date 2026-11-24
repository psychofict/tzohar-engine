import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { site, canonicalUrl } from "@/config/site";
import { posts, postCategories, postSummaries } from "@/data/posts";
import PageHero from "@/components/ui/PageHero";
import PostListBlock from "@/components/blocks/PostListBlock";
import { clampDescription, fitTitle, pageOpenGraph } from "@/lib/route-meta";
import { optionalMessage } from "@/lib/optional-message";
import { postsIndexMoved, postsIndexPath } from "@/lib/posts-index";

/**
 * Post index. A server component so `posts.json` — bodies and drafts included —
 * stays out of the client bundle; only trimmed summaries cross into the (client)
 * list component.
 *
 * Its words are the site's own (the `posts` Copy fields), with English fallbacks for a messages
 * file that predates them. They were fixed English ("Writing", "Posts"), which a site calling
 * its writing a Journal could not change.
 */

export function generateStaticParams() {
  return site.locales.enabled.map((locale) => ({ locale }));
}

async function indexCopy(locale: string) {
  const t = await getTranslations({ locale, namespace: "posts" });
  return {
    eyebrow: optionalMessage(t, "eyebrow", "Writing"),
    title: optionalMessage(t, "title", "Posts"),
    subtitle: optionalMessage(t, "subtitle", `Latest posts from ${site.name}.`),
  };
}

/** "Notes from the studio" + "." so the site description that follows reads as a second sentence. */
const asSentence = (s: string) => (/[.!?…。！？]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { title, subtitle } = await indexCopy(locale);
  const fitted = fitTitle(title, site.name);
  const description = clampDescription(`${asSentence(subtitle)} ${site.description}`);
  return {
    title: fitted,
    description,
    // With the index moved (`site.posts.indexPath`), next.config.ts redirects here; should this
    // page still be reached, it names the real index as the one to list.
    alternates: { canonical: canonicalUrl(locale, postsIndexMoved ? postsIndexPath : "/posts") },
    openGraph: pageOpenGraph({ title: fitted.absolute, description, path: postsIndexPath, locale }),
  };
}

export default async function PostsIndexRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { eyebrow, title, subtitle } = await indexCopy(locale);
  return (
    <main id="main-content" className="bg-bg min-h-screen">
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
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
