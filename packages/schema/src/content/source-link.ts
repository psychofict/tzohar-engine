import { z } from "zod";

/**
 * The link a client already has: an Instagram handle or a link-in-bio page (EBE-7090).
 *
 * Most people who ask for a site have no site; they have Instagram and a Linktree, Beacons or
 * similar page. Studio starts a new site's brief from that address, so it is the first field of
 * the new-site form and of the editor's AI brief. It is Studio's own record of the site
 * (`tenant.sourceLink`), never part of `site.values.json`, so nothing here reaches a client repo's
 * config.
 *
 * Two shapes, both stored as one normalised string:
 *  - an Instagram handle, stored as "@name". Instagram is never fetched: its pages need a
 *    signed-in session and Meta's terms forbid automated reading, so the handle stays text. An
 *    instagram.com profile address is turned into its handle here, before anything could read it.
 *  - an https address of a public page, stored without its #fragment. Studio's server may read it
 *    once, for the AI brief (studio/lib/source-page.ts), unless its host is one of
 *    `NEVER_FETCH_HOSTS`.
 */

export const SOURCE_LINK_MAX = 300;

/** Instagram's own hosts: an address on one of them becomes a handle. */
const INSTAGRAM_HOSTS = ["instagram.com", "instagr.am"];

/**
 * Hosts Studio never requests, at any step of a read (redirects included): Meta's sites need a
 * signed-in session and forbid automated reading.
 */
export const NEVER_FETCH_HOSTS = [
  "instagram.com",
  "instagr.am",
  "ig.me",
  "cdninstagram.com",
  "facebook.com",
  "fb.com",
  "fb.me",
  "fbcdn.net",
  "fbsbx.com",
  "threads.net",
  "threads.com",
  "meta.com",
  "messenger.com",
  "m.me",
  "whatsapp.com",
  "wa.me",
] as const;

/** True for a host on, or under, one of `NEVER_FETCH_HOSTS`. */
export function isNeverFetchHost(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  return NEVER_FETCH_HOSTS.some((d) => h === d || h.endsWith(`.${d}`));
}

/** Instagram paths that are not a profile. */
const INSTAGRAM_NOT_PROFILE = new Set([
  "p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct", "about", "legal", "developer", "web", "s",
]);

/** Letters, digits, dots and underscores, 1 to 30, no leading, trailing or doubled dot. */
const HANDLE = /^(?!\.)(?!.*\.\.)[a-z0-9._]{1,30}(?<!\.)$/;

export type SourceLink =
  | { kind: "instagram"; handle: string; text: string }
  | { kind: "url"; url: string; host: string; text: string; readable: boolean };

export type SourceLinkResult = { ok: true; value: SourceLink | null } | { ok: false; error: string };

const fail = (error: string): SourceLinkResult => ({ ok: false, error });

const ASK = "Type an Instagram handle (@name) or the https address of a link-in-bio page.";

function handleOf(raw: string): SourceLinkResult {
  const h = raw.replace(/^@/, "").toLowerCase();
  if (!HANDLE.test(h)) return fail(`That isn't an Instagram handle. ${ASK}`);
  return { ok: true, value: { kind: "instagram", handle: h, text: `@${h}` } };
}

/**
 * Endings that make a bare word an address rather than a handle: "kopjelight.store" is a page,
 * "kopje.light" a handle. A handle can always be forced with "@", and the form shows how it read
 * the field, so a guess the person did not mean is visible before anything is saved.
 */
const ADDRESS_ENDINGS = new Set([
  "com", "net", "org", "io", "co", "ai", "app", "dev", "me", "to", "be", "cc", "ee", "bio", "link", "page", "site",
  "store", "shop", "online", "xyz", "info", "biz", "us", "uk", "de", "fr", "nl", "es", "it", "eu", "ca", "au", "nz",
  "za", "zw", "ng", "ke", "gh", "kr", "jp", "in", "art", "music", "studio", "design", "live", "world", "tv", "fm",
  "gg", "ly", "so", "sh", "is", "space", "website", "blog", "club", "band", "photo", "gallery", "works", "agency",
]);

