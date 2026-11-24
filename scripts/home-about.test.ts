/**
 * The home page and the About page, two faults found on the Kopje Light demo (24 Nov 2026).
 *
 * 1. A composed home page with a postList block always read "Nothing published here yet": the home
 *    route never handed its posts down, so the block rendered with no data. The server route now
 *    resolves post summaries and HomeDefault passes them on. HomeDefault is a client component, so it
 *    must not import the posts store itself (that would ship every post body, drafts included).
 * 2. The About page ended on a near-black band (a fixed #06070B scrim inside `.section-invert`) on
 *    every light site, and printed "From" with no value and a lone "·" when a place was unset.
 *
 * These read the source of files every site has. Run: npx --yes tsx scripts/home-about.test.ts
 */
import { readFileSync } from "node:fs";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const route = read("src/app/[locale]/page.tsx");
const home = read("src/components/home/HomeDefault.tsx");
const about = read("src/app/[locale]/about/page.tsx");
const css = read("src/app/globals.css");

console.log("home page posts");
check("the server route hands post summaries to HomeDefault", /<HomeDefault\s+postData=\{\{[^}]*postSummaries\(posts\)/.test(route));
check("HomeDefault is a client component", /^"use client";/.test(home));
check("HomeDefault takes postData and forwards it to the composed page", /postData\?: BlockData/.test(home) && /<PreviewablePage[^>]*data=\{postData\}/.test(home));
check("HomeDefault does not import the posts store", !/from "@\/data\/posts"/.test(home));

console.log("about page");
check("the closing band is not wrapped in section-invert", !/className=["'{`][^"'}`]*section-invert/.test(about));
check("the closing band has no fixed near-black scrim", !/#06070B/i.test(about));
check("the closing band's wash reads the theme's background token", /color-mix\(in oklab, var\(--color-bg\)/.test(about));
check("that token exists in the stylesheet", /--color-bg:/.test(css));
check("the From and Based facts only render when set", /site\.location\?\.from && \(/.test(about) && /site\.location\?\.based && \(/.test(about));
check("the hero meta line joins only the places that are set", /\.filter\(Boolean\)\s*\.join\(" · "\)/.test(about));

if (fails) {
  console.error(`\n${fails} check(s) failed`);
  process.exit(1);
}
console.log("\nall home and about checks pass");
