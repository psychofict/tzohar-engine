import Link from "next/link";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import { site } from "@/config/site";
import { appearanceStyle } from "@tzohar/schema";

/*
 * This route renders its own document, so it also has to load its own faces:
 * the next/font variable classes live on `[locale]/layout.tsx`'s <body>, which
 * never wraps this page. Without them `.type-display` and `.type-label` fell
 * through to system-ui, so the 404 was correctly themed in color but set in the
 * wrong typeface. next/font dedupes by config, so declaring the same three
 * faces here reuses the already-emitted files rather than shipping copies.
 *
 * Kept in sync with `site.appearance.font` — currently the `fraunces` pairing
 * (Inter body, Fraunces display) plus the sitewide mono label face.
 */
const body = Inter({ variable: "--nf-body", subsets: ["latin"], display: "swap" });
const display = Fraunces({ variable: "--nf-display", subsets: ["latin"], display: "swap" });
const label = IBM_Plex_Mono({
  variable: "--nf-label",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * 404 for requests that never matched the `[locale]` segment (a bad locale
 * prefix, a stray path). It renders its own `<html>`, so it is outside
 * `[locale]/layout.tsx` — which is where `appearanceStyle(site)` is injected.
 *
 * That is why this page used to look like a different website: with no
 * appearance overrides the semantic tokens fell back to the engine defaults in
 * globals.css, so a noir + gold site served its 404 in warm cream with the
 * default ocean blue — and the copy ("Lost at sea", "drifted away like a wave")
 * was the reference build's nautical voice. Injecting the same appearance CSS
 * and the same no-flash mode script the real layout uses makes this the site's
 * own 404 in both themes, via the shared token classes rather than hardcoded hex.
 */
export default function RootNotFound() {
  const appearanceCss = appearanceStyle(site);
  const forcedMode = site.appearance?.mode ?? "system";

  return (
    <html
      lang={site.locales.default}
      data-theme={site.theme ?? "default"}
      // Same reason as [locale]/layout.tsx: globals.css's `@theme` tokens
      // reference these variables from `:root`, so they must be defined here and
      // not on <body>, or `--font-sans` / `--font-mono` resolve to nothing.
      className={`${body.variable} ${display.variable} ${label.variable}`}
      style={
        {
          "--font-body": "var(--nf-body)",
          "--font-display": "var(--nf-display)",
          "--font-label": "var(--nf-label)",
        } as React.CSSProperties
      }
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=${JSON.stringify(forcedMode)};var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&(m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)))){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        {appearanceCss && <style dangerouslySetInnerHTML={{ __html: appearanceCss }} />}
      </head>
      <body className="bg-bg text-ink font-sans antialiased" suppressHydrationWarning>
        <main className="flex min-h-screen items-center px-6 py-20">
          <div className="mx-auto w-full max-w-3xl">
            <div className="mb-7 flex items-center gap-3.5">
              <span className="accent-rule" aria-hidden />
              <span className="type-label text-ink-3">404</span>
              <span className="bg-line h-px flex-1" aria-hidden />
            </div>
            <h1 className="type-display text-ink text-balance leading-[1.08] text-[calc(clamp(2.25rem,6vw,3.75rem)*var(--display-scale))]">
              That page isn&apos;t here
            </h1>
            <p className="text-ink-2 measure mt-6 text-[17px] leading-relaxed">
              The address may be mistyped, or the page may have moved. The home page is a good place to
              pick the thread back up.
            </p>
            <Link
              href="/"
              className="bg-ocean text-on-accent hover:bg-ocean-strong mt-9 inline-flex h-11 items-center rounded-[var(--radius-pill)] px-6 text-[15px] font-semibold transition-colors"
            >
              Back to {site.name}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
