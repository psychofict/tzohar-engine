/**
 * The root 404 page (audit item E7, 24 Nov 2026).
 *
 * src/app/not-found.tsx renders its own document, outside the [locale] layout. It declared Inter,
 * Fraunces and IBM Plex Mono itself, so a 404 was set in one site's type on every site, and its tab
 * had no title. It now loads the same faces as the layout (src/lib/site-fonts.ts), applies the
 * site's font choice, and names the page and the site in the tab.
 *
 * Run: npx --yes tsx scripts/not-found.test.ts
 */
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const page = code("src/app/not-found.tsx");
const layout = code("src/app/[locale]/layout.tsx");
const fonts = code("src/lib/site-fonts.ts");

console.log("fonts");
check("the 404 declares no faces of its own", !/next\/font/.test(page) && !/\b(Inter|Fraunces|IBM_Plex_Mono)\(/.test(page));
check("it puts the site's font variables on <html>", /className=\{siteFontVariables\}/.test(page));
check("it applies the site's font choice", /fontVarStyle\(site\.appearance\?\.font\)/.test(page));
check("the layout uses the same list", /siteFontVariables/.test(layout) && !/next\/font\/google/.test(layout));
check("the faces are declared in one place", /from "next\/font\/google"/.test(fonts) && /export const siteFontVariables = \[/.test(fonts));

console.log("title and way home");
check("the tab names the page and the site", /<title>\{`Page not found \| \$\{site\.name\}`\}<\/title>/.test(page));
check("it links to the home page", /<Link\s+href="\/"/.test(page) && /Back to \{site\.name\}/.test(page));
check("it applies the site's colours", /appearanceStyle\(site\)/.test(page));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
