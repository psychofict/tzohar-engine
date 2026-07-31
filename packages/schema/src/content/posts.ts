import { z } from "zod";

/**
 * POSTS — the writing surface: opinion articles, research commentary, policy
 * briefs, blog entries.
 *
 * Separate from `pages` on purpose. A composed page is a designed artefact whose
 * blocks an author art-directs once; a post is one of a growing, dated,
 * reverse-chronological series that the client publishes on their own without
 * touching layout. Folding posts into `pages` would mean every new article was a
 * hand-built page, which is exactly the job the CRM exists to remove.
 *
 * Body is Markdown-ish plain text — paragraphs separated by blank lines, with
 * `## ` subheadings, `> ` pull quotes and `- ` bullets. Deliberately not HTML:
 * the CRM writes this field, and a rich-text field that accepts markup is a
 * stored-XSS hole the moment anyone but the owner can edit.
 */
export const postSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase slug, e.g. "science-diplomacy-in-practice"'),
  title: z.string().min(1),
  /** ISO date (YYYY-MM-DD). Drives ordering and the visible date line. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ISO date, e.g. 2026-05-12"),
  /** Editorial category — also the filter chips on the index. */
  category: z.string().optional(),
  /** One-paragraph standfirst, used on the index and as the meta description. */
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  coverAlt: z.string().optional(),
  /** Where it first appeared, for a republished article. */
  publication: z.string().optional(),
  externalUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  body: z.string().optional(),
  /** Hidden from the index and the sitemap, but reachable by direct link. */
  draft: z.boolean().optional(),
});

export const postsSchema = z
  .object({
    categories: z.array(z.object({ key: z.string().min(1), label: z.string().min(1) })).optional(),
    posts: z.array(postSchema),
  })
  .superRefine((val, ctx) => {
    const seen = new Set<string>();
    val.posts.forEach((p, i) => {
      if (seen.has(p.slug)) {
        ctx.addIssue({ code: "custom", path: ["posts", i, "slug"], message: `Duplicate slug "${p.slug}".` });
      }
      seen.add(p.slug);
    });
  });

export type Post = z.infer<typeof postSchema>;
export type PostsContent = z.infer<typeof postsSchema>;
