/**
 * The visitor-mail forms cannot be made to mail strangers (security review TZS-4, EBE-6326).
 *
 * Before the fix the contact, newsletter and Inner Circle routes limited only by the first
 * X-Forwarded-For entry, in one instance's memory: a script that changed that header, or simply
 * came from new addresses, could send any one recipient as many acknowledgements and welcomes as
 * it liked and add them to the Resend audience. This test fails on that code and passes on the fix:
 *
 * - six contact messages naming one recipient, each from a new address, send that recipient at
 *   most three acknowledgements;
 * - a caller cannot reset its own count by writing X-Forwarded-For;
 * - unknown and oversized contact fields never reach the owner's note; a non-string email, or a
 *   body over the cap, is refused;
 * - a newsletter or Inner Circle sign-up sends only a confirm mail: no welcome, no owner's note,
 *   no audience add until the button in it is pressed, and the button works once;
 * - a forged or changed confirm link does nothing;
 * - the site's daily ceiling holds; a counter store that does not answer stops the send;
 * - with a Redis store, the counters live there and hold no address.
 *
 * Run: npx --yes tsx scripts/mail-limits.test.ts
 * No network: global fetch is replaced, so nothing reaches Resend or any store. Every address is
 * made up (example.invalid).
 */
import { existsSync } from "node:fs";
import { NextRequest } from "next/server";
import { POST as contact } from "../src/app/api/contact/route";
import { POST as newsletter } from "../src/app/api/newsletter/route";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

type Call = { url: string; body: Record<string, unknown> | unknown[] };
let calls: Call[] = [];
let resendFails = false;
let storeDown = false;
const redis = new Map<string, number>();
const ttl = new Map<string, number>();
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  const body = JSON.parse(String(init?.body ?? "{}"));
  calls.push({ url, body });
  const json = (v: unknown, status = 200) =>
    new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json" } });
  if (url.startsWith("https://store.example.invalid")) {
    if (storeDown) return json({ error: "down" }, 500);
    // A tiny Redis: INCR key, then EXPIRE key n NX.
    const out = (body as string[][]).map(([cmd, key, seconds, flag]) => {
      if (cmd === "EXPIRE") {
        if (flag !== "NX" || ttl.has(key)) return { result: 0 };
        ttl.set(key, Number(seconds));
        return { result: 1 };
      }
      if (cmd === "GET") return { result: redis.has(key) ? String(redis.get(key)) : null };
      if (cmd === "DEL") {
        const had = redis.delete(key);
        ttl.delete(key);
        return { result: had ? 1 : 0 };
      }
      if (cmd === "INCR") {
        const n = (redis.get(key) ?? 0) + 1;
        redis.set(key, n);
        return { result: n };
      }
      return { error: "unknown command" };
    });
    return json(out);
  }
  if (resendFails && url.includes("/emails")) return json({ name: "validation_error", message: "refused", statusCode: 403 }, 403);
  return json({ id: "test" });
}) as typeof fetch;

const mails = () => calls.filter((c) => /\/emails$/.test(c.url)).map((c) => c.body as Record<string, unknown>);
const audienceAdds = () => calls.filter((c) => /contacts/.test(c.url));
const to = (addr: string) => mails().filter((m) => JSON.stringify(m.to).includes(addr));

