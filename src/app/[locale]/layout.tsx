import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { site, canonicalUrl, hasModule } from "@/config/site";
import { getComposedPage } from "@/data/pages";
import { filterMessages } from "@/lib/messages";
import { appearanceStyle } from "@tzohar/schema";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AudioPlayerProvider } from "@/components/AudioPlayerContext";
import AudioPlayer from "@/components/AudioPlayer";
import JsonLd from "@/components/JsonLd";
import {
  getPersonSchema,
  getWebsiteSchema,
  getEbenworksOrganizationSchema,
  getSiteNavigationSchema,
} from "@/lib/structured-data";
import Analytics from "@/components/Analytics";
import ScrollProgress from "@/components/ScrollProgress";
import ThemeProvider from "@/components/ThemeProvider";
import MotionProvider from "@/components/MotionProvider";
import PreviewBridge from "@/components/preview/PreviewBridge";
import { fontVarStyle } from "@/lib/font-vars";
import { siteFontVariables } from "@/lib/site-fonts";
/*
 * CJK faces come from a GENERATED module, because a next/font call downloads its
 * family at BUILD time whether or not the result is used — so the three Noto
 * families could not be gated on `site.locales.enabled` by a condition, only by
 * not existing. Declared inline here they cost an English-only client 349 of its
 * 434 font fetches, and made every build depend on ~350 URLs staying up at
 * fonts.gstatic.com — one client deploy failed outright when a few 404'd.
 *
 * Regenerate with `npm run cjk-fonts` after changing locales; `prebuild` runs it
 * too, so a deploy cannot ship a stale set. See scripts/gen-cjk-fonts.mjs.
 */
