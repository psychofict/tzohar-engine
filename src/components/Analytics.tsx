"use client";

import Script from "next/script";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { analyticsTools, type AnalyticsTool } from "@/lib/analytics";

/**
 * Every analytics script the site loads, and nothing else: the list comes from
 * src/lib/analytics.ts, which the privacy notice reads too, so the notice names exactly
 * what runs here (EBE-7044). scripts/check-analytics-notice.mjs fails the build if an
 * analytics script is loaded anywhere else.
 */
function Tool({ tool }: { tool: AnalyticsTool }): React.JSX.Element | null {
  switch (tool.id) {
    case "vercel":
      return <VercelAnalytics />;
    case "google":
      return (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tool.gaId)}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(tool.gaId)});
            `}
          </Script>
        </>
      );
    case "plausible":
      return (
        <Script
          defer
          data-domain={tool.domain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      );
    case "naver":
      return (
        // The page view is sent once wcslog.js has loaded: run beside it, as before, the call
        // came before the script existed and Naver counted nothing on a first visit.
        <Script
          src="//wcs.pstatic.net/wcslog.js"
          strategy="afterInteractive"
          onLoad={() => {
            const w = window as unknown as {
              wcs_add?: Record<string, string>;
              wcs?: unknown;
              wcs_do?: () => void;
            };
            w.wcs_add = w.wcs_add || {};
            w.wcs_add["wa"] = tool.naverId;
            if (w.wcs && typeof w.wcs_do === "function") w.wcs_do();
          }}
        />
      );
    default: {
      // A tool added to the list without a branch here fails the type check.
      const missing: never = tool;
      return missing;
    }
  }
}

export default function Analytics() {
  return (
    <>
      {analyticsTools().map((tool) => (
        <Tool key={tool.id} tool={tool} />
      ))}
    </>
  );
}
