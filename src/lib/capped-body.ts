/**
 * Read a request body only up to a byte cap (TZ-4 follow-up, EBE-9474).
 *
 * `req.json()`, `req.formData()` and `req.text()` read a body whole, and a body sent in chunks
 * declares no Content-Length, so a size check on the header never sees it. A site run with
 * `next start` has no platform cap in front of a route handler. This counts the bytes as they
 * arrive and stops reading, and cancels the stream, the moment the cap is passed, so at most
 * `max` bytes are ever held.
 *
 * Studio has the same reader (BodyTooLarge, readBodyCapped, readTextCapped, readFormCapped) at
 * studio/lib/capped-body.ts, since its build root is studio/ and it cannot import this file; keep
 * those four alike. `readJsonBody` and `BODY_CAPS` are the engine's own. The contact and newsletter routes use their own
 * `readJsonCapped` in src/lib/mail-guard.ts, which answers a status instead of throwing.
 */
export class BodyTooLarge extends Error {
  constructor() {
    super("Request body is over the limit.");
    this.name = "BodyTooLarge";
  }
}

/** The body's bytes, or BodyTooLarge as soon as more than `max` arrive (declared or not). */
export async function readBodyCapped(req: Request, max: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) throw new BodyTooLarge();
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      throw new BodyTooLarge();
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.byteLength;
  }
  return out;
}

/** The body as UTF-8 text, read under the same cap. */
export async function readTextCapped(req: Request, max: number): Promise<string> {
  return new TextDecoder().decode(await readBodyCapped(req, max));
}

/** The body as form data, read under the cap first and parsed from the bytes held. */
export async function readFormCapped(req: Request, max: number): Promise<FormData> {
  const bytes = await readBodyCapped(req, max);
  const type = req.headers.get("content-type") ?? "";
  return new Response(bytes, { headers: { "content-type": type } }).formData();
}

/**
 * The body parsed as JSON under the cap. A body over the cap is 413; one that is empty or not
 * JSON is 400. The value is whatever the JSON holds, so a route still checks its shape.
 */
export async function readJsonBody(
  req: Request,
  max: number,
): Promise<{ ok: true; value: unknown } | { ok: false; status: 400 | 413 }> {
  let text: string;
  try {
    text = await readTextCapped(req, max);
  } catch (err) {
    return { ok: false, status: err instanceof BodyTooLarge ? 413 : 400 };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

/** The caps, one per route, named here so a test and the routes read the same figure. */
export const BODY_CAPS = {
  /** One page (blocks, tabs and items) or one post, with its text. A real one is a few KB. */
  adminPage: 1024 * 1024,
  adminPost: 1024 * 1024,
  /** The named site fields: name, tagline, description, email, url, seo, socials, location. */
  adminSettings: 64 * 1024,
  /** A password and a `next` path. */
  adminLogin: 8 * 1024,
  /** The route's 25 MB file limit plus the form's own framing. */
  adminUpload: 26 * 1024 * 1024,
  /** `{ plan, interval }`. */
  checkout: 4 * 1024,
  /** The hub's own limit for a profile blob (accounts-hub userdata route, 32 KB). */
  profile: 32 * 1024,
} as const;
