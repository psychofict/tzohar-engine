import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  DM_Sans,
  Inter,
  Sora,
  Space_Grotesk,
  Manrope,
  Nunito_Sans,
  Playfair_Display,
  Fraunces,
  Unbounded,
  Syne,
  Figtree,
  Bricolage_Grotesque,
  Schibsted_Grotesk,
  Anton,
  Archivo,
  Instrument_Sans,
  Instrument_Serif,
  DM_Serif_Display,
  IBM_Plex_Mono,
  Noto_Sans_KR,
  Noto_Sans_SC,
  Noto_Sans_JP,
  Caveat,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { localeToOgLocale, type Locale } from "@/i18n/config";
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
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import ScrollProgress from "@/components/ScrollProgress";
import ThemeProvider from "@/components/ThemeProvider";
import PreviewBridge from "@/components/preview/PreviewBridge";
import { fontVarStyle } from "@/lib/font-vars";
import BottomNav from "@/components/BottomNav";
import { routeAlternates } from "@/lib/route-meta";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// Named `--font-dm-sans`, matching what globals.css's `@theme` actually
// references for `--font-display`. It used to declare itself AS `--font-display`
// while `@theme` set `--font-display: var(--font-dm-sans)` — a variable nothing
// defined — so the theme token was permanently invalid.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

// Curated `appearance.font` pairings — loaded but not preloaded; only applied
// when a site opts in via `site.appearance.font` (default keeps Jakarta/DM Sans).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap", preload: false });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], display: "swap", preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap", preload: false });
const nunitoSans = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap", preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap", preload: false });
const unbounded = Unbounded({ variable: "--font-unbounded", subsets: ["latin"], display: "swap", preload: false });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], display: "swap", preload: false });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], display: "swap", preload: false });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], display: "swap", preload: false });
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"], display: "swap", preload: false });
// Single-weight poster/serif display faces — rendered at 400 via --display-weight.
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400", display: "swap", preload: false });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], display: "swap", preload: false });
const instrumentSans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], display: "swap", preload: false });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", display: "swap", preload: false });
const dmSerifDisplay = DM_Serif_Display({ variable: "--font-dmserif", subsets: ["latin"], weight: "400", display: "swap", preload: false });
// DM Sans again under its own var — the dmserif pairing's body can't point at
// --font-display (it's redefined on the same element, which would self-reference).
const dmSansBody = DM_Sans({ variable: "--font-dmsans", subsets: ["latin"], display: "swap", preload: false });

// All appearance-font `.variable` classes go on <body> so the vars are defined;
// `site.appearance.font` then points --font-body/--font-display at the chosen pair.
const appearanceFontVariables = [
  inter.variable,
  sora.variable,
  spaceGrotesk.variable,
  manrope.variable,
  nunitoSans.variable,
  playfair.variable,
  fraunces.variable,
  unbounded.variable,
  syne.variable,
  figtree.variable,
  bricolage.variable,
  schibsted.variable,
  anton.variable,
  archivo.variable,
  instrumentSans.variable,
  instrumentSerif.variable,
  dmSerifDisplay.variable,
  dmSansBody.variable,
].join(" ");

// `jakarta` maps to the today-defaults (--font-body / --font-display) and is
// never applied as an inline override (that would self-reference the vars).

// Script accent — used by the block system's taglines / pull-quotes
// (`--font-script`), not part of the body/display pairing matrix.
const caveat = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

/**
 * Label face (`--font-mono`, consumed by `.type-label` in globals.css).
 *
 * Sitewide and OUTSIDE the body/display pairing matrix, exactly like
 * `--font-script`: a pairing chooses the two *reading* voices, while every
 * structural label — eyebrows, stat captions, table heads, dates, record
 * numbers — is set in one mono face across all pairings. Two voices (display +
 * body) cannot distinguish "this is prose" from "this is metadata"; the mono
 * third voice is what makes small-caps labels read as apparatus rather than as
 * shrunken headings. Preloaded, because labels appear above the fold on every
 * page.
 */
const plexMono = IBM_Plex_Mono({
  // Named `--font-label`, not `--font-mono`: globals.css's `@theme` defines the
  // Tailwind family token `--font-mono` *in terms of* this one, and a token that
  // referenced itself would resolve to nothing.
  variable: "--font-label",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-ko",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-zh",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-ja",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const cjkVariableForLocale: Record<string, string> = {
  ko: notoSansKR.variable,
  zh: notoSansSC.variable,
  ja: notoSansJP.variable,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ogLocale = localeToOgLocale[locale as Locale] || "en_US";
  const baseUrl = site.url;
  const canonical = canonicalUrl(locale);

  return {
    metadataBase: new URL(baseUrl),
    applicationName: site.name,
    title: {
      template: `%s | ${site.name}`,
      default: site.seo.titleDefault,
    },
    description: site.description,
    keywords: site.seo.keywords,
    openGraph: {
      title: site.seo.titleDefault,
      description: site.description,
      siteName: site.name,
      url: canonical,
      type: "website",
      locale: ogLocale,
      alternateLocale: Object.values(localeToOgLocale).filter((l) => l !== ogLocale),
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
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    // Generated from config by src/app/manifest.ts, not a static file in public/
    // — see the comment there for why a copied static manifest goes stale.
    manifest: "/manifest.webmanifest",
    // The root layout IS the home route, so the path is empty.
    alternates: routeAlternates("", locale),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
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
  // Forced default color mode for the no-flash script ("system" preserves today's behavior).
  const forcedMode = site.appearance?.mode ?? "system";
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
  const fontVariableClasses = [
    plusJakartaSans.variable,
    dmSans.variable,
    caveat.variable,
    plexMono.variable,
    appearanceFontVariables,
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
            A PINNED appearance.mode ('light'/'dark') wins outright — see below.
            Under 'system' a stored choice wins, then prefers-color-scheme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=${JSON.stringify(forcedMode)};var t=m==='system'?localStorage.getItem('theme'):null;if(m==='dark'||t==='dark'||(m==='system'&&t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}document.documentElement.classList.add('js-on')}catch(e){}})()`,
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
          <ThemeProvider mode={forcedMode}>
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
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <VercelAnalytics />
      </body>
    </html>
  );
}
