/**
 * The site's own icon (audit item E12, 24 Nov 2026).
 *
 * Every site showed the icon files in public/, which on a site made from the template are a
 * placeholder, and Studio had nowhere to set one. `brand.icon` (an https address of a square
 * picture) now feeds the browser tab, the home-screen icon and the web app manifest. A Cloudinary
 * address is cut to each size and delivered as PNG by Cloudinary.
 *
 * Run: npx --yes tsx scripts/site-icon.test.ts
 */
import { readFileSync } from "node:fs";
import { configSchema } from "../packages/schema/src/config";
import { iconAt, manifestIcons, siteIcons } from "../src/lib/site-icon";
import { site } from "../src/config/site";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const CLOUD = "https://res.cloudinary.com/demo/image/upload/v1732400000/sites/kopje/icon.jpg";

console.log("the setting");
const brand = configSchema.shape.brand;
// This site's own brand settings with only the icon changed, so a refusal can only be the icon's.
const okBrand = (icon: string) => brand.safeParse({ ...site.brand, icon }).success;
check("this site's brand settings parse without an icon", brand.safeParse({ ...site.brand, icon: undefined }).success);
check("an https address is accepted", okBrand(CLOUD));
check("an http address is refused", !okBrand("http://example.com/icon.png"));
check("a bare path is refused", !okBrand("/icon.png"));

console.log("sizes from Cloudinary");
const at192 = iconAt(CLOUD, 192);
check("a size step goes in front of the stored path", at192.url === "https://res.cloudinary.com/demo/image/upload/w_192,h_192,c_fill/v1732400000/sites/kopje/icon.png", at192.url);
check("it is delivered as PNG", at192.png);
const noExt = iconAt("https://res.cloudinary.com/demo/image/upload/v1/sites/kopje/icon", 32);
check("an address with no extension asks for PNG in the step", noExt.url.includes("/w_32,h_32,c_fill,f_png/") && noExt.png, noExt.url);
const other = iconAt("https://cdn.example.com/icon.png", 192);
check("any other address is used as it is", other.url === "https://cdn.example.com/icon.png" && !other.png);

console.log("where it is used");
const icons = siteIcons(CLOUD) as { icon: { url: string; sizes: string }[]; apple: { url: string; sizes: string }[] };
check("the tab gets 32, 192 and 512", icons.icon.map((i) => i.sizes).join(",") === "32x32,192x192,512x512");
check("the home screen gets 180", icons.apple[0]?.sizes === "180x180" && icons.apple[0].url.includes("w_180,h_180"));
const manifest = manifestIcons(CLOUD);
check("the manifest gets 192 and 512 PNGs", manifest.map((i) => `${i.sizes}:${i.type}`).join(",") === "192x192:image/png,512x512:image/png");
const fallback = siteIcons(undefined) as { icon: { url: string }[]; apple: string };
check("without the setting the site keeps its own files", fallback.icon[0]?.url === "/favicon.ico" && fallback.apple === "/apple-touch-icon.png");
check("the layout uses it", /icons: siteIcons\(\)/.test(read("src/app/[locale]/layout.tsx")));
check("the manifest uses it", /manifestIcons\(\)/.test(read("src/app/manifest.ts")));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
