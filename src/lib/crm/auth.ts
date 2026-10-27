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
 * The cookie is a signed, expiring bearer token: `<expiry>.<hmac>`. The HMAC covers
 * the expiry and a tag derived from the current CRM_PASSWORD, so changing the
 * password ends every session at once (TZS-5). There is no server-side session store
 * because there is nothing to store — the only fact being asserted is "this browser
 * proved it knows the current password before <expiry>".
 */

// Engine-wide, not per-client: each client site is its own isolated deploy on
// its own host, so there is nothing to collide with. The `__Host-` prefix makes the
// browser refuse the cookie unless it is Secure, host-only (no Domain) and on `/`,
// so no sibling host of the same site can set or overwrite it (TZS-5). Browsers
// treat http://localhost as secure, so local development still works.
const COOKIE = "__Host-tzohar_crm";
/** The name engines before TZS-5 used; logout clears it too. */
export const LEGACY_CRM_COOKIE = "tzohar_crm";
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

/**
 * A tag of the password the token was issued under. It never leaves the server: it
 * only goes into the HMAC, so a token issued before a rotation no longer verifies.
 */
function passwordTag(): string {
  return createHmac("sha256", secret())
    .update(`crm-password:${process.env.CRM_PASSWORD ?? ""}`)
    .digest("base64url");
}

function sign(expiresAt: number): string {
  return createHmac("sha256", secret()).update(`v2.${expiresAt}.${passwordTag()}`).digest("base64url");
}

// Random per process: the compare below only needs both sides hashed with the same
// key, so nothing about the key has to be stored or configured.
const COMPARE_KEY = randomBytes(32);

/**
 * Constant-time compare whose running time tells nothing about either value's
 * length: both sides are HMACed to 32 bytes first (TZS-5; the old compare returned
 * early on a length mismatch).
 */
function safeEqual(a: string, b: string): boolean {
  const ah = createHmac("sha256", COMPARE_KEY).update(a).digest();
  const bh = createHmac("sha256", COMPARE_KEY).update(b).digest();
  return timingSafeEqual(ah, bh);
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
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiryPart, mac] = parts;
  if (!/^\d{1,12}$/.test(expiryPart) || !mac) return false;
  const expiresAt = Number(expiryPart);
  if (expiresAt * 1000 < Date.now()) return false;
  try {
    return safeEqual(mac, sign(expiresAt));
  } catch {
    // CRM_SESSION_SECRET missing: nothing verifies.
    return false;
  }
}

export const CRM_COOKIE = COOKIE;

/**
 * The session cookie's attributes, always: Secure regardless of NODE_ENV,
 * SameSite=Strict so no other site (sibling hosts of the same registrable domain
 * included) can make a signed-in browser send it, httpOnly, host-only on `/`.
 */
export const CRM_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/",
} as const;

/** True when the current request carries a valid CRM session (server components). */
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

// ── Failed sign-in lockout ─────────────────────────────────────────────────────
//
// A client deploy has no database (the CRM is built to need nothing but its own
// deploy), so the counters live in the server's memory: they hold for as long as the
// instance runs, which on a low-traffic site is most of the day, and a cold start
// clears them. A locked caller is refused before the password is even compared, so a
// right guess during a lockout tells it nothing.
//
// Two counters, each over a sliding 15 minutes (the failure times themselves are
// kept). Per caller: five wrong passwords within any 15 minutes lock that caller for
// 15 minutes from the fifth. An IPv6 caller counts by its /64, because one host is
// usually given a whole /64 and could otherwise take a fresh address every five
// guesses. Site-wide: 50 wrong passwords within any 15 minutes from anyone lock every
// sign-in for 15 minutes, which bounds a guesser with many addresses (and the map's
// size). A browser that has signed in before carries a signed "known browser" cookie
// (30 days); it is let past the site-wide lock and meets only its own counter, so a
// guesser who keeps re-arming the site-wide lock does not keep the operator out.

