/**
 * Dev helper: sign into the CRM, walk its screens, and (optionally) perform a
 * real round-trip edit so the whole save path is exercised, not just rendered.
 *
 *   node scripts/shot-crm.mjs            # screenshots only
 *   EDIT=1 node scripts/shot-crm.mjs     # also create + delete a test post
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "/tmp/tzohar-shots/crm";
const PASSWORD = process.env.CRM_PASSWORD ?? "devpass";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

const shot = async (name, full = false) => {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.jpeg`, type: "jpeg", quality: 84, fullPage: full });
  console.log(`${OUT}/${name}.jpeg`);
};

// ── sign in ────────────────────────────────────────────────────────────────
await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await shot("01-login");
await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 15000 });
await shot("02-dashboard");

// ── the screens ────────────────────────────────────────────────────────────
for (const [name, path] of [
  ["03-posts", "/admin/posts"],
  ["04-pages", "/admin/pages"],
  ["05-media", "/admin/media"],
  ["06-settings", "/admin/settings"],
  ["07-help", "/admin/help"],
]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await shot(name);
}

// Post editor
await page.goto(`${BASE}/admin/posts/${process.env.SHOT_POST ?? ""}`, { waitUntil: "networkidle" });
await shot("08-post-editor", true);

// Page editor, with a section expanded so the generated fields are visible.
await page.goto(`${BASE}/admin/pages/home`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /statement/i }).first().click().catch(() => {});
await page.waitForTimeout(400);
await shot("09-page-editor");

// ── real round trip ────────────────────────────────────────────────────────
if (process.env.EDIT === "1") {
  const slug = "crm-smoke-test";
  await page.goto(`${BASE}/admin/posts/new`, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', "").catch(() => {});
  const titleBox = page.locator(".crm-input").first();
  await titleBox.fill("CRM smoke test");
  await page.getByRole("button", { name: /Create post/i }).click();
  await page.waitForTimeout(2500);
  await shot("10-created");

  // Confirm it reached the public site.
  const res = await page.goto(`${BASE}/posts/crm-smoke-test`, { waitUntil: "networkidle" });
  console.log(`public post status: ${res?.status()}`);
  await shot("11-public-post");

  // Clean up so the smoke test leaves nothing behind.
  await page.goto(`${BASE}/admin/posts/${slug}`, { waitUntil: "networkidle" });
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /^Delete$/i }).click();
  await page.waitForTimeout(2500);
  console.log("deleted test post");
  await shot("12-after-delete");
}

if (errors.length) {
  console.log("\nCONSOLE ERRORS:");
  for (const e of errors.slice(0, 12)) console.log(" -", e);
} else {
  console.log("\nno console errors");
}

await ctx.close();
await browser.close();
