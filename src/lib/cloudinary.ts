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
 *   CLOUDINARY_FOLDER   optional; default tzohar-sites/<site name>/crm
 *
 * Every call is signed with SHA-1 over the sorted parameters plus the secret. There is no
 * unsigned upload preset, and the key never reaches the browser.
 */

export interface CloudinaryConfig {
  cloud: string;
  key: string;
  secret: string;
  folder: string;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "site";

/** The settings, or null when any of the three keys is missing. */
export function cloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  const cloud = env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = env.CLOUDINARY_API_KEY?.trim();
  const secret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud || !key || !secret) return null;
  const folder = (env.CLOUDINARY_FOLDER?.trim() || `tzohar-sites/${slugify(site.name)}/crm`).replace(/^\/+|\/+$/g, "");
  return { cloud, key, secret, folder };
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
