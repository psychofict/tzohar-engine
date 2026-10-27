/**
 * Limits on the mail a public form makes a site send (security review TZS-4, EBE-6326).
 *
 * The contact, newsletter and Inner Circle forms each send a message to the address the visitor
 * typed, from the site's own sender, and a site on an ebenworks.co address sends as Tzohar Sites.
 * Three counters stand in front of every such message:
 *
 * - per caller, per form and over the day: the visitor's address as the platform reports it (X-Real-IP on Vercel, never the
 *   first X-Forwarded-For entry, which the caller writes), an IPv6 address by its /64;
 * - per recipient: the lower-cased address the form names, counted as a SHA-256 hash so the store
 *   never holds an address, for the contact form and for the sign-ups separately;
 * - per site and day: the messages to typed addresses, and the owner's notes under their own
 *   larger ceiling, so a script with many addresses cannot spend the sending allowance.
 *
 * The counters live in Redis when the site has one (the REST interface Upstash and Vercel's Redis
 * integration give: UPSTASH_REDIS_REST_URL and _TOKEN, or KV_REST_API_URL and _TOKEN), so they
 * hold across instances and cold starts. A site without one counts in its own memory, which holds
 * for as long as the instance runs, and a confirm link's "used once" mark with it, so another
 * instance could take the same link a second time (one more note and welcome); the release note
 * says to add the store. A store that does not answer stops the send (fail closed).
 */
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { site } from "@/config/site";

export type MailForm = "contact" | "newsletter" | "superfan" | "confirm";

/** Sends per caller in each window, by form. */
const CALLER_LIMITS: Record<MailForm, { max: number; windowSeconds: number }> = {
  contact: { max: 5, windowSeconds: 15 * 60 },
  newsletter: { max: 10, windowSeconds: 60 * 60 },
  superfan: { max: 10, windowSeconds: 60 * 60 },
  confirm: { max: 20, windowSeconds: 60 * 60 },
};
/** Requests one caller may make to all the forms together in a day, so one address cannot spend
 *  the site's daily ceiling on its own. Generous, because mobile carriers put many phones behind
 *  one IPv4 address; the recipient and site ceilings bound the abuse. */
export const CALLER_DAILY_MAX = 30;
/** Messages to one recipient in a day, per group of forms (the contact form; the two sign-ups),
 *  so a stranger using one form cannot stop the person using the other. */
export const RECIPIENT_MAX = 3;
const RECIPIENT_WINDOW_SECONDS = 24 * 60 * 60;
/** Messages to typed addresses the forms may send in one UTC day, unless MAIL_DAILY_CAP sets
 *  another number. The owner's own notes count separately, under three times that, so a flood
 *  of acknowledgements cannot stop real messages reaching the owner. */
export const SITE_DAILY_DEFAULT = 60;
// The welcome after a confirmed sign-up is not counted again: it goes only to an address that
// already had a counted confirm mail, once per link.

// ── The store ────────────────────────────────────────────────────────────────

export interface CounterStore {
  /** Add one to `key` and return its count in the window that started with its first hit. */
  hit(key: string, windowSeconds: number): Promise<number>;
  /** Forget a key (a confirm link whose sign-up did not go through, so it can be pressed again). */
  forget(key: string): Promise<void>;
  /** The key's count, or 0, without adding to it. */
  peek(key: string): Promise<number>;
  readonly durable: boolean;
}

class MemoryStore implements CounterStore {
  readonly durable = false;
  private counts = new Map<string, { count: number; resetAt: number }>();
  async hit(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    if (this.counts.size > 5000) {
      for (const [k, v] of this.counts) if (v.resetAt <= now) this.counts.delete(k);
    }
    const c = this.counts.get(key);
    if (!c || c.resetAt <= now) {
      this.counts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return 1;
    }
    c.count += 1;
    return c.count;
  }
  async forget(key: string): Promise<void> {
    this.counts.delete(key);
  }
  async peek(key: string): Promise<number> {
    const c = this.counts.get(key);
    return c && c.resetAt > Date.now() ? c.count : 0;
  }
}

/** Redis over its REST interface: INCR counts, then EXPIRE NX gives a new key its window. The
 *  pipeline is not atomic, but a key left without an expiry gets one on its next hit, because
 *  EXPIRE NX only sets an expiry where none is (Redis 7; Upstash and Vercel's Redis have it). */
