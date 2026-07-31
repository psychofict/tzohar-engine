"use client";

import Script from "next/script";

export default function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const naverAnalyticsId = process.env.NEXT_PUBLIC_NAVER_ANALYTICS_ID;

  return (
    <>
      {/* Plausible Analytics */}
      {plausibleDomain && (
        <Script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      )}

      {/* Google Analytics 4 */}
      {process.env.NEXT_PUBLIC_GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
          </Script>
        </>
      )}

      {/* Naver Analytics */}
      {naverAnalyticsId && (
        <Script
          src="//wcs.pstatic.net/wcslog.js"
          strategy="afterInteractive"
        />
      )}
      {naverAnalyticsId && (
        <Script id="naver-analytics" strategy="afterInteractive">
          {`
            if(!wcs_add) var wcs_add = {};
            wcs_add["wa"] = "${naverAnalyticsId}";
            if(window.wcs) {
              wcs_do();
            }
          `}
        </Script>
      )}
    </>
  );
}
