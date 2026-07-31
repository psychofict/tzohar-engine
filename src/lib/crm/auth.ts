import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

/**
 * CRM authentication — a single operator, a shared password, a signed cookie.
 *
 * Deliberately NOT the Ebenworks Accounts Hub. The hub owns identity for fleet
 * products where many users from many orgs sign in; this is one client editing
 * their own website, on their own isolated deploy, and making them hold a hub
 * account (and making the site a hub consumer) to reach their own CMS would add
 * an external dependency to the one surface that must keep working when the rest
 * of the fleet is down.
 *
 * The cookie is a signed, expiring bearer token: `<expiry>.<hmac>`. There is no
 * server-side session store because there is nothing to store — the only fact
 * being asserted is "this browser proved it knows the password before <expiry>".
 */

// Engine-wide, not per-client: each client site is its own isolated deploy on
// its own host, so there is nothing to collide with. Naming it after a client
// (it used to be per-client) only guarantees the next build ships the wrong
// cookie name and silently signs everyone out on the first engine sync.
const COOKIE = "tzohar_crm";
const TTL_SECONDS = 60 * 60 * 12; // a working day; re-auth after that

function secret(): string {
  const s = process.env.CRM_SESSION_SECRET;
  if (!s || s.length < 24) {
    throw new Error(
      "CRM_SESSION_SECRET is missing or too short (needs 24+ random characters). Set it in .env.local and on the Vercel project.",
    );
  }
  return s;
}

function sign(expiresAt: number): string {
  return createHmac("sha256", secret()).update(String(expiresAt)).digest("base64url");
}

/** Constant-time compare that can't throw on a length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function passwordIsValid(candidate: string): boolean {
  const expected = process.env.CRM_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}

export function issueToken(): { value: string; maxAge: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  return { value: `${expiresAt}.${sign(expiresAt)}`, maxAge: TTL_SECONDS };
}

export function tokenIsValid(token: string | undefined): boolean {
  if (!token) return false;
  const [expiryPart, mac] = token.split(".");
  if (!expiryPart || !mac) return false;
  const expiresAt = Number(expiryPart);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return false;
  return safeEqual(mac, sign(expiresAt));
}

export const CRM_COOKIE = COOKIE;

/** True when the current request carries a valid CRM session. */
export async function hasCrmSession(): Promise<boolean> {
  try {
    const jar = await cookies();
    return tokenIsValid(jar.get(COOKIE)?.value);
  } catch {
    return false;
  }
}

/**
 * Whether the CRM is usable at all. Reported to the login screen so a missing
 * env var shows as "not configured" rather than as an incorrect password —
 * which is otherwise an hour of debugging for whoever deploys it.
 */
export function crmConfigStatus(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!process.env.CRM_PASSWORD) missing.push("CRM_PASSWORD");
  const s = process.env.CRM_SESSION_SECRET;
  if (!s || s.length < 24) missing.push("CRM_SESSION_SECRET");
  return { ok: missing.length === 0, missing };
}

/** Convenience for generating a secret when setting the CRM up. */
export function suggestSecret(): string {
  return randomBytes(32).toString("base64url");
}
