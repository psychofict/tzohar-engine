import { homeContentSchema, type HomeContent } from "@tzohar/schema";
import raw from "./home.json";

/**
 * Loader for the default home page's content.
 *
 * Engine code (the loader) reading client content (`home.json`) — the same split
 * every other content artifact uses, and the reason `src/data/` is classified by
 * extension rather than by prefix. Before this, all of it was inline in
 * `src/app/[locale]/page.tsx`, so every client shipped the reference build's
 * numbers, logos, photographs and discography on their own home page.
 *
 * Validation throws on a malformed file, deliberately: a home page is the first
 * thing anyone sees, and failing at build with a path to the bad field beats
 * rendering a page with a hole in it. Every field is OPTIONAL though — `{}` is
 * valid and yields a home with only the hero and the closing call to action,
 * which is the right shape for a client who composes their own home with the
 * `pages` module.
 */
const parsed: HomeContent = homeContentSchema.parse(raw);

export const homeStats = parsed.stats ?? [];
export const credibilityLogos = parsed.logos ?? [];
export const rolePanels = parsed.panels ?? [];
export const spotlight = parsed.spotlight ?? null;
export const latestRelease = parsed.latestRelease ?? null;