const LOCK_AFTER = 5;
const SITE_LOCK_AFTER = 50;
const WINDOW_MS = 15 * 60 * 1000;
type Counter = { times: number[]; lockedUntil: number };
const failures = new Map<string, Counter>();
const SITE = "\u0000site";
// Wrong passwords sent with a known-browser cookie, from anywhere: such a cookie skips the
// site-wide lock, so its own shared counter caps one cookie replayed from many addresses.
const KNOWN = "\u0000known";
const KNOWN_LOCK_AFTER = 10;

/** The key a caller's address counts under: an IPv4 address whole, an IPv6 address by its /64. */
export function lockoutKey(address: string): string {
  const a = address
    .trim()
    .toLowerCase()
    .replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1") // an IPv4 address with a port
    .replace(/^\[([^\]]*)\](?::\d+)?$/, "$1") // [IPv6] or [IPv6]:port
    .replace(/%.*$/, "");
  if (!a.includes(":")) return a || "unknown";
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/.test(a)) return a.slice(7);
  const [head, tail = ""] = a.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = a.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  return groups.slice(0, 4).map((g) => (g || "0").replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

function lockedLeft(c: Counter | undefined, now: number): number {
  return c && c.lockedUntil > now ? Math.ceil((c.lockedUntil - now) / 1000) : 0;
}

/**
 * Seconds left on the caller's lockout, or the whole site's unless `knownBrowser`
 * (a valid known-browser cookie), or 0 when it may try.
 */
export function loginLockedFor(address: string, now = Date.now(), knownBrowser = false): number {
  const site = lockedLeft(failures.get(knownBrowser ? KNOWN : SITE), now);
  return Math.max(site, lockedLeft(failures.get(lockoutKey(address)), now));
}

function bump(key: string, limit: number, now: number): void {
  const c = failures.get(key) ?? { times: [], lockedUntil: 0 };
  c.times = c.times.filter((t) => now - t < WINDOW_MS);
  c.times.push(now);
  if (c.times.length > limit) c.times.splice(0, c.times.length - limit);
  if (c.times.length >= limit && c.lockedUntil <= now) c.lockedUntil = now + WINDOW_MS;
  failures.set(key, c);
}

const stale = (c: Counter, now: number) => c.lockedUntil <= now && c.times.every((t) => now - t >= WINDOW_MS);

export function recordLoginFailure(address: string, now = Date.now(), knownBrowser = false): void {
  if (failures.size > 2000) {
    for (const [k, v] of failures) if (stale(v, now)) failures.delete(k);
  }
  bump(SITE, SITE_LOCK_AFTER, now);
  if (knownBrowser) bump(KNOWN, KNOWN_LOCK_AFTER, now);
  bump(lockoutKey(address), LOCK_AFTER, now);
}

/** After a right password: clear the caller's counter. */
export function clearLoginFailures(address: string): void {
  failures.delete(lockoutKey(address));
}

// ── Known browser ──────────────────────────────────────────────────────────────

export const CRM_KNOWN_COOKIE = "__Host-tzohar_crm_known";
const KNOWN_TTL_SECONDS = 60 * 60 * 24 * 30;

function signKnown(expiresAt: number): string {
  // Bound to the password like the session: changing CRM_PASSWORD ends every known browser.
  return createHmac("sha256", secret()).update(`known.${expiresAt}.${passwordTag()}`).digest("base64url");
}

/** A signed cookie value saying "this browser signed in here before <expiry>". */
export function issueKnownBrowser(): { value: string; maxAge: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + KNOWN_TTL_SECONDS;
  return { value: `${expiresAt}.${signKnown(expiresAt)}`, maxAge: KNOWN_TTL_SECONDS };
}

export function knownBrowserIsValid(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 2 || !/^\d{1,12}$/.test(parts[0]) || !parts[1]) return false;
  const expiresAt = Number(parts[0]);
  if (expiresAt * 1000 < Date.now()) return false;
  try {
    return safeEqual(parts[1], signKnown(expiresAt));
  } catch {
    return false;
  }
}
