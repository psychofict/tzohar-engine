/**
 * Tzohar Sites — site configuration
 * ----------------------------------------------------------------------------
 * THE single source of identity for a Tzohar Sites build. The identity VALUES
 * live in `site.values.json` (validated + loaded by `site.values.ts`); the
 * TYPES are defined once in `@tzohar/schema` and re-exported here so the whole
 * app keeps importing them from `@/config/site`. The engine (components,
 * layout, metadata, schema.org) reads everything from `site`.
 *
 * Long / list-shaped content (discography, gallery, projects, roster, …) lives
 * in `src/data/*` per module. This file is identity + wiring helpers only.
 */

import { site } from "./site.values";
import type { SiteModule } from "@tzohar/schema";

// Canonical types come from the shared schema (one definition, zero drift).
export type { SiteConfig, SiteModule, ThemePreset, Locale, SocialLink } from "@tzohar/schema";

// The site's values live in ./site.values (validated against the schema there).
export { site };

/** Is a module switched on for this site? */
export function hasModule(m: SiteModule): boolean {
  return site.modules.includes(m);
}

/** Canonical URL for a locale (+ optional path). The default locale lives at root. */
export function canonicalUrl(locale: string = site.locales.default, path = ""): string {
  const base = locale === site.locales.default ? site.url : `${site.url}/${locale}`;
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** All schema.org sameAs URLs: social profiles + extras, de-duped. */
export function allSameAs(): string[] {
  return Array.from(new Set([...site.socials.map((s) => s.url), ...(site.sameAs ?? [])]));
}
