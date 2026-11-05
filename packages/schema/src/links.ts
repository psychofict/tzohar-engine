import { z } from "zod";

/**
 * Links a visitor follows (TZ-2, security review of 5 Nov 2026).
 *
 * `z.url()` and `z.string()` alone accept any scheme, so an owner could store `javascript:` or
 * `data:` as their site's address, a social link, a button or a press link. React neutralises a
 * `javascript:` href today, but the same values feed JSON-LD, feeds, mail and any later renderer,
 * so the schema refuses them at the door.
 */

/** A web address: http or https only. */
export const webUrlSchema = z.url({ protocol: /^https?$/, error: "Use a web address starting with https://" });

/** A social link: a web address, or a mailto: address. */
export const socialUrlSchema = z.url({ protocol: /^(https?|mailto)$/, error: "Use a web address starting with https://, or a mailto: address" });

// Browsers drop tabs and line breaks anywhere in a link, and C0 controls and spaces at its ends,
// so "/\t/evil.example" would open evil.example: a link holding any control character is refused.
const CONTROL = /[\u0000-\u001F\u007F]/;

/** True when `v` is a path on the site, a hash, or an http(s), mailto: or tel: address. */
export function isSafeHref(v: string): boolean {
  if (CONTROL.test(v)) return false;
  const h = v.trim();
  if (!h) return false;
  if (h.startsWith("#")) return true;
  // `//host` and `/\host` leave the site while looking like a path.
  if (h.startsWith("/")) return !h.startsWith("//") && !h.startsWith("/\\");
  try {
    return ["http:", "https:", "mailto:", "tel:"].includes(new URL(h).protocol);
  } catch {
    return false;
  }
}

const HREF_ERROR = "Use a path on the site (/contact), or a web, mailto: or tel: address";

/** A link inside the site or out of it; never a script or data scheme. */
export const siteHrefSchema = z.string().min(1).refine(isSafeHref, { error: HREF_ERROR });

/** The same, for a field that may be left empty ("" or absent), as it could before. */
export const optionalSiteHrefSchema = z
  .string()
  .refine((v) => v === "" || isSafeHref(v), { error: HREF_ERROR })
  .optional();
