import type { NextConfig } from "next";
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
const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self' https://studio.ebenworks.co",
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

const nextConfig: NextConfig = {
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
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
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
          { key: "Content-Security-Policy", value: "frame-ancestors 'self' https://studio.ebenworks.co" },
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
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
