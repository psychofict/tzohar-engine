import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { membership as cfg } from "@/config/membership";

// ─────────────────────────────────────────────────────────────────────────────
// Membership on the SERVER — the only answer a members-only page may gate on.
//
// `useMembership()` (src/lib/membership.ts) runs in the visitor's browser, so anything a page
// hides on its say-so has already been sent to that browser. Until engine 2.8.11 the vault and
// gallery did exactly that: every insider drop and every gated photo shipped in the page and
// was only blurred (security review TZS-2, EBE-6325). A members-only page now asks this module
// while it renders and sends a non-member nothing the free tier does not show.
//
// It forwards the visitor's hub session cookie, and nothing else of this site's cookies, to the
// hub's `/api/session-info?product=<hubProduct>`, the same answer the browser reads. The cookie
// reaches this server only when the site runs on a host that shares the hub's cookie domain
// (`.ebenworks.co`), as `/api/checkout` already requires; on any other host every visitor reads
// as a non-member here, which is the closed side.
//
// Fails CLOSED: no provider, no hub address, no product key, no session cookie, a slow or
// failed hub, an unreadable answer, or a FREE plan all read as not a member.
//
// The server key (EBE-6346, the hub's EBE-6342). Every call from here comes from this server's one
// address, and the hub limits session-info per address. When the server-only variable
// HUB_SESSION_INFO_KEY holds the key ew-platform made for this site's hub product, it goes to the
// hub in X-Ebenworks-Session-Key and the call counts against the product's allowance instead. The
// key never stands in for the visitor: without the hub cookie the answer is still signed out. It
// is never a NEXT_PUBLIC_ variable, never logged, and goes only to the hub address below, over
// https (or to a local hub). A 403 means the hub refused the key (wrong, stale, another
// product's, or sent for a hub product the hub does not know): a setup fault, logged without the
// key and never cached. The hub is asked once more without the key, and the key is set aside for
// five minutes, so a broken key costs about one refused call per five minutes (one per lookup
// already in flight when it is refused) instead of signing every
// member out or halving the per-address limit (the hub counts a refused call against it too).
// ─────────────────────────────────────────────────────────────────────────────

export interface ServerMembership {
  signedIn: boolean;
  /** Signed in AND holding an active paid (non-FREE) plan of this site's hub product. */
  member: boolean;
}

export const NOT_A_MEMBER: ServerMembership = Object.freeze({ signedIn: false, member: false });

/** The hub's session cookie (`__Secure-` in production), including Auth.js chunks `.0`, `.1`. */
const HUB_COOKIE = /^(__Secure-)?ebenworks-session(\.\d+)?$/;

/** Only the hub's session cookie out of a Cookie header, so no other cookie of this site leaves it. */
export function hubSessionCookies(cookieHeader: string | null | undefined): string {
  if (!cookieHeader) return "";
  return cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter((p) => {
      const eq = p.indexOf("=");
      return eq > 0 && HUB_COOKIE.test(p.slice(0, eq));
    })
    .join("; ");
}

/** Reads the hub's session-info body. Anything unexpected is a non-member. */
export function memberFromSessionInfo(body: unknown): ServerMembership {
  if (!body || typeof body !== "object") return NOT_A_MEMBER;
  const b = body as { signedIn?: unknown; membership?: { active?: unknown; plan?: unknown } };
  const signedIn = b.signedIn === true;
  const m = b.membership;
  const member =
    signedIn &&
    !!m &&
    typeof m === "object" &&
    m.active === true &&
    typeof m.plan === "string" &&
    m.plan !== "" &&
    m.plan !== "FREE";
  return { signedIn, member };
}

/*
 * A short cache of the hub's answer per session, inside this instance. The hub limits
 * /api/session-info per calling address, and every call from here comes from this server's one
 * address, so without it a busy release day would hit the hub's limit and lock paying members
 * out (a 429 reads as "not a member"). Only a "member" answer is kept, for one minute: a
 * membership that ends is honoured at most a minute late, and a fan who has just paid, or whose
 * answer came back without a membership after a hub hiccup, is asked about again at once.
 * Keyed by a hash of the cookie.
 */
const CACHE_MS = 60_000;
/*
 * When the hub cannot be reached (an error, a 429, a timeout), FLEET.md "Identity, billing and
 * the hub" says to treat the subscription as active for a short time. Here that applies only to
 * a session the hub called a member in the last ten minutes; anyone else stays locked out, and a
 * definite "not a member" from the hub always wins.
 */
const STALE_OK_MS = 10 * 60_000;
const CACHE_MAX = 500;
const cache = new Map<string, { at: number; value: ServerMembership }>();

function cacheKey(hub: string, product: string, cookie: string): string {
  return createHash("sha256").update(`${hub}\n${product}\n${cookie}`).digest("hex");
}

export interface MembershipLookup {
  provider?: string;
  hub?: string;
  product?: string;
  /** The hub product's session-info server key; HUB_SESSION_INFO_KEY when not given. */
  serverKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: number;
  /** Where a setup fault is logged; console.error when not given. */
  logError?: (message: string) => void;
}

/** The header the hub reads the server key from (accounts-hub src/lib/session-info-key.ts). */
export const SESSION_KEY_HEADER = "X-Ebenworks-Session-Key";

/** The key goes only over https, or to a hub on this machine (local development). */
function keyMayGoTo(hub: string): boolean {
  try {
    const u = new URL(hub);
    return u.protocol === "https:" || (u.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname));
  } catch {
    return false;
  }
}

