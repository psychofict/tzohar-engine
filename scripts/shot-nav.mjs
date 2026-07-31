/** Dev helper: capture the header's expanded menu panel and the mobile drawer. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "/tmp/tzohar-shots/nav";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(`try{localStorage.setItem('theme',${JSON.stringify(theme)})}catch(e){}`);
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/${process.env.SHOT_SECTION ?? ""}`, { waitUntil: "networkidle" });
  // Scroll off the hero so the bar takes its solid state, then open a panel.
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: /Public Diplomacy/i }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/panel--${theme}.jpeg`, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1440, height: 460 } });
  console.log(`${OUT}/panel--${theme}.jpeg`);
  await ctx.close();
}

// Mobile drawer
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await mctx.addInitScript(`try{localStorage.setItem('theme','light')}catch(e){}`);
const mpage = await mctx.newPage();
await mpage.goto(`${BASE}/en`, { waitUntil: "networkidle" });
await mpage.getByRole("button", { name: /open menu/i }).click();
await mpage.waitForTimeout(400);
// Expand a group so the icons + blurbs are visible.
await mpage.getByRole("button", { name: /Public Diplomacy/i }).first().click();
await mpage.waitForTimeout(500);
await mpage.screenshot({ path: `${OUT}/drawer.jpeg`, type: "jpeg", quality: 86 });
console.log(`${OUT}/drawer.jpeg`);
await mctx.close();

await browser.close();
