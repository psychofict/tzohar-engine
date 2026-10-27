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
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: number;
}

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
  try {
    const r = await (opts.fetchImpl ?? fetch)(`${hub}/api/session-info?product=${encodeURIComponent(product)}`, {
      headers: { accept: "application/json", cookie },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(opts.timeoutMs ?? 4000),
    });
    if (!r.ok) return fallback();
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
