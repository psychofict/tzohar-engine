import type { Metadata, MetadataRoute } from "next";
import { site } from "@/config/site";

/**
 * The site's icon in the browser tab, on a phone's home screen and in the web app manifest.
 *
 * With `brand.icon` (an https address of a square picture) every icon comes from it. A Cloudinary
 * address, which is what Studio stores, is cut to each size by Cloudinary and delivered as PNG
 * (a size step in front of the stored path, and the extension changed to .png). Any other
 * address is used as it is. Without `brand.icon` the site keeps the icon files in its own
 * public/ folder, as before; on a site made from the template those are a placeholder.
 */

const CLOUDINARY_IMAGE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** The icon picture at one square size. `png` is true when the address is sure to serve PNG. */
export function iconAt(src: string, size: number): { url: string; png: boolean } {
  const m = CLOUDINARY_IMAGE.exec(src);
  if (!m) return { url: src, png: false };
  const [, upload, rest] = m;
  const [path, query] = rest.split("?");
  const hasExtension = /\.[a-z0-9]{2,5}$/i.test(path);
  const step = `w_${size},h_${size},c_fill${hasExtension ? "" : ",f_png"}`;
  const asPng = hasExtension ? path.replace(/\.[a-z0-9]{2,5}$/i, ".png") : path;
  return { url: `${upload}${step}/${asPng}${query ? `?${query}` : ""}`, png: true };
}

function sized(src: string, size: number) {
  const { url, png } = iconAt(src, size);
  return { url, sizes: `${size}x${size}`, ...(png ? { type: "image/png" } : {}) };
}

/** The `icons` entry of the layout's metadata. */
export function siteIcons(icon: string | undefined = site.brand.icon): NonNullable<Metadata["icons"]> {
  if (!icon) {
    return {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    };
  }
  return {
    icon: [sized(icon, 32), sized(icon, 192), sized(icon, 512)],
    apple: [sized(icon, 180)],
  };
}

/** The `icons` list of the web app manifest. */
export function manifestIcons(icon: string | undefined = site.brand.icon): NonNullable<MetadataRoute.Manifest["icons"]> {
  if (!icon) {
    return [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ];
  }
  return [192, 512].map((n) => {
    const { url, png } = iconAt(icon, n);
    return { src: url, sizes: `${n}x${n}`, ...(png ? { type: "image/png" } : {}) };
  });
}
