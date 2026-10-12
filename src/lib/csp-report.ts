/**
 * Browser Content-Security-Policy reports: parsing, logging and a small per-address
 * limit, for POST /api/csp-report (src/app/api/csp-report/route.ts).
 *
 * Studio has the same file at studio/lib/csp-report.ts for its own three hosts. It
 * cannot import across to this one (its build root is studio/), so keep the two alike.
 */

export const CSP_REPORT_PATH = "/api/csp-report";

/** Largest report body read; a real one is well under 2 KB. */
export const MAX_REPORT_BYTES = 16 * 1024;

export type CspReportFields = {
  disposition?: string;
  directive?: string;
  blocked?: string;
  document?: string;
  source?: string;
  line?: number;
  sample?: string;
};

/** Origin and path only: no query string or fragment, which can carry tokens. */
function bare(u: unknown): string {
  const s = typeof u === "string" ? u : "";
  if (!s) return "-";
  try {
    const url = new URL(s);
    return `${url.origin}${url.pathname}`.slice(0, 200);
  } catch {
    // "inline", "eval", "data" and similar keywords are not URLs.
    return s.split(/[?#]/)[0].slice(0, 60);
  }
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** Both report formats: `report-uri` (application/csp-report) and the Reporting API. */
export function parseCspReports(body: unknown): CspReportFields[] {
  if (Array.isArray(body)) {
    return body
      .filter((r) => r && typeof r === "object" && (r as { type?: string }).type === "csp-violation")
      .map((r) => {
        const b = ((r as { body?: Record<string, unknown> }).body ?? {}) as Record<string, unknown>;
        return {
          disposition: str(b.disposition),
          directive: str(b.effectiveDirective),
          blocked: str(b.blockedURL),
          document: str(b.documentURL) ?? str((r as { url?: string }).url),
          source: str(b.sourceFile),
          line: typeof b.lineNumber === "number" ? b.lineNumber : undefined,
          sample: str(b.sample),
        };
      });
  }
  const r = (body as { "csp-report"?: Record<string, unknown> } | null)?.["csp-report"];
  if (!r || typeof r !== "object") return [];
  return [
    {
      disposition: str(r.disposition),
      directive: str(r["effective-directive"]) ?? str(r["violated-directive"]),
      blocked: str(r["blocked-uri"]),
      document: str(r["document-uri"]),
      source: str(r["source-file"]),
      line: typeof r["line-number"] === "number" ? (r["line-number"] as number) : undefined,
      sample: str(r["script-sample"]),
    },
  ];
}

/** One log line, tagged "[csp]" so the function log can be filtered on it. */
export function formatCspReport(f: CspReportFields): string {
  const sample = f.sample ? ` sample=${JSON.stringify(f.sample.slice(0, 40))}` : "";
  const where = f.source ? ` src=${bare(f.source)}${f.line ? `:${f.line}` : ""}` : "";
  return (
    `[csp] ${(f.disposition ?? "enforce").slice(0, 10)} ${(f.directive ?? "-").slice(0, 40)}` +
    ` blocked=${bare(f.blocked)} page=${bare(f.document)}${where}${sample}`
  );
}

/**
 * At most `max` reports a minute from one address, per function instance. It only
 * keeps one page from filling the log; it is not a security boundary.
 */
export function createReportLimiter(max = 30, windowMs = 60_000) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return function isLimited(key: string): boolean {
    const now = Date.now();
    if (buckets.size >= 5000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
      if (buckets.size >= 5000) buckets.clear();
    }
    const entry = buckets.get(key);
    if (!entry || now > entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count++;
    return entry.count > max;
  };
}

export function reportClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd && /^[\d.:a-fA-F]+$/.test(fwd) ? fwd : "unknown";
}

/**
 * The whole handler, shared by the route file (which may export only handlers).
 * Always answers an empty 204: a browser does nothing with the answer, and a
 * probe learns nothing from it.
 */
export function createCspReportHandler(log: (line: string) => void = console.warn) {
  const isLimited = createReportLimiter();
  return async function handle(req: Request): Promise<Response> {
    const noContent = () => new Response(null, { status: 204 });
    if (isLimited(reportClientIp(req.headers))) return noContent();
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_REPORT_BYTES) return noContent();
    const text = await req.text().catch(() => "");
    if (!text || text.length > MAX_REPORT_BYTES) return noContent();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return noContent();
    }
    for (const f of parseCspReports(body).slice(0, 10)) log(formatCspReport(f));
    return noContent();
  };
}
