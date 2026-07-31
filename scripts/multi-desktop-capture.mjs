import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3000/en";
const outDir = process.argv[3] || "/tmp/all";
const tag = process.argv[4] || "desktop";

const paths = ["/", "/about", "/ai", "/contact", "/macro-influencer", "/music", "/press"];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const p of paths) {
  const url = base + p;
  const slug = p === "/" ? "home" : p.replace(/^\//, "");
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outDir}/${tag}-${slug}-fold.png` });
  console.log(`captured ${slug}`);
}
await browser.close();
console.log("done");
