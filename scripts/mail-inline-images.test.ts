/**
 * Visitor mail carries its pictures inside the message (EBE-4891). On 22 Oct 2026 Gmail showed the
 * Ebenworks stamp broken while ebenworks.co's name servers failed (EBE-4879), and
 * tzohar-sites.ebenworks.co is in the same zone. So the contact acknowledgement, the newsletter
 * welcome and the Inner Circle welcome send the joint stamp and the Tzohar Sites logo as inline
 * attachments (Resend content_id) with the HTML pointing at cid:<id>.
 *
 * Run: npx --yes tsx scripts/mail-inline-images.test.ts
 * No network: global fetch is replaced, so nothing reaches Resend.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { POST as contact } from "../src/app/api/contact/route";
import { POST as newsletter } from "../src/app/api/newsletter/route";
import { MAIL_IMAGE_SOURCES } from "../src/lib/email/mail-images.generated";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

type Part = { filename: string; content: string; content_type: string; content_id: string };
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

function checkInline(label: string, mail: Record<string, unknown> | undefined) {
  const html = String(mail?.html ?? "");
  const parts = (mail?.attachments ?? []) as Part[];
  const cids = [...new Set([...html.matchAll(/src="cid:([^"]+)"/g)].map((m) => m[1]))].sort();
  check(`${label}: shows the joint stamp and the logo from inline parts`,
    JSON.stringify(cids) === JSON.stringify(["ebenworks-joint-stamp", "tzohar-logo"]), JSON.stringify(cids));
  check(`${label}: every cid: has its part, each attached once`,
    cids.every((c) => parts.some((p) => p.content_id === c && p.content_type === "image/png" && p.content.length > 100))
      && parts.length === cids.length, JSON.stringify(parts.map((p) => p.content_id)));
  check(`${label}: no picture under ebenworks.co stays linked`, !/<img[^>]+src="https?:\/\/[^"]*ebenworks\.co\//.test(html));
}

async function main() {
  process.env.RESEND_API_KEY = "re_test_not_real";
  delete process.env.RESEND_AUDIENCE_ID;

  console.log("contact acknowledgement");
  sent = [];
  await contact(post("/api/contact", { type: "general", name: "Tendai Moyo", email: "visitor@example.invalid", message: "hello" }, "203.0.113.40"));
  checkInline("acknowledgement", sent[1]);

  console.log("newsletter welcome");
  sent = [];
  await newsletter(post("/api/newsletter", { email: "reader@example.invalid" }, "203.0.113.41"));
  checkInline("newsletter welcome", sent.find((m) => String(m.to) === "reader@example.invalid"));

  console.log("Inner Circle welcome");
  // The superfan route belongs to the vault module, which a client site without it does not have.
  if (existsSync(new URL("../src/app/api/superfan/route.ts", import.meta.url))) {
    // A plain string, so the type checker does not resolve it in a site without the file.
    const route: string = "../src/app/api/superfan/route";
    const { POST: superfan } = (await import(route)) as { POST: (req: NextRequest) => Promise<Response> };
    sent = [];
    await superfan(post("/api/superfan", { email: "fan@example.invalid", city: "Harare" }, "203.0.113.42"));
    checkInline("Inner Circle welcome", sent.find((m) => String(m.to) === "fan@example.invalid"));
  } else {
    console.log("  - skipped: this site has no vault module, so no Inner Circle welcome");
  }

  console.log("the logo module matches its source");
  // A client repo has no Studio, so the source pictures are not there to compare: skip, say so.
  // studio/engine.release.json exists only in the engine (a client may keep a studio/ folder of
  // its own). In the engine a missing source still fails, because readFileSync throws.
  const inEngine = existsSync(new URL("../studio/engine.release.json", import.meta.url));
  for (const src of MAIL_IMAGE_SOURCES) {
    if (!inEngine) {
      console.log(`  - skipped: ${src.source} (no Studio in a client repo; checked in the engine)`);
      continue;
    }
    const sha = createHash("sha256").update(readFileSync(new URL(`../${src.source}`, import.meta.url))).digest("hex");
    check(`${src.source} unchanged since scripts/build-mail-images.py ran`, sha === src.sourceSha256);
  }

  globalThis.fetch = realFetch;
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
