/**
 * Dev screenshot helper — capture pages in light + dark, desktop + mobile.
 *
 *   node scripts/shots.mjs                       # default page set
 *   node scripts/shots.mjs /en /en/about       # explicit paths
 *   OUT=/tmp/shots node scripts/shots.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "/tmp/tzohar-shots";
const FULL = process.env.FULL === "1";
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ["/en"];

const VIEWPORTS = process.env.MOBILE === "1"
  ? [{ name: "mobile", width: 390, height: 844 }]
  : [{ name: "desk", width: 1440, height: 900 }];

const THEMES = (process.env.THEMES ?? "light,dark").split(",");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    // Seed the theme the way the site's no-flash script reads it.
    await ctx.addInitScript(`try{localStorage.setItem('theme',${JSON.stringify(theme)})}catch(e){}`);
    const page = await ctx.newPage();
    for (const p of paths) {
      const url = BASE + p;
      await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
      // Let reveals settle, then force any still-pending reveal visible so a
      // full-page shot isn't full of blank bands.
      await page.waitForTimeout(700);
      await page.evaluate(() => {
        document.querySelectorAll('[data-reveal="pending"]').forEach((el) => {
          el.setAttribute("data-reveal", "visible");
        });
      });
      // Long enough for the journey block's staggered route draw to finish
      // (1s each, last one delayed ~1.1s). A shorter wait catches the arcs
      // part-drawn, which looks exactly like a broken-path bug.
      await page.waitForTimeout(2400);
      const slug = p.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "root";
      const file = path.join(OUT, `${slug}--${theme}--${vp.name}.jpeg`);
      await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: FULL });
      console.log(file);
    }
    await ctx.close();
  }
}
await browser.close();
