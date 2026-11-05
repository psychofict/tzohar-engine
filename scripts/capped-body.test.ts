/**
 * Request bodies are read under a byte cap as they arrive (TZ-4 follow-up, EBE-9474).
 *
 * `req.json()`, `req.formData()` and `req.text()` read a body whole, and a body sent in chunks
 * declares no Content-Length, so a size check on the header never saw it. This proves, on the
 * reader (src/lib/capped-body.ts) and on each route that uses it, that a chunked body with no
 * declared length is cut off close to its cap: the stream is cancelled and the route answers 413
 * (or, for the sign-in form, a redirect back to the sign-in page) before it touches the store,
 * the hub or the image encoder.
 *
 * Fails on the code before the fix: each route's first check does.
 *
 * Run: npx --yes tsx scripts/capped-body.test.ts
 * No network: global fetch is replaced and any call to it is recorded. Made-up values throughout;
 * nothing is written.
 */
import { existsSync } from "node:fs";
import { NextRequest } from "next/server";

process.env.CRM_PASSWORD = "made-up-crm-password";
process.env.CRM_SESSION_SECRET = "made-up-session-secret-for-the-test-0123";
process.env.CRM_DRIVER = "github";
process.env.GITHUB_TOKEN = "made-up-token";
process.env.GITHUB_REPO = "kopje-light-org/secret-repo-name";
process.env.CLOUDINARY_CLOUD_NAME = "made-up-cloud";
process.env.CLOUDINARY_API_KEY = "made-up-key";
process.env.CLOUDINARY_API_SECRET = "made-up-secret";
process.env.CLOUDINARY_FOLDER = "tzohar-sites/kopje-light/crm";
process.env.ACCOUNTS_URL = "https://hub.example";
delete process.env.TZOHAR_PREVIEW;

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const calls: string[] = [];
globalThis.fetch = (async (input: unknown) => {
  calls.push(String(input instanceof Request ? input.url : input));
  return new Response(JSON.stringify({ success: true, data: {} }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

/** A body with no declared length that never ends: it counts what was pulled from it. */
function endless(chunk: number) {
  const state = { pulled: 0, cancelled: false };
  const piece = new Uint8Array(chunk).fill(0x61);
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      state.pulled += chunk;
      c.enqueue(piece);
    },
    cancel() {
      state.cancelled = true;
    },
  });
  return { state, body };
}

/** A finite body of exactly `total` bytes, in chunks, with no declared length. */
function finite(total: number, chunk: number, fill = 0x61) {
  let left = total;
  return new ReadableStream<Uint8Array>({
    pull(c) {
      if (left <= 0) return c.close();
      const n = Math.min(chunk, left);
      left -= n;
      c.enqueue(new Uint8Array(n).fill(fill));
    },
  });
}

const post = (url: string, headers: Record<string, string>, body: ReadableStream<Uint8Array>, method = "POST") =>
  new NextRequest(url, { method, headers, body, duplex: "half" } as unknown as ConstructorParameters<typeof NextRequest>[1]);

async function main() {
  const { BODY_CAPS, BodyTooLarge, readBodyCapped, readFormCapped, readJsonBody, readTextCapped } = await import("../src/lib/capped-body");

  console.log("1. The reader");
  {
    const CAP = 16 * 1024;
    const { state, body } = endless(1024);
    let err: unknown;
    await readBodyCapped(post("https://x.example/a", {}, body), CAP).catch((e) => (err = e));
    check("a chunked body with no declared length is refused", err instanceof BodyTooLarge);
    check(
      `it stops near the cap (cap ${CAP} bytes, pulled ${state.pulled})`,
      state.pulled > CAP && state.pulled <= CAP + 2 * 1024,
      `pulled ${state.pulled}`,
    );
    check("the stream is cancelled, so the sender is cut off", state.cancelled);
  }
  {
    const { state, body } = endless(1024);
    let err: unknown;
    const req = post("https://x.example/a", { "content-length": "999999" }, body);
    await readBodyCapped(req, 16 * 1024).catch((e) => (err = e));
    check("a declared length over the cap is refused before a byte is read", err instanceof BodyTooLarge && state.pulled <= 1024, `pulled ${state.pulled}`);
  }
  {
    const CAP = 4096;
    const ok = await readBodyCapped(post("https://x.example/a", {}, finite(CAP, 512)), CAP);
    check("a body of exactly the cap is read whole", ok.byteLength === CAP);
    let err: unknown;
    await readBodyCapped(post("https://x.example/a", {}, finite(CAP + 1, 512)), CAP).catch((e) => (err = e));
    check("one byte over the cap is refused", err instanceof BodyTooLarge);
    check("an empty body is read as empty", (await readBodyCapped(new Request("https://x.example/a", { method: "POST" }), CAP)).byteLength === 0);
    const text = await readTextCapped(new Request("https://x.example/a", { method: "POST", body: "héllo" }), CAP);
    check("text keeps its UTF-8", text === "héllo", text);
    const form = new FormData();
    form.append("a", "1");
    form.append("file", new File(["xyz"], "f.txt"));
    const back = await readFormCapped(new Request("https://x.example/a", { method: "POST", body: form }), CAP);
    check("form data is parsed from the bytes held", back.get("a") === "1" && (back.get("file") as File).name === "f.txt");
    const j = await readJsonBody(new Request("https://x.example/a", { method: "POST", body: '{"a":1}' }), CAP);
    check("JSON is parsed", j.ok && (j.value as { a: number }).a === 1);
    const bad = await readJsonBody(new Request("https://x.example/a", { method: "POST", body: "{nope" }), CAP);
    check("bad JSON is 400", !bad.ok && bad.status === 400);
    const big = await readJsonBody(post("https://x.example/a", {}, finite(CAP + 1, 512)), CAP);
    check("JSON over the cap is 413", !big.ok && big.status === 413);
  }

  console.log("2. Each route cuts a chunked body off at its cap");
  const { site } = await import("../src/config/site");
  const modulesOn = [...site.modules];
  if (!site.modules.includes("crm")) site.modules.push("crm");
  const { CRM_COOKIE, issueToken } = await import("../src/lib/crm/auth");

  const inEngine = existsSync(new URL("../studio/engine.release.json", import.meta.url));
  async function load(route: string, moduleName: "crm" | "membership"): Promise<{ POST?: (r: NextRequest) => Promise<Response>; PUT?: (r: NextRequest) => Promise<Response> } | null> {
    if (existsSync(new URL(`${route}.ts`, import.meta.url))) return (await import(route)) as never;
    // A client repo whose site has the module off has no such route; the engine always has it.
    if (inEngine || modulesOn.includes(moduleName)) check(`${route.replace(/^\.\.\//, "")} is here`, false);
    else console.log(`  - skipped: this site has no ${moduleName} module (${route.replace(/^\.\.\//, "")})`);
    return null;
  }

  const ORIGIN = "https://crm.kopje-light.example";
  const admin = (path: string, type: string, body: ReadableStream<Uint8Array>) =>
    post(
      `${ORIGIN}${path}`,
      { "content-type": type, origin: ORIGIN, "sec-fetch-site": "same-origin", cookie: `${CRM_COOKIE}=${issueToken().value}` },
      body,
    );

  type Case = { label: string; cap: number; run: (body: ReadableStream<Uint8Array>) => Promise<Response>; want: (r: Response) => boolean };
  const cases: Case[] = [];
  const crmJson = async (name: string, path: string, cap: number) => {
    const route = await load(`../src/app/api/admin/${name}/route`, "crm");
    if (route?.POST) cases.push({ label: `admin/${name}`, cap, run: (b) => route.POST!(admin(path, "application/json", b)), want: (r) => r.status === 413 });
  };
  await crmJson("pages", "/api/admin/pages", BODY_CAPS.adminPage);
  await crmJson("posts", "/api/admin/posts", BODY_CAPS.adminPost);
  await crmJson("settings", "/api/admin/settings", BODY_CAPS.adminSettings);
  const login = await load("../src/app/api/admin/login/route", "crm");
  if (login?.POST) {
    cases.push({
      label: "admin/login",
      cap: BODY_CAPS.adminLogin,
      run: (b) =>
        login.POST!(
          post(`${ORIGIN}/api/admin/login`, { "content-type": "application/x-www-form-urlencoded", origin: ORIGIN, "sec-fetch-site": "same-origin" }, b),
        ),
      want: (r) => r.status === 303 && (r.headers.get("location") ?? "").includes("error=refused"),
    });
  }
  const upload = await load("../src/app/api/admin/upload/route", "crm");
  if (upload?.POST) {
    cases.push({
      label: "admin/upload",
      cap: BODY_CAPS.adminUpload,
      run: (b) => upload.POST!(admin("/api/admin/upload", "multipart/form-data; boundary=made-up-boundary", b)),
      want: (r) => r.status === 413,
    });
  }
  const { membership } = await import("../src/config/membership");
  if (membership.hubProduct) {
    const checkout = await load("../src/app/api/checkout/route", "membership");
    if (checkout?.POST) {
      cases.push({
        label: "checkout",
        cap: BODY_CAPS.checkout,
        run: (b) => checkout.POST!(post("https://kopje-light.example/api/checkout", { "content-type": "application/json" }, b)),
        want: (r) => r.status === 413,
      });
    }
    const profile = await load("../src/app/api/account/profile/route", "membership");
    if (profile?.PUT) {
      cases.push({
        label: "account/profile",
        cap: BODY_CAPS.profile,
        run: (b) =>
          profile.PUT!(
            post(
              "https://kopje-light.example/api/account/profile",
              { "content-type": "application/json", cookie: "__Secure-ebenworks-session.0=made-up" },
              b,
              "PUT",
            ),
          ),
        want: (r) => r.status === 413,
      });
    }
  } else {
    console.log("  - skipped: this site has no hub product (checkout and profile)");
  }

  for (const c of cases) {
    const chunk = Math.min(Math.max(c.cap >> 4, 512), 64 * 1024);
    const { state, body } = endless(chunk);
    calls.length = 0;
    const r = await c.run(body);
    check(`${c.label}: a chunked body with no length is refused (${r.status})`, c.want(r), String(r.status));
    check(
      `${c.label}: reading stopped near its cap (cap ${c.cap} bytes, pulled ${state.pulled})`,
      state.pulled > c.cap && state.pulled <= c.cap + 2 * chunk,
      `pulled ${state.pulled}`,
    );
    check(`${c.label}: the stream was cancelled`, state.cancelled);
    check(`${c.label}: nothing went to GitHub, Cloudinary or the hub`, calls.length === 0, calls.join(", "));
  }

  // A body just inside the profile's cap still goes to the hub, so the cap is not a new refusal.
  if (membership.hubProduct) {
    const profile = await load("../src/app/api/account/profile/route", "membership");
    if (profile?.PUT) {
      calls.length = 0;
      const r = await profile.PUT(
        post(
          "https://kopje-light.example/api/account/profile",
          { "content-type": "application/json", cookie: "__Secure-ebenworks-session.0=made-up" },
          finite(BODY_CAPS.profile, 4096, 0x20),
        ),
      );
      check("account/profile: a body of exactly the cap still reaches the hub", r.status === 200 && calls.length === 1, `${r.status}, ${calls.length} calls`);
    }
  }

  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
