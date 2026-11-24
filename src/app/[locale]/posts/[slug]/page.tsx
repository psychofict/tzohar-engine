import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { site, canonicalUrl } from "@/config/site";
import { clampDescription, fitTitle, pageOpenGraph } from "@/lib/route-meta";
import { optionalMessage } from "@/lib/optional-message";
import { postsIndexPath } from "@/lib/posts-index";
import { absoluteUrl } from "@/lib/absolute-url";
import { personRef } from "@/lib/structured-data";
import { allPosts, categoryLabel, getPost, posts, postSummaries } from "@/data/posts";
import { formatPostDate } from "@/lib/posts-format";
import { getBlurDataURL } from "@/lib/image-blur";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import PostBody from "@/components/PostBody";
import PostListBlock from "@/components/blocks/PostListBlock";
import JsonLd from "@/components/JsonLd";
import { postCategories } from "@/data/posts";

/**
 * One post. Static params cover drafts too, so an unpublished piece is reviewable
 * at its own URL while staying out of the index, the nav and the sitemap.
 */

/*
 * `dynamicParams` is left at its default (true) rather than pinned to false.
 * With it false, any slug absent from `generateStaticParams` 404s before the page
 * runs — which meant a post created through the CRM was unreachable until the
 * next deploy even in local development, where the file had already been written.
 * Unknown slugs still 404: `getPost` returns undefined and the page calls
 * `notFound()` itself.
 */
export function generateStaticParams() {
  return site.locales.enabled.flatMap((locale) => allPosts.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const description = clampDescription(post.excerpt ?? site.description);
  return {
    title: fitTitle(post.title, site.name),
    description,
    alternates: { canonical: canonicalUrl(locale, `/posts/${slug}`) },
    openGraph: {
      ...pageOpenGraph({
        title: post.title,
        description,
        path: `/posts/${slug}`,
        locale,
        image: post.coverImage ? absoluteUrl(post.coverImage, site.url) : undefined,
        imageAlt: post.coverAlt,
      }),
      type: "article",
      publishedTime: post.date,
    },
    // A draft is reachable by link for review; it must not be indexed. Only a draft sets the key: an
    // undefined robots would replace the layout's (a preview build's noindex included).
    ...(post.draft ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function PostRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  /*
   * The way back to the index and the label over related posts are the site's own: the index may
   * live on a composed page (`site.posts.indexPath`, e.g. /journal) and be called something else
   * (`site.posts.indexLabel`, then the Copy field `posts.backLabel`). Both were fixed to "Posts"
   * and /posts, and "More writing".
   */
  const t = await getTranslations({ locale, namespace: "posts" });
  const backLabel = site.posts?.indexLabel ?? optionalMessage(t, "backLabel", "Posts");
  const moreHeading = optionalMessage(t, "moreHeading", "More writing");

  const label = categoryLabel(post.category);
  const related = postSummaries(posts.filter((p) => p.slug !== post.slug)).slice(0, 3);

  return (
    <main id="main-content" className="bg-bg min-h-screen">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          datePublished: post.date,
          description: post.excerpt,
          // A Cloudinary cover is already a full address; only a path gets the site in front.
          image: post.coverImage ? absoluteUrl(post.coverImage, site.url) : undefined,
          // The person the site is about, the same node the layout's Person carries.
          author: personRef(),
          mainEntityOfPage: canonicalUrl(site.locales.default, `/posts/${post.slug}`),
        }}
      />

      <article>
        <header className="band band-top-hero band-bottom-tight">
          <Container size="xl">
            <Link
              href={postsIndexPath as "/"}
              className="type-label text-ink-3 hover:text-ink mb-8 inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={13} aria-hidden />
              {backLabel}
            </Link>
            <div className="measure-lg">
              <p className="type-label text-ink-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                {label && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{label}</span>
                  </>
                )}
                {post.draft && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="text-sunset-strong">Draft</span>
                  </>
                )}
              </p>
              <h1 className="type-display text-ink mt-5 text-balance text-[calc(clamp(2rem,4.4vw,3.25rem)*var(--display-scale))] leading-[1.08]">
                {post.title}
              </h1>
              {post.excerpt && (
                <p className="text-ink-2 measure mt-6 text-[18px] leading-relaxed">{post.excerpt}</p>
              )}
              {post.externalUrl && (
                <a
                  href={post.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink hover:text-ocean-strong mt-7 inline-flex items-center gap-2 text-[14.5px] font-semibold transition-colors"
                >
                  {post.publication ? `First published in ${post.publication}` : "Read the original"}
                  <ArrowUpRight size={14} aria-hidden />
                </a>
              )}
            </div>
          </Container>
        </header>

        {post.coverImage && (
          <Container size="xl">
            <Reveal direction="wipe">
              <figure className="border-line-strong relative overflow-hidden rounded-[var(--radius-card)] border" style={{ aspectRatio: "16 / 8" }}>
                <Image
                  src={post.coverImage}
                  alt={post.coverAlt ?? ""}
                  fill
                  sizes="(max-width: 1280px) 92vw, 1152px"
                  className="object-cover"
                  placeholder={getBlurDataURL(post.coverImage) ? "blur" : undefined}
                  blurDataURL={getBlurDataURL(post.coverImage)}
                  priority
                />
              </figure>
            </Reveal>
          </Container>
        )}

        {post.body && (
          <div className="band">
            <Container size="xl">
              <PostBody body={post.body} />
            </Container>
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <Container size="xl">
            <ul className="border-line flex flex-wrap gap-2 border-t pt-8">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="type-label border-line-strong text-ink-2 rounded-[calc(var(--radius-card)*0.5)] border px-2.5 py-1.5"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </Container>
        )}
      </article>

      {related.length > 0 && (
        <section className="bg-surface band mt-16">
          <PostListBlock
            block={{ type: "postList", columns: 3, header: { eyebrow: moreHeading } }}
            posts={related}
            categories={postCategories}
          />
        </section>
      )}
    </main>
  );
}
