import { chromium, devices } from "playwright";

const base = process.argv[2] || "http://localhost:3000/en";
const outDir = process.argv[3] || "/tmp/all";
const tag = process.argv[4] || "stats";

const targets = [
  { path: "/music", anchor: "Spotify Wrapped section" },
  { path: "/macro-influencer", anchor: "Stats Bar" },
  { path: "/ai", anchor: "Stats Bar" },
  { path: "/label", anchor: "Stats" },
];

const browser = await chromium.launch();

for (const dev of ["iPhone SE", "iPhone 12"]) {
  const ctx = await browser.newContext({ ...devices[dev] });
  const page = await ctx.newPage();
  for (const { path } of targets) {
    const slug = path.replace(/^\//, "");
    await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(500);
    // Find first stats grid (grid-cols-4) and scroll to it
    const found = await page.evaluate(() => {
      const grid = [...document.querySelectorAll(".grid.grid-cols-4")][0];
      if (!grid) return null;
      grid.scrollIntoView({ block: "center", behavior: "instant" });
      const r = grid.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    });
    await page.waitForTimeout(1800);
    const file = `${outDir}/${tag}-${dev.replace(/\s+/g, "")}-${slug}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log(`${dev} ${path}: grid=${JSON.stringify(found)}`);
  }
  await ctx.close();
}
await browser.close();
console.log("done");
