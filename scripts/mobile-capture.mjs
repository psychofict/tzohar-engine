import { chromium, devices } from "playwright";

const url = process.argv[2] || "http://localhost:3000/en";
const out = process.argv[3] || "/tmp/mobile-home";

const profiles = [
  { name: "iphone-se", device: devices["iPhone SE"] },
  { name: "iphone-12", device: devices["iPhone 12"] },
  { name: "pixel-7", device: devices["Pixel 7"] },
];

const browser = await chromium.launch();
for (const { name, device } of profiles) {
  const ctx = await browser.newContext({ ...device });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(800);

  await page.screenshot({ path: `${out}-${name}-fold.png` });
  await page.screenshot({ path: `${out}-${name}-full.png`, fullPage: true });

  const metrics = await page.evaluate(() => {
    const portrait = document.querySelector("main img");
    const heroSection = document.querySelector("section");
    const h1 = document.querySelector("h1");
    const stats = document.querySelector("dl");
    const cta = document.querySelector("a[href*='roles'], a[href*='contact']");
    const data = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    };
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scrollY: window.scrollY,
      portrait: data(portrait),
      heroSection: data(heroSection),
      h1: data(h1),
      stats: data(stats),
      cta: data(cta),
    };
  });
  console.log(`\n[${name}] ${JSON.stringify(metrics, null, 2)}`);

  await ctx.close();
}
await browser.close();
console.log("\nDone.");
