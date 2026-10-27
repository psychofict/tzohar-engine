/**
 * The one cookie a hub proxy route forwards to the Accounts Hub (security review TZS-12).
 *
 * The browser sends this site's whole Cookie header: the CRM session, analytics and
 * anything else set on the site's host. The hub needs only its own session, which
 * Auth.js names `__Secure-ebenworks-session` in production (`ebenworks-session` on a
 * local hub) and splits into `.0`, `.1` … chunks when it is large. Everything else
 * stays here.
 */
const HUB_SESSION = /^(?:__Secure-)?ebenworks-session(?:\.\d+)?$/;

/** The hub session cookie (and its chunks) out of a Cookie header, or "" when absent. */
export function hubSessionCookie(cookieHeader: string | null | undefined): string {
  if (!cookieHeader) return "";
  return cookieHeader
    .split(";")
    .map((pair) => pair.trim())
    .filter((pair) => {
      const eq = pair.indexOf("=");
      return eq > 0 && HUB_SESSION.test(pair.slice(0, eq).trim());
    })
    .join("; ");
}
