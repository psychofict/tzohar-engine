import Link from "next/link";
import { site } from "@/config/site";
import { appearanceStyle } from "@tzohar/schema";
import { scriptJson } from "@/lib/json-ld";
import { siteFontVariables } from "@/lib/site-fonts";
import { fontVarStyle } from "@/lib/font-vars";

/*
 * This route renders its own document, so it also has to load its own faces:
 * the next/font variable classes live on `[locale]/layout.tsx`'s <html>, which
 * never wraps this page. It takes the same faces and the same pairing switch as
 * the layout (src/lib/site-fonts.ts), so the 404 is set in the site's own type.
 * It declared Inter, Fraunces and IBM Plex Mono itself, which suited one site.
 */

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
  const forcedMode = site.appearance?.mode ?? "light";
  const allowToggle = site.appearance?.toggle === true || forcedMode === "system";

  return (
    <html
      lang={site.locales.default}
      data-theme={site.theme ?? "default"}
      // Same reason as [locale]/layout.tsx: globals.css's `@theme` tokens
      // reference these variables from `:root`, so they must be defined here and
      // not on <body>, or `--font-sans` / `--font-mono` resolve to nothing.
      className={siteFontVariables}
      style={(fontVarStyle(site.appearance?.font) ?? undefined) as React.CSSProperties | undefined}
      suppressHydrationWarning
    >
      <head>
        {/* This document has no metadata of its own, so the tab read the bare address. */}
        <title>{`Page not found | ${site.name}`}</title>
        <script
          dangerouslySetInnerHTML={{
            // Same precedence as the root layout: a stored choice wins only when a
            // toggle is offered (appearance.toggle, or mode 'system'); a locked
            // pinned mode ignores storage. light-theme:allow a client's own appearance.mode ("system" only when the site sets it; Tzohar's default is light)
            __html: `(function(){try{var m=${scriptJson(forcedMode)},c=${scriptJson(allowToggle)};var s=c?localStorage.getItem('theme'):null;if(s==='dark'||(s!=='light'&&(m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)))){document.documentElement.classList.add('dark')}}catch(e){}})()`,
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
              We could not find this page
            </h1>
            <p className="text-ink-2 measure mt-6 text-[17px] leading-relaxed">
              The page may have moved, or the address may be out of date. Please return to the homepage to continue.
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
