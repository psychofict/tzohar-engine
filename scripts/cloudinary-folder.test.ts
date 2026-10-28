/**
 * The client CRM's Cloudinary folder is set, never guessed (EBE-6352, from the TZS-6 review).
 *
 * Before this, a site with the Cloudinary keys but no CLOUDINARY_FOLDER uploaded into
 * tzohar-sites/<display name slugified>/crm, so two sites whose names slugify alike ("Kopje
 * Light!" and "Kopje-Light") shared one folder and each CRM's media library listed the other's
 * uploads. Now the upload answers 501 with the reason and nothing reaches Cloudinary; with the
 * folder set, the upload goes there. Private vault links need only the three keys.
 *
 * Fails on the code before the fix: the upload without a folder went to Cloudinary under a
 * folder made from the site's name.
 *
 * Run: npx --yes tsx scripts/cloudinary-folder.test.ts
 * No network: fetch is replaced, so nothing reaches Cloudinary. Every value is made up.
 */
import { existsSync } from "node:fs";
import { NextRequest } from "next/server";

process.env.CRM_PASSWORD = "made-up-crm-password";
process.env.CRM_SESSION_SECRET = "made-up-session-secret-for-the-test-0123";
process.env.CLOUDINARY_CLOUD_NAME = "made-up-cloud";
process.env.CLOUDINARY_API_KEY = "made-up-key";
process.env.CLOUDINARY_API_SECRET = "made-up-secret";
delete process.env.CLOUDINARY_FOLDER;

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const sentIds: string[] = [];
globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.includes("api.cloudinary.com") && init?.body instanceof FormData) {
    const id = String(init.body.get("public_id") ?? "");
    sentIds.push(id);
    return new Response(JSON.stringify({ secure_url: `https://res.cloudinary.com/made-up-cloud/image/upload/v1/${id}.png`, bytes: 10 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "no network in this test" }), { status: 599 });
}) as typeof fetch;

// A module-owned route a client repository may not have: imported by a string after a check.
const UPLOAD_ROUTE = "../src/app/api/admin/upload/route";

async function main() {
  const lib = (await import("../src/lib/cloudinary")) as Record<string, unknown> & {
    cloudinaryConfig: (env?: NodeJS.ProcessEnv) => { folder: string } | null;
  };
  const keys = { CLOUDINARY_CLOUD_NAME: "c", CLOUDINARY_API_KEY: "k", CLOUDINARY_API_SECRET: "s" } as unknown as NodeJS.ProcessEnv;

  console.log("the settings");
  check("keys without a folder give no upload settings", lib.cloudinaryConfig({ ...keys }) === null, JSON.stringify(lib.cloudinaryConfig({ ...keys })));
  check("a folder of only slashes counts as none", lib.cloudinaryConfig({ ...keys, CLOUDINARY_FOLDER: " // " }) === null);
  check("the folder set is used as given", lib.cloudinaryConfig({ ...keys, CLOUDINARY_FOLDER: "/tzohar-sites/kopje-light/crm/" })?.folder === "tzohar-sites/kopje-light/crm");
  const keysOnly = typeof lib.cloudinaryKeys === "function" ? (lib.cloudinaryKeys as (e: NodeJS.ProcessEnv) => unknown)({ ...keys }) : null;
  check("private vault links still have their keys without a folder", Boolean(keysOnly));

  if (!existsSync(new URL(`${UPLOAD_ROUTE}.ts`, import.meta.url))) {
    console.log("The CRM upload route is not in this repository; the route checks are skipped.");
  } else {
    console.log("the CRM upload");
    const { CRM_COOKIE, issueToken } = await import("../src/lib/crm/auth");
    // A client site or the public mirror may have the CRM module off; the route answers 404 then.
    const { site } = await import("../src/config/site");
    if (!site.modules.includes("crm")) site.modules.push("crm");
    const upload =((await import(UPLOAD_ROUTE)) as { POST: (r: NextRequest) => Promise<Response> }).POST;
    const sharp = (await import("sharp")).default;
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#cc8844" } }).png().toBuffer();
    const ORIGIN = "https://crm.kopje-light.example";
    const req = () => {
      const f = new FormData();
      f.append("file", new File([Uint8Array.from(png)], "made-up.png", { type: "image/png" }));
      return new NextRequest(`${ORIGIN}/api/admin/upload`, {
        method: "POST",
        headers: { origin: ORIGIN, "sec-fetch-site": "same-origin", cookie: `${CRM_COOKIE}=${issueToken().value}` },
        body: f,
      });
    };

    delete process.env.VERCEL;
    const r1 = await upload(req());
    const t1 = await r1.text();
    check("without CLOUDINARY_FOLDER the upload answers 501 and says upload isn't finished", r1.status === 501 && /isn't finished/.test(t1) && !/CLOUDINARY/.test(t1), `${r1.status} ${t1}`);
    check("and nothing is sent to Cloudinary under a guessed folder", sentIds.length === 0, sentIds.join(", "));

    process.env.CLOUDINARY_FOLDER = "tzohar-sites/kopje-light/crm";
    const r2 = await upload(req());
    check("with the folder set the upload goes into it", r2.status === 200 && sentIds.length === 1 && sentIds[0].startsWith("tzohar-sites/kopje-light/crm/"), `${r2.status} ${sentIds.join(", ")}`);
  }

  console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
