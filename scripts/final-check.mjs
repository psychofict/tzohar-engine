import { chromium } from 'playwright';

const ROUTES = [
  '/en', '/en/music', '/en/ai', '/en/macro-influencer',
  '/en/about', '/en/press', '/en/contact', '/en/links',
  '/en/label', '/en/merch', '/en/tour',
  // a non-en locale spot-check
  '/ko', '/fr/music', '/ja/ai', '/zh/macro-influencer',
];
const VPS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const BASE = 'http://localhost:3000';

const browser = await chromium.launch();
let totalErrors = 0;
const summary = [];

for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  for (const route of ROUTES) {
    const errs = [];
    page.removeAllListeners('pageerror');
    page.removeAllListeners('console');
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text()}`); });
    let status = 0;
    try {
      const resp = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
      status = resp?.status() ?? 0;
      await page.waitForTimeout(700);
    } catch (e) {
      errs.push(`navigate: ${e.message}`);
    }
    const ok = status === 200 && errs.length === 0;
    if (!ok) totalErrors++;
    summary.push({ vp: vp.name, route, status, errs });
  }
  await ctx.close();
}
await browser.close();

console.log('\n=== Smoke summary ===');
for (const s of summary) {
  const flag = s.status === 200 && s.errs.length === 0 ? '✓' : '✗';
  console.log(`${flag} [${s.vp}] ${s.route} → ${s.status}${s.errs.length ? '  ' + s.errs.join(' | ') : ''}`);
}
console.log(`\n${totalErrors === 0 ? '✓ All routes 200, no console errors.' : `✗ ${totalErrors} issue(s).`}`);
process.exit(totalErrors === 0 ? 0 : 1);
