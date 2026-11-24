/**
 * Every face a site can use, declared once and shared by the locale layout and the root 404.
 *
 * The root 404 (src/app/not-found.tsx) renders its own document outside the locale layout, so it
 * has to load the faces itself. It declared three fixed ones (Inter, Fraunces, IBM Plex Mono), which
 * were right for one site and wrong for every other: the Kopje Light demo's 404 came up in Inter and
 * Fraunces beside pages set in Instrument Sans and Instrument Serif. Both documents now take the same
 * set from here and the same pairing switch (`fontVarStyle(site.appearance.font)`, src/lib/font-vars.ts).
 * next/font dedupes by configuration, so two importers do not ship two copies.
 *
 * CJK faces are not here: src/lib/cjk-fonts.generated.ts declares them for the enabled locales only.
 */
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
  Caveat,
} from "next/font/google";

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

/**
 * The CSS variable classes of every face above, for the <html> element. FONT VARIABLES BELONG ON
 * <html>, NOT <body>: see the note in src/app/[locale]/layout.tsx.
 */
export const siteFontVariables = [
  plusJakartaSans.variable,
  dmSans.variable,
  caveat.variable,
  plexMono.variable,
  appearanceFontVariables,
].join(" ");
