import { chromium, devices } from "playwright";

const base = process.argv[2] || "http://localhost:3000/en";
const outDir = process.argv[3] || "/tmp/all";
const tag = process.argv[4] || "before";

const paths = ["/about", "/ai", "/contact", "/label", "/links", "/macro-influencer", "/merch", "/music", "/press", "/tour"];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 12"] });
const page = await ctx.newPage();

for (const p of paths) {
  const url = base + p;
  const slug = p.replace(/^\//, "");
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/${tag}-${slug}-fold.png` });
  const m = await page.evaluate(() => {
    const sec = document.querySelector("main section");
    const img = document.querySelector("main section img");
    const h1 = document.querySelector("main h1");
    const data = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) };
    };
    return {
      vp: { w: window.innerWidth, h: window.innerHeight },
      hero: data(sec),
      img: data(img),
      h1: data(h1),
    };
  });
  console.log(`${p}: ${JSON.stringify(m)}`);
}

await browser.close();
console.log("done");
