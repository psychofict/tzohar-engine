/**
 * The mail a site sends to its visitors (customer email design, approved by Eben on 20 Oct 2026):
 * the contact acknowledgement, the newsletter welcome and the Inner Circle welcome.
 *
 * A site on its own mail domain sends in its own name: the tenant edition of the Record in the
 * site's colours with the Tzohar Sites footer block. A site on an ebenworks.co address sends its
 * acknowledgement as Tzohar Sites' own support mail. Every message has a text part; the welcomes
 * carry a way off the list. Nothing the visitor typed reaches the mail but a checked first name.
 *
 * Run: npx --yes tsx scripts/contact-acknowledgement.test.ts
 * No network: global fetch is replaced, so nothing reaches Resend.
 */
import { NextRequest } from "next/server";
import { contactAcknowledgement, sendsAsEbenworks } from "../src/lib/email/supportDesk";
import { innerCircleWelcome, newsletterWelcome, siteColours } from "../src/lib/email/siteMail";
import { POST } from "../src/app/api/contact/route";
import { carryInline } from "../src/lib/email/inline";
import { site } from "../src/config/site";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const reference = { name: "Ebstar", email: "contact@ebenworks.co", url: "https://ebstar.co" };
const client = { name: "JAFTER", email: "studio@jafter.example", url: "https://jafter.studio.ebenworks.co" };
const gold = { ...client, appearance: { accent: "#E8B23A" } };

