import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
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
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
