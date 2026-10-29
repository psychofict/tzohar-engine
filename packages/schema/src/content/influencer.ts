import { z } from "zod";

/**
 * The influencer module's content — social posts, partner marks, hero.
 *
 * `src/data/instagram.ts` was 404 lines of ENGINE code holding one person's
 * Instagram: 24 captioned posts with his like counts, his meetings with heads of
 * state, his magazine induction and his album announcement. It survived the 2.5.0
 * sweep that moved `artist.ts` to content because it is imported by the `music`
 * page as well as the influencer one, so it looked structural.
 *
 * The partner logo map lived in `macro-influencer/page.tsx` — thirty-one
 * organisations pointing at `/images/brands/*`, a `public/` path that does not
 * exist in a client repo.
 *
 * Posts keep their shape exactly, because `InstagramPostCard` renders them and
 * the derived selectors (travel / music / culture) filter on `tags`.
 */
export const instagramPostSchema = z.object({
  shortcode: z.string().min(1),
  url: z.string().min(1),
  caption: z.string().default(""),
  location: z.string().nullable().default(null),
  likes: z.number().int().nonnegative().default(0),
  comments: z.number().int().nonnegative().default(0),
  type: z.enum(["carousel", "video", "image"]).default("image"),
  date: z.string().default(""),
  /** Drives the derived feeds: "travel", "music", "culture", plus free tags. */
  tags: z.array(z.string()).default([]),
  image: z.string().default(""),
  highlight: z.string().default(""),
});

/**
 * The audience figures in the influence page's stats bar, written as the site shows them
 * ("200K+"). They lived in `macro-influencer/page.tsx` as the reference build's own numbers,
 * so every site with the module on showed them as its own (EBE-7131). An empty value hides
 * its stat; the labels stay in `messages` (`followersStat`, `socialViews`, `brandPartners`).
 */
/** A figure typed into the JSON by hand as a number (50) is shown as written ("50"); null hides it. */
const statValue = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => (v == null ? "" : String(v).trim()))
  .default("");

export const influencerStatsSchema = z.object({
  followers: statValue,
  socialViews: statValue,
  brandPartners: statValue,
});

export const influencerSchema = z.object({
  /** Without the "@" — the page adds it. */
  instagramHandle: z.string().default(""),
  heroImage: z.string().optional(),
  heroAlt: z.string().optional(),
  /** Short credibility chips under the hero title. */
  heroTags: z.array(z.string()).default([]),
  /** Organisation name → logo path, for the partnership and event tables. */
  orgLogos: z.record(z.string(), z.string()).default({}),
  /** Audience figures for the stats bar; a content file from before 2.8.25 has none. */
  stats: influencerStatsSchema
    .nullish()
    .transform((v) => v ?? { followers: "", socialViews: "", brandPartners: "" }),
  posts: z.array(instagramPostSchema).default([]),
});

export type InstagramPost = z.infer<typeof instagramPostSchema>;
export type InfluencerStats = z.infer<typeof influencerStatsSchema>;
export type InfluencerContent = z.infer<typeof influencerSchema>;
