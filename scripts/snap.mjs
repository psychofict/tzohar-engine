import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node snap.mjs <route> [<route>...]  (e.g. /en /en/music)');
  process.exit(1);
}
const BASE = 'http://localhost:3000';
const VPS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const out = path.resolve('audit-shots');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${vp.name}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${vp.name}] ${m.text()}`); });
  for (const route of targets) {
    const slug = route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root';
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    const total = await page.evaluate(() => document.body.scrollHeight);
    const sections = ['top', 'mid', 'low'];
    for (let i = 0; i < 3; i++) {
      const y = Math.floor((i * (total - vp.height)) / 2);
      await page.evaluate((s) => window.scrollTo(0, s), y);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(out, `${slug}-${vp.name}-${sections[i]}.png`), fullPage: false });
    }
  }
  await ctx.close();
}
await browser.close();
if (errors.length) { console.log('ERRORS:'); errors.forEach((e) => console.log(' ', e)); }
console.log('done');
