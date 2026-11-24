/**
 * Two more faults found on the live Kopje Light demo (24 Nov 2026).
 *
 * 1. The post index and every post page carried another client's wording in the route files: a
 *    "Publications & Blog" heading, an intro about "the science, and the partnerships that carry it",
 *    and a search description about nanoscience and Africa–Korea science diplomacy. They now come
 *    from the site's own name and description.
 * 2. /contact's four FAQ answers ship as instructions to the site owner ("Set expectations on lead
 *    time here"), which a visitor reads on opening a question. They are editable Copy fields now, as
 *    the footer blurb, contact intro and About opening already are, and so is the availability line.
 *
 * The posts pages exist only when the posts module is on: in the engine checkout a missing file
 * fails, on a client site without the module the posts block is skipped with a note.
 * Run: npx --yes tsx scripts/posts-faq.test.ts
 */
import { existsSync, readFileSync } from "node:fs";

const url = (p: string) => new URL(`../${p}`, import.meta.url);
const read = (p: string) => readFileSync(url(p), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

console.log("posts pages");
const indexPath = "src/app/[locale]/posts/page.tsx";
const slugPath = "src/app/[locale]/posts/[slug]/page.tsx";
const inEngine = existsSync(url("studio/engine.release.json"));
const hasPosts = existsSync(url(indexPath)) && existsSync(url(slugPath));
if (!hasPosts && !inEngine) {
  console.log("  - skipped: the posts module is off on this site, so it has no posts pages");
} else {
  check("the engine checkout has both posts pages", hasPosts);
  if (hasPosts) {
    const index = read(indexPath);
    const slug = read(slugPath);
    const OTHER = /Publications\s*(&|&amp;)\s*Blog|nanoscience|policy briefs|science diplomacy|partnerships that carry/i;
    check("the post index carries no other client's wording", !OTHER.test(index), (index.match(OTHER) ?? [])[0]);
    check("the post page's back link carries no other client's wording", !OTHER.test(slug), (slug.match(OTHER) ?? [])[0]);
    // The index's words are the `posts` Copy fields since 24 Nov 2026, with these as the fallbacks.
    check("the post index title is fitted to the site's name", /fitTitle\(title, site\.name\)/.test(index) && /optionalMessage\(t, "title", "Posts"\)/.test(index));
    check("the post index description uses the site's own description", /clampDescription\(`\$\{asSentence\(subtitle\)\} \$\{site\.description\}`\)/.test(index));
    check("the post index heading names the site when no subtitle is set", /optionalMessage\(t, "subtitle", `Latest posts from \$\{site\.name\}\.`\)/.test(index) && /<PageHero eyebrow=\{eyebrow\} title=\{title\} subtitle=\{subtitle\} \/>/.test(index));
  }
}

console.log("contact copy fields");
const copy = read("packages/schema/src/content/copy.ts");
for (const key of ["faq1Q", "faq1A", "faq2Q", "faq2A", "faq3Q", "faq3A", "faq4Q", "faq4A"]) {
  check(`Studio can edit contact.${key}`, new RegExp(`ns:\\s*"contact",\\s*key:\\s*"${key}"`).test(copy));
}
// The availability line is read from `common`, not `contact`: a field in the wrong namespace saves
// and does nothing, which is how 2.8.36 shipped it.
check("Studio can edit common.availableWorldwide", /ns:\s*"common",\s*key:\s*"availableWorldwide"/.test(copy));
const contactPage = read("src/app/[locale]/contact/page.tsx");
check("the contact page reads availableWorldwide from common", /const tc = useTranslations\("common"\)/.test(contactPage) && /tc\("availableWorldwide"\)/.test(contactPage));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
