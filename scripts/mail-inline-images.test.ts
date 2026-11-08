/**
 * Visitor mail links its pictures from the mail picture host and carries none inside the message
 * (EBE-9568, Eben 5 Nov 2026). The Gmail iPhone app never fetched a nameless inline picture and lists
 * a named one as an attachment, so the contact acknowledgement, the sign-up confirm mails and the
 * newsletter and Inner Circle welcomes send no attachments: the joint stamp and the Tzohar Sites logo
 * are https pictures on the host (mailPictureUrl in blocks.generated.ts), each with a pixel width and
 * height, its brand words as alt text, and a font size and colour for a client that holds pictures back.
 * The file keeps its old name so a client repo's copy is replaced, not left beside a new one.
 *
 * Run: npx --yes tsx scripts/mail-inline-images.test.ts
 * No network: global fetch is replaced, so nothing reaches Resend.
 */
import { existsSync } from "node:fs";
import { NextRequest } from "next/server";
import { POST as contact } from "../src/app/api/contact/route";
import { POST as newsletter } from "../src/app/api/newsletter/route";
import { POST as confirm } from "../src/app/api/newsletter/confirm/route";
import { MAIL_PICTURE_BASE, MAIL_PICTURES, STAMPS, mailPictureUrl } from "../src/lib/email/blocks.generated";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

let sent: Record<string, unknown>[] = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
  sent.push(JSON.parse(String(init?.body ?? "{}")));
  return new Response(JSON.stringify({ id: "test" }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

const post = (path: string, body: Record<string, unknown>, ip: string) =>
  new NextRequest(`https://example.com${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

const STAMP = mailPictureUrl("ebenworks-joint-stamp");
const LOGO = mailPictureUrl("tzohar-logo");
const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function checkLinked(label: string, mail: Record<string, unknown> | undefined) {
  const html = String(mail?.html ?? "");
  const attachments = mail?.attachments as unknown[] | undefined;
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const srcs = imgs.map((t) => attr(t, "src") ?? "");

  check(`${label}: sent`, html.length > 0);
  check(`${label}: no attachments`, attachments === undefined || attachments.length === 0, JSON.stringify(attachments));
  check(`${label}: no cid: picture`, !html.includes("cid:"));
  check(`${label}: every picture is on the mail picture host`,
    imgs.length > 0 && srcs.every((s) => s.startsWith(`${MAIL_PICTURE_BASE}/`)), JSON.stringify(srcs));
  check(`${label}: shows the joint stamp and the Tzohar Sites logo`,
    JSON.stringify([...new Set(srcs)].sort()) === JSON.stringify([STAMP, LOGO].sort()), JSON.stringify(srcs));
  check(`${label}: no picture under ebenworks.co stays linked`, !/<img[^>]+src="https?:\/\/[^"]*ebenworks\.co\//.test(html));

  for (const tag of imgs) {
    const src = attr(tag, "src");
    const w = Number(attr(tag, "width")), h = Number(attr(tag, "height"));
    const alt = attr(tag, "alt"), style = attr(tag, "style") ?? "";
    const name = src === STAMP ? "joint stamp" : src === LOGO ? "logo" : String(src);
    check(`${label}: ${name} has a pixel width and height`, w > 0 && h > 0, tag);
    // Gmail draws a linked picture that does not load as a box about as tall as it is wide when its CSS
    // height is auto (EBE-4879), so a CSS height, where there is one, is the attribute's in pixels.
    const cssH = style.match(/(?:^|;)\s*height:\s*([^;]+)/)?.[1]?.trim();
    check(`${label}: ${name} keeps its pixel height in the style too`, cssH === undefined || cssH === `${h}px`, style);
    check(`${label}: ${name} has a font size and a colour for a held-back picture`,
      /font-size:\s*\d+px/.test(style) && /(^|;)\s*color:/.test(style), style);
    if (src === STAMP) {
      check(`${label}: joint stamp at ${STAMPS.joint.width}x${STAMPS.joint.height}, alt word for word`,
        w === STAMPS.joint.width && h === STAMPS.joint.height && alt === STAMPS.joint.alt, tag);
    } else if (src === LOGO) {
      const f = MAIL_PICTURES["tzohar-logo"];
      check(`${label}: logo drawn at the host file's shape (${w}x${h}), alt "${f.alt}"`,
        h === Math.round((w * f.height) / f.width) && alt === f.alt, tag);
    }
  }
}

