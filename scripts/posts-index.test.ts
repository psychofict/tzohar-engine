/**
 * Where the post index lives, and what it says (audit item E4, 24 Nov 2026).
 *
 * The index was fixed at /posts with fixed English words, so a site whose writing lives on a
 * composed Journal page had two indexes and a back link on every post that led to the wrong one.
 * Now `site.posts.indexPath` names the index, /posts answers 308 to it, the back link and the
 * "all posts" links follow it, and the index's words are the `posts` Copy fields.
 *
 * The route files belong to the posts module and are skipped with a note on a site without it.
 * Run: npx --yes tsx scripts/posts-index.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { postsSettingsSchema } from "../packages/schema/src/config";
import { COPY_FIELDS } from "../packages/schema/src/content/copy";
import { postsIndexHref } from "../src/lib/posts-index";

const url = (p: string) => new URL(`../${p}`, import.meta.url);
const read = (p: string) => readFileSync(url(p), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

console.log("the setting");
check("a path on the site is accepted", postsSettingsSchema.safeParse({ indexPath: "/journal" }).success);
check("a nested path is accepted", postsSettingsSchema.safeParse({ indexPath: "/studio/journal" }).success);
for (const bad of ["journal", "/Journal", "https://example.com/journal", "/journal/", "/a b"]) {
  check(`"${bad}" is refused`, !postsSettingsSchema.safeParse({ indexPath: bad }).success);
}

console.log("links that follow it");
check("a link to /posts goes to the index", postsIndexHref("/posts", "/journal") === "/journal");
check("its section anchor is kept", postsIndexHref("/posts#latest", "/journal") === "/journal#latest");
check("a trailing slash is the same link", postsIndexHref("/posts/", "/journal") === "/journal");
check("a post's own address is left alone", postsIndexHref("/posts/first-firing", "/journal") === "/posts/first-firing");
check("any other link is left alone", postsIndexHref("/about", "/journal") === "/about");
check("with no setting, /posts stays", postsIndexHref("/posts", "/posts") === "/posts");

console.log("the redirect");
const config = read("next.config.ts");
const schema = read("packages/schema/src/config.ts");
const pathRule = /const SITE_PATH_RE = (\/\^.*\$\/);/.exec(schema)?.[1];
check("next.config.ts redirects /posts to the index, permanently (308)", /\{ source: "\/posts", destination: target, permanent: true \}/.test(config));
check("and /<locale>/posts under each other locale", /source: `\/:locale\(\$\{prefixed\}\)\/posts`, destination: `\/:locale\$\{target\}`, permanent: true/.test(config));
check("it checks the path by the schema's own rule", !!pathRule && config.includes(`${pathRule}.test(target)`), pathRule);
check("the redirects are in the list Next reads", /\.\.\.postsIndexRedirects\(\)/.test(config));
const sitemap = read("src/app/sitemap.ts");
check("the sitemap leaves /posts out once the index has moved", /m\.path === "\/posts" && postsIndexMoved/.test(sitemap));
const list = read("src/components/blocks/PostListBlock.tsx");
check("the post list's \"all posts\" link follows the setting", /href=\{postsIndexHref\(block\.viewAllHref\)/.test(list));

console.log("the posts pages");
const indexPath = "src/app/[locale]/posts/page.tsx";
const slugPath = "src/app/[locale]/posts/[slug]/page.tsx";
const inEngine = existsSync(url("studio/engine.release.json"));
if (!existsSync(url(indexPath)) && !inEngine) {
  console.log("  - skipped: the posts module is off on this site");
} else {
  const index = read(indexPath);
  const slug = read(slugPath);
  check("the back link on a post goes to the index", /href=\{postsIndexPath as "\/"\}/.test(slug));
  check("its label is the setting's, else the Copy field", /site\.posts\?\.indexLabel \?\? optionalMessage\(t, "backLabel", "Posts"\)/.test(slug));
  check("the more-posts heading is a Copy field", /optionalMessage\(t, "moreHeading", "More writing"\)/.test(slug));
  for (const [key, fallback] of [["eyebrow", "Writing"], ["title", "Posts"]]) {
    check(`the index ${key} is a Copy field with "${fallback}" as the fallback`, index.includes(`optionalMessage(t, "${key}", "${fallback}")`));
  }
  check("the index names the moved page as canonical", /canonicalUrl\(locale, postsIndexMoved \? postsIndexPath : "\/posts"\)/.test(index));
}
for (const key of ["eyebrow", "title", "subtitle", "backLabel", "moreHeading"]) {
  check(`Studio can edit posts.${key}, shown only with the posts module`, COPY_FIELDS.some((f) => f.ns === "posts" && f.key === key && f.module === "posts"));
}
const en = JSON.parse(read("messages/en.json")) as Record<string, Record<string, string>>;
if (inEngine) check("the reference build keeps its words", en.posts?.eyebrow === "Writing" && en.posts?.title === "Posts" && en.posts?.moreHeading === "More writing");

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
