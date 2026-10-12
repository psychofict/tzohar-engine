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

/**
 * The search-result budget, and the two helpers that keep every client inside it.
 *
 * Google shows roughly 60 characters of a title and 155 of a description. Nothing in
 * the engine measured either, so a client's own words decided whether their snippet
 * survived. Measured on a live client build: a 237-character site description on the
 * home page, three post titles at 73 to 87, and their excerpts at 183 to 193 — the
 * whole tail of each invisible, and on the long titles the subject sat near the cut.
 *
 * Both are applied where the length is unbounded because it comes from content: the
 * site description, a composed page's title and description, and a post's title and
 * excerpt. The fixed route titles elsewhere are a known string plus the client's name.
 */
const MAX_TITLE = 60;
const MAX_DESCRIPTION = 158;

/**
 * Fits a title and the site name into the search slot, and returns `{ absolute }`.
 *
 * Three rules, in order. If the title already names the site, it is left exactly
 * as written — that is what a client means by typing "About JAFTER" into an SEO
 * title field, and what the engine's own `Research — <site>` layouts already say.
 * Otherwise the name is appended when the pair fits. When it does not, the name
 * is dropped rather than allowed to fall off the end: Google cuts on pixel width
 * and does that better than a character count, and an ellipsis stamped at 60 is
 * worse than the browser's own truncation.
 *
 * `absolute` is the load-bearing part. The locale layout declares
 * `title.template = "%s | <site>"`, which Next applies to any page setting a
 * plain string — so a fitted title had the name it had just dropped put straight
 * back on the end, one separator later, and a title that already named the site
 * rendered it twice ("About JAFTER | JAFTER", in every locale). `absolute` is the
 * one form the parent template cannot reach, so the fix does not depend on each
 * call site remembering to opt out.
 */
export function fitTitle(main: string, brand: string, separator = " — "): { absolute: string } {
  const m = main.trim();
  const b = brand.trim();
  if (!b || m.toLowerCase().includes(b.toLowerCase())) return { absolute: m };
  const withBrand = `${m}${separator}${b}`;
  return { absolute: withBrand.length <= MAX_TITLE ? withBrand : m };
}

/**
 * Clamps a description into the snippet, cutting at the last sentence that still
 * fits and only falling back to a word boundary. Never cuts mid-word. Content is
 * written to be read, so it is clamped here rather than rewritten upstream.
 */
export function clampDescription(text: string | undefined | null, max = MAX_DESCRIPTION): string {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;

  const cut = s.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence >= Math.floor(max * 0.6)) return cut.slice(0, sentence + 1);

  const space = cut.lastIndexOf(" ");
  return `${(space > 0 ? cut.slice(0, space) : cut).replace(/[\s,;:\u2014-]+$/, "")}\u2026`;
}
