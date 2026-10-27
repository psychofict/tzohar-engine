import { NextResponse, type NextRequest } from "next/server";
import {
  CRM_COOKIE,
  CRM_COOKIE_OPTIONS,
  CRM_KNOWN_COOKIE,
  clearLoginFailures,
  issueKnownBrowser,
  issueToken,
  knownBrowserIsValid,
  loginLockedFor,
  passwordIsValid,
  recordLoginFailure,
} from "@/lib/crm/auth";
import { refuseCrmRequest } from "@/lib/crm/guard";

/** The caller's address as the platform reports it (Vercel sets both headers itself). */
function callerKey(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * CRM sign-in. Form POST rather than fetch+JSON so it works with no JS and so the
 * password never lands in a URL or in the history stack.
 */
export async function POST(req: NextRequest) {
  // Same-origin only, like every CRM write: a page elsewhere cannot sign a browser in.
  const refused = refuseCrmRequest(req, { body: "form", session: false, form: true });
  if (refused) return refused;

  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const rawNext = String(form.get("next") ?? "/admin");
  // Only ever redirect within the CRM — an attacker-supplied `next` must not be
  // able to turn the login form into an open redirect.
  const next = rawNext.startsWith("/admin") ? rawNext : "/admin";
  const back = (error: string) =>
    NextResponse.redirect(new URL(`/admin/login?error=${error}&next=${encodeURIComponent(next)}`, req.url), 303);

  // Five wrong passwords from one address (an IPv6 /64), or 50 from anyone, within
  // 15 minutes lock sign-in for 15 minutes; a locked caller is turned away before the
  // password is compared (src/lib/crm/auth.ts).
  // A browser that signed in before skips the site-wide lock (not its own).
  const who = callerKey(req);
  const known = knownBrowserIsValid(req.cookies.get(CRM_KNOWN_COOKIE)?.value);
  if (loginLockedFor(who, Date.now(), known) > 0) return back("locked");

  if (!passwordIsValid(password)) {
    recordLoginFailure(who, Date.now(), known);
    // Also slow each wrong guess down.
    await new Promise((r) => setTimeout(r, 600));
    return back(loginLockedFor(who, Date.now(), known) > 0 ? "locked" : "1");
  }

  clearLoginFailures(who);
  const { value, maxAge } = issueToken();
  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(CRM_COOKIE, value, { ...CRM_COOKIE_OPTIONS, maxAge });
  const knownCookie = issueKnownBrowser();
  res.cookies.set(CRM_KNOWN_COOKIE, knownCookie.value, { ...CRM_COOKIE_OPTIONS, maxAge: knownCookie.maxAge });
  return res;
}
