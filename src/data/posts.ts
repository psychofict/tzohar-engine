// CONTENT lives in ./posts.json — the git-as-DB artifact the CRM edits and
// commits (see docs/crm.md). Validated against the shared schema at load, same
// pattern as ./pages.ts.

import { postsSchema, type Post } from "@tzohar/schema";
import raw from "./posts.json";

const content = postsSchema.parse(raw);

/** Newest first. Drafts are excluded — see `getPost` for the direct-link case. */
export const posts: Post[] = [...content.posts]
  .filter((p) => !p.draft)
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

/**
 * Every post INCLUDING drafts, so a draft stays reachable by its URL for review
 * while staying out of the index, the nav counts and the sitemap.
 */
export const allPosts: Post[] = content.posts;

export const postCategories = content.categories ?? [];

export function getPost(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug);
}

/** Published posts in one category, newest first. */
export function postsInCategory(key?: string): Post[] {
  return key ? posts.filter((p) => p.category === key) : posts;
}

export function categoryLabel(key?: string): string | undefined {
  if (!key) return undefined;
  return postCategories.find((c) => c.key === key)?.label ?? key;
}

/** Long-form date for a post's `date` (ISO). Fixed locale so SSR and client agree. */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Index-shaped post — everything a card needs and nothing more.
 *
 * `PostListBlock` is a client component (it carries filter chips), so handing it
 * whole `Post` objects would serialise every article body into the HTML of any
 * page that lists posts, and would put unpublished draft bodies on the wire the
 * moment a draft existed. The server trims to this shape first.
 */
export type PostSummary = Pick<
  Post,
  "slug" | "title" | "date" | "category" | "excerpt" | "coverImage" | "coverAlt" | "publication" | "externalUrl"
>;

export function postSummaries(list: Post[] = posts): PostSummary[] {
  return list.map(({ slug, title, date, category, excerpt, coverImage, coverAlt, publication, externalUrl }) => ({
    slug,
    title,
    date,
    category,
    excerpt,
    coverImage,
    coverAlt,
    publication,
    externalUrl,
  }));
}

export type { Post };
