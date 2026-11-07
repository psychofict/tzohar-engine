/**
 * The notes a site sends its owner, and the From line a site sends under (EBE-9909).
 *
 * - The contact form's owner note: a plain, one-line subject of at most 78 characters (a long typed
 *   name is cut with "…" and stays whole in the body), the typed values escaped once in the HTML
 *   body only, and a text part with the same facts.
 * - The two sign-up notes: a text part beside the HTML. Their subjects hold nothing a visitor typed.
 * - The From line: a site called `D'Souza <Ltd>` still gives a valid address header.
 *
 * Run: npx --yes tsx scripts/mail-owner-notes.test.ts
 * No network: global fetch is replaced, so nothing reaches Resend.
 */
import { NextRequest } from "next/server";
import { contactAcknowledgement } from "../src/lib/email/supportDesk";
import { POST as contact } from "../src/app/api/contact/route";
import { POST as newsletter } from "../src/app/api/newsletter/route";
import { completeSignup } from "../src/lib/signup";
import { site } from "../src/config/site";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

type Sent = Record<string, unknown> & { from?: string; to?: unknown; subject?: string; html?: string; text?: string };
let sent: Sent[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body ?? "{}")));
  return new Response(JSON.stringify({ id: "test" }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

let ipCount = 0;
const post = (path: string, body: Record<string, unknown>) =>
  new NextRequest(`https://example.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": `203.0.113.${100 + ++ipCount}` },
    body: JSON.stringify(body),
  });

const hasControl = (s: string) => /[\p{Cc}\u2028\u2029]/u.test(s);
const toList = (v: unknown) => (Array.isArray(v) ? v : [v]).map(String);
/** An address header is a display name, then the address in angle brackets: the name is plain words
 *  (RFC 5322 atoms) or a quoted string with no quote, backslash, angle bracket or line break. */
const ATOM = "[A-Za-z0-9!#$%&'*+\\-/=?^_`{|}~]+";
const VALID_FROM = new RegExp(`^(?:${ATOM}(?: ${ATOM})*|"[^"\\\\\\r\\n<>]*") <[^\\s<>"@,]+@[^\\s<>"@,]+>$`);
const NO_HTML_IN_TEXT = (t: string) => !/<\/?(strong|br|p|ul|li|div|h2|span|a)\b/i.test(t) && !/&(amp|lt|gt|quot|mdash|nbsp|#\d+);/i.test(t);
const sendTo = (address: string) => sent.find((m) => toList(m.to).includes(address));

const originalName = site.name;
const originalEmail = site.email;
const rename = (name: string, email: string) => Object.assign(site, { name, email });

async function contactNote(fields: Record<string, unknown>, visitor: string) {
  sent = [];
  const res = await contact(post("/api/contact", { email: visitor, message: "Hello there", ...fields }));
  return { res, note: sendTo(site.email) ?? ({} as Sent) };
}

async function main() {
  process.env.RESEND_API_KEY = "re_test_not_real";
  delete process.env.RESEND_BASE_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  delete process.env.MAIL_DAILY_CAP;

  console.log("contact owner note: the subject is plain text as typed");
  let r = await contactNote({ type: "speaking", name: "Tendai & Sons" }, "v1@example.invalid");
  check("answers 200", r.res.status === 200, String(r.res.status));
  check("an ampersand shows as typed", r.note.subject === "Speaking Invitation from Tendai & Sons", String(r.note.subject));

  r = await contactNote({ type: "general", name: "D'Souza <Ltd>" }, "v2@example.invalid");
  check("an apostrophe and angle brackets show as typed", r.note.subject === "General Inquiry from D'Souza <Ltd>", String(r.note.subject));

  r = await contactNote({ type: "press", outlet: "Daily \"News\" & Co" }, "v3@example.invalid");
  check("a press outlet shows as typed", r.note.subject === 'Press Inquiry from Daily "News" & Co', String(r.note.subject));

  r = await contactNote({ type: "research", name: "Dr. Lee" }, "v4@example.invalid");
  check("research subject", r.note.subject === "Research Collaboration Inquiry from Dr. Lee", String(r.note.subject));

  r = await contactNote({ type: "other" }, "v5&co@example.invalid");
  check("an unlisted type falls back to the address", r.note.subject === "New Inquiry from v5&co@example.invalid", String(r.note.subject));

  console.log("contact owner note: one line, at most 78 characters");
  const long = "Bartholomew-".repeat(10);
  r = await contactNote({ type: "general", name: long.slice(0, 120) }, "v6@example.invalid");
  const lead = "General Inquiry from ";
  check("a 120-character name is cut to 78 with an ellipsis", (r.note.subject?.length ?? 0) === 78 && r.note.subject?.endsWith("…") === true, `${r.note.subject?.length}: ${r.note.subject}`);
  check("only the name is cut", r.note.subject?.startsWith(lead) === true && long.startsWith((r.note.subject ?? "").slice(lead.length, -1)));
  check("the body keeps the whole name", (r.note.html ?? "").includes(long.slice(0, 120)) && (r.note.text ?? "").includes(long.slice(0, 120)));

  const exact = "n".repeat(78 - "General Inquiry from ".length);
  r = await contactNote({ type: "general", name: exact }, "v7@example.invalid");
  check("a name that just fits is not cut", r.note.subject === `General Inquiry from ${exact}` && !(r.note.subject ?? "").includes("…"), String(r.note.subject));

  r = await contactNote({ type: "general", name: "Ana\r\nBcc: x@example.invalid" }, "v8@example.invalid");
  check("a typed line break does not reach the subject", !hasControl(r.note.subject ?? "x\n") && (r.note.subject?.length ?? 0) > 0, JSON.stringify(r.note.subject));
  check("what is left of it stays on one line", r.note.subject === "General Inquiry from Ana Bcc: x@example.invalid", JSON.stringify(r.note.subject));
  check("no Bcc header line starts in the subject", !/^bcc:/im.test(r.note.subject ?? ""));
  check("other control characters go too", !hasControl(sentSubject(await contactNote({ type: "general", name: "A\u0000B\u0007C\tD\u2028E" }, "v9@example.invalid"))));

  r = await contactNote({ type: "general", name: "\u{1F600}".repeat(80) }, "v12@example.invalid");
  check("a cut never splits an emoji", (r.note.subject?.length ?? 999) <= 78 && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(r.note.subject ?? "\uD800"), JSON.stringify(r.note.subject));
  r = await contactNote({ type: "general", name: "\u0007\u0007" }, "v13@example.invalid");
  check("a name of control characters only falls back to the address", r.note.subject === "General Inquiry from v13@example.invalid", JSON.stringify(r.note.subject));

  // A cut keeps whole characters as a reader sees them, not only whole UTF-16 pairs: a flag is two
  // regional indicators, and a family is several people joined by zero-width joiners.
  const flag = "\u{1F1F0}\u{1F1F7}";
  r = await contactNote({ type: "general", name: "a".repeat(54) + flag + flag }, "v14@example.invalid");
  check("a cut never splits a flag", r.note.subject === `${lead}${"a".repeat(54)}…`, JSON.stringify(r.note.subject));
  const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
  r = await contactNote({ type: "general", name: "a".repeat(52) + family + family }, "v15@example.invalid");
  check("a cut never splits a joined emoji", r.note.subject === `${lead}${"a".repeat(52)}…`, JSON.stringify(r.note.subject));
  r = await contactNote({ type: "general", name: flag.repeat(30) }, "v16@example.invalid");
  check("a name of whole flags is cut between two of them", r.note.subject === `${lead}${flag.repeat(14)}…` && r.note.subject.length === 78, JSON.stringify(r.note.subject));

  console.log("contact owner note: a type that is a name on every object is not a listed type");
  let visitor = 0;
  for (const odd of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
    const who = `odd${++visitor}@example.invalid`;
    r = await contactNote({ type: odd }, who);
    check(`type "${odd}" gets the fallback subject`, r.note.subject === `New Inquiry from ${who}`, JSON.stringify(r.note.subject));
  }

  console.log("contact owner note: HTML body escapes once; a text part says the same");
  r = await contactNote({ type: "speaking", name: "Tendai & Sons", eventType: "Gala <VIP>", message: "Fees & travel: 5 < 6" }, "v10@example.invalid");
  const html = r.note.html ?? "";
  const text = r.note.text ?? "";
  check("the HTML body escapes the ampersand once", html.includes("Tendai &amp; Sons") && !html.includes("&amp;amp;"));
  check("the HTML body escapes angle brackets", html.includes("Gala &lt;VIP&gt;") && html.includes("5 &lt; 6"));
  check("there is a text part", text.length > 40, JSON.stringify(r.note.text));
  check("the text part names every field as typed", ["Type: speaking", "Name: Tendai & Sons", "Email: v10@example.invalid", "Message: Fees & travel: 5 < 6", "Event Type: Gala <VIP>"].every((s) => text.includes(s)), text);
  check("the text part names the site", text.includes(`Sent from the ${site.name} contact form`), text);
  check("the text part has no HTML tags or entities", NO_HTML_IN_TEXT(text), text);
  check("the text part leads with the same heading", text.startsWith("New speaking Inquiry\n"), text.split("\n")[0]);

  console.log("the owner notes at sign-up: a text part beside the HTML");
  sent = [];
  const fan = await completeSignup({ kind: "superfan", email: "fan@example.invalid", phone: "+82 10 5555 0000", city: "Seoul & Busan" });
  check("Inner Circle: done", fan === "done", fan);
  const fanNote = sendTo(site.email) ?? ({} as Sent);
  check("Inner Circle: a text part", (fanNote.text ?? "").length > 40, JSON.stringify(fanNote.text));
  check("Inner Circle: the text part has the same facts", ["fan@example.invalid", "+82 10 5555 0000", "Seoul & Busan", "Inner Circle"].every((s) => (fanNote.text ?? "").includes(s)), String(fanNote.text));
  check("Inner Circle: no HTML tags or entities in the text", NO_HTML_IN_TEXT(fanNote.text ?? "x<br>"), String(fanNote.text));
  check("Inner Circle: the HTML escapes the city once", (fanNote.html ?? "").includes("Seoul &amp; Busan") && !(fanNote.html ?? "").includes("&amp;amp;"));
  check("Inner Circle: the subject is plain and short", fanNote.subject === "New Inner Circle member", String(fanNote.subject));

  sent = [];
  const sub = await completeSignup({ kind: "newsletter", email: "reader&co@example.invalid" });
  check("newsletter: done", sub === "done", sub);
  const subNote = sendTo(site.email) ?? ({} as Sent);
  check("newsletter: a text part with the address as typed", (subNote.text ?? "").includes("reader&co@example.invalid") && NO_HTML_IN_TEXT(subNote.text ?? "x<br>"), String(subNote.text));
  check("newsletter: the HTML escapes it once", (subNote.html ?? "").includes("reader&amp;co@example.invalid"));
  check("newsletter: the subject is plain and short", /^[^\p{Cc}&<>]{1,78}$/u.test(subNote.subject ?? "") && subNote.subject !== subNote.subject?.toUpperCase(), String(subNote.subject));

  console.log("the From line: a valid address header whatever the site is called");
  const addr = "hello@dsouza.example";
  const cases: Array<[string, string]> = [
    ["D'Souza <Ltd>", `"D'Souza Ltd" <${addr}>`],
    ["Tendai & Sons, Ltd.", `"Tendai & Sons, Ltd." <${addr}>`],
    ['Say "hi" \\ you', `Say hi you <${addr}>`], // nothing left that needs quotes
    ["Ana\r\nBcc: x@example.invalid Studio", `"Ana Bcc: x@example.invalid Studio" <${addr}>`],
    ["Tendai & Sons", `"Tendai & Sons" <${addr}>`],
  ];
  for (const [name, expected] of cases) {
    const ack = contactAcknowledgement({ name, email: addr, url: "https://dsouza.example" }, { type: "general", name: "Ana Kim" });
    check(`the acknowledgement's From for ${JSON.stringify(name)}`, ack.from === expected, ack.from);
    check("  it is a valid header on one line", VALID_FROM.test(ack.from) && !hasControl(ack.from), ack.from);
  }
  const plain = contactAcknowledgement({ name: "Kopje Light Ceramics", email: "hello@kopje-light.example", url: "https://kopje-light.example" }, { type: "booking" });
  check("an ordinary name is left as it was", plain.from === "Kopje Light Ceramics <hello@kopje-light.example>", plain.from);
  const korean = contactAcknowledgement({ name: "한글 사이트", email: addr, url: "https://dsouza.example" }, { type: "general" });
  check("a Korean name is left as it was", korean.from === `한글 사이트 <${addr}>`, korean.from);

  console.log("the From line on the route's and the sign-up mails of a renamed site");
  rename("D'Souza <Ltd>", addr);
  try {
    r = await contactNote({ type: "general", name: "Ana Kim" }, "v11@example.invalid");
    check("contact owner note From", r.note.from === `"D'Souza Ltd Website" <${addr}>`, String(r.note.from));
    const ackMail = sent.find((m) => toList(m.to).includes("v11@example.invalid"));
    check("contact acknowledgement From", ackMail?.from === `"D'Souza Ltd" <${addr}>`, String(ackMail?.from));

    sent = [];
    const done = await completeSignup({ kind: "newsletter", email: "reader@example.invalid" });
    check("sign-up completes", done === "done", done);
    const froms = sent.map((m) => String(m.from));
    check("sign-up owner note and welcome From are valid headers", froms.length === 2 && froms.every((f) => VALID_FROM.test(f)), froms.join(" | "));
    check("owner note From", froms[0] === `"D'Souza Ltd Website" <${addr}>`, froms[0]);
    check("welcome From", froms[1] === `"D'Souza Ltd" <${addr}>`, froms[1]);

    sent = [];
    const res = await newsletter(post("/api/newsletter", { email: "confirm@example.invalid" }));
    check("confirm request answers 200", res.status === 200, String(res.status));
    check("confirm mail From", sent[0]?.from === `"D'Souza Ltd" <${addr}>`, String(sent[0]?.from));
  } finally {
    rename(originalName, originalEmail);
  }

  globalThis.fetch = realFetch;
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

function sentSubject(r: { note: Sent }): string {
  return r.note.subject ?? "x\n";
}

main().catch((e) => { console.error(e); process.exit(1); });
