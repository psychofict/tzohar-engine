import { createCspReportHandler } from "@/lib/csp-report";

/**
 * POST /api/csp-report — where a visitor's browser reports what the site's
 * Content-Security-Policy (next.config.ts, `report-uri`) would have refused. The
 * middleware matcher already leaves /api alone, so no locale prefix or redirect gets
 * in the way of a report.
 *
 * A report means either an injection attempt or an origin the policy does not list
 * yet (a new analytics id, an embed). It is written to the function log as one "[csp]"
 * line and nothing is stored: `vercel logs <deployment>`, or the project's Logs tab,
 * filtered on "[csp]". Read them before moving the policy from Report-Only to enforced.
 */
export const runtime = "nodejs";

export const POST = createCspReportHandler();
