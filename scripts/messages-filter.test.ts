/**
 * What the browser is sent of the messages file (src/lib/messages.ts), audit item E10 (24 Nov 2026).
 *
 * Everything handed to NextIntlClientProvider is written into every page's HTML. The filter
 * dropped whole module namespaces, but kept `contact`, `nav` and `metadata` whole, so a site with
 * only a general contact form still shipped "Submit demo", "Your artist / stage name", the music
 * menu labels and the reference build's search descriptions. These checks run the filter on
 * made-up sites, then on this site's own config and messages.
 *
 * Run: npx --yes tsx scripts/messages-filter.test.ts
 */
import { readFileSync } from "node:fs";
import type { AbstractIntlMessages } from "next-intl";
import { filterMessages, filterMessagesFor, offeredInquiries, type MessageFilterFacts } from "../src/lib/messages";
import { navEntries } from "../src/config/navigation";
import type { SiteModule } from "../src/config/site";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const en = JSON.parse(readFileSync(new URL("../messages/en.json", import.meta.url), "utf8")) as AbstractIntlMessages;
const ns = (m: AbstractIntlMessages, name: string) => (m[name] ?? {}) as Record<string, unknown>;

/** A made-up site with only the modules named. */
const facts = (modules: SiteModule[], extra: Partial<MessageFilterFacts> = {}): MessageFilterFacts => ({
  hasModule: (m) => modules.includes(m),
  hasComposedHome: false,
  preview: false,
  footerNewsletter: true,
  hasBasedIn: false,
  ...extra,
});

// The fixture is a full messages file shaped like the reference build's, so the made-up sites
// below have every key to lose.
const all = {
  ...en,
  metadata: { musicTitle: "Music", defaultTitle: "Site" },
  posts: { title: "Posts" },
  notFound: { title: "Not found" },
  nav: { home: "Home", about: "About", contact: "Contact", music: "Music", discography: "Discography", overview: "Overview", ai: "AI", influence: "Influence", signIn: "Sign in" },
  footer: { more: "More", tourDates: "Tour dates", aiMlEngineer: "AI/ML engineer", newsletter: "Newsletter", newsletterDesc: "News", reach: "Worldwide" },
} as AbstractIntlMessages;

console.log("server-only namespaces");
const plain = filterMessagesFor(all, facts([]));
for (const name of ["metadata", "posts", "notFound"]) check(`${name} never reaches the browser`, !(name in plain));
check("core namespaces stay", ["common", "nav", "footer", "contact", "about"].every((n) => n in plain));

console.log("menu labels");
const navPlain = ns(plain, "nav");
check("a site without music drops the music labels", !("music" in navPlain) && !("discography" in navPlain));
check("home, about and contact stay", ["home", "about", "contact"].every((k) => k in navPlain));
check("overview goes when neither AI nor influencer runs", !("overview" in navPlain));
check("overview stays while AI runs", "overview" in ns(filterMessagesFor(all, facts(["ai"])), "nav"));
check("sign-in goes without membership", !("signIn" in navPlain));
check("sign-in stays with membership", "signIn" in ns(filterMessagesFor(all, facts(["membership"])), "nav"));

console.log("footer");
const footerPlain = ns(plain, "footer");
check("tour dates and the AI line go without their modules", !("tourDates" in footerPlain) && !("aiMlEngineer" in footerPlain));
check("the reach line stays", footerPlain.reach === "Worldwide");
check("the newsletter copy stays while the footer shows the form", "newsletter" in footerPlain);
const noLetter = ns(filterMessagesFor(all, facts([], { footerNewsletter: false })), "footer");
check("the newsletter copy goes with the form", !("newsletter" in noLetter) && !("newsletterDesc" in noLetter));

console.log("contact forms");
const general = ns(filterMessagesFor(all, facts([], { inquiries: ["general"] })), "contact");
check("a general-only site ships no demo form", !("submitDemo" in general) && !("stageName" in general), Object.keys(general).join(","));
check("a general-only site ships no booking tab or budget list", !("booking" in general) && !("under1k" in general));
check("a general-only site keeps its own form", ["general", "sendMessage", "whatsOnMind", "name", "email", "message"].every((k) => k in general));
const research = ns(filterMessagesFor(all, facts([], { inquiries: ["research"] })), "contact");
check("the research tab keeps the collaboration form and its institution field", ["research", "submitCollab", "institutionName"].every((k) => k in research));
check("the research tab drops the collaborations tab label", !("collaborations" in research));
const untouched = ns(filterMessagesFor(all, facts([])), "contact");
check("with no list set, every form with a label stays", ["submitDemo", "submitBooking", "submitPress", "submitCollab", "sendMessage"].every((k) => k in untouched));
check("the preview note goes on a live build", !("previewFormNote" in untouched));
const preview = ns(filterMessagesFor(all, facts([], { preview: true })), "contact");
check("a preview build ships no form at all", !["general", "sendMessage", "name", "submitDemo"].some((k) => k in preview));
check("a preview build keeps its note and the page's own words", ["previewFormNote", "contactLabel", "title"].every((k) => k in preview));
check("the city fallback goes once the site names its place", !("seoulKorea" in ns(filterMessagesFor(all, facts([], { hasBasedIn: true })), "contact")));
check(
  "a configured tab whose label is missing falls back to general, as the page does",
  JSON.stringify(offeredInquiries({ general: "General" }, facts([], { inquiries: ["booking"] }))) === '["general"]',
);
const fallback = ns(filterMessagesFor({ ...all, contact: { general: "General", sendMessage: "Send", name: "Name" } }, facts([], { inquiries: ["booking"] })), "contact");
check("and keeps the general form's words for it", "sendMessage" in fallback && "name" in fallback);

console.log("this site");
const own = filterMessages(en, { hasComposedHome: false });
const ownNav = ns(own, "nav");
const labels = navEntries.flatMap((e) => (e.kind === "group" ? [e.labelKey, ...e.children.map((c) => c.nameKey)] : [e.nameKey]));
const missing = labels.filter((k) => !k.startsWith("@") && k in ns(en, "nav") && !(k in ownNav));
check("every menu label this site shows is still sent", missing.length === 0, missing.join(", "));
check("no search descriptions are sent", !("metadata" in own));

if (fails) {
  console.error(`\n${fails} check${fails === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("\nall checks passed");
