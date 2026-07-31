import { site, canonicalUrl } from "@/config/site";

/**
 * Per-route canonical + hreflang, from config.
 *
 * Fourteen route layouts each carried their own copy of this shape: a `baseUrl`
 * const holding the reference build's domain as a literal, a hand-rolled
 * `canonical` ternary on `locale === "en"`, and a `languages` map listing five
 * locales by name.
 *
 * Two things were wrong with it, and both shipped to every client. The domain was
 * the reference build's, so a client's canonical tags pointed at somebody else's
 * site — the worst SEO error available, because a canonical is an instruction to
 * index the OTHER url. And the language map was fixed at five locales, so a client
 * shipping only `en` still advertised ko/zh/fr/ja alternates that 404.
 *
 * Both now come from `site.url` and `site.locales`.
 */
export function routeAlternates(path: string, locale: string) {
  return {
    canonical: canonicalUrl(locale, path),
    languages: {
      ...Object.fromEntries(site.locales.enabled.map((l) => [l, canonicalUrl(l, path)])),
      "x-default": canonicalUrl(site.locales.default, path),
    },
  };
}
