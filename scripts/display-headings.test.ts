/**
 * Headings in the site's display face (audit item E5, 24 Nov 2026).
 *
 * A site picks a display face for its headings (`type-display`), but the plain page hero's title,
 * the privacy page's headings, the contact form's headings, timeline cards and several block
 * headings were set in bold body type, so one page mixed two heading styles. Every heading in
 * these files is now in the display face, except small eyebrow labels, which are set in the label
 * or mono face on purpose.
 *
 * Run: npx --yes tsx scripts/display-headings.test.ts
 */
import { readFileSync, readdirSync } from "node:fs";

const url = (p: string) => new URL(`../${p}`, import.meta.url);
const read = (p: string) => readFileSync(url(p), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

/** Each <h1>..<h4> opening tag in a file, with its line number. */
function headings(src: string): { line: number; tag: string }[] {
  const out: { line: number; tag: string }[] = [];
  const re = /<h[1-4]\b/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    // The opening tag runs to the first ">" that is not inside braces.
    let depth = 0;
    let end = m.index;
    for (; end < src.length; end++) {
      const c = src[end];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    out.push({ line: src.slice(0, m.index).split("\n").length, tag: src.slice(m.index, end + 1) });
  }
  return out;
}

/** An eyebrow label: small type in the label or mono face, not a heading style. */
const isLabel = (tag: string) => /\btype-label\b|\bfont-mono\b/.test(tag);

const FILES = [
  "src/components/ui/PageHero.tsx",
  "src/components/ui/Timeline.tsx",
  "src/app/[locale]/contact/page.tsx",
  ...readdirSync(url("src/components/blocks")).filter((f) => f.endsWith(".tsx")).map((f) => `src/components/blocks/${f}`),
];

console.log("headings use the display face");
for (const file of FILES) {
  const plain = headings(read(file)).filter((h) => !/\btype-display\b/.test(h.tag) && !isLabel(h.tag));
  check(file, plain.length === 0, plain.map((h) => `line ${h.line}: ${h.tag.replace(/\s+/g, " ").slice(0, 120)}`).join("\n      "));
}

console.log("privacy page");
const privacy = read("src/app/[locale]/privacy/page.tsx");
const h2Class = /const H2 = "([^"]*)"/.exec(privacy)?.[1] ?? "";
check("the section heading style is the display face", /\btype-display\b/.test(h2Class), h2Class);
const privacyHeadings = headings(privacy);
check("every section heading uses it", privacyHeadings.filter((h) => h.tag.startsWith("<h2")).every((h) => /className=\{H2\}/.test(h.tag)));
check("the page title is in the display face", privacyHeadings.some((h) => h.tag.startsWith("<h1") && /\btype-display\b/.test(h.tag)));

console.log("timeline and block titles that are not heading tags");
const leaf = read("src/components/blocks/LeafBlocks.tsx");
const master = read("src/components/blocks/MasterDetailBlock.tsx");
check("the timeline grid's titles", /<span className="type-display text-ink[^"]*">\{m\.title\}<\/span>/.test(leaf));
check("the master-detail rows' titles", /<p className="type-display text-ink[^"]*">\{row\.title\}<\/p>/.test(master));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
