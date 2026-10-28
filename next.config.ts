import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Content-Security-Policy-Report-Only (audit WEB-10, 2026-10-03). It reports and blocks
// nothing, so a missing origin costs a console line instead of a broken page. This file ships
// to every client site, so the list covers every module the engine can switch on, not only
// what one site uses. It was checked against the reference build in a browser at 1280 and 390
// wide.
//   - 'unsafe-inline' for scripts and styles: Next's bootstrap script and the GA4 snippet are
//     inline, and a nonce policy needs per-request rendering.
//   - Analytics (src/components/Analytics.tsx) is switched on by NEXT_PUBLIC_* variables, so all
//     three vendors are listed whether or not a given site enables them.
//   - img-src allows any https image: remote images come from the hosts under `images` below,
//     and the Songkick widget loads its own artwork.
//   - frame-src is the Spotify player, Instagram and privacy-enhanced YouTube embeds, and the
//     Songkick widget.
//   - frame-ancestors repeats the enforced rule below so the two stay in step when this
//     policy is made to enforce. The enforced one is the control that lets Studio frame the
//     site, and it is unchanged.
//   - No upgrade-insecure-requests: browsers ignore it in a report-only policy and log a warning.
//   - report-uri /api/csp-report (EBE-515, 11 Oct 2026): until then the policy reported to
//     nobody. Each report becomes one "[csp]" line in the site's function log.
// To enforce: read the "[csp]" lines, fix what they report, then merge this value into
// Content-Security-Policy.
// Studio frames the site for its live preview. A local Studio may be added in development only
// (NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN, an http(s) origin; src/lib/preview-store.ts accepts its
// messages under the same rule, TZS-7). Only `next dev` (PHASE_DEVELOPMENT_SERVER) adds it: any
// build, whatever NODE_ENV says, lists Studio alone.
/** The dev setting as a browser writes an origin (lowercase, no path, no default port), or "". */
function devStudioOrigin(): string {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_TZOHAR_STUDIO_DEV_ORIGIN?.trim() ?? "").origin;
    return /^https?:\/\/[a-z0-9.-]+(:\d+)?$/.test(origin) ? origin : "";
  } catch {
    return "";
  }
}

function frameAncestors(devServer: boolean): string {
  const dev = devServer ? devStudioOrigin() : "";
  const extra = dev ? ` ${dev}` : "";
  return `frame-ancestors 'self' https://studio.ebenworks.co${extra}`;
}

const contentSecurityPolicyReportOnly = (devServer: boolean) => [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  frameAncestors(devServer),
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  [
    "script-src 'self' 'unsafe-inline'",
    "https://plausible.io",
    "https://www.googletagmanager.com",
    "https://wcs.pstatic.net",
    "https://ssl.pstatic.net",
    "https://widget-app.songkick.com",
  ].join(" "),
  [
    "connect-src 'self'",
    "https://accounts.ebenworks.co",
    "https://plausible.io",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://*.naver.com",
  ].join(" "),
  "frame-src https://open.spotify.com https://www.instagram.com https://www.youtube-nocookie.com https://widget-app.songkick.com",
  "media-src 'self' https:",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "report-uri /api/csp-report",
].join("; ");

// A function of the phase, so each load's headers() reads its own phase, never shared state.
const nextConfigFor = (devServer: boolean): NextConfig => ({
  images: {
    // ONE format, not two. Next picks the first entry the browser accepts, but the
    // transformation cache key includes the format, so offering avif and webp caches
    // (and bills) the same image at the same width twice. webp alone is a few percent
    // larger on the wire and halves the number of distinct keys.
    formats: ["image/webp"],
    // Transformations are billed on every cache MISS and STALE. The default lifetime is
    // 60 seconds, so a hot image is re-billed minute after minute forever.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Without these Next generates its full default ladder to 3840px. A `sizes="100vw"`
    // hero then bills the two largest widths on every viewport that asks for them.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Images uploaded through Studio or this site's CRM (engine 2.8.7). Pinned to the one
      // product environment, not the whole host: Vercel Blob's `*.public.blob.vercel-storage.com`
      // stood here until 13 Oct 2026 and let any Blob store anyone runs through the optimizer.
      // A site with its own Cloudinary account (CLOUDINARY_CLOUD_NAME) gets its own entry.
      ...[...new Set(["qjbtaukm", process.env.CLOUDINARY_CLOUD_NAME?.trim()].filter(Boolean))].map(
        (cloud) => ({ protocol: "https" as const, hostname: "res.cloudinary.com", pathname: `/${cloud}/image/upload/**` }),
      ),
    ],
  },
  async redirects() {
    return [
      { source: "/ambassadorships", destination: "/macro-influencer", permanent: true },
      { source: "/:locale(ko|zh|fr|ja)/ambassadorships", destination: "/:locale/macro-influencer", permanent: true },
      { source: "/blog", destination: "/", permanent: true },
      { source: "/:locale(ko|zh|fr|ja)/blog", destination: "/:locale", permanent: true },
      { source: "/blog/:slug", destination: "/", permanent: true },
      { source: "/:locale(ko|zh|fr|ja)/blog/:slug", destination: "/:locale", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          /*
           * Clickjacking protection, kept — but expressed as CSP frame-ancestors
           * rather than X-Frame-Options, because XFO has no way to allow ONE
           * other origin (ALLOW-FROM is dead in every modern browser) and
           * Studio's live preview frames this site from studio.ebenworks.co.
           * With XFO SAMEORIGIN the browser refused the frame outright and the
           * preview fell back to the sketch. frame-ancestors supersedes XFO in
           * every browser that supports it, and listing 'self' + Studio keeps
           * every other host exactly as locked out as before.
           */
          { key: "Content-Security-Policy", value: frameAncestors(devServer) },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // The strict form also withholds the origin on an https -> http downgrade.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly(devServer) },
        ],
      },
    ];
  },
});

export default function config(phase: string): NextConfig {
  return withNextIntl(nextConfigFor(phase === PHASE_DEVELOPMENT_SERVER));
}
