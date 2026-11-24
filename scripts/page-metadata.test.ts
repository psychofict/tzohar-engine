/**
 * Search and share data per page (audit items E8 and E15, 24 Nov 2026).
 *
 * E8  Next replaces the layout's `openGraph` with a page's own, so composed pages, the post index
 *     and the privacy page shared without the site name, locale or picture; `alternateLocale`
 *     listed all five engine locales on a one-language site; and the composed home's own
 *     description was ignored. Every route now builds its `openGraph` with `pageOpenGraph`, and
 *     the locales come from the site's enabled list.
 * E15 `site.seo.index: false` keeps a launched site out of search (noindex robots tag, the
 *     X-Robots-Tag header and a robots.txt with no sitemap). A preview build still always does.
 *
 * Run: npx --yes tsx scripts/page-metadata.test.ts
 */
import { readFileSync } from "node:fs";
import { configSchema } from "../packages/schema/src/config";
import { copySchema } from "../packages/schema/src/content/copy";
import { localeToOgLocale, type Locale } from "../src/i18n/config";
import { ogLocales, pageOpenGraph } from "../src/lib/route-meta";
import { site } from "../src/config/site";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

console.log("E8 locales");
const current = site.locales.default;
const { locale, alternateLocale } = ogLocales(current);
const expected = site.locales.enabled.filter((l) => l !== current).map((l) => localeToOgLocale[l as Locale]);
check("the page's own locale is first", locale === localeToOgLocale[current as Locale], locale);
check("the alternates are this site's other enabled locales only", JSON.stringify(alternateLocale) === JSON.stringify(expected), alternateLocale.join(","));
check("the layout uses the same list", /\.\.\.ogLocales\(locale\)/.test(read("src/app/[locale]/layout.tsx")));

console.log("E8 a page's whole openGraph");
const og = pageOpenGraph({ title: "Studio", description: "Pots.", path: "/studio", locale: current });
check("it names the site", og.siteName === site.name);
check("its address is the page's canonical one", og.url.endsWith("/studio"), og.url);
check("its picture is the site's sharing image when the page has none", og.images[0]?.url === site.brand.ogImage);
check("a page picture replaces it", pageOpenGraph({ title: "a", description: "b", path: "/", locale: current, image: "https://x.test/p.jpg" }).images[0]?.url === "https://x.test/p.jpg");
const routes: [string, RegExp][] = [
  ["src/app/[locale]/[slug]/page.tsx", /openGraph: pageOpenGraph\(/],
  ["src/app/[locale]/posts/page.tsx", /openGraph: pageOpenGraph\(/],
  ["src/app/[locale]/posts/[slug]/page.tsx", /\.\.\.pageOpenGraph\(/],
  ["src/app/[locale]/privacy/layout.tsx", /openGraph: pageOpenGraph\(/],
  ["src/app/[locale]/about/layout.tsx", /openGraph: pageOpenGraph\(/],
  ["src/app/[locale]/contact/layout.tsx", /openGraph: pageOpenGraph\(/],
];
for (const [file, re] of routes) {
  let src = "";
  try { src = read(file); } catch { console.log(`  - skipped: ${file} is not on this site`); continue; }
  check(`${file} builds its openGraph with pageOpenGraph`, re.test(src));
}
const home = read("src/app/[locale]/page.tsx");
check("the composed home's own description is used", /description: composed\?\.seo\?\.description/.test(home));
check("Studio can save the metadata namespace", "metadata" in copySchema.shape);

console.log("E15 kept out of search");
const seo = configSchema.shape.seo;
check("the config takes seo.index: false", seo.safeParse({ titleDefault: "x", index: false }).success);
check("and leaves it out by default", seo.safeParse({ titleDefault: "x" }).success);
check("it is a yes or no, not text", !seo.safeParse({ titleDefault: "x", index: "no" }).success);
const flag = read("src/lib/search-index.ts");
check("a site is listed unless it is a preview or says seo.index: false", /siteIndexable: boolean = !isPreviewBuild && site\.seo\.index !== false/.test(flag));
const robots = read("src/app/robots.ts");
const closed = /if \(!siteIndexable\) return (\{.*\});$/m.exec(robots)?.[1] ?? "";
check("robots.txt names no sitemap for such a site", closed !== "" && !closed.includes("sitemap"), closed);
check("but still lets crawlers read the noindex", /if \(!siteIndexable\) return \{ rules: \[\{ userAgent: "\*", allow: "\/"/.test(robots));
const layout = read("src/app/[locale]/layout.tsx");
check("the robots tag follows the flag", /index: siteIndexable,\s*follow: siteIndexable/.test(layout));
const config = read("next.config.ts");
check("the X-Robots-Tag header follows the config as well as a preview", /const noIndex = process\.env\.TZOHAR_PREVIEW === "1" \|\| siteSettings\.seo\?\.index === false;/.test(config));
check("the header is sent when noIndex", /\.\.\.\(noIndex \? \[\{ key: "X-Robots-Tag", value: "noindex, nofollow" \}\] : \[\]\)/.test(config));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
