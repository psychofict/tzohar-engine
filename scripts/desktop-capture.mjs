import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000/en";
const out = process.argv[3] || "/tmp/desktop-home";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}-fold.png` });
await browser.close();
console.log("done");