/** An address a public page could not have: an IP literal, a single label or a local name. */
function hostProblem(host: string): string | null {
  if (!host || host.startsWith("[") || /^\d+(\.\d+){0,3}$/.test(host) || /^0x/i.test(host)) {
    return "Use the page's web address, not a server address.";
  }
  if (!host.includes(".")) return "That address has no domain. " + ASK;
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|arpa)$/.test(host)) {
    return "Use the address of a public page.";
  }
  return null;
}

/**
 * Why Studio's server may not request this address, or null: https on the default port, no
 * name or password, a public host name. The same rule for a typed address and for every redirect
 * a read follows (without the typed field's length cap, since redirect addresses run long).
 */
export function pageAddressProblem(url: URL): string | null {
  if (url.protocol === "http:") return "Use the https address of the page (it starts with https://).";
  if (url.protocol !== "https:") return ASK;
  if (url.username || url.password) return "Leave any name or password out of the address.";
  if (url.port) return "Use the page's usual web address, without a port number.";
  return hostProblem(url.hostname.toLowerCase().replace(/\.$/, ""));
}

/** A short line saying how the field was read, for under the field. */
export function describeSourceLink(link: SourceLink): string {
  return link.kind === "instagram"
    ? `Instagram handle ${link.text}: kept as text, never opened.`
    : link.readable
      ? `Page ${link.host}: read once on our server for the brief.`
      : `Page ${link.host}: Meta's sites are never opened; the address is kept as text.`;
}

/**
 * Read what a person typed into the field. Never throws; `value: null` means the field is empty.
 * A handle may carry "@" or not; an address may leave out "https://". "http://" is refused rather
 * than upgraded, so what is stored is what was meant.
 */
export function parseSourceLink(input: unknown): SourceLinkResult {
  if (input === undefined || input === null) return { ok: true, value: null };
  if (typeof input !== "string") return fail(ASK);
  const raw = input.trim();
  if (!raw) return { ok: true, value: null };
  if (raw.length > SOURCE_LINK_MAX) return fail(`Keep the address under ${SOURCE_LINK_MAX} characters.`);
  if (/\s/.test(raw)) return fail(ASK);

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/:]+:\d+(\/|$)/.test(raw);
  const ending = raw.includes(".") ? raw.slice(raw.lastIndexOf(".") + 1).toLowerCase() : "";
  if (!hasScheme && !raw.includes("/") && (raw.startsWith("@") || !ADDRESS_ENDINGS.has(ending))) {
    return handleOf(raw);
  }

  let url: URL;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    return fail(ASK);
  }
  const bad = pageAddressProblem(url);
  if (bad) return fail(bad);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");

  if (INSTAGRAM_HOSTS.some((d) => host === d || host.endsWith(`.${d}`))) {
    const first = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (!first || INSTAGRAM_NOT_PROFILE.has(first.toLowerCase())) {
      return fail("That Instagram address isn't a profile. Type the handle instead, like @name.");
    }
    return handleOf(first);
  }

  url.hash = "";
  const text = url.toString();
  if (text.length > SOURCE_LINK_MAX) return fail(`Keep the address under ${SOURCE_LINK_MAX} characters.`);
  return { ok: true, value: { kind: "url", url: text, host, text, readable: !isNeverFetchHost(host) } };
}

/**
 * The stored form: "" (no link), "@handle" or a normalised https address. Refuses anything
 * `parseSourceLink` refuses, with its message.
 */
export const sourceLinkSchema = z.string().transform((v, ctx) => {
  const r = parseSourceLink(v);
  if (!r.ok) {
    ctx.addIssue({ code: "custom", message: r.error });
    return z.NEVER;
  }
  return r.value?.text ?? "";
});
