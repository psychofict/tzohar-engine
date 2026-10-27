/**
 * The confirm link a newsletter or Inner Circle sign-up gets before any welcome or list add
 * (double opt-in, security review TZS-4, EBE-6326).
 *
 * The site keeps no list of its own, so the link carries the sign-up itself: the address, the
 * form and (for the Inner Circle) the phone and city the visitor gave, sealed with AES-256-GCM.
 * Nobody can read or change it without the site's key, and it lapses after two days. The key is
 * MAIL_CONFIRM_SECRET, or, when that is unset, one derived from RESEND_API_KEY (a site that can
 * send mail has that), so an existing site needs no new setting.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";
import { site } from "@/config/site";

export type SignupKind = "newsletter" | "superfan";
export type Signup = { kind: SignupKind; email: string; phone?: string; city?: string };

export const CONFIRM_TTL_SECONDS = 2 * 24 * 60 * 60;

function key(): Buffer | null {
  const own = process.env.MAIL_CONFIRM_SECRET;
  if (own && own.length >= 24) return createHmac("sha256", own).update("tzohar-mail-confirm-v1").digest();
  const resend = process.env.RESEND_API_KEY;
  if (resend) return createHmac("sha256", resend).update("tzohar-mail-confirm-v1").digest();
  return null;
}

/** The sealed token for a sign-up, or null when the site has no key to seal it with. */
export function sealSignup(s: Signup, now = Date.now()): string | null {
  const k = key();
  if (!k) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const plain = JSON.stringify({ ...s, x: Math.floor(now / 1000) + CONFIRM_TTL_SECONDS });
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

/** The sign-up a token holds, or null when it is forged, changed, expired or not ours. */
export function openSignup(token: unknown, now = Date.now()): Signup | null {
  const k = key();
  if (!k || typeof token !== "string" || token.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
  const raw = Buffer.from(token, "base64url");
  // One spelling per token: the decoder ignores spare trailing bits and a stray last character,
  // which would otherwise let one link pass the "used once" mark under several names.
  if (raw.length < 29 || raw.toString("base64url") !== token) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", k, raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const plain = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    const v = JSON.parse(plain) as Signup & { x: number };
    if (typeof v.x !== "number" || v.x * 1000 < now) return null;
    if ((v.kind !== "newsletter" && v.kind !== "superfan") || typeof v.email !== "string") return null;
    return {
      kind: v.kind,
      email: v.email,
      ...(typeof v.phone === "string" && v.phone ? { phone: v.phone } : {}),
      ...(typeof v.city === "string" && v.city ? { city: v.city } : {}),
    };
  } catch {
    return null;
  }
}

/** The link in the confirm mail. It opens a page with a button, so a mail scanner that follows
 *  links does not confirm on the person's behalf. */
export function confirmUrl(token: string): string {
  return `${site.url.replace(/\/$/, "")}/api/newsletter/confirm?t=${token}`;
}
