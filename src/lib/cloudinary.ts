import { createHash } from "node:crypto";
import { site } from "@/config/site";

/**
 * Images the client's CRM uploads go to Cloudinary (engine 2.8.7, 13 Oct 2026).
 *
 * Until then `/api/admin/upload` committed each image into the site's own git repository
 * (or wrote it to the local disk in development), so every photograph grew the repository
 * for good and cost a redeploy. Now it is a signed server-side upload to Cloudinary, which
 * resizes and converts images as it serves them. A site without the three settings below
 * still builds and runs; only the upload reports that it is not configured.
 *
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET   (server only)
 *   CLOUDINARY_FOLDER   the CRM's upload folder, tzohar-sites/<studio slug>/crm-<vercel project id>
 *
 * The folder is required for the CRM's uploads and media library. It used to default to
 * tzohar-sites/<site name>/crm, from the editable display name, so two sites whose names
 * slugify alike shared one folder and each CRM listed the other's images (EBE-6352). Tzohar
 * Studio sets it when it sets up a client's CRM; without it the upload answers 501 with the
 * reason. Private vault files need only the three keys (cloudinaryKeys).
 *
 * Every call is signed with SHA-1 over the sorted parameters plus the secret. There is no
 * unsigned upload preset, and the key never reaches the browser.
 */

export interface CloudinaryKeys {
  cloud: string;
  key: string;
  secret: string;
}

export interface CloudinaryConfig extends CloudinaryKeys {
  folder: string;
}

/** The three keys, or null when any is missing. Enough for signed links to private files. */
export function cloudinaryKeys(env: NodeJS.ProcessEnv = process.env): CloudinaryKeys | null {
  const cloud = env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = env.CLOUDINARY_API_KEY?.trim();
  const secret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud || !key || !secret) return null;
  return { cloud, key, secret };
}

/** The configured CRM folder, or "" when CLOUDINARY_FOLDER is unset or only slashes. */
function crmFolder(env: NodeJS.ProcessEnv): string {
  return (env.CLOUDINARY_FOLDER ?? "").trim().replace(/^\/+|\/+$/g, "");
}

/** The CRM's upload settings, or null when a key or the folder is missing: never a guessed folder. */
export function cloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  const keys = cloudinaryKeys(env);
  const folder = crmFolder(env);
  return keys && folder ? { ...keys, folder } : null;
}

/** What a CRM user is told while the folder is missing: plain words, the site's support address. */
export function folderMissingMessage(): string {
  const help = site.crm?.supportEmail ? ` or write to ${site.crm.supportEmail}` : "";
  return `Image upload isn't finished on this site yet. Paste an image address instead${help}.`;
}

/** True when the keys are set but CLOUDINARY_FOLDER is not: the upload says so, rather than
 *  "not set up". */
export function cloudinaryFolderMissing(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(cloudinaryKeys(env)) && !crmFolder(env);
}

/** The free plan's limit for one image file. */
export const CLOUDINARY_MAX_BYTES = 10 * 1024 * 1024;

export function signParams(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

/** Signed upload of one image into the configured folder. Returns its public address. */
export async function uploadImage(
  cfg: CloudinaryConfig,
  bytes: Buffer,
  name: string,
  mime: string,
): Promise<{ url: string; bytes: number }> {
  const params = {
    asset_folder: cfg.folder,
    overwrite: "false",
    public_id: `${cfg.folder}/${name}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", cfg.key);
  form.append("signature", signParams(params, cfg.secret));
  form.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), name);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: "POST", body: form });
  const body = (await res.json().catch(() => ({}))) as { secure_url?: string; bytes?: number; error?: { message?: string } };
  if (!res.ok || !body.secure_url) throw new Error(body.error?.message || `The image host answered ${res.status}.`);
  return { url: body.secure_url, bytes: body.bytes ?? bytes.length };
}

/**
 * The images already in the folder, newest first, for the CRM's media library: the public
 * address to copy and a 256-pixel copy for the grid (one fixed width, automatic format and
 * quality, so the transformations stay countable). Empty when the listing fails.
 */
export async function listFolder(
  cfg: CloudinaryConfig,
): Promise<{ path: string; size: number; thumb: string }[]> {
  const auth = "Basic " + Buffer.from(`${cfg.key}:${cfg.secret}`).toString("base64");
  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cfg.cloud}/resources/by_asset_folder?asset_folder=${encodeURIComponent(cfg.folder)}&max_results=100`,
      { headers: { Authorization: auth }, cache: "no-store" },
    );
    if (!res.ok) return [];
    const body = (await res.json()) as {
      resources?: { secure_url: string; bytes: number; created_at: string; resource_type: string }[];
    };
    return (body.resources ?? [])
      .filter((r) => r.resource_type === "image")
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((r) => ({
        path: r.secure_url,
        size: r.bytes,
        thumb: r.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto,w_256,c_limit/"),
      }));
  } catch {
    return [];
  }
}

/**
 * A short-lived link to a PRIVATE asset (upload type `private`), for paid files such as a vault
 * download (FLEET.md, "Security baseline": paid files live in private storage behind short-lived
 * signed links). A private asset has no public address; this download-API link is signed with
 * the secret and Cloudinary refuses it after `expires_at` (401). Null when Cloudinary is not
 * configured, so a caller never hands out an unsigned address. Raw files omit `format`.
 */
export function privateFileUrl(
  cfg: CloudinaryKeys,
  file: { publicId: string; format?: string; resourceType?: "image" | "video" | "raw" },
  opts: { expiresInSeconds?: number; now?: number } = {},
): string {
  const timestamp = Math.floor((opts.now ?? Date.now()) / 1000);
  const ttl = Math.min(3600, Math.max(30, Math.floor(opts.expiresInSeconds ?? 600)));
  const resourceType = file.resourceType ?? "raw";
  const params: Record<string, string> = {
    public_id: file.publicId,
    type: "private",
    attachment: "true",
    timestamp: String(timestamp),
    expires_at: String(timestamp + ttl),
    ...(file.format && resourceType !== "raw" ? { format: file.format } : {}),
  };
  const signature = signParams(params, cfg.secret);
  const query = new URLSearchParams({ ...params, api_key: cfg.key, signature });
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/${resourceType}/download?${query.toString()}`;
}
