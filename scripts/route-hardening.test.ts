/**
 * Small hardening of the engine's routes (security review TZS-12).
 *
 * 1. A failed save in the CRM, a failed upload and a failed checkout answer a fixed text: GitHub's
 *    or the hub's own answer (repository path included) stays in the server log. A content error
 *    the schema found is still told to the editor.
 * 2. /api/checkout and /api/account/profile forward only the hub session cookie (and its
 *    Auth.js chunks) to the hub, never the site's other cookies.
 * 3. The CRM routes answer 404 when the site has the crm module off (also in crm-access.test.ts).
 * 4. Newsletter and superfan report a failure when Resend refuses the confirm mail, or (on the
 *    confirm button, TZS-4) the note to the site owner.
 *
 * Run: npx --yes tsx scripts/route-hardening.test.ts
 * No network: global fetch is replaced, so nothing reaches GitHub, Cloudinary, Resend or the hub.
 * Made-up values throughout; nothing is written (the CRM runs on a fake GitHub).
 */
import { NextRequest } from "next/server";

process.env.CRM_PASSWORD = "made-up-crm-password";
process.env.CRM_SESSION_SECRET = "made-up-session-secret-for-the-test-0123";
process.env.CRM_DRIVER = "github";
process.env.GITHUB_TOKEN = "made-up-token";
process.env.GITHUB_REPO = "kopje-light-org/secret-repo-name";
process.env.CLOUDINARY_CLOUD_NAME = "made-up-cloud";
process.env.CLOUDINARY_API_KEY = "made-up-key";
process.env.CLOUDINARY_API_SECRET = "made-up-secret";
process.env.ACCOUNTS_URL = "https://hub.example";
process.env.RESEND_API_KEY = "re_made_up";
process.env.RESEND_AUDIENCE_ID = "";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

type Seen = { url: string; headers: Headers; body: string };
let seen: Seen[] = [];
let answer: (url: string, n: number) => Response = () => new Response("{}", { status: 200 });
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  seen.push({ url, headers: new Headers(init?.headers), body: typeof init?.body === "string" ? init.body : "" });
  return answer(url, seen.length);
}) as typeof fetch;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const ORIGIN = "https://crm.kopje-light.example";
const GITHUB_ANSWER =
  'GitHub-internal: {"message":"Not Found","documentation_url":"https://docs.github.com"} for kopje-light-org/secret-repo-name';

