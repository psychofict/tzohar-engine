import { configSchema, type SiteConfig } from "@tzohar/schema";
import rawValues from "./site.values.json";

/**
 * ── Site values: this site (the repo ships the reference build's) ───────────────────────────────────
 * The identity VALUES now live in `site.values.json` — the git-as-DB artifact
 * that Tzohar Studio generates and commits to the client's repo (see
 * docs/studio.md). Regenerate by hand with `npm run new-site`.
 *
 * This module validates that JSON against the shared `@tzohar/schema` contract
 * at load and exports the typed `site`. A malformed config fails the build
 * (fail fast) rather than shipping a broken site. Types + helpers live in ./site.
 */
export const site: SiteConfig = configSchema.parse(rawValues);
