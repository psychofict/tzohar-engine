import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROUTES = [
  '/en', '/en/music', '/en/ai', '/en/macro-influencer',
  '/en/about', '/en/press', '/en/contact', '/en/links',
  '/en/label', '/en/merch', '/en/tour',
];
const BASE = 'http://localhost:3000';
const VP = { name: 'mobile', width: 390, height: 844 };
const out = path.resolve('audit-shots');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VP, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`page ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console ${m.text().slice(0, 200)}`); });

for (const route of ROUTES) {
  const slug = route.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'root';
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
  // Capture five viewports vertically so we see whole page on mobile
  const total = await page.evaluate(() => document.body.scrollHeight);
  const slices = Math.min(5, Math.max(2, Math.ceil(total / VP.height)));
  for (let i = 0; i < slices; i++) {
    const y = Math.floor((i * (total - VP.height)) / Math.max(1, slices - 1));
    await page.evaluate((s) => window.scrollTo(0, s), y);
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, `m-${slug}-${i + 1}.png`), fullPage: false });
  }
  console.log(`✓ ${route} (${slices} slices)`);
}
await ctx.close();
await browser.close();
if (errors.length) {
  console.log('\nERRORS:'); errors.forEach((e) => console.log('  -', e));
}
console.log('done');