async function main() {
  const { site } = await import("../src/config/site");
  if (!site.modules.includes("crm")) site.modules.push("crm");
  const { CRM_COOKIE, issueToken } = await import("../src/lib/crm/auth");
  const posts = (await import("../src/app/api/admin/posts/route")).POST;
  const pagesRoute = (await import("../src/app/api/admin/pages/route")).POST;
  const settings = (await import("../src/app/api/admin/settings/route")).POST;
  const upload = (await import("../src/app/api/admin/upload/route")).POST;
  const admin = (path: string, body: BodyInit, type = "application/json") =>
    new NextRequest(`${ORIGIN}${path}`, {
      method: "POST",
      headers: {
        "content-type": type,
        origin: ORIGIN,
        "sec-fetch-site": "same-origin",
        cookie: `${CRM_COOKIE}=${issueToken().value}`,
      },
      body,
    });
  const text = async (r: Response) => JSON.stringify(await r.clone().json().catch(() => ({})));
  const leaks = (s: string) => /secret-repo-name|kopje-light-org|GitHub|api\.github\.com|cloudinary/i.test(s);

  console.log("1. CRM failures answer a fixed text");
  answer = () => new Response(GITHUB_ANSWER, { status: 404 });
  for (const [label, route, path, body] of [
    ["posts", posts, "/api/admin/posts", { action: "delete", original: "made-up-post" }],
    ["pages", pagesRoute, "/api/admin/pages", { slug: "home", page: { slug: "home", title: "Home", blocks: [] } }],
    ["settings", settings, "/api/admin/settings", { tagline: "Made-up tagline" }],
  ] as const) {
    seen = [];
    const r = await route(admin(path, JSON.stringify(body)));
    const t = await text(r);
    check(`${label}: GitHub failing reaches the store (fake GitHub called)`, seen.some((s) => s.url.includes("api.github.com")));
    check(`${label}: answers 502 without GitHub's text or the repository`, r.status === 502 && !leaks(t), `${r.status} ${t}`);
  }

  // A schema error is the editor's own content and is still named.
  const values = (await import("../src/config/site.values.json")).default;
  answer = (url) => {
    if (url.includes("/contents/")) {
      return json(200, { content: Buffer.from(JSON.stringify(values)).toString("base64"), encoding: "base64", sha: "0" });
    }
    return new Response(GITHUB_ANSWER, { status: 500 });
  };
  const bad = await settings(admin("/api/admin/settings", JSON.stringify({ url: 42 })));
  const badText = await text(bad);
  check(
    "a content error is told to the editor (400, names the field)",
    bad.status === 400 && /Not saved\. Please fix/.test(badText) && /url/.test(badText) && !leaks(badText),
    `${bad.status} ${badText}`,
  );

  // A stored file that no longer parses is not the editor's fault: fixed text.
  answer = (url) =>
    url.includes("/contents/")
      ? json(200, { content: Buffer.from(JSON.stringify({ name: 42 })).toString("base64"), encoding: "base64", sha: "0" })
      : new Response(GITHUB_ANSWER, { status: 500 });
  const broken = await settings(admin("/api/admin/settings", JSON.stringify({ tagline: "Made-up" })));
  const brokenText = await text(broken);
  check("a broken stored file answers 502 with the fixed text, not as the editor's mistake", broken.status === 502 && !/Please fix/.test(brokenText), `${broken.status} ${brokenText}`);

  // A save that repairs a broken stored value still goes through.
  answer = (url, n) =>
    url.includes("/contents/")
      ? json(200, { content: Buffer.from(JSON.stringify({ ...values, url: 42 })).toString("base64"), encoding: "base64", sha: "0" })
      : json(201, { object: { sha: "made-up-sha" }, sha: `made-up-${n}`, tree: { sha: "made-up-tree" }, html_url: "https://example.invalid/commit" });
  const repaired = await settings(admin("/api/admin/settings", JSON.stringify({ url: "https://kopje-light.example" })));
  check("a save that repairs a broken stored value is not refused", repaired.status === 200, `${repaired.status} ${await text(repaired)}`);

  const stillBad = await settings(admin("/api/admin/settings", JSON.stringify({ url: 7 })));
  check("broken store, and the editor's own field invalid: told what to fix (400)", stillBad.status === 400 && /Please fix/.test(await text(stillBad)), `${stillBad.status} ${await text(stillBad)}`);
  for (const [label, route, path] of [
    ["posts", posts, "/api/admin/posts"],
    ["pages", pagesRoute, "/api/admin/pages"],
    ["settings", settings, "/api/admin/settings"],
  ] as const) {
    const r = await route(admin(path, "null"));
    check(`${label}: a JSON body that is not an object answers 400`, r.status === 400, String(r.status));
  }

  // The github driver with a setting missing names it.
  const tok = process.env.GITHUB_TOKEN;
  delete process.env.GITHUB_TOKEN;
  const noTok = await settings(admin("/api/admin/settings", JSON.stringify({ tagline: "Made-up" })));
  check("the github driver without GITHUB_TOKEN names it (503)", noTok.status === 503 && /GITHUB_TOKEN/.test(await text(noTok)), `${noTok.status} ${await text(noTok)}`);
  process.env.GITHUB_TOKEN = tok;

  // A CRM set up wrong says so (names settings, never values).
  process.env.CRM_DRIVER = "";
  const savedRepo = process.env.GITHUB_REPO;
  delete process.env.GITHUB_REPO;
  process.env.VERCEL = "1";
  answer = (url) => (url.includes("/contents/") ? json(200, { content: Buffer.from(JSON.stringify(values)).toString("base64"), encoding: "base64", sha: "0" }) : json(200, {}));
  const misset = await settings(admin("/api/admin/settings", JSON.stringify({ tagline: "Made-up" })));
  const missetText = await text(misset);
  check("a CRM set up wrong names the missing setting", misset.status === 503 && /GITHUB_REPO/.test(missetText), `${misset.status} ${missetText}`);
  process.env.GITHUB_REPO = savedRepo;
  process.env.CRM_DRIVER = "github";
  delete process.env.VERCEL;

  // Upload: an unreadable file is told plainly; a Cloudinary failure is not passed on.
  const uploadReq = (bytes: Uint8Array<ArrayBuffer>, name: string) => {
    const f = new FormData();
    f.append("file", new File([bytes], name, { type: "image/jpeg" }));
    // No content-type header: the FormData body sets multipart/form-data with its boundary.
    return new NextRequest(`${ORIGIN}/api/admin/upload`, {
      method: "POST",
      headers: { origin: ORIGIN, "sec-fetch-site": "same-origin", cookie: `${CRM_COOKIE}=${issueToken().value}` },
      body: f,
    });
  };
  {
    const r = await upload(uploadReq(new TextEncoder().encode("not an image") as Uint8Array<ArrayBuffer>, "made-up.jpg"));
    const t = await text(r);
    check("upload: an unreadable file is told so (400)", r.status === 400 && /readable image/.test(t), `${r.status} ${t}`);
  }
  {
    const r = await upload(uploadReq(new Uint8Array(0), "made-up-empty.jpg"));
    check("upload: an empty file is told it isn't readable (400)", r.status === 400, `${r.status} ${await text(r)}`);
  }
  {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp({ create: { width: 64, height: 64, channels: 3, background: "#336699" } }).jpeg().toBuffer();
    const cut = Uint8Array.from(jpeg.subarray(0, Math.floor(jpeg.length / 2)));
    const r = await upload(uploadReq(cut, "made-up-truncated.jpg"));
    const t = await text(r);
    check("upload: a truncated image is told it isn't readable (400)", r.status === 400 && /readable image/.test(t), `${r.status} ${t}`);
  }
  {
    const sharp = (await import("sharp")).default;
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#cc8844" } }).png().toBuffer();
    answer = () => new Response("cloudinary-internal: bad signature for made-up-cloud", { status: 401 });
    const r = await upload(uploadReq(Uint8Array.from(png), "made-up.png"));
    const t = await text(r);
    check("upload: a Cloudinary failure answers 502 without Cloudinary's text", r.status === 502 && !leaks(t) && !/made-up-cloud|signature/.test(t), `${r.status} ${t}`);
  }

  console.log("2. Hub proxies forward only the hub session cookie");
  const { membership } = await import("../src/config/membership");
  if (!membership.hubProduct) {
    console.log("  - skipped: this site has no hub product (membership is off)");
  } else {
    const checkout = (await import("../src/app/api/checkout/route")).POST;
    const profile = await import("../src/app/api/account/profile/route");
    const cookies =
      `${CRM_COOKIE}=crm-made-up; _ga=GA1.1.made-up; __Secure-ebenworks-session.0=hub-part-a; ` +
      `__Secure-ebenworks-session.1=hub-part-b; ph_made_up=analytics`;
    const site = (path: string, method = "POST", body?: string) =>
      new NextRequest(`https://kopje-light.example${path}`, {
        method,
        headers: { cookie: cookies, "content-type": "application/json" },
        body,
      });
    const forwarded = () => seen.map((s) => s.headers.get("cookie") ?? "");
    const want = "__Secure-ebenworks-session.0=hub-part-a; __Secure-ebenworks-session.1=hub-part-b";

    seen = [];
    answer = () => json(400, { error: "hub-internal: plan row 42 missing in table tzohar_plans" });
    const c = await checkout(site("/api/checkout", "POST", JSON.stringify({ plan: "made-up-plan" })));
    const ct = await text(c);
    check("checkout sends only the hub session cookie", forwarded()[0] === want, forwarded()[0]);
    check("checkout: the hub's error text and status stay here (502, fixed text)", c.status === 502 && !/hub-internal|tzohar_plans/.test(ct), `${c.status} ${ct}`);

    answer = () => json(409, { error: "hub-internal: subscription sub_42 active until 2026-12-01" });
    const c409 = await checkout(site("/api/checkout", "POST", JSON.stringify({ plan: "made-up-plan" })));
    const t409 = await text(c409);
    check("checkout: a plan already running keeps 409, in the engine's words", c409.status === 409 && !/hub-internal|sub_42/.test(t409), `${c409.status} ${t409}`);
    answer = () => json(429, { error: "hub-internal: rate bucket 7" });
    const c429 = await checkout(site("/api/checkout", "POST", JSON.stringify({ plan: "made-up-plan" })));
    check("checkout: too many attempts keeps 429", c429.status === 429 && !/hub-internal/.test(await text(c429)), String(c429.status));

    seen = [];
    answer = () => json(500, { error: "hub-internal: userdata store down" });
    const g = await profile.GET(site("/api/account/profile", "GET"));
    check("profile GET sends only the hub session cookie", forwarded()[0] === want, forwarded()[0]);
    check("profile: the hub's error text stays here", !/hub-internal/.test(await text(g)), await text(g));
    answer = () => json(413, { error: "hub-internal: blob 70000 bytes" });
    const big = await profile.PUT(site("/api/account/profile", "PUT", JSON.stringify({ displayName: "Made Up" })));
    check("profile: too large keeps 413, in the engine's words", big.status === 413 && !/hub-internal/.test(await text(big)), String(big.status));
    seen = [];
    answer = () => json(200, { success: true, data: {} });
    await profile.PUT(site("/api/account/profile", "PUT", JSON.stringify({ displayName: "Made Up" })));
    check("profile PUT sends only the hub session cookie", forwarded()[0] === want, forwarded()[0]);

    seen = [];
    const none = await checkout(new NextRequest("https://kopje-light.example/api/checkout", {
      method: "POST",
      headers: { cookie: `${CRM_COOKIE}=crm-made-up; _ga=x`, "content-type": "application/json" },
      body: JSON.stringify({ plan: "made-up-plan" }),
    }));
    check("checkout without a hub session cookie is 401 and calls nothing", none.status === 401 && seen.length === 0, `${none.status} ${seen.length}`);
  }

  console.log("3. CRM routes answer 404 with the crm module off");
  const at = site.modules.indexOf("crm");
  site.modules.splice(at, 1);
  try {
    for (const [label, route, path] of [
      ["posts", posts, "/api/admin/posts"],
      ["pages", pagesRoute, "/api/admin/pages"],
      ["settings", settings, "/api/admin/settings"],
      ["upload", upload, "/api/admin/upload"],
    ] as const) {
      let status = 0;
      try {
        status = (await route(admin(path, "{}"))).status;
      } catch (e) {
        status = String((e as { digest?: string }).digest ?? "").includes("404") ? 404 : -1;
      }
      check(`${label}: 404`, status === 404, String(status));
    }
  } finally {
    site.modules.splice(at, 0, "crm");
  }

  console.log("4. Newsletter and superfan check Resend's answer");
  // Since TZS-4 (EBE-6326) a sign-up sends only a confirm mail; the owner's note and the welcome
  // follow the button on /api/newsletter/confirm. Each case uses its own caller and address, so
  // the mail limits (scripts/mail-limits.test.ts) stay out of the way.
  const confirm = (await import("../src/app/api/newsletter/confirm/route")).POST;
  const resendCalls = () => seen.filter((x) => x.url.includes("resend"));
  const refuseCall = (k: number) => (url: string) =>
    url.includes("resend") && resendCalls().length === k ? json(403, { name: "validation_error", message: "refused", statusCode: 403 }) : json(200, { id: "made-up" });
  let caseNo = 0;
  for (const [label, path, extra] of [
    ["newsletter", "../src/app/api/newsletter/route", {}],
    ["superfan", "../src/app/api/superfan/route", { city: "Bulawayo" }],
  ] as const) {
    const route = (await import(path)).POST as (r: NextRequest) => Promise<Response>;
    const signup = () => {
      caseNo++;
      return new NextRequest(`https://kopje-light.example/api/${label}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-real-ip": `192.0.2.${30 + caseNo}` },
        body: JSON.stringify({ email: `made-up-${caseNo}@kopje-light.example`, ...extra }),
      });
    };
    const tokenOf = () => resendCalls().map((x) => String(JSON.parse(x.body).text ?? "").match(/confirm\?t=([A-Za-z0-9_-]+)/)?.[1]).find(Boolean) ?? "";
    const press = (token: string) =>
      confirm(new NextRequest("https://kopje-light.example/api/newsletter/confirm", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "x-real-ip": `192.0.2.${30 + caseNo}` },
        body: new URLSearchParams({ t: token }).toString(),
      }));

    seen = [];
    answer = () => json(200, { id: "made-up" });
    const ok = await route(signup());
    check(`${label}: the confirm mail sent answers success`, ok.status === 200 && resendCalls().length === 1, `${ok.status}, ${resendCalls().length}`);
    seen = [];
    answer = refuseCall(1);
    const refused = await route(signup());
    check(`${label}: Resend refusing the confirm mail is a failure, not success`, refused.status >= 500, `${refused.status} ${await text(refused)}`);

    for (const [what, k, wantOk, wantCalls] of [
      ["both mails sent answers success", 0, true, 2],
      ["Resend refusing the owner's note is a failure, and no welcome goes", 1, false, 1],
      ["a welcome that did not go still records the signup (success)", 2, true, 2],
    ] as const) {
      seen = [];
      answer = () => json(200, { id: "made-up" });
      await route(signup());
      const token = tokenOf();
      seen = [];
      answer = k ? refuseCall(k) : () => json(200, { id: "made-up" });
      const r = await press(token);
      check(`${label} confirm: ${what}`, Boolean(token) && (r.status === 200) === wantOk && resendCalls().length === wantCalls, `${r.status}, ${resendCalls().length} calls`);
    }
  }

  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
