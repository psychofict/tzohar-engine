"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type { postListBlockSchema } from "@tzohar/schema";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { BlockHeaderRow } from "./LeafBlocks";
import { getBlurDataURL } from "@/lib/image-blur";
import { formatPostDate } from "@/lib/posts-format";
import type { PostSummary } from "@/data/posts";

type PostListBlockType = z.infer<typeof postListBlockSchema>;
type Category = { key: string; label: string };

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * Latest posts, rendered from the posts store.
 *
 * The posts arrive as a prop rather than being imported here: this is a client
 * component (it carries the filter chips), and importing the store directly
 * would serialise every post body — including drafts — into the page payload.
 * The server picks and trims; this only lays out.
 */
export default function PostListBlock({
  block,
  posts,
  categories,
}: {
  block: PostListBlockType;
  posts: PostSummary[];
  categories: Category[];
}) {
  const [active, setActive] = useState("all");

  /*
   * Two filters, applied in order and doing different jobs. The block's own
   * `category`/`limit` are the AUTHOR's scope — "the three latest policy briefs
   * on this page" — and are not negotiable at runtime. The chip is the READER's
   * scope, and only ever narrows what the author already allowed.
   */
  const scoped = useMemo(() => {
    const inCategory = block.category ? posts.filter((p) => p.category === block.category) : posts;
    return block.limit ? inCategory.slice(0, block.limit) : inCategory;
  }, [posts, block.category, block.limit]);

  const filtered = useMemo(
    () => (active === "all" ? scoped : scoped.filter((p) => p.category === active)),
    [active, scoped],
  );

  // Only offer a chip for a category that actually has posts in this set.
  const usable = categories.filter((c) => scoped.some((p) => p.category === c.key));
  const showFilters = block.showFilters && usable.length > 1;

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />

      {showFilters && (
        <div className="scrollbar-hide -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ key: "all", label: "All" }, ...usable].map((c) => {
            const on = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActive(c.key)}
                aria-pressed={on}
                className={clsx(
                  "type-label flex-none rounded-[calc(var(--radius-card)*0.5)] border px-3.5 py-2 transition-colors",
                  on ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink hover:text-ink",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-ink-3 border-line rounded-[var(--radius-card)] border border-dashed p-10 text-center text-[15px]">
          {block.emptyNote ?? "Nothing published here yet."}
        </p>
      ) : (
        <ul className={clsx("grid gap-x-5 gap-y-9", COLS[block.columns ?? 3])}>
          {filtered.map((post, i) => (
            <Reveal key={post.slug} as="li" direction="up" delay={Math.min(i, 5) * 60}>
              <PostCard post={post} categories={categories} />
            </Reveal>
          ))}
        </ul>
      )}

      {block.viewAllHref && (
        <div className="mt-10">
          <Link
            href={block.viewAllHref as "/"}
            className="text-ink hover:text-ocean-strong inline-flex items-center gap-2 text-[14.5px] font-semibold transition-colors"
          >
            {block.viewAllLabel ?? "All posts"}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      )}
    </Container>
  );
}

function PostCard({ post, categories }: { post: PostSummary; categories: Category[] }) {
  const label = post.category ? (categories.find((c) => c.key === post.category)?.label ?? post.category) : undefined;
  return (
    <article className="group border-line-strong bg-elevated flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border">
      {post.coverImage && (
        <Link href={`/posts/${post.slug}` as "/"} className="relative block overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
          <Image
            src={post.coverImage}
            alt={post.coverAlt ?? ""}
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            placeholder={getBlurDataURL(post.coverImage) ? "blur" : undefined}
            blurDataURL={getBlurDataURL(post.coverImage)}
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="type-label text-ink-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          {label && (
            <>
              <span aria-hidden>·</span>
              <span>{label}</span>
            </>
          )}
        </p>
        <h3 className="type-display text-ink mt-3 text-[1.3rem] leading-tight">
          <Link href={`/posts/${post.slug}` as "/"} className="hover:text-ocean-strong transition-colors">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="text-ink-2 mt-3 text-[14.5px] leading-relaxed">{post.excerpt}</p>}
        <div className="mt-auto pt-6">
          <Link
            href={`/posts/${post.slug}` as "/"}
            className="text-ink hover:text-ocean-strong inline-flex items-center gap-2 text-[14px] font-semibold transition-colors"
          >
            Read
            <ArrowRight size={14} aria-hidden />
          </Link>
          {post.externalUrl && (
            <a
              href={post.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-3 hover:text-ink ml-5 inline-flex items-center gap-1.5 text-[14px] transition-colors"
            >
              {post.publication ?? "Original"}
              <ArrowUpRight size={13} aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
