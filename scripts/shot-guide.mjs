/**
 * Capture the figures for the client delivery guide.
 *
 * Two surfaces: the public site (light + dark) and the CRM.
 *
 * Two bits of CRM chrome describe THIS checkout rather than the client's
 * deployment — the sidebar's "Local dev / local working tree" badge, and the
 * dashboard's Publishing panel, which against a working tree reads "nothing is
 * published anywhere". Both are suppressed at capture time (see hideDevChrome).
 * Publishing is explained in prose in the guide instead.
 *
 * Running the capture against CRM_DRIVER=github to get the production wording
 * does NOT work: the media tile then reports 0 images, because listing files
 * goes through the GitHub API and there is no usable token here. Correct
 * numbers with the panel removed beat production wording with false counts.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "/tmp/tzohar-shots/guide";
const PASSWORD = process.env.CRM_PASSWORD;
/*
 * Which of THIS site's content to photograph. They were hardcoded to one
 * client's post slug and one of their page routes, so running the capture
 * against any other site produced 404s in the delivery guide.
 */
const POST = process.env.SHOT_POST ?? "";
const SECTION = process.env.SHOT_SECTION ?? "";
if (!PASSWORD) throw new Error("CRM_PASSWORD must be set");
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

/** Settle reveals + let the route-draw animation finish. */
async function settle(page, ms = 2400) {
  // Next's dev-mode indicator is a local artifact no visitor ever sees; hiding
  // it at capture time keeps the figures honest rather than editing site CSS.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal="pending"]').forEach((el) => el.setAttribute("data-reveal", "visible"));
  });
  await page.waitForTimeout(ms);
}

// ── public site ────────────────────────────────────────────────────────────
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(`try{localStorage.setItem('theme',${JSON.stringify(theme)})}catch(e){}`);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await settle(page);
  await page.screenshot({ path: `${OUT}/site-home-${theme}.png` });
  console.log(`site-home-${theme}.png`);
  await ctx.close();
}

// Content pages, if this site names any. SHOT_SECTION is a comma-separated list
// of routes under /en — it was two hardcoded slugs from one client's build, so
// running the capture anywhere else photographed two 404s into the guide.
if (SECTION) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(`try{localStorage.setItem('theme','light')}catch(e){}`);
  const page = await ctx.newPage();
  for (const slug of SECTION.split(",").map((x) => x.trim()).filter(Boolean)) {
    await page.goto(`${BASE}/en/${slug}`, { waitUntil: "networkidle" });
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/site-${slug}.png` });
    console.log(`site-${slug}.png`);
  }
  await ctx.close();
} else {
  console.log("skipped section shots — set SHOT_SECTION=<slug>[,<slug>]");
}

// Mobile
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(`try{localStorage.setItem('theme','light')}catch(e){}`);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await settle(page, 1200);
  await page.screenshot({ path: `${OUT}/site-mobile.png` });
  console.log("site-mobile.png");
  await ctx.close();
}

// ── CRM ────────────────────────────────────────────────────────────────────
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();

/** Crop away the sidebar's bottom (environment badge + sign-out). */
const CONTENT = { x: 0, y: 0, width: 1500, height: 1000 };

/** Remove the two panels that describe this checkout rather than the client's site. */
async function hideDevChrome(page) {
  await page.addStyleTag({ content: ".crm-store{visibility:hidden!important}" }).catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll("section.crm-card").forEach((card) => {
      if (card.querySelector("h2")?.textContent.trim() === "Publishing") card.remove();
    });
  });
}

await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/crm-login.png`, clip: { x: 380, y: 150, width: 740, height: 560 } });
console.log("crm-login.png");

await page.fill('input[name="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForURL("**/admin", { timeout: 20000 });
await page.waitForTimeout(900);
await hideDevChrome(page);
await page.screenshot({ path: `${OUT}/crm-dashboard.png`, clip: CONTENT });
console.log("crm-dashboard.png");

for (const [file, path, clip, prep] of [
  ["crm-posts", "/admin/posts", CONTENT, null],
  ["crm-media", "/admin/media", CONTENT, null],
  ["crm-settings", "/admin/settings", CONTENT, null],
]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await hideDevChrome(page);
  if (prep) await prep(page);
  await page.screenshot({ path: `${OUT}/${file}.png`, clip });
  console.log(`${file}.png`);
}

// Post editor — the screen the client will live in
if (POST) {
  await page.goto(`${BASE}/admin/posts/${POST}`, { waitUntil: "networkidle" });
  await hideDevChrome(page);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/crm-post-editor.png`, clip: CONTENT });
  console.log("crm-post-editor.png");
} else {
  console.log("skipped crm-post-editor.png — set SHOT_POST=<slug>");
}

// Pages editor with one section opened
await page.goto(`${BASE}/admin/pages/home`, { waitUntil: "networkidle" });
await hideDevChrome(page);
await page.waitForTimeout(800);
await page.getByRole("button", { name: /statement/i }).first().click().catch(() => {});
await page.waitForTimeout(700);
await page.evaluate(() => window.scrollTo(0, 330));
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/crm-page-editor.png`, clip: CONTENT });
console.log("crm-page-editor.png");

await ctx.close();
await browser.close();
