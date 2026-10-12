/**
 * The engine's CSP report endpoint (src/lib/csp-report.ts, EBE-515): it answers an
 * empty 204, logs one "[csp]" line per violation without query strings, and caps one
 * address. Run: npx --yes tsx scripts/csp-report.test.ts
 */
import { createCspReportHandler } from "../src/lib/csp-report";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const post = (body: string, ip = "203.0.113.7") =>
  new Request("https://example.com/api/csp-report", {
    method: "POST",
    headers: { "content-type": "application/csp-report", "x-forwarded-for": ip },
    body,
  });

async function main() {
  const lines: string[] = [];
  const handle = createCspReportHandler((l) => lines.push(l));
  const report = JSON.stringify({
    "csp-report": {
      "document-uri": "https://example.com/en/about?session=abc",
      "violated-directive": "frame-src",
      "blocked-uri": "https://player.example/embed?id=9",
      disposition: "report",
    },
  });
  const res = await handle(post(report));
  check("answers 204", res.status === 204);
  check("logs one [csp] line", lines.length === 1 && lines[0].startsWith("[csp] report frame-src"), lines[0]);
  check("cuts query strings", !lines[0].includes("session=") && !lines[0].includes("id=9"), lines[0]);
  await handle(post("{"));
  check("junk logs nothing", lines.length === 1);
  for (let i = 0; i < 40; i++) await handle(post(report, "198.51.100.9"));
  check("caps one address at 30 a minute", lines.length === 31, String(lines.length));
  console.log(fails ? `\n${fails} failed` : "\nall passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
