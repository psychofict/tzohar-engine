import { chromium } from "playwright";

const PAGES = [
  ["home", "/en"],
  ["music", "/en/music"],
  ["ai", "/en/ai"],
  ["macro", "/en/macro-influencer"],
  ["about", "/en/about"],
  ["label", "/en/label"],
  ["tour", "/en/tour"],
  ["press", "/en/press"],
  ["contact", "/en/contact"],
  ["links", "/en/links"],
];

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "/tmp/site-shots";
const VIEW = process.env.VIEW || "desktop"; // desktop | mobile
const FULL = process.env.FULL === "1";

const viewport = VIEW === "mobile"
  ? { width: 390, height: 844 }       // iPhone 14 Pro
  : { width: 1440, height: 900 };

const userAgent = VIEW === "mobile"
  ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  : undefined;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport,
  deviceScaleFactor: VIEW === "mobile" ? 3 : 1,
  isMobile: VIEW === "mobile",
  hasTouch: VIEW === "mobile",
  ...(userAgent ? { userAgent } : {}),
});
const page = await ctx.newPage();

for (const [name, path] of PAGES) {
  const url = BASE + path;
  console.log(`→ ${name}: ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
  } catch (e) {
    console.log(`   timeout, trying domcontentloaded`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }
  await page.waitForTimeout(1200);
  const file = `${OUT}/${VIEW}-${name}${FULL ? "-full" : ""}.png`;
  await page.screenshot({ path: file, fullPage: FULL });
  console.log(`   ${file}`);
}

await browser.close();
console.log("done");
