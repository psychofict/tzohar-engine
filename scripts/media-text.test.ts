/**
 * MediaText pictures on a phone (audit item E14, 24 Nov 2026).
 *
 * On the Kopje Light demo at 390 px, a MediaText block's picture rendered 320 px wide beside
 * another at 348 px: the plate sizes itself to the picture's own shape under a height cap, so an
 * upright picture came out narrower than the column and the pictures down the page did not line
 * up. Below the large breakpoint the plate now fills the column and an upright picture is cropped
 * to the cap instead of narrowed. From the large breakpoint up nothing changes.
 *
 * Run: npx --yes tsx scripts/media-text.test.ts
 */
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const leaf = read("src/components/blocks/LeafBlocks.tsx");
const plate = /function Plate\([\s\S]*?\n\}\n/.exec(leaf)?.[0] ?? "";
const mediaText = /function MediaTextBlock\([\s\S]*?\n\}\n/.exec(leaf)?.[0] ?? "";

check("the plate takes extra classes", /className\?: string/.test(plate) && /className=\{clsx\("[^"]*", className\)\}/.test(plate));
check("its own width follows the picture from the large breakpoint up", /\bw-auto\b/.test(plate) && /\bobject-contain\b/.test(plate));
check("the MediaText block was found", mediaText.length > 0);
check("below the large breakpoint its picture fills the column and is cropped to the cap",
  /<Plate src=\{block\.image\}[^>]*className="max-lg:w-full max-lg:object-cover"/.test(mediaText));
check("the height cap still applies", /maxHeight: maxH/.test(plate));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