/*
 * A setup fault is said at most once per kind every five minutes per instance, so a wrong key on
 * a busy day does not flood the log. The message names the variable and the product, never the key.
 */
const FAULT_LOG_MS = 5 * 60_000;
const faultSaid = new Map<string, number>();
function sayFault(kind: string, message: string, now: number, log: (m: string) => void): void {
  const last = faultSaid.get(kind);
  if (last !== undefined && now - last < FAULT_LOG_MS) return;
  faultSaid.set(kind, now);
  log(message);
}

/** When the hub last refused this instance's key for a product; the key is not sent for five minutes after. */
const KEY_SET_ASIDE_MS = 5 * 60_000;
const keyRefusedAt = new Map<string, number>();

/** A header value carries visible ASCII only; anything else would make fetch throw for every visitor. */
const KEY_SHAPE = /^[\x21-\x7e]+$/;
/** The hub never matches a key shorter than this and quietly counts the call per address (SESSION_INFO_KEY_MIN_LENGTH). */
const KEY_MIN_LENGTH = 43;

/** The membership a Cookie header proves, asked of the hub. Never throws. */
export async function membershipForCookie(cookieHeader: string | null | undefined, opts: MembershipLookup = {}): Promise<ServerMembership> {
  const provider = opts.provider ?? cfg.provider;
  const hub = (opts.hub ?? (process.env.ACCOUNTS_URL || process.env.NEXT_PUBLIC_ACCOUNTS_URL || "")).replace(/\/+$/, "");
  const product = opts.product ?? cfg.hubProduct ?? "";
  if (provider !== "hub" || !hub || !product) return NOT_A_MEMBER;
  const cookie = hubSessionCookies(cookieHeader);
  if (!cookie) return NOT_A_MEMBER;
  const now = opts.now ?? Date.now();
  const key = cacheKey(hub, product, cookie);
  const hit = cache.get(key);
  if (hit && now - hit.at < CACHE_MS) return hit.value;
  const fallback = (): ServerMembership => (hit && now - hit.at < STALE_OK_MS ? hit.value : NOT_A_MEMBER);
  const log = opts.logError ?? ((m: string) => console.error(m));
  let serverKey = (opts.serverKey ?? process.env.HUB_SESSION_INFO_KEY ?? "").trim();
  if (serverKey && !KEY_SHAPE.test(serverKey)) {
    sayFault(`shape:${product}`, `membership: HUB_SESSION_INFO_KEY holds a space, a line break or a character outside ASCII; the key is not sent (product ${product})`, now, log);
    serverKey = "";
  }
  if (serverKey && serverKey.length < KEY_MIN_LENGTH) {
    sayFault(`short:${product}`, `membership: HUB_SESSION_INFO_KEY is too short (under ${KEY_MIN_LENGTH} characters, perhaps cut off when pasted); the key is not sent (product ${product})`, now, log);
    serverKey = "";
  }
  if (serverKey && !keyMayGoTo(hub)) {
    sayFault(`insecure:${product}`, `membership: HUB_SESSION_INFO_KEY is set but the hub address is not https; the key is not sent (product ${product})`, now, log);
    serverKey = "";
  }
  const refusedKey = `${hub}\n${product}`;
  const refused = keyRefusedAt.get(refusedKey);
  if (serverKey && refused !== undefined && now - refused < KEY_SET_ASIDE_MS) serverKey = "";
  try {
    // One deadline for the whole lookup, the retry without the key included.
    const signal = AbortSignal.timeout(opts.timeoutMs ?? 4000);
    const ask = (withKey: boolean) =>
      (opts.fetchImpl ?? fetch)(`${hub}/api/session-info?product=${encodeURIComponent(product)}`, {
        headers: withKey ? { accept: "application/json", cookie, [SESSION_KEY_HEADER]: serverKey } : { accept: "application/json", cookie },
        cache: "no-store",
        redirect: "error",
        signal,
      });
    let r = await ask(!!serverKey);
    if (r.status === 403) {
      // Not "signed out": a setup fault. Nothing about this answer is cached.
      if (serverKey) {
        keyRefusedAt.set(refusedKey, now);
        sayFault(
          `key:${product}`,
          `membership: the hub refused HUB_SESSION_INFO_KEY for product ${product} (403): the key is wrong, stale or another product's, or hubProduct in src/config/membership.ts is not a product the hub knows; the key is set aside for five minutes at a time until it is fixed`,
          now,
          log,
        );
        // Release the refused answer's connection before asking again.
        await r.body?.cancel().catch(() => {});
        r = await ask(false);
      }
      if (r.status === 403) {
        // The hub itself never answers 403 without a key, so something in front of it refused.
        sayFault(`refused:${product}`, `membership: the hub address, or a proxy in front of it, refused session-info for product ${product} with 403`, now, log);
      }
    }
    if (!r.ok) {
      await r.body?.cancel().catch(() => {});
      return fallback();
    }
    const body = await r.json().catch(() => undefined);
    if (body === undefined) return fallback();
    const value = memberFromSessionInfo(body);
    if (value.member) {
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
      cache.delete(key);
      cache.set(key, { at: now, value });
    }
    if (!value.member) cache.delete(key);
    return value;
  } catch {
    return fallback();
  }
}

/** For a server component or route: the current request's membership. */
export async function getServerMembership(): Promise<ServerMembership> {
  const h = await headers();
  return membershipForCookie(h.get("cookie"));
}
