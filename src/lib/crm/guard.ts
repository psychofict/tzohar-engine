import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { hasModule, site } from "@/config/site";
import { requireModule } from "@/lib/modules";
import { CRM_COOKIE, hasCrmSession, tokenIsValid } from "./auth";

/**
 * The CRM's access checks, called at the top of every page and route under
 * `src/app/admin` and `src/app/api/admin` (security review TZS-5).
 *
 * A check in a Next layout is not an access check: a client-side navigation sends the
 * router state it already holds, and Next then renders only the segments that differ,
 * so a request claiming the CRM layout is already on screen gets the page without the
 * layout running. Every page therefore checks for itself, and
 * `scripts/crm-access.test.ts` fails when one does not.
 */

/** Pages: the CRM module must be on and the browser signed in, or it goes to the login. */
export async function requireCrm(): Promise<void> {
  requireModule("crm");
  if (!(await hasCrmSession())) redirect("/admin/login");
}

/** What a write route reads: JSON, a file upload, or the no-JS sign-in form. */
export type CrmBody = "json" | "multipart" | "form";

const BODY_TYPES: Record<CrmBody, string[]> = {
  json: ["application/json"],
  multipart: ["multipart/form-data"],
  form: ["application/x-www-form-urlencoded", "multipart/form-data"],
};

function refuse(status: number, error: string) {
  return NextResponse.json({ success: false, error }, { status });
}

/** The site's configured address (`site.url`), for a host that forwards no scheme. */
function configuredOrigin(): string | null {
  try {
    return new URL(site.url).origin.toLowerCase();
  } catch {
    return null;
  }
}

/** The origin this request was addressed to, as the browser saw it. */
function ownOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || req.headers.get("host") || req.nextUrl.host;
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.nextUrl.protocol.replace(/:$/, "");
  return `${proto}://${host}`.toLowerCase();
}

/**
 * Write routes. Answers the refusal, or null when the request may go on:
 *
 * - 404 when the site has the CRM module off;
 * - 403 unless `Origin` is this site's own origin (and `Sec-Fetch-Site`, when the
 *   browser sends it, says same-origin). The session cookie is SameSite=Strict as
 *   well; this is the check that does not depend on the cookie's attributes, and it
 *   stops a page on any other host, sibling hosts of the same domain included;
 * - 415 unless the body has the type the route reads, so a cross-site form post
 *   (text/plain) can never pass as JSON;
 * - 401 without a valid session, unless `session: false` (sign-in and sign-out).
 *
 * `Origin` may also equal the site's configured `site.url`, for a host behind a proxy
 * that does not forward the scheme. With `form: true` a refusal (other than 404) is a
 * 303 back to the login page with `error=refused`.
 */
export function refuseCrmRequest(
  req: NextRequest,
  { body, session = true, form = false }: { body: CrmBody | null; session?: boolean; form?: boolean },
): NextResponse | null {
  if (!hasModule("crm")) return refuse(404, "Not found.");
  // The no-JS sign-in and sign-out forms go back to the login page with a message,
  // rather than leaving the browser on a bare JSON answer.
  const turnAway = (status: number, error: string) =>
    form ? NextResponse.redirect(new URL("/admin/login?error=refused", req.url), 303) : refuse(status, error);

  const origin = req.headers.get("origin")?.toLowerCase();
  if (!origin || (origin !== ownOrigin(req) && origin !== configuredOrigin())) {
    return turnAway(403, "This request did not come from this site's CRM.");
  }
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") {
    return turnAway(403, "This request did not come from this site's CRM.");
  }

  if (body) {
    const type = (req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!BODY_TYPES[body].includes(type)) {
      return turnAway(415, `Expected ${BODY_TYPES[body][0]}.`);
    }
  }

  if (session && !tokenIsValid(req.cookies.get(CRM_COOKIE)?.value)) {
    return refuse(401, "Not signed in.");
  }
  return null;
}
