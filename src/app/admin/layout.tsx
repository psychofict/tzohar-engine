import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { site } from "@/config/site";
import "./admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--crm-sans", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--crm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} CRM`,
  // The CRM must never be indexed. `robots.ts` covers crawlers that read
  // robots.txt; this covers the ones that only read the meta tag.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * CRM root layout — its own <html>, deliberately, and NO auth guard.
 *
 * The admin is not nested under `[locale]`, so it inherits none of the site
 * chrome: no navbar, no footer, no next-intl provider, no site theme tokens.
 * That separation is the point — the CMS is an operator tool with different
 * density and a different failure mode from the public site, and it should not
 * break when the site's design does.
 *
 * The guard lives one level down in `(app)/layout.tsx` rather than here, because
 * `/admin/login` is a child of this segment: a redirect-to-login in *this*
 * layout would also fire on the login page itself and loop forever.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="crm">{children}</body>
    </html>
  );
}