async function main() {
  process.env.RESEND_API_KEY = "re_test_not_real";
  delete process.env.RESEND_AUDIENCE_ID;

  console.log("contact acknowledgement");
  sent = [];
  await contact(post("/api/contact", { type: "general", name: "Tendai Moyo", email: "visitor@example.invalid", message: "hello" }, "203.0.113.40"));
  checkLinked("acknowledgement", sent.find((m) => String(m.to) === "visitor@example.invalid"));

  // A sign-up sends a confirm mail first; the welcome follows its button (TZS-4, EBE-6326).
  const confirmLink = (mail: Record<string, unknown> | undefined) =>
    new URL(String(mail?.text ?? "").match(/https?:\/\/\S+\/api\/newsletter\/confirm\?t=[A-Za-z0-9_-]+/)?.[0] ?? "https://x.invalid/");
  const pressConfirm = (link: URL, ip: string) =>
    confirm(new NextRequest(`https://example.com/api/newsletter/confirm`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", "x-real-ip": ip },
      body: new URLSearchParams({ t: link.searchParams.get("t") ?? "" }).toString(),
    }));

  console.log("newsletter confirm mail and welcome");
  sent = [];
  await newsletter(post("/api/newsletter", { email: "reader@example.invalid" }, "203.0.113.41"));
  const readerConfirm = sent.find((m) => String(m.to) === "reader@example.invalid");
  checkLinked("newsletter confirm mail", readerConfirm);
  sent = [];
  await pressConfirm(confirmLink(readerConfirm), "203.0.113.41");
  checkLinked("newsletter welcome", sent.find((m) => String(m.to) === "reader@example.invalid"));

  console.log("Inner Circle welcome");
  // The superfan route belongs to the vault module, which a client site without it does not have.
  if (existsSync(new URL("../src/app/api/superfan/route.ts", import.meta.url))) {
    // A plain string, so the type checker does not resolve it in a site without the file.
    const route: string = "../src/app/api/superfan/route";
    const { POST: superfan } = (await import(route)) as { POST: (req: NextRequest) => Promise<Response> };
    sent = [];
    await superfan(post("/api/superfan", { email: "fan@example.invalid", city: "Harare" }, "203.0.113.42"));
    const fanConfirm = sent.find((m) => String(m.to) === "fan@example.invalid");
    checkLinked("Inner Circle confirm mail", fanConfirm);
    sent = [];
    await pressConfirm(confirmLink(fanConfirm), "203.0.113.42");
    checkLinked("Inner Circle welcome", sent.find((m) => String(m.to) === "fan@example.invalid"));
  } else {
    console.log("  - skipped: this site has no vault module, so no Inner Circle welcome");
  }

  console.log("an old caller of carryInline (only while the stand-in file exists)");
  if (existsSync(new URL("../src/lib/email/inline.ts", import.meta.url))) {
    // A variable specifier, so the type check passes once the file is deleted (EBE-9591).
    const standIn: string = "../src/lib/email/inline";
    const { carryInline } = (await import(standIn)) as {
      carryInline: (html: string) => { html: string; attachments: unknown[] };
    };
    const own = "https://client.example/logo.png";
    const old = `<img src="https://tzohar-sites.ebenworks.co/logo-light.png" width="120" height="40" alt="Tzohar Sites"><img src="${own}">`;
    const out = carryInline(old);
    check("the old logo address becomes its file on the host", out.html.includes(`src="${LOGO}"`), out.html);
    check("a site's own logo keeps its own address", out.html.includes(`src="${own}"`), out.html);
    check("nothing is attached", out.attachments.length === 0, JSON.stringify(out.attachments));
  }

  globalThis.fetch = realFetch;
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