class RedisRestStore implements CounterStore {
  readonly durable = true;
  constructor(private url: string, private token: string) {}
  async hit(key: string, windowSeconds: number): Promise<number> {
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSeconds), "NX"],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`counter store answered ${res.status}`);
    const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const n = Number(out?.[0]?.result);
    if (!Number.isFinite(n) || out?.[0]?.error) throw new Error("counter store gave no count");
    // A store without EXPIRE NX would leave every key forever: stop (fail closed) instead.
    if (out?.[1]?.error) throw new Error(`counter store refused EXPIRE: ${out[1].error}`);
    return n;
  }
  private async one(command: string[]): Promise<unknown> {
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
      body: JSON.stringify([command]),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`counter store answered ${res.status}`);
    // A pipeline answers 200 even when a command in it failed: read the command's own answer.
    const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    if (!Array.isArray(out) || out[0]?.error) throw new Error(`counter store refused ${command[0]}: ${out?.[0]?.error ?? "no answer"}`);
    return out[0]?.result;
  }
  async forget(key: string): Promise<void> {
    await this.one(["DEL", key]);
  }
  async peek(key: string): Promise<number> {
    const v = Number(await this.one(["GET", key]));
    return Number.isFinite(v) ? v : 0;
  }
}

let memory: MemoryStore | null = null;
let override: CounterStore | null = null;

/** The site's counter store: Redis when configured, else this instance's memory. */
export function counterStore(): CounterStore {
  if (override) return override;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return new RedisRestStore(url, token);
  return (memory ??= new MemoryStore());
}

/** Tests only: count in a given store, or (null) go back to the configured one. */
export function useCounterStoreForTests(store: CounterStore | null): void {
  override = store;
  if (!store) memory = null;
}

// ── The caller and the recipient ─────────────────────────────────────────────

