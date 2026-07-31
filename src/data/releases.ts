// Full discography for the music module.
//
// CONTENT now lives in ./releases.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). It is validated against the shared
// schema at load; the engine's exports below are unchanged.

import { releasesSchema, type Release, type Track, type Credit } from "@tzohar/schema";
import raw from "./releases.json";

const content = releasesSchema.parse(raw);

export const releases: Release[] = content.releases;

/** Albums + EPs (long-form releases). */
export const albumsAndEPs = releases.filter((r) => r.type === "album" || r.type === "ep");

/** Singles only. */
export const allSingles = releases.filter((r) => r.type === "single");

/** Get release by slug. */
export function getReleaseBySlug(slug: string): Release | undefined {
  return releases.find((r) => r.slug === slug);
}

export type { Release, Track, Credit } from "@tzohar/schema";