import { cjkVariableForLocale } from "@/lib/cjk-fonts.generated";
import BottomNav from "@/components/BottomNav";
import { clampDescription, ogLocales, routeAlternates } from "@/lib/route-meta";
import { siteIndexable } from "@/lib/search-index";
import { siteIcons } from "@/lib/site-icon";
import { scriptJson } from "@/lib/json-ld";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const baseUrl = site.url;
  const canonical = canonicalUrl(locale);

  return {
    metadataBase: new URL(baseUrl),
    applicationName: site.name,
    title: {
      template: `%s | ${site.name}`,
      default: site.seo.titleDefault,
    },
    description: clampDescription(site.description),
    keywords: site.seo.keywords,
    openGraph: {
      title: site.seo.titleDefault,
      description: site.description,
      siteName: site.name,
      url: canonical,
      type: "website",
      // This locale, and as alternates only the other locales the site ships.
      ...ogLocales(locale),
      images: [
        {
          url: site.brand.ogImage,
          width: 1200,
          height: 630,
          alt: site.seo.titleDefault,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: site.twitter,
      creator: site.twitter,
    },
    // `brand.icon` when the site names one, else the icon files in public/ (src/lib/site-icon.ts).
    icons: siteIcons(),
    // Generated from config by src/app/manifest.ts, not a static file in public/
    // — see the comment there for why a copied static manifest goes stale.
    manifest: "/manifest.webmanifest",
    // The root layout IS the home route, so the path is empty.
    alternates: routeAlternates("", locale),
    // A preview build (TZOHAR_PREVIEW=1) or a site with `seo.index: false` asks not to be
    // indexed (src/lib/search-index.ts).
    robots: {
      index: siteIndexable,
      follow: siteIndexable,
      googleBot: {
        index: siteIndexable,
        follow: siteIndexable,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      other: {
        ...(process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
          ? { "naver-site-verification": [process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION] }
          : {}),
        ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
          ? { "msvalidate.01": [process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION] }
          : {}),
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);
  // Everything passed to NextIntlClientProvider is serialized into every
  // page's HTML — filter out namespaces this build can't reach so a client
  // site never ships (or leaks) copy for modules it doesn't run.
  const messages = filterMessages(await getMessages(), {
    hasComposedHome: hasModule("pages") && getComposedPage("home") !== undefined,
  });

  // Custom accent/radius overrides (empty string for preset-only sites → no <style>).
  const appearanceCss = appearanceStyle(site);
  // Default color mode for the no-flash script. A site that sets nothing opens
  // light and never follows the visitor's OS (engine 2.8.5: light is the default
  // everywhere; "system" has to be chosen on purpose).
  const forcedMode = site.appearance?.mode ?? "light";
  // Whether visitors get a light/dark switch. "system" always does; a pinned
  // mode does only when the site opts in — then the pinned mode is just the
  // first-visit default. Must stay in lockstep with the pre-paint script below
  // and ThemeProvider.
  const allowToggle = site.appearance?.toggle === true || forcedMode === "system";
  // Only override --font-body/--font-display when a non-default pairing is chosen.
  const fontChoice = site.appearance?.font;
  // Shared with the live-preview bridge — see src/lib/font-vars.ts for why the
  // pairing must be applied INLINE on <html> and not via a stylesheet.
  const rootFontStyle = (fontVarStyle(fontChoice) ?? undefined) as React.CSSProperties | undefined;

  /*
   * FONT VARIABLES BELONG ON <html>, NOT <body>.
   *
   * globals.css builds its theme tokens by indirection — `--font-sans:
   * var(--font-body)`, `--font-mono: var(--font-label), …` — and Tailwind emits
   * `@theme` into `:root`. A custom property is substituted using the computed
   * value of the referenced property ON THE SAME ELEMENT, so with `--font-body`
   * defined only on <body>, `--font-sans` computed at `:root` as
   * guaranteed-invalid. Every rule that consumed it then became invalid at
   * computed-value time and fell back to the UA default: `body{font-family:
   * var(--font-sans),…}`, the `font-sans` utility, `.type-display`, `.type-label`.
   *
   * Net effect, and this predates the current design work: the site rendered
   * headings and body copy in the browser's default sans regardless of which
   * pairing `site.appearance.font` selected. Defining the variables on <html>
   * puts them on the same element as the `@theme` tokens that reference them, so
   * the indirection resolves and the configured faces actually apply.
   */
  // The faces themselves are declared in src/lib/site-fonts.ts, shared with the root 404.
  const fontVariableClasses = [
    siteFontVariables,
    cjkVariableForLocale[locale] ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html
      lang={locale}
      data-theme={site.theme ?? "default"}
      className={fontVariableClasses}
      style={rootFontStyle}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of wrong theme + flag JS for the Reveal primitive.
            When a toggle is offered (appearance.toggle, or mode 'system') a stored
            choice wins, else the mode's default. A locked pinned mode ignores
            storage. Keep this in lockstep with ThemeProvider and not-found.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            // light-theme:allow a client's own appearance.mode ("system" only when the site sets it; Tzohar's default is light)
            __html: `(function(){try{var m=${scriptJson(forcedMode)},c=${scriptJson(allowToggle)};var s=c?localStorage.getItem('theme'):null;if(s==='dark'||(s!=='light'&&(m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches)))){document.documentElement.classList.add('dark')}document.documentElement.classList.add('js-on')}catch(e){}})()`,
          }}
        />
        {/* Custom accent/radius overrides — after globals.css so head source order wins. */}
        {appearanceCss && <style dangerouslySetInnerHTML={{ __html: appearanceCss }} />}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {site.geo?.region && <meta name="geo.region" content={site.geo.region} />}
        {site.geo?.placename && <meta name="geo.placename" content={site.geo.placename} />}
        <JsonLd data={getPersonSchema()} />
        <JsonLd data={getWebsiteSchema()} />
        <JsonLd data={getSiteNavigationSchema()} />
        {/* Ebenworks studio org — reference-site specific (the founder's company) */}
        {hasModule("ai") && <JsonLd data={getEbenworksOrganizationSchema()} />}
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:rounded-lg focus:bg-ocean focus:px-4 focus:py-2 focus:text-on-accent focus:shadow-lg"
        >
          Skip to content
        </a>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider mode={forcedMode} toggle={allowToggle}>
            <MotionProvider>
              <ScrollProgress />
              <AudioPlayerProvider>
                <Navbar />
                {children}
                <Footer />
                <div className="h-16 lg:hidden" />
                <BottomNav />
                <AudioPlayer />
                {/* Inert unless ?tzohar-preview is present — see lib/preview-store.ts */}
                <PreviewBridge />
              </AudioPlayerProvider>
            </MotionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        {/* Every analytics tool, Vercel Web Analytics included (src/lib/analytics.ts). */}
        <Analytics />
      </body>
    </html>
  );
}
