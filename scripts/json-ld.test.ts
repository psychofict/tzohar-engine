/**
 * JSON-LD escaping (src/lib/json-ld.ts, EBE-515). Site owners write the text that
 * ends up in these blocks, so "</script>" in a page title must not close the
 * element. Run: npx --yes tsx scripts/json-ld.test.ts
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JsonLd from "../src/components/JsonLd";
import { serializeJsonLd } from "../src/lib/json-ld";
import { existsSync, readFileSync } from "node:fs";
import { absoluteUrl } from "../src/lib/absolute-url";
import { getPersonSchema, personName, personRef } from "../src/lib/structured-data";
import { site } from "../src/config/site";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const hostile = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Owner</script><script>alert(document.cookie)</script>",
  description: "a < b, <!-- not a comment --> &   line separator",
};

const html = renderToStaticMarkup(createElement(JsonLd, { data: hostile }));
const open = '<script type="application/ld+json">';
const inner = html.slice(open.length, html.lastIndexOf("</script>"));

check("the component renders one script element", html.startsWith(open) && html.endsWith("</script>"), html);
check('no "<" survives inside it', !inner.includes("<"), inner);
check("an HTML parser would end the element only at the real close tag",
  html.toLowerCase().indexOf("</script") === html.length - "</script>".length);
check("JSON.parse gives back exactly what went in", JSON.stringify(JSON.parse(inner)) === JSON.stringify(hostile));
check("the escape is \\u003c", serializeJsonLd({ a: "<" }) === '{"a":"\\u003c"}', serializeJsonLd({ a: "<" }));
check("plain data is unchanged", serializeJsonLd({ name: "Ebstar", url: "https://ebstar.co" }) === JSON.stringify({ name: "Ebstar", url: "https://ebstar.co" }));

// The control: what 14c42ef rendered for the same data.
const before = `${open}${JSON.stringify(hostile)}</script>`;
check("the old output did break out (control)", before.indexOf("</script") < before.length - "</script>".length);

// Audit item E9 (24 Nov 2026): the Person carried the site's name, every picture address got the
// site's origin in front even when it was already a full address (Studio stores pictures on
// Cloudinary), and a post's author was not the person.
console.log("picture addresses");
check("a path gets the site's origin", absoluteUrl("/og.jpg", "https://x.test") === "https://x.test/og.jpg");
check("a trailing slash on the origin is not doubled", absoluteUrl("/og.jpg", "https://x.test/") === "https://x.test/og.jpg");
check("a path without a slash still joins", absoluteUrl("og.jpg", "https://x.test") === "https://x.test/og.jpg");
const cloud = "https://res.cloudinary.com/demo/image/upload/v1/sites/og.jpg";
check("a full address is left alone", absoluteUrl(cloud, "https://x.test") === cloud, absoluteUrl(cloud, "https://x.test"));
check("a scheme-relative address gets https", absoluteUrl("//cdn.test/a.png", "https://x.test") === "https://cdn.test/a.png");

console.log("the person");
const person = getPersonSchema() as { name: string; "@id": string; image: { url: string }; alternateName?: string[] };
check("the Person is named by personName()", person.name === personName(), person.name);
const p = site.person;
const full = [p?.givenName, p?.familyName].filter(Boolean).join(" ");
check("with a given or family name set, that is the name", !full || person.name === full, `${person.name} vs ${full}`);
check("its picture address is absolute and has one scheme", /^https:\/\//.test(person.image.url) && !/https?:\/\/.*https?:\/\//.test(person.image.url), person.image.url);
check("a post's author points at the same Person", personRef()["@id"] === person["@id"] && personRef().name === person.name);
const slugPage = new URL("../src/app/[locale]/posts/[slug]/page.tsx", import.meta.url);
if (!existsSync(slugPage) && !existsSync(new URL("../studio/engine.release.json", import.meta.url))) {
  console.log("  - skipped: the posts module is off on this site");
} else {
  const post = readFileSync(slugPage, "utf8");
  check("the post page names the person as author", /author: personRef\(\)/.test(post));
  check("the post page's picture address is made absolute only when relative", /image: post\.coverImage \? absoluteUrl\(post\.coverImage, site\.url\)/.test(post));
}

console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
