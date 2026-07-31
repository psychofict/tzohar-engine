import { defineRouting } from "next-intl/routing";
import { locales as allLocales, defaultLocale } from "./config";
import { site } from "@/config/site";

/**
 * Routing only recognizes the locales this site actually enables
 * (`site.locales.enabled`), not the engine's full supported set. A locale
 * prefix that isn't enabled (e.g. `/ko/...` on an English-only build) falls
 * through to Next's normal 404 instead of serving another locale's content —
 * this is what makes `site.locales.enabled` authoritative end to end, the
 * same way `site.modules` is for routes (see `requireModule`).
 */
const enabled = new Set(site.locales.enabled);
const activeLocales = allLocales.filter((l) => enabled.has(l));

export const routing = defineRouting({
  locales: activeLocales.length > 0 ? activeLocales : [defaultLocale],
  defaultLocale: enabled.has(site.locales.default as typeof defaultLocale)
    ? (site.locales.default as typeof defaultLocale)
    : defaultLocale,
  localePrefix: "as-needed",
});
