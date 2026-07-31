// CONTENT lives in ./pages.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). Validated against the shared
// schema at load, same pattern as ./research.ts.

import { pagesSchema, type SitePage, type PageBlock } from "@tzohar/schema";
import raw from "./pages.json";

const content = pagesSchema.parse(raw);

/**
 * Slugs owned by built-in routes — a composed page can't shadow them (the
 * static route would win in Next anyway; filtering keeps nav/params honest).
 * `"home"` is special: it REPLACES the default home composition.
 */
const RESERVED = new Set([
  "about",
  "account",
  "ai",
  "biography",
  "contact",
  "engagements",
  "gallery",
  "innovation",
  "join",
  "label",
  "links",
  "macro-influencer",
  "merch",
  "music",
  "press",
  "privacy",
  "research",
  "tour",
  "vault",
]);

export const composedPages: SitePage[] = content.pages.filter(
  (p) => p.slug === "home" || !RESERVED.has(p.slug),
);

export function getComposedPage(slug: string): SitePage | undefined {
  return composedPages.find((p) => p.slug === slug);
}

/** Composed pages served at /<slug> (everything except the home override). */
export const routedPages: SitePage[] = composedPages.filter((p) => p.slug !== "home");

export type { SitePage, PageBlock };
