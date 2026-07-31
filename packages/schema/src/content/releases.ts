import { z } from "zod";
import type { FormField } from "../config.form";

/**
 * Music module CONTENT — a discography. Same git-as-DB pipeline as gallery:
 * the engine validates src/data/releases.json against this; Studio generates a
 * repeatable editor from `releaseFields` (release-level metadata) and serializes
 * back to that JSON on publish. Tracklist + credits ride along on each release
 * (round-tripped; nested editing is a later pass).
 */

export const RELEASE_TYPES = ["album", "ep", "single"] as const;
export const releaseTypeEnum = z.enum(RELEASE_TYPES);

export const trackSchema = z.object({
  number: z.number().int().positive(),
  title: z.string().min(1),
  feat: z.string().optional(),
  duration: z.string().optional(),
  slug: z.string().optional(),
});

export const creditSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
});

export const releaseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  type: releaseTypeEnum,
  /** ISO date, e.g. "2024-11-29". */
  date: z.string().min(1),
  year: z.number().int(),
  genres: z.array(z.string()),
  spotifyId: z.string(),
  spotifyUri: z.string(),
  coverImage: z.string().optional(),
  tracklist: z.array(trackSchema),
  credits: z.array(creditSchema),
  featured: z.boolean().optional(),
});

export const releasesSchema = z.object({
  releases: z.array(releaseSchema),
});

export type ReleaseType = z.infer<typeof releaseTypeEnum>;
export type Track = z.infer<typeof trackSchema>;
export type Credit = z.infer<typeof creditSchema>;
export type Release = z.infer<typeof releaseSchema>;
export type ReleasesContent = z.infer<typeof releasesSchema>;

/** Studio editor descriptor for one release's top-level fields (repeatable rows). */
export const releaseFields: readonly FormField[] = [
  { key: "title", label: "Title", widget: "text", required: true, group: "Release" },
  { key: "slug", label: "Slug", widget: "text", required: true, group: "Release", help: "URL segment, e.g. /music/<slug>." },
  { key: "type", label: "Type", widget: "select", options: RELEASE_TYPES, required: true, group: "Release" },
  { key: "date", label: "Release date", widget: "text", required: true, group: "Release", help: "ISO, e.g. 2024-11-29." },
  { key: "year", label: "Year", widget: "number", required: true, group: "Release" },
  { key: "genres", label: "Genres", widget: "string-list", group: "Release", help: "One per line." },
  { key: "spotifyId", label: "Spotify ID", widget: "text", group: "Release" },
  { key: "spotifyUri", label: "Spotify URI", widget: "text", group: "Release", help: 'e.g. album/<id>.' },
  { key: "coverImage", label: "Cover image path", widget: "image", group: "Release" },
] as const;