const post = (path: string, body: unknown, address: string, extra: Record<string, string> = {}) =>
  new NextRequest(`https://example.com${path}`, {
    method: "POST",
    // Vercel sets both headers to the caller's address; the old code read only X-Forwarded-For.
    headers: { "content-type": "application/json", "x-real-ip": address, "x-forwarded-for": address, ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

// The limiter module exists only after the fix; on the old code the store checks are skipped
// and the checks above them fail on their own.
type Guard = { useCounterStoreForTests: (s: unknown) => void };
async function guard(): Promise<Guard | null> {
  if (!existsSync(new URL("../src/lib/mail-guard.ts", import.meta.url))) return null;
  const path: string = "../src/lib/mail-guard";
  return (await import(path)) as Guard;
}
const fresh = async () => (await guard())?.useCounterStoreForTests(null);

async function confirmRoute(): Promise<{ GET: (r: NextRequest) => Promise<Response>; POST: (r: NextRequest) => Promise<Response> } | null> {
  if (!existsSync(new URL("../src/app/api/newsletter/confirm/route.ts", import.meta.url))) return null;
  const path: string = "../src/app/api/newsletter/confirm/route";
  return await import(path);
}

const linkIn = (m: Record<string, unknown> | undefined) =>
  String(m?.text ?? "").match(/https?:\/\/\S+\/api\/newsletter\/confirm\?t=([A-Za-z0-9_-]+)/)?.[1] ?? "";

const press = (token: string, address: string) =>
  new NextRequest("https://example.com/api/newsletter/confirm", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-real-ip": address },
    body: new URLSearchParams({ t: token }).toString(),
  });

async function main() {
  process.env.RESEND_API_KEY = "re_test_not_real";
  process.env.RESEND_AUDIENCE_ID = "aud_test_not_real";
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.KV_REST_API_URL;
  delete process.env.MAIL_DAILY_CAP;
  await fresh();

  console.log("one recipient, six messages from six addresses");
  calls = [];
  for (let i = 1; i <= 6; i++) {
    await contact(post("/api/contact", { type: "general", name: "Rudo", email: "stranger@example.invalid", message: `hello ${i}` }, `198.51.100.${i}`));
  }
  const acks = to("stranger@example.invalid").length;
  check("exactly three acknowledgements reach the recipient", acks === 3, `${acks} sent`);
  check("the owner still gets every message", mails().filter((m) => !JSON.stringify(m.to).includes("stranger@")).length === 6);
  check("the recipient's sixth acknowledgement is not sent", acks > 0 && acks < 6, `${acks} sent`);

  console.log("a caller writing X-Forwarded-For");
  await fresh();
  calls = [];
  const statuses: number[] = [];
  for (let i = 1; i <= 6; i++) {
    const r = await contact(post("/api/contact", { type: "general", email: `p${i}@example.invalid`, message: "hi" }, "198.51.100.50", { "x-forwarded-for": `10.0.0.${i}` }));
    statuses.push(r.status);
  }
  check("the sixth request from one address is refused (429)", statuses[5] === 429, statuses.join(","));

  console.log("contact fields");
  await fresh();
  calls = [];
  const r1 = await contact(post("/api/contact", { type: "general", email: "a@example.invalid", message: "hi", injected: "INJECTED-FIELD", name: "N".repeat(5000) }, "198.51.100.60"));
  const note = String(mails()[0]?.html ?? "");
  check("answers 200", r1.status === 200, String(r1.status));
  check("an unknown field is not in the owner's note", !note.includes("INJECTED-FIELD"));
  check("a long name is cut to 120 characters", !note.includes("N".repeat(121)) && note.includes("N".repeat(120)));
  calls = [];
  const r2 = await contact(post("/api/contact", { email: ["a@example.invalid", "b@example.invalid"], message: "hi" }, "198.51.100.61"));
  check("an email that is not a string is refused (400)", r2.status === 400 && mails().length === 0, `${r2.status}, ${mails().length} sent`);
  const r3 = await contact(post("/api/contact", JSON.stringify({ email: "a@example.invalid", message: "x".repeat(40_000) }), "198.51.100.62"));
  check("a body over 32 KB is refused (413)", r3.status === 413, String(r3.status));
  const chunked = new NextRequest("https://example.com/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": "198.51.100.63" },
    body: new ReadableStream({
      start(c) {
        const enc = new TextEncoder();
        c.enqueue(enc.encode('{"email":"a@example.invalid","message":"'));
        for (let i = 0; i < 40; i++) c.enqueue(enc.encode("y".repeat(1024)));
        c.enqueue(enc.encode('"}'));
        c.close();
      },
    }),
    duplex: "half",
  } as ConstructorParameters<typeof NextRequest>[1]);
  const r4 = await contact(chunked);
  const korean = await contact(post("/api/contact", { type: "general", email: "ko@example.invalid", message: "안".repeat(5000), links: "링".repeat(1000) }, "198.51.100.64"));
  check("a Korean message at its cap is taken (200)", korean.status === 200, String(korean.status));
  check("a streamed body with no length over 32 KB is refused (413)", r4.status === 413, String(r4.status));

  console.log("newsletter: a confirm mail only");
  await fresh();
  calls = [];
  const n1 = await newsletter(post("/api/newsletter", { email: "Reader@Example.invalid" }, "198.51.100.70"));
  const nm = to("Reader@Example.invalid");
  check("answers 200", n1.status === 200, String(n1.status));
  check("one mail, to the typed address, asking to confirm", mails().length === 1 && nm.length === 1 && /Confirm your address/.test(String(nm[0]?.subject)), JSON.stringify(mails().map((m) => m.subject)));
  check("no owner's note before confirming", !mails().some((m) => /subscriber/i.test(String(m.subject))));

  const route = await confirmRoute();
  const token = linkIn(nm[0]);
  check("the confirm mail carries a link", Boolean(route && token));
  if (route && token) {
    calls = [];
    const g = await route.GET(new NextRequest(`https://example.com/api/newsletter/confirm?t=${token}`));
    const gHtml = await g.text();
    check("opening the link shows a button and sends nothing", g.status === 200 && gHtml.includes('method="post"') && mails().length === 0);
    const p1 = await route.POST(press(token, "198.51.100.70"));
    check("the button sends the owner's note, then the welcome", p1.status === 200 && mails().length === 2
      && /subscriber/i.test(String(mails()[0].subject)) && /mailing list/.test(String(mails()[1].subject)),
      JSON.stringify(mails().map((m) => m.subject)));
    calls = [];
    const p2 = await route.POST(press(token, "198.51.100.70"));
    check("pressing it again sends nothing", p2.status === 200 && mails().length === 0 && (await p2.text()).includes("already confirmed"));
    const realNow = Date.now;
    try {
      Date.now = () => realNow() + 10 * 60 * 1000; // past the five-minute lease
      calls = [];
      const late = await route.POST(press(token, "198.51.100.70"));
      check("pressing it again after the lease has run out still sends nothing", late.status === 200 && mails().length === 0 && (await late.text()).includes("already confirmed"), `${late.status}, ${mails().length}`);
    } finally {
      Date.now = realNow;
    }
    const forged = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
    calls = [];
    const p3 = await route.POST(press(forged, "198.51.100.71"));
    check("a changed link sends nothing (400)", p3.status === 400 && mails().length === 0, String(p3.status));
  }

  console.log("Inner Circle: no audience add before confirming");
  if (existsSync(new URL("../src/app/api/superfan/route.ts", import.meta.url))) {
    const path: string = "../src/app/api/superfan/route";
    const { POST: superfan } = (await import(path)) as { POST: (r: NextRequest) => Promise<Response> };
    await fresh();
    calls = [];
    const s1 = await superfan(post("/api/superfan", { email: "fan@example.invalid", phone: "+263 77 000 0000", city: "Gweru" }, "198.51.100.80"));
    check("answers 200", s1.status === 200, String(s1.status));
    check("no audience add and no welcome yet", audienceAdds().length === 0 && mails().length === 1 && /Confirm/.test(String(mails()[0]?.subject)),
      `${audienceAdds().length} adds, ${JSON.stringify(mails().map((m) => m.subject))}`);
    const ft = linkIn(mails()[0]);
    check("the link does not show the phone or city", ft !== "" && !String(mails()[0]?.text).includes("Gweru"));
    if (route && ft) {
      calls = [];
      await route.POST(press(ft, "198.51.100.80"));
      const noteHtml = String(mails()[0]?.html ?? "");
      check("after the button: owner's note with phone and city, welcome, one audience add",
        mails().length === 2 && noteHtml.includes("Gweru") && noteHtml.includes("+263") && audienceAdds().length === 1,
        `${mails().length} mails, ${audienceAdds().length} adds`);
    }
  } else {
    console.log("  - skipped: this site has no vault module");
  }

  console.log("one caller across the forms in a day");
  await fresh();
  calls = [];
  const across: number[] = [];
  const realNow = Date.now;
  try {
    // Seven quarter-hour windows of five contact messages: past the form's own limit each time,
    // so only the daily ceiling (30) can refuse the 31st.
    for (let w = 0; w < 7; w++) {
      Date.now = () => realNow() + w * 16 * 60 * 1000;
      for (let i = 1; i <= 5; i++) {
        across.push((await contact(post("/api/contact", { type: "general", email: `d${w}-${i}@example.invalid`, message: "hi" }, "198.51.100.200"))).status);
      }
    }
  } finally {
    Date.now = realNow;
  }
  check("the 31st request of the day from one address is refused (429)", across.slice(0, 30).every((x) => x === 200) && across[30] === 429, across.join(","));

  console.log("an address past its share costs the site nothing");
  await fresh();
  process.env.MAIL_DAILY_CAP = "4";
  calls = [];
  for (let i = 1; i <= 8; i++) await contact(post("/api/contact", { type: "general", email: "same@example.invalid", message: "hi" }, `198.51.100.${240 + i}`));
  const after = await newsletter(post("/api/newsletter", { email: "fresh@example.invalid" }, "198.51.100.250"));
  delete process.env.MAIL_DAILY_CAP;
  check("eight requests for one address use 3 of the site's 4; a new sign-up still goes", after.status === 200 && to("same@example.invalid").length === 3 && to("fresh@example.invalid").length === 1,
    `${after.status}, ${to("same@example.invalid").length}, ${to("fresh@example.invalid").length}`);

  console.log("the contact form cannot stop a sign-up");
  await fresh();
  calls = [];
  for (let i = 1; i <= 3; i++) await contact(post("/api/contact", { type: "general", email: "both@example.invalid", message: "hi" }, `198.51.100.${210 + i}`));
  await newsletter(post("/api/newsletter", { email: "both@example.invalid" }, "198.51.100.220"));
  check("after three acknowledgements the address still gets its confirm mail", to("both@example.invalid").length === 4, String(to("both@example.invalid").length));

  console.log("a confirm link whose owner's note failed can be pressed again");
  if (route) {
    await fresh();
    calls = [];
    await newsletter(post("/api/newsletter", { email: "retry@example.invalid" }, "198.51.100.230"));
    const rt = linkIn(to("retry@example.invalid")[0]);
    calls = [];
    resendFails = true;
    const f1 = await route.POST(press(rt, "198.51.100.230"));
    resendFails = false;
    calls = [];
    const f2 = await route.POST(press(rt, "198.51.100.230"));
    check("the first press fails (502), the second goes through (note and welcome)", f1.status === 502 && f2.status === 200 && mails().length === 2, `${f1.status}, ${f2.status}, ${mails().length}`);
    calls = [];
    const alias = await route.POST(press(rt + "A", "198.51.100.230"));
    check("the same link with a stray last character is refused (400)", alias.status === 400 && mails().length === 0, String(alias.status));
  }

  console.log("Resend refuses the confirm mail");
  await fresh();
  calls = [];
  resendFails = true;
  const rf = await newsletter(post("/api/newsletter", { email: "refused@example.invalid" }, "198.51.100.90"));
  resendFails = false;
  check("answers 502, not success", rf.status === 502, String(rf.status));

  const g = await guard();
  if (!g) {
    check("the limiter module exists (src/lib/mail-guard.ts)", false);
  } else {
    console.log("the site's daily ceiling");
    g.useCounterStoreForTests(null);
    process.env.MAIL_DAILY_CAP = "4";
    calls = [];
    const codes: number[] = [];
    for (let i = 1; i <= 4; i++) {
      const r = await newsletter(post("/api/newsletter", { email: `cap${i}@example.invalid` }, `198.51.100.${100 + i}`));
      codes.push(r.status);
    }
    check("up to MAIL_DAILY_CAP=4 the site sends", codes[4 - 1] === 200 && mails().length === 4, codes.join(","));
    const r5 = await newsletter(post("/api/newsletter", { email: "cap5@example.invalid" }, "198.51.100.120"));
    check("the fifth is refused", r5.status === 429 && mails().length === 4, `${r5.status}, ${mails().length}`);
    delete process.env.MAIL_DAILY_CAP;

    console.log("a Redis store");
    g.useCounterStoreForTests(null);
    process.env.UPSTASH_REDIS_REST_URL = "https://store.example.invalid";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-not-real";
    redis.clear();
    calls = [];
    for (let i = 1; i <= 4; i++) {
      await contact(post("/api/contact", { type: "general", email: "kept@example.invalid", message: "hi" }, `203.0.113.${i}`));
    }
    const keys = [...redis.keys()];
    check("the counters are kept in the store", keys.some((k) => k.includes(":to:")) && keys.some((k) => k.includes(":caller:contact:")) && keys.some((k) => k.includes(":day:")), keys.join(" "));
    check("no key holds the address", !keys.some((k) => k.includes("kept@") || k.includes("example.invalid")), keys.join(" "));
    check("every counter key has an expiry", keys.every((k) => (ttl.get(k) ?? 0) > 0), keys.filter((k) => !ttl.has(k)).join(" "));
    check("three acknowledgements to the recipient, counted in the store", to("kept@example.invalid").length === 3, String(to("kept@example.invalid").length));
    storeDown = true;
    calls = [];
    const down = await contact(post("/api/contact", { type: "general", email: "down@example.invalid", message: "hi" }, "203.0.113.50"));
    storeDown = false;
    check("a store that does not answer stops the send (503)", down.status === 503 && mails().length === 0, `${down.status}, ${mails().length}`);
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  }

  globalThis.fetch = realFetch;
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