/** The key an address counts under: an IPv4 address whole, an IPv6 address by its /64. */
export function addressKey(address: string): string {
  const a = address
    .trim()
    .toLowerCase()
    .replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1")
    .replace(/^\[([^\]]*)\](?::\d+)?$/, "$1")
    .replace(/%.*$/, "");
  if (!a.includes(":")) return a || "unknown";
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/.test(a)) return a.slice(7);
  const [head, tail = ""] = a.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = a.includes("::") ? [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right] : left;
  return groups.slice(0, 4).map((g) => (g || "0").replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

/** The caller's address as the platform sets it. Vercel writes X-Real-IP and
 *  X-Vercel-Forwarded-For itself; the first X-Forwarded-For entry is the caller's own text. */
export function callerAddress(req: NextRequest | Request): string {
  const h = req.headers;
  return addressKey(
    h.get("x-real-ip")?.trim() || h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown",
  );
}

/** A typed address in the one form every counter uses. */
export function normaliseRecipient(email: string): string {
  return email.trim().toLowerCase();
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);

/** One store may serve several sites; each counts under its own host. */
function siteScope(): string {
  try {
    return new URL(site.url).host;
  } catch {
    return site.name;
  }
}

function dailyCap(): number {
  const n = Number(process.env.MAIL_DAILY_CAP);
  return Number.isInteger(n) && n > 0 ? n : SITE_DAILY_DEFAULT;
}

// ── The checks ───────────────────────────────────────────────────────────────

export type Verdict =
  | { ok: true }
  | { ok: false; status: 429 | 503; reason: "caller" | "recipient" | "site" | "store" };

async function counted(fn: () => Promise<Verdict>): Promise<Verdict> {
  try {
    return await fn();
  } catch (e) {
    console.error("Mail limiter store failed:", e instanceof Error ? e.message : e);
    return { ok: false, status: 503, reason: "store" };
  }
}

/** Count this caller's request to a form; refuse once it is over that form's limit or the
 *  caller's daily ceiling across forms. */
export function allowCaller(req: NextRequest | Request, form: MailForm): Promise<Verdict> {
  return counted(async () => {
    const { max, windowSeconds } = CALLER_LIMITS[form];
    const who = callerAddress(req);
    const n = await counterStore().hit(`tzmail:${siteScope()}:caller:${form}:${who}`, windowSeconds);
    if (n > max) return { ok: false, status: 429, reason: "caller" };
    if (form === "confirm") return { ok: true }; // pressing a link we sent is not a new request for mail
    const day = await counterStore().hit(`tzmail:${siteScope()}:caller-day:${who}`, 24 * 60 * 60);
    return day > CALLER_DAILY_MAX ? { ok: false, status: 429, reason: "caller" } : { ok: true };
  });
}

/** Whether a typed address still has room today in that group of forms, without counting.
 *  Requests racing at the address's last slot can each spend one of the site's daily sends
 *  before one of them takes the slot; that cost is bounded by the caller limits. */
export function recipientHasRoom(email: string, group: "contact" | "signup"): Promise<Verdict> {
  return counted(async () => {
    const n = await counterStore().peek(`tzmail:${siteScope()}:to:${group}:${hash(normaliseRecipient(email))}`);
    return n >= RECIPIENT_MAX ? { ok: false, status: 429, reason: "recipient" } : { ok: true };
  });
}

/** Count one message to a typed address; refuse past RECIPIENT_MAX a day for that group of forms. */
export function allowRecipient(email: string, group: "contact" | "signup"): Promise<Verdict> {
  return counted(async () => {
    const n = await counterStore().hit(`tzmail:${siteScope()}:to:${group}:${hash(normaliseRecipient(email))}`, RECIPIENT_WINDOW_SECONDS);
    return n > RECIPIENT_MAX ? { ok: false, status: 429, reason: "recipient" } : { ok: true };
  });
}

/** Count one send against the site's daily ceiling for mail to typed addresses ("visitor") or
 *  for the owner's own notes ("owner", three times the size); refuse once it is reached. */
export function allowSiteSend(kind: "visitor" | "owner"): Promise<Verdict> {
  return counted(async () => {
    const day = new Date().toISOString().slice(0, 10);
    const n = await counterStore().hit(`tzmail:${siteScope()}:day:${kind}:${day}`, 26 * 60 * 60);
    const cap = kind === "owner" ? dailyCap() * 3 : dailyCap();
    return n > cap ? { ok: false, status: 429, reason: "site" } : { ok: true };
  });
}

/** True the first time a key is seen within the window (a confirm link used once). */
export async function firstUse(key: string, windowSeconds: number): Promise<boolean | null> {
  try {
    return (await counterStore().hit(`tzmail:${siteScope()}:once:${hash(key)}`, windowSeconds)) === 1;
  } catch (e) {
    console.error("Mail limiter store failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Undo firstUse, so a link whose sign-up did not go through can be pressed again. */
export async function releaseUse(key: string): Promise<void> {
  try {
    await counterStore().forget(`tzmail:${siteScope()}:once:${hash(key)}`);
  } catch (e) {
    console.error("Mail limiter: could not release a confirm link, it stays marked used:", e instanceof Error ? e.message : e);
  }
}

/** Record that a key's work finished (a confirm link whose sign-up went through). */
export async function markDone(key: string, windowSeconds: number): Promise<void> {
  try {
    await counterStore().hit(`tzmail:${siteScope()}:done:${hash(key)}`, windowSeconds);
  } catch (e) {
    console.error("Mail limiter store failed:", e instanceof Error ? e.message : e);
  }
}

/** True when markDone ran for the key; null when the store does not answer. */
export async function isDone(key: string): Promise<boolean | null> {
  try {
    return (await counterStore().peek(`tzmail:${siteScope()}:done:${hash(key)}`)) > 0;
  } catch (e) {
    console.error("Mail limiter store failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ── The request body ─────────────────────────────────────────────────────────

/** Read the body as text, stopping at `maxBytes` however it is sent (a declared length or chunks). */
export async function readTextCapped(
  req: NextRequest | Request,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false; status: 400 | 413 }> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false, status: 413 };
  if (!req.body) return { ok: false, status: 400 };
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  return { ok: true, text: Buffer.concat(chunks).toString("utf8") };
}

/** Read a JSON object from the body, stopping at `maxBytes`. */
export async function readJsonCapped(
  req: NextRequest | Request,
  maxBytes: number,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; status: 400 | 413 }> {
  const read = await readTextCapped(req, maxBytes);
  if (!read.ok) return read;
  try {
    const parsed: unknown = JSON.parse(read.text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, status: 400 };
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, status: 400 };
  }
}

/** A plain address of at most 254 characters, or null. */
export function typedEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const e = value.trim();
  return e.length <= 254 && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:]+$/.test(e) ? e : null;
}
