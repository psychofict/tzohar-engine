/**
 * A preview build's contact form is closed (EBE-7044, src/lib/preview-build.ts).
 *
 * Before the fix a site built with TZOHAR_PREVIEW=1 still took contact messages: /api/contact
 * mailed the preview's configured address, or failed without RESEND_API_KEY. This test builds
 * the route as a preview and checks that a well-formed message gets 404 and that nothing is
 * fetched (no mail provider, no counter store). The launched-site path is covered by
 * scripts/mail-limits.test.ts.
 *
 * Run: npx --yes tsx scripts/preview-contact.test.ts
 * No network: global fetch is replaced. The address is made up (example.invalid).
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

// The flag is read when the module loads, so set it before the route is imported.
process.env.TZOHAR_PREVIEW = "1";
process.env.RESEND_API_KEY = "re_test_not_a_key";
process.env.CONTACT_EMAIL = "owner@example.invalid";
// A made-up counter store, so a limit counted before the preview check would show up as a fetch
// (without it, src/lib/mail-guard.ts counts in memory and fetches nothing).
process.env.UPSTASH_REDIS_REST_URL = "https://store.example.invalid";
process.env.UPSTASH_REDIS_REST_TOKEN = "not-a-token";

async function main() {
  const { POST } = await import("../src/app/api/contact/route");
  const { isPreviewBuild } = await import("../src/lib/preview-build");

  console.log("preview build: contact form closed");
  check("the flag reads as a preview build", isPreviewBuild === true);

  const req = new NextRequest("https://preview.example.invalid/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify({ type: "general", name: "Test Visitor", email: "visitor@example.invalid", message: "Hello" }),
  });
  const res = await POST(req);
  const body = (await res.json()) as { error?: string; success?: boolean };
  check("a well-formed message is refused with 404", res.status === 404, `status ${res.status}`);
  check("the answer is not a success", body.success !== true, JSON.stringify(body));
  check("nothing was fetched (no mail, no counter store)", fetched.length === 0, fetched.join(", "));

  if (fails) {
    console.log(`\n${fails} check(s) failed`);
    process.exit(1);
  }
  console.log("\nall checks pass");
}

void main();
