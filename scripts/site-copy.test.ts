/**
 * Words the site owner could not change, found on the Kopje Light demo (audit items E1, E2, E3 and
 * E11, 24 Nov 2026).
 *
 * E1  The footer printed "Worldwide" after the place on every site. It is the Copy field
 *     `footer.reach` now; with it missing or empty the place prints alone.
 * E2  The contact page's eyebrow, title and subtitle had no Copy fields, its labels were in title
 *     case, and its search description was fixed English.
 * E3  The About page's heading and closing band had no Copy fields, printed "The story" twice,
 *     fixed "From" and "Based" in English, used the share picture behind the closing band and
 *     cropped its hero to the reference build's face position.
 * E11 The gallery's search description was a musician's sentence, and it shared the reference
 *     build's picture by path.
 *
 * The gallery block is skipped with a note on a site without the gallery module.
 * Run: npx --yes tsx scripts/site-copy.test.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { COPY_FIELDS } from "../packages/schema/src/content/copy";
import { optionalMessage, optionalMessageOrEmpty } from "../src/lib/optional-message";

const url = (p: string) => new URL(`../${p}`, import.meta.url);
const read = (p: string) => readFileSync(url(p), "utf8");
/** The source with its comments taken out, for checks on what the code says (comments quote the old text). */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const hasField = (ns: string, key: string) => COPY_FIELDS.some((f) => f.ns === ns && f.key === key);
const en = JSON.parse(read("messages/en.json")) as Record<string, Record<string, string>>;
/** The engine checkout. A client's messages files are its own words, so their wording is checked only here. */
const inEngine = existsSync(url("studio/engine.release.json"));

/** A translator over one namespace, the shape next-intl's `t` has. */
const translator = (messages: Record<string, string>) =>
  Object.assign((key: string) => messages[key], { has: (key: string) => key in messages });

console.log("optional messages");
check("a missing key gives the fallback", optionalMessage(translator({}), "reach", "x") === "x");
check("an empty key gives the fallback", optionalMessage(translator({ reach: "  " }), "reach", "x") === "x");
check("a set key gives its value", optionalMessage(translator({ reach: "Africa" }), "reach", "x") === "Africa");
check("the empty form gives nothing when unset", optionalMessageOrEmpty(translator({}), "reach") === "");

console.log("E1 footer reach line");
const footer = code("src/components/Footer.tsx");
check("Studio can edit footer.reach", hasField("footer", "reach"));
if (inEngine) check("the reference build keeps its wording", en.footer?.reach === "Worldwide");
check("the footer joins the place and the reach line, leaving out what is unset",
  /\[site\.location\?\.based, optionalMessageOrEmpty\(t, "reach"\)\]\.filter\(Boolean\)\.join\(" · "\)/.test(footer));
check("no fixed \"Worldwide\" is left in the footer", !/>[^<{]*Worldwide|"Worldwide"/.test(footer));

console.log("E2 contact page");
const contact = read("src/app/[locale]/contact/page.tsx");
const contactLayout = read("src/app/[locale]/contact/layout.tsx");
for (const key of ["contactLabel", "title", "subtitle"]) check(`Studio can edit contact.${key}`, hasField("contact", key));
check("Studio can edit metadata.contactDescription", hasField("metadata", "contactDescription"));
check("the contact layout reads its description from messages", /optionalMessage\(t, "contactDescription",/.test(contactLayout));
check("the contact hero takes the site's focal point", /imagePosition=\{pageHeroPosition\}/.test(contact));
const LABELS = ["title", "faqsTitle", "socialLinks", "basedIn", "labelSubmissions", "eventType", "budgetRange", "outletName",
  "collaborationType", "artistName", "linksToMusic", "submitBooking", "submitPress", "submitCollab", "submitDemo", "sendMessage", "research"];
const titleCase = LABELS.filter((k) => en.contact?.[k] && /\s[A-Z]/.test(en.contact[k]));
if (inEngine) check("the reference build's contact labels are in sentence case", titleCase.length === 0, titleCase.map((k) => `${k}: ${en.contact[k]}`).join("; "));

console.log("E3 about page");
const about = read("src/app/[locale]/about/page.tsx");
const focal = read("src/lib/hero-focal.ts");
for (const key of ["aboutHeading", "letsBuildTitle", "letsBuildDesc"]) check(`Studio can edit about.${key}`, hasField("about", key));
check("\"The story\" is printed once", (about.match(/t\("theStory"\)/g) ?? []).length === 1);
check("\"From\" and \"Based\" come from messages, with English fallbacks",
  /optionalMessage\(t, "fromLabel", "From"\)/.test(about) && /optionalMessage\(t, "basedLabel", "Based"\)/.test(about));
if (inEngine) check("the reference build's messages file has both labels", en.about?.fromLabel === "From" && en.about?.basedLabel === "Based");
check("the closing band does not use the share picture", !/ctaBackdrop\s*=[^;]*ogImage/.test(about));
check("the about hero takes the site's focal point", /imagePosition=\{pageHeroPosition\}/.test(about));
check("without a focal point the hero crops to the centre", /pageHeroPosition[^=]*=\s*heroFocalPosition \?\? "center"/.test(focal));

console.log("E11 gallery");
const galleryLayout = "src/app/[locale]/gallery/layout.tsx";
if (!existsSync(url(galleryLayout)) && !inEngine) {
  console.log("  - skipped: the gallery module is off on this site");
} else {
  check("the engine checkout has the gallery layout", existsSync(url(galleryLayout)));
  if (existsSync(url(galleryLayout))) {
    const gallery = code(galleryLayout);
    check("no other site's sentence is left", !/the stage, the road|tours, travel, press/i.test(gallery));
    check("the title is the page's own", /optionalMessage\(tg, "title", "Gallery"\)/.test(gallery));
    check("the description is the Copy field, else the subtitle", /optionalMessage\(tm, "galleryDescription", optionalMessage\(tg, "subtitle",/.test(gallery));
    check("the share picture is the site's own", /pageOpenGraph\(/.test(gallery) && !/["'`]\/[\w-]+\.(jpe?g|png|webp)/.test(gallery));
  }
  for (const [ns, key] of [["gallery", "title"], ["gallery", "subtitle"], ["metadata", "galleryDescription"]]) {
    check(`Studio can edit ${ns}.${key}, shown only with the gallery`, COPY_FIELDS.some((f) => f.ns === ns && f.key === key && f.module === "gallery"));
  }
}

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
