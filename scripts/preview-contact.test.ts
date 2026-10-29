/**
 * A preview build's contact form, sign-ups and paid checkout are closed (EBE-7044, EBE-7062,
 * EBE-7066, src/lib/preview-build.ts).
 *
 * Before the fixes a site built with TZOHAR_PREVIEW=1 still took contact messages and sign-ups:
 * /api/contact mailed the preview's configured address, and /api/newsletter and /api/superfan
 * sent a confirm-your-address mail to whatever address a visitor typed, and /api/checkout sent a
 * signed-in visitor on to the hub's Paynow checkout for a membership. This test builds each
 * route as a preview and checks that a well-formed request gets 404 and that nothing is fetched
 * (no mail provider, no counter store), and that a confirm link from an earlier build completes
 * nothing. The launched-site paths are covered by scripts/mail-limits.test.ts.
 *
 * Run: npx --yes tsx scripts/preview-contact.test.ts
 * No network: global fetch is replaced. The addresses are made up (example.invalid).
 */
import { NextRequest } from "next/server";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const fetched: string[] = [];
globalThis.fetch = (async (input: unknown) => {
  fetched.push(String(input instanceof Request ? input.url : input));
  return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;

// The flag is read when the module loads, so set it before the routes are imported.
process.env.TZOHAR_PREVIEW = "1";
process.env.RESEND_API_KEY = "re_test_not_a_key";
process.env.CONTACT_EMAIL = "owner@example.invalid";
// A made-up counter store, so a limit counted before the preview check would show up as a fetch
// (without it, src/lib/mail-guard.ts counts in memory and fetches nothing).
process.env.UPSTASH_REDIS_REST_URL = "https://store.example.invalid";
process.env.UPSTASH_REDIS_REST_TOKEN = "not-a-token";
// A made-up hub, so a checkout forwarded to the hub would show up as a fetch (EBE-7066).
process.env.ACCOUNTS_URL = "https://hub.example.invalid";

type Post = (req: NextRequest) => Promise<Response>;

async function refused(label: string, POST: Post, path: string, body: Record<string, string>, ip: string) {
  console.log(`preview build: ${label}`);
  const before = fetched.length;
  const req = new NextRequest(`https://preview.example.invalid${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
  const res = await POST(req);
  const answer = (await res.json()) as { error?: string; success?: boolean };
  check("a well-formed request is refused with 404", res.status === 404, `status ${res.status}`);
  check("the answer is not a success", answer.success !== true, JSON.stringify(answer));
  const calls = fetched.slice(before);
  check("nothing was fetched (no mail, no counter store)", calls.length === 0, calls.join(", "));
}

async function main() {
  const { isPreviewBuild } = await import("../src/lib/preview-build");
  check("the flag reads as a preview build", isPreviewBuild === true);

  const contact = await import("../src/app/api/contact/route");
  await refused("contact form closed", contact.POST, "/api/contact", {
    type: "general", name: "Test Visitor", email: "visitor@example.invalid", message: "Hello",
  }, "203.0.113.7");

  const newsletter = await import("../src/app/api/newsletter/route");
  await refused("newsletter sign-up closed", newsletter.POST, "/api/newsletter", {
    email: "reader@example.invalid",
  }, "203.0.113.8");

  const superfan = await import("../src/app/api/superfan/route");
  await refused("join (Inner Circle) sign-up closed", superfan.POST, "/api/superfan", {
    email: "fan@example.invalid", source: "join-free",
  }, "203.0.113.9");

  // A paid membership: a signed-in visitor (made-up hub session cookie) asks for a checkout.
  // membership.ts is the site's own file and a new site sells nothing, so the test names a made-up
  // hub product before the route reads it: without the preview guard the request would then reach
  // the hub in every repository, not only on a site that sells memberships.
  const { membership } = await import("../src/config/membership");
  membership.hubProduct = "MADE_UP_PRODUCT";
  const checkout = await import("../src/app/api/checkout/route");
  console.log("preview build: paid checkout closed");
  {
    const before = fetched.length;
    const res = await checkout.POST(new NextRequest("https://preview.example.invalid/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: "__Secure-ebenworks-session=made-up-session",
        "x-forwarded-for": "203.0.113.11",
      },
      body: JSON.stringify({ plan: "made-up-plan", interval: "month" }),
    }));
    const answer = (await res.json()) as { redirectUrl?: string };
    check("a signed-in checkout request is refused with 404", res.status === 404, `status ${res.status}`);
    check("no checkout address comes back", !answer.redirectUrl, JSON.stringify(answer));
    const calls = fetched.slice(before);
    check("nothing was fetched (no hub checkout)", calls.length === 0, calls.join(", "));
  }

  const confirm = await import("../src/app/api/newsletter/confirm/route");
  console.log("preview build: confirm link completes nothing");
  const before = fetched.length;
  const press = await confirm.POST(new NextRequest("https://preview.example.invalid/api/newsletter/confirm", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": "203.0.113.10" },
    body: "t=made-up-token",
  }));
  check("the confirm button's request is refused with 404", press.status === 404, `status ${press.status}`);
  const open = await confirm.GET(new NextRequest("https://preview.example.invalid/api/newsletter/confirm?t=made-up-token"));
  check("the confirm page shows no button", open.status === 404 && !(await open.text()).includes("<form"), `status ${open.status}`);
  check("nothing was fetched", fetched.length === before, fetched.slice(before).join(", "));

  // Over the whole run, module loads included: nothing reached the network.
  check("nothing was fetched in the whole run", fetched.length === 0, fetched.join(", "));

  if (fails) {
    console.log(`\n${fails} check(s) failed`);
    process.exit(1);
  }
  console.log("\nall checks pass");
}

void main();
