import "server-only";
import Stripe from "stripe";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Server-side Stripe helpers for the client-owned membership provider.
 * Everything here runs only in route handlers (Node runtime). Membership state
 * is read LIVE from Stripe per request, so no database and no webhook are
 * required for gating (a webhook is optional hardening — see docs/membership.md).
 */

/** Stripe client — null when STRIPE_SECRET_KEY is unset, so routes can 503. */
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** Signed, httpOnly cookie holding the Stripe customer id (the "session"). */
export const MEMBER_COOKIE = "tz_member";
const SECRET = process.env.MEMBERSHIP_COOKIE_SECRET ?? "";

/** Sign a value (Stripe customer id) for the access cookie. */
export function sign(value: string): string {
  const mac = createHmac("sha256", SECRET).update(value).digest("base64url");
  return `${value}.${mac}`;
}

/** Verify a signed cookie value; returns the customer id, or null if invalid. */
export function verify(signed: string | undefined): string | null {
  if (!signed || !SECRET) return null;
  const dot = signed.lastIndexOf(".");
  if (dot < 0) return null;
  const value = signed.slice(0, dot);
  const mac = signed.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(value).digest("base64url");
  try {
    const a = Buffer.from(mac);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return value;
  } catch {
    /* malformed input → invalid */
  }
  return null;
}

/** Stripe Price IDs per plan slug + interval (server env; never committed). */
const PRICES: Record<string, { month?: string; year?: string }> = {
  insider: { month: process.env.STRIPE_PRICE_INSIDER_MONTH, year: process.env.STRIPE_PRICE_INSIDER_YEAR },
  studio: { month: process.env.STRIPE_PRICE_STUDIO_MONTH, year: process.env.STRIPE_PRICE_STUDIO_YEAR },
  patron: { month: process.env.STRIPE_PRICE_PATRON_MONTH, year: process.env.STRIPE_PRICE_PATRON_YEAR },
};

/** Stripe Price ID for a plan slug + interval, or undefined if unconfigured. */
export function priceFor(slug: string, interval: "month" | "year"): string | undefined {
  return PRICES[slug]?.[interval];
}

/** Resolve a Stripe Price ID back to its plan slug (for display). */
export function slugForPrice(priceId: string | null | undefined): string | null {
  if (!priceId) return null;
  for (const [slug, ids] of Object.entries(PRICES)) {
    if (ids.month === priceId || ids.year === priceId) return slug;
  }
  return null;
}