let sent: Record<string, unknown>[] = [];
let failFirst = false;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body ?? "{}")));
  if (failFirst && sent.length === 1) {
    return new Response(JSON.stringify({ name: "validation_error", message: "domain is not verified", statusCode: 403 }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ id: "test" }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

const post = (body: Record<string, unknown>, ip: string) =>
  new NextRequest("https://example.com/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

async function main() {
  console.log("ebenworks.co sender: Tzohar Sites' own support mail");
  const a = contactAcknowledgement(reference, { type: "general", name: "Tendai Moyo" });
  check("From Tzohar Sites Support", a.from === "Tzohar Sites Support <tzohar-sites@ebenworks.co>", a.from);
  check("replies go to the site's address", a.replyTo === "contact@ebenworks.co", a.replyTo);
  check("subject", a.subject === "Your message to Ebstar", a.subject);
  check("Tzohar Sites' logo heads it", a.html.includes("tzohar-sites.ebenworks.co/logo-light.png"));
  check("says where it came through", a.text.includes("which runs on Tzohar Sites"));
  check("greets by the first name", a.text.includes("Hello Tendai,") && !a.text.includes("Moyo"));
  check("no phone number", !/\+\d{2,}/.test(a.text));
  check("light only", a.html.includes('<meta name="color-scheme" content="light">'));

  console.log("a client's own domain: the client's paper with the Tzohar Sites footer block");
  const c = contactAcknowledgement(client, { type: "booking", name: "Ana Kim" });
  check("From the client", c.from === "JAFTER <studio@jafter.example>", c.from);
  check("the client's name heads the text", c.text.startsWith("JAFTER\n"), c.text.split("\n")[0]);
  check("the footer block names Tzohar Sites once", (c.text.match(/Tzohar Sites/g) ?? []).length === 1 && c.html.includes("The JAFTER website is built with Tzohar Sites"));
  check("no Ebenworks wordmark or strip", !/EBEN<\/span>WORKS|ebenworks-email-strip/.test(c.html));
  // SO-39: the joint stamp, once, inside the footer block and in the text part.
  check("the joint stamp once, in the footer block", (c.html.match(/joint-stamp-ebenworks-statotech\.png/g) ?? []).length === 1
    && c.html.indexOf("joint-stamp-ebenworks-statotech.png") > c.html.indexOf("Get a site like this")
    && c.text.includes("A joint product of Ebenworks and Statotech Systems: https://ebenworks.co")
    && !c.html.includes("ebenworks-stamp.png") && !c.html.includes("an Ebenworks product"));
  check("says what arrived", c.text.replace(/\s+/g, " ").includes("We've received your booking enquiry"));
  check("sendsAsEbenworks", sendsAsEbenworks("x@ebenworks.co") && sendsAsEbenworks(" X@EBENWORKS.CO ") && !sendsAsEbenworks("x@ebenworks.co.evil.example"));

  console.log("the typed name");
  for (const typed of ["<b>Tendai</b> Moyo", "https://evil.example/pay Smith", "pay@evil.example", "x".repeat(120)]) {
    const t = contactAcknowledgement(reference, { type: "press", name: typed });
    check(`no name from ${JSON.stringify(typed.slice(0, 24))}`, t.text.includes("Hello,\n") && !/evil|<b>|xxxxxxxx/.test(t.html + t.text));
  }
  check("press has no name: Hello,", contactAcknowledgement(reference, { type: "press" }).text.includes("Hello,\n"));
  check("a demo submission greets the artist", contactAcknowledgement(reference, { type: "labelSubmissions", artistName: "Ndoro" }).text.includes("Hello Ndoro,"));

  console.log("the welcomes");
  for (const [label, m] of [["newsletter", newsletterWelcome(client)], ["Inner Circle", innerCircleWelcome(client)]] as const) {
    check(`${label}: a text part`, m.text.length > 100 && m.text.startsWith("JAFTER\n"));
    check(`${label}: a way off the list in both parts and the header`,
      m.html.includes("mailto:studio@jafter.example?subject=Unsubscribe") && m.text.includes("Unsubscribe: mailto:studio@jafter.example")
        && m.headers["List-Unsubscribe"] === "<mailto:studio@jafter.example?subject=Unsubscribe>");
    check(`${label}: the Tzohar Sites footer block`, m.html.includes("is built with Tzohar Sites.") && m.html.includes("joint-stamp-ebenworks-statotech.png"));
  }
  check("newsletter subject", newsletterWelcome(client).subject === "You're on the JAFTER mailing list");
  check("the Vault link", innerCircleWelcome(client).html.includes("https://jafter.studio.ebenworks.co/vault"));
  const lum = (hex: string) => { const v = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const ratio = (x: string, y: string) => { const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
  for (const s of [client, gold] as Array<{ name: string; email: string; url: string; appearance?: { accent: string } }>) {
    const k = siteColours(s);
    check(`${s.appearance ? "a gold accent" : "the default accent"}: text and button at 4.5:1`, ratio(k.text, "#ffffff") >= 4.5 && ratio(k.fill, k.fillType) >= 4.5, JSON.stringify(k));
  }

  console.log("the route (reference build)");
  process.env.RESEND_API_KEY = "re_test_not_real";
  sent = [];
  const res = await POST(post({ type: "general", name: "Tendai Moyo", email: "visitor@example.invalid", message: "hello" }, "203.0.113.20"));
  check("answers 200", res.status === 200, String(res.status));
  check("sends the notification, then the acknowledgement", sent.length === 2, String(sent.length));
  const ack = sent[1] ?? {};
  const expected = contactAcknowledgement(site, { type: "general", name: "Tendai Moyo" });
  check("acknowledgement From", ack.from === expected.from, String(ack.from));
  check("acknowledgement reply-to", JSON.stringify(ack.reply_to) === JSON.stringify(expected.replyTo), JSON.stringify(ack.reply_to));
  // The stamp and logo travel inside the message since EBE-4891 (scripts/mail-inline-images.test.ts).
  check("acknowledgement HTML and text", ack.html === carryInline(expected.html).html && ack.text === expected.text);

  console.log("the route when the notification is refused");
  sent = [];
  failFirst = true;
  const bad = await POST(post({ type: "general", name: "Tendai", email: "visitor@example.invalid", message: "hello" }, "203.0.113.21"));
  check("answers 502", bad.status === 502, String(bad.status));
  check("sends no acknowledgement", sent.length === 1, String(sent.length));

  globalThis.fetch = realFetch;
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
