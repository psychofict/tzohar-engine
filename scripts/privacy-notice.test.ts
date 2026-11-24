/**
 * The site's privacy notice (audit item E6, 24 Nov 2026).
 *
 * The notice named Ebenworks as the operator of every client's site, with Ebenworks' privacy
 * address, and listed a newsletter, a contact form and processors whether or not the site had
 * them. Now the client is the operator (`site.legal`), Ebenworks Systems (Private) Limited is named
 * as the company that builds and hosts the site, and each item appears only when the site has
 * the thing it describes. scripts/analytics-notice.test.ts and scripts/mail-picture-notice.test.ts
 * still hold the analytics list and the mail picture paragraph.
 *
 * Run: npx --yes tsx scripts/privacy-notice.test.ts
 */
import { readFileSync } from "node:fs";
import { legalSchema } from "../packages/schema/src/config";
import { BUILDER, operator, privacyEmail, sendsEmail, takesMessages } from "../src/lib/privacy-facts";
import { site } from "../src/config/site";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const page = read("src/app/[locale]/privacy/page.tsx");
const facts = read("src/lib/privacy-facts.ts");

console.log("who runs the site");
check("the setting takes an operator, a country and a privacy address",
  legalSchema.safeParse({ operator: "Kopje Light Ceramics", country: "Zimbabwe", privacyEmail: "hello@example.com" }).success);
check("a privacy address that is not an address is refused", !legalSchema.safeParse({ privacyEmail: "hello" }).success);
check("the operator is legal.operator, else the legal name, else the site name",
  /site\.legal\?\.operator \?\? site\.legalName \?\? site\.name/.test(facts));
check("this site's operator resolves", operator === (site.legal?.operator ?? site.legalName ?? site.name), operator);
check("privacy requests go to legal.privacyEmail, else the site's address", privacyEmail === (site.legal?.privacyEmail ?? site.email));
check("the page sends requests to that address", /href=\{`mailto:\$\{privacyEmail\}`\}/.test(page));
check("the page names no Ebenworks mailbox itself", !/[\w.+-]+@ebenworks\.co/.test(page));

console.log("who builds and hosts it");
check("the builder is the registered company", BUILDER === "Ebenworks Systems (Private) Limited");
check("the page says the builder builds and hosts the site for the operator", /\{BUILDER\} builds\s+the site and hosts it for \{operator\}/.test(page));
check("the builder heads the list of who handles the data", /Who handles it for us<\/h2>\s*<ul>\s*<li><strong>\{BUILDER\}<\/strong>/.test(page));
check("the short company form is gone", !/\(Pvt\) Ltd/.test(page));

console.log("only what the site has");
check("sign-ups only when the site takes them", /\{signups && \(/.test(page));
check("the contact form only when it takes messages", /\{takesMessages && \(/.test(page));
check("membership only with the membership module", /\{membership && \(/.test(page));
check("the mail paragraph and the mail processor only when the site sends mail", (page.match(/\{sendsEmail && \(/g) ?? []).length >= 2);
check("Cloudinary only when the site's pictures are there", /\{usesCloudinary && <li><strong>Cloudinary<\/strong>/.test(page));
check("the site sends mail exactly when it takes messages or sign-ups", /export const sendsEmail: boolean = takesNewsletter \|\| takesFreeSignups \|\| takesMessages;/.test(facts));
check("this build takes messages unless it is a preview", takesMessages === (process.env.TZOHAR_PREVIEW !== "1") && (!takesMessages || sendsEmail));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
