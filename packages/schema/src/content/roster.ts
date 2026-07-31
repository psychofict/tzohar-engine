import { z } from "zod";

/**
 * The record label's roster — content, not code.
 *
 * It was a TypeScript array in `src/data/roster.ts`, i.e. engine-owned, so every
 * client repo carried the reference build's label artists. It could not be pruned
 * with the `label` module either, because the sitemap reads it from a core
 * entrypoint. Splitting it into JSON (client) + loader (engine) is the same shape
 * every other content artifact in `src/data/` uses.
 */
export const rosterArtistSchema = z.object({
  /** Spotify artist id — used for the sitemap entry and the artist page route. */
  spotifyId: z.string().min(1),
  name: z.string().min(1),
});

export const labelSocialSchema = z.object({
  /** Drives the icon; anything unrecognised renders as a plain outbound link. */
  platform: z.string().min(1),
  url: z.string().min(1),
});

export const labelStatSchema = z.object({
  value: z.string().min(1),
  /** A `label` namespace message key, so the caption localises. */
  labelKey: z.string().min(1),
});

/**
 * The label ITSELF — its name, marks, links and the numbers on its page.
 *
 * These were literals spread across `label/page.tsx`, both label layouts, the
 * artist route and `structured-data-label.ts`: the label's name, its website,
 * four social URLs, its logo paths, its founding year and its stat row. So a
 * client enabling the `label` module got a page for the reference build's record
 * label, and emitted schema.org saying their site was about it.
 *
 * Every field is optional. A label with nothing filled in falls back to the site's
 * own name and renders the sections it has content for — which is the right
 * behaviour for a client who has just switched the module on.
 */
export const labelIdentitySchema = z.object({
  name: z.string().default(""),
  /** Extra spellings for schema.org `alternateName` (accents, "Records", …). */
  alternateNames: z.array(z.string()).default([]),
  description: z.string().default(""),
  url: z.string().optional(),
  email: z.string().optional(),
  logoLight: z.string().optional(),
  logoDark: z.string().optional(),
  /** Square mark for schema.org `logo` and the brand tile. */
  logoSquare: z.string().optional(),
  ogImage: z.string().optional(),
  foundingYear: z.string().optional(),
  foundingLocation: z.string().optional(),
  /** schema.org `numberOfEmployees`, in artists. */
  artistCount: z.number().optional(),
  spotifyArtistId: z.string().optional(),
  socials: z.array(labelSocialSchema).default([]),
  stats: z.array(labelStatSchema).default([]),
  genres: z.array(z.string()).default([]),
});

export const rosterContentSchema = z.object({
  /*
   * `prefault`, not `default`: a plain default has to satisfy the OUTPUT type, so
   * `{}` would mean restating every inner default here and letting the two copies
   * drift. This runs `{}` through the schema instead, so the inner defaults stay
   * the single definition — and a roster.json with no `label` key still parses.
   */
  label: labelIdentitySchema.prefault({}),
  artists: z.array(rosterArtistSchema).default([]),
});

export type RosterArtist = z.infer<typeof rosterArtistSchema>;
export type LabelIdentity = z.infer<typeof labelIdentitySchema>;
export type LabelSocial = z.infer<typeof labelSocialSchema>;
export type LabelStat = z.infer<typeof labelStatSchema>;
export type RosterContent = z.infer<typeof rosterContentSchema>;
