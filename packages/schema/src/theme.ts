/**
 * @tzohar/schema — SHARED theme engine.
 *
 * The single source of truth for how a site's `appearance` (accent colors,
 * font pairing, paper/neutral palette, type scale, motion, corner radius,
 * light/dark mode) turns into concrete CSS variables. It is framework-agnostic
 * and dependency-free so it can be consumed by BOTH:
 *   1. the engine (`src/app/[locale]/layout.tsx` injects `appearanceStyle()`),
 *   2. Tzohar Studio's live preview (renders the same tokens as-you-type).
 *
 * Brand expression = accent + type + paper + shape + motion. `globals.css`
 * carries the defaults (the "warm" paper, "classic" scale, "rise" motion);
 * everything here emits overrides on top of those defaults.
 */

// ── Vocabularies (also used to build the Studio pickers) ────────────────────
export const FONT_CHOICES = [
  "jakarta",
  "inter",
  "sora",
  "space",
  "manrope",
  "playfair",
  "fraunces",
  "unbounded",
  "syne",
  "bricolage",
  "anton",
  "instrument",
  "dmserif",
] as const;
export const RADIUS_CHOICES = ["sharp", "soft", "round"] as const;
export const MODE_CHOICES = ["light", "dark", "system"] as const;
export const PAPER_CHOICES = ["warm", "pure", "cool", "sand", "noir", "tinted"] as const;
export const TYPESCALE_CHOICES = ["classic", "expressive", "statement"] as const;
export const MOTION_CHOICES = ["rise", "drift", "kinetic", "editorial", "still"] as const;

export type FontChoice = (typeof FONT_CHOICES)[number];
export type RadiusChoice = (typeof RADIUS_CHOICES)[number];
export type ModeChoice = (typeof MODE_CHOICES)[number];
export type PaperChoice = (typeof PAPER_CHOICES)[number];
export type TypeScaleChoice = (typeof TYPESCALE_CHOICES)[number];
export type MotionChoice = (typeof MOTION_CHOICES)[number];

/** Matches `#rrggbb` (what the color pickers emit). */
export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// ── Curated font pairings (self-hosted via next/font in the engine) ─────────
export interface FontPairing {
  /** Human label for the Studio picker. */
  label: string;
  /** One-word vibe shown under the label. */
  vibe: string;
  /** CSS font-family stack for body copy. */
  body: string;
  /** CSS font-family stack for display/headings. */
  display: string;
  /** Google Fonts family names the engine must load (first = body, second = display). */
  google: [string, string];
  /**
   * Heading weight for this display face. Single-weight poster/serif faces
   * (Anton, Instrument Serif, DM Serif Display) must render at 400 — synthetic
   * bold ruins them. Omit for the 700 default.
   */
  displayWeight?: string;
  /** Heading letter-spacing tuned per face. Omit for the -0.025em default. */
  displayTracking?: string;
}

const SANS = `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
const SERIF = `Georgia, "Times New Roman", serif`;

export const FONT_PAIRINGS: Record<FontChoice, FontPairing> = {
  jakarta: {
    label: "Jakarta + DM Sans",
    vibe: "Modern · default",
    body: `"Plus Jakarta Sans", ${SANS}`,
    display: `"DM Sans", ${SANS}`,
    google: ["Plus Jakarta Sans", "DM Sans"],
  },
  inter: {
    label: "Inter",
    vibe: "Ubiquitous · neutral",
    body: `"Inter", ${SANS}`,
    display: `"Inter", ${SANS}`,
    google: ["Inter", "Inter"],
  },
  sora: {
    label: "Inter + Sora",
    vibe: "Tech · precise",
    body: `"Inter", ${SANS}`,
    display: `"Sora", ${SANS}`,
    google: ["Inter", "Sora"],
  },
  space: {
    label: "Inter + Space Grotesk",
    vibe: "Editorial tech",
    body: `"Inter", ${SANS}`,
    display: `"Space Grotesk", ${SANS}`,
    google: ["Inter", "Space Grotesk"],
  },
  manrope: {
    label: "Manrope",
    vibe: "Clean · geometric",
    body: `"Manrope", ${SANS}`,
    display: `"Manrope", ${SANS}`,
    google: ["Manrope", "Manrope"],
  },
  playfair: {
    label: "Nunito + Playfair",
    vibe: "Elegant · fashion",
    body: `"Nunito Sans", ${SANS}`,
    display: `"Playfair Display", ${SERIF}`,
    google: ["Nunito Sans", "Playfair Display"],
    displayTracking: "-0.015em",
  },
  fraunces: {
    label: "Inter + Fraunces",
    vibe: "Warm · literary",
    body: `"Inter", ${SANS}`,
    display: `"Fraunces", ${SERIF}`,
    google: ["Inter", "Fraunces"],
    // Fraunces is a high-contrast variable serif: at display sizes its 700 is
    // heavy enough that the thin strokes bloom and the wonk reads as a glitch.
    // 600 keeps the character and holds the hairlines.
    displayWeight: "600",
    displayTracking: "-0.015em",
  },
  unbounded: {
    label: "Manrope + Unbounded",
    vibe: "Futurist · statement",
    body: `"Manrope", ${SANS}`,
    display: `"Unbounded", ${SANS}`,
    google: ["Manrope", "Unbounded"],
    displayWeight: "600",
    displayTracking: "-0.01em",
  },
  syne: {
    label: "Figtree + Syne",
    vibe: "Art-house · bold",
    body: `"Figtree", ${SANS}`,
    display: `"Syne", ${SANS}`,
    google: ["Figtree", "Syne"],
    displayWeight: "700",
    displayTracking: "0em",
  },
  bricolage: {
    label: "Schibsted + Bricolage",
    vibe: "Editorial · characterful",
    body: `"Schibsted Grotesk", ${SANS}`,
    display: `"Bricolage Grotesque", ${SANS}`,
    google: ["Schibsted Grotesk", "Bricolage Grotesque"],
    displayTracking: "-0.02em",
  },
  anton: {
    label: "Archivo + Anton",
    vibe: "Poster · loud",
    body: `"Archivo", ${SANS}`,
    display: `"Anton", ${SANS}`,
    google: ["Archivo", "Anton"],
    displayWeight: "400",
    displayTracking: "0.005em",
  },
  instrument: {
    label: "Instrument Sans + Serif",
    vibe: "Refined · editorial serif",
    body: `"Instrument Sans", ${SANS}`,
    display: `"Instrument Serif", ${SERIF}`,
    google: ["Instrument Sans", "Instrument Serif"],
    displayWeight: "400",
    displayTracking: "0em",
  },
  dmserif: {
    label: "DM Sans + DM Serif",
    vibe: "Classic editorial",
    body: `"DM Sans", ${SANS}`,
    display: `"DM Serif Display", ${SERIF}`,
    google: ["DM Sans", "DM Serif Display"],
    displayWeight: "400",
    displayTracking: "-0.01em",
  },
};

export const RADIUS_VALUES: Record<RadiusChoice, { label: string; card: string; pill: string }> = {
  sharp: { label: "Sharp", card: "0.35rem", pill: "0.35rem" },
  soft: { label: "Soft", card: "1rem", pill: "9999px" },
  round: { label: "Rounded", card: "1.6rem", pill: "9999px" },
};

// ── Type scale — how loud the display type is sitewide ──────────────────────
export interface TypeScalePreset {
  label: string;
  vibe: string;
  /** Multiplier applied to every display-* heading size (via --display-scale). */
  scale: number;
}
export const TYPESCALE_VALUES: Record<TypeScaleChoice, TypeScalePreset> = {
  classic: { label: "Classic", vibe: "Balanced hierarchy", scale: 1 },
  expressive: { label: "Expressive", vibe: "Headlines lean large", scale: 1.12 },
  statement: { label: "Statement", vibe: "Type is the design", scale: 1.28 },
};

// ── Motion presets — the site's signature movement vocabulary ───────────────
export interface MotionPreset {
  label: string;
  vibe: string;
  /** Scroll-reveal travel distance (px). */
  distance: string;
  /** Scroll-reveal duration (ms). */
  duration: string;
  /** Scroll-reveal timing function. */
  ease: string;
  /** Blur applied to pending reveals (editorial crossfade look). */
  blur: string;
  /** Scale for "scale"-direction reveals. */
  scale: string;
  /** Hero entrance keyframe params. */
  entranceDuration: string;
  entranceDistance: string;
  entranceBlur: string;
}
export const MOTION_PRESETS: Record<MotionChoice, MotionPreset> = {
  rise: {
    label: "Rise",
    vibe: "Soft lift · default",
    distance: "24px",
    duration: "600ms",
    ease: "cubic-bezier(0.22, 1, 0.36, 1)",
    blur: "0px",
    scale: "0.96",
    entranceDuration: "720ms",
    entranceDistance: "14px",
    entranceBlur: "4px",
  },
  drift: {
    label: "Drift",
    vibe: "Slow · cinematic",
    distance: "36px",
    duration: "950ms",
    ease: "cubic-bezier(0.16, 1, 0.3, 1)",
    blur: "6px",
    scale: "0.97",
    entranceDuration: "1100ms",
    entranceDistance: "22px",
    entranceBlur: "8px",
  },
  kinetic: {
    label: "Kinetic",
    vibe: "Snappy · springy",
    distance: "44px",
    duration: "520ms",
    ease: "cubic-bezier(0.34, 1.4, 0.64, 1)",
    blur: "0px",
    scale: "0.9",
    entranceDuration: "560ms",
    entranceDistance: "26px",
    entranceBlur: "0px",
  },
  editorial: {
    label: "Editorial",
    vibe: "Blur crossfade · no travel",
    distance: "0px",
    duration: "820ms",
    ease: "cubic-bezier(0.25, 1, 0.5, 1)",
    blur: "10px",
    scale: "0.99",
    entranceDuration: "900ms",
    entranceDistance: "0px",
    entranceBlur: "12px",
  },
  still: {
    label: "Still",
    vibe: "Quiet fade only",
    distance: "0px",
    duration: "380ms",
    ease: "ease-out",
    blur: "0px",
    scale: "1",
    entranceDuration: "420ms",
    entranceDistance: "0px",
    entranceBlur: "0px",
  },
};

// ── Accent presets — mirror engine globals.css THEME PRESETS exactly ────────
export interface AccentPair {
  primary: string;
  primaryStrong: string;
  secondary: string;
  secondaryStrong: string;
}
export interface PresetAccents {
  label: string;
  light: AccentPair;
  dark: AccentPair;
}

export const THEME_PRESETS: Record<string, PresetAccents> = {
  default: {
    label: "Ocean",
    light: { primary: "#1F5FE0", primaryStrong: "#1648B0", secondary: "#F08A2B", secondaryStrong: "#C66A14" },
    dark: { primary: "#4F8AF5", primaryStrong: "#80AAFF", secondary: "#FFA84A", secondaryStrong: "#FFC178" },
  },
  violet: {
    label: "Violet",
    light: { primary: "#6E48E5", primaryStrong: "#5733C4", secondary: "#D33A7A", secondaryStrong: "#B02862" },
    dark: { primary: "#A98BFF", primaryStrong: "#C4AEFF", secondary: "#FF6FA6", secondaryStrong: "#FF93BE" },
  },
  emerald: {
    label: "Emerald",
    light: { primary: "#1F9A66", primaryStrong: "#157A4F", secondary: "#E0A21F", secondaryStrong: "#B47F12" },
    dark: { primary: "#3FD699", primaryStrong: "#74E6B8", secondary: "#FFC85A", secondaryStrong: "#FFD980" },
  },
  sunset: {
    label: "Sunset",
    light: { primary: "#F0792B", primaryStrong: "#C6600F", secondary: "#D33A7A", secondaryStrong: "#B02862" },
    dark: { primary: "#FF9F57", primaryStrong: "#FFBA82", secondary: "#FF6FA6", secondaryStrong: "#FF93BE" },
  },
  rose: {
    label: "Rose",
    light: { primary: "#D33A7A", primaryStrong: "#B02862", secondary: "#F0792B", secondaryStrong: "#C6600F" },
    dark: { primary: "#FF6FA6", primaryStrong: "#FF93BE", secondary: "#FF9F57", secondaryStrong: "#FFBA82" },
  },
  slate: {
    label: "Slate",
    light: { primary: "#3D5A80", primaryStrong: "#2C4763", secondary: "#9C6B4A", secondaryStrong: "#7D543A" },
    dark: { primary: "#7FA0C8", primaryStrong: "#A6BFDD", secondary: "#C99A78", secondaryStrong: "#DDB89C" },
  },
};

// ── Neutral palettes ("paper") — light + dark per choice ────────────────────
export interface Neutrals {
  bg: string;
  surface: string;
  surface2: string;
  elevated: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  lineStrong: string;
}
export interface PaperPreset {
  label: string;
  vibe: string;
  light: Neutrals;
  dark: Neutrals;
}

/** The engine's baked-in defaults (globals.css) — the "warm" paper. */
export const NEUTRALS_LIGHT: Neutrals = {
  bg: "#FAFAF7", surface: "#F2EEE7", surface2: "#E7E1D6", elevated: "#FFFFFF",
  ink: "#15121C", ink2: "#4A4456", ink3: "#67616F",
  line: "rgba(21,18,28,0.10)", lineStrong: "rgba(21,18,28,0.18)",
};
export const NEUTRALS_DARK: Neutrals = {
  bg: "#0A0813", surface: "#14101F", surface2: "#1C1730", elevated: "#1A1428",
  ink: "#ECE7F5", ink2: "#B5AEC4", ink3: "#8E879F",
  line: "rgba(255,255,255,0.10)", lineStrong: "rgba(255,255,255,0.18)",
};

/**
 * Fixed paper presets. "tinted" is special-cased in `resolvePaper` — its
 * neutrals are derived from the site's accent so the whole page carries the
 * brand hue at low saturation.
 */
export const PAPER_PRESETS: Record<Exclude<PaperChoice, "tinted">, PaperPreset> = {
  warm: { label: "Warm", vibe: "Cream · default", light: NEUTRALS_LIGHT, dark: NEUTRALS_DARK },
  pure: {
    label: "Pure",
    vibe: "Clean white / true black",
    light: {
      bg: "#FFFFFF", surface: "#F7F7F8", surface2: "#EFEFF1", elevated: "#FFFFFF",
      ink: "#101014", ink2: "#47474F", ink3: "#696970",
      line: "rgba(16,16,20,0.08)", lineStrong: "rgba(16,16,20,0.16)",
    },
    dark: {
      bg: "#0A0A0C", surface: "#131316", surface2: "#1B1B20", elevated: "#18181C",
      ink: "#F2F2F4", ink2: "#B4B4BC", ink3: "#86868F",
      line: "rgba(255,255,255,0.09)", lineStrong: "rgba(255,255,255,0.17)",
    },
  },
  cool: {
    label: "Cool",
    vibe: "Blue-gray · technical",
    light: {
      bg: "#F7F9FC", surface: "#EDF1F7", surface2: "#E1E7F0", elevated: "#FFFFFF",
      ink: "#0F1420", ink2: "#414B60", ink3: "#5C6575",
      line: "rgba(15,20,32,0.10)", lineStrong: "rgba(15,20,32,0.18)",
    },
    dark: {
      bg: "#070B14", surface: "#0F1523", surface2: "#161E30", elevated: "#131A2A",
      ink: "#E9EEF7", ink2: "#AAB6CC", ink3: "#7E8AA0",
      line: "rgba(255,255,255,0.10)", lineStrong: "rgba(255,255,255,0.18)",
    },
  },
  sand: {
    label: "Sand",
    vibe: "Deep cream · gallery",
    light: {
      bg: "#F5EFE3", surface: "#ECE3D0", surface2: "#E0D4BC", elevated: "#FDFAF3",
      ink: "#1C160E", ink2: "#52483A", ink3: "#61584D",
      line: "rgba(28,22,14,0.11)", lineStrong: "rgba(28,22,14,0.19)",
    },
    dark: {
      bg: "#100D08", surface: "#1A1610", surface2: "#241E15", elevated: "#201A12",
      ink: "#F2EBDD", ink2: "#C2B7A3", ink3: "#928977",
      line: "rgba(255,255,255,0.10)", lineStrong: "rgba(255,255,255,0.18)",
    },
  },
  /**
   * Noir's tonal LADDER matters more than its extremes. The tone envelope on a
   * composed page (`base|muted|deep` → bg/surface/surface-2) can only read as
   * alternating bands if those three values are actually distinguishable. This
   * preset used to span #050506→#151518 in dark — a ~4% luminance band across
   * four surface tokens — so every dark noir page rendered as one flat void
   * with invisible section boundaries and card edges. Light had the same
   * problem more mildly (#F4F4F3→#DEDEDC).
   *
   * The values below keep noir's stark, near-monochrome character but give it
   * four separable steps per mode, with `elevated` sitting deliberately between
   * `surface` and `surface-2` in dark so a card lifts off a muted band instead
   * of dissolving into it. Neutrals carry a faint warm bias rather than being
   * dead grey — a pure grey reads as unconsidered next to a warm accent.
   *
   * ⚠️ WIDENING THE LADDER SPENDS INK-3'S CONTRAST BUDGET. `ink3` is the
   * quietest text token and every band tone is a legal ground for it, so its
   * real contrast is measured against the *extreme* surface — `surface2`, not
   * `bg`. Pushing `surface2` darker to make the tones separable therefore pushes
   * `ink3` below 4.5:1 unless `ink3` moves too: at the ladder above, `#6B675F`
   * measured 5.21:1 on `bg` but only 4.11:1 on `surface2` (the footer band), and
   * the dark mirror measured 4.34:1. Both are corrected below with margin
   * (≥4.6:1 on every tone). Re-check this pair whenever either moves — see the
   * `paper contrast` test in packages/schema/src/theme.test.ts.
   */
  noir: {
    label: "Noir",
    vibe: "High contrast · stark",
    light: {
      bg: "#F7F6F4", surface: "#EDEBE6", surface2: "#DFDCD4", elevated: "#FFFFFF",
      ink: "#12110F", ink2: "#48453F", ink3: "#625F57",
      line: "rgba(18,17,15,0.12)", lineStrong: "rgba(18,17,15,0.22)",
    },
    dark: {
      bg: "#0A0A0C", surface: "#141518", surface2: "#212328", elevated: "#1A1C20",
      ink: "#F4F3F0", ink2: "#B6B3AC", ink3: "#8F8B83",
      line: "rgba(255,255,255,0.11)", lineStrong: "rgba(255,255,255,0.20)",
    },
  },
};

/** Picker metadata for every paper choice, including the derived one. */
export const PAPER_LABELS: Record<PaperChoice, { label: string; vibe: string }> = {
  warm: { label: PAPER_PRESETS.warm.label, vibe: PAPER_PRESETS.warm.vibe },
  pure: { label: PAPER_PRESETS.pure.label, vibe: PAPER_PRESETS.pure.vibe },
  cool: { label: PAPER_PRESETS.cool.label, vibe: PAPER_PRESETS.cool.vibe },
  sand: { label: PAPER_PRESETS.sand.label, vibe: PAPER_PRESETS.sand.vibe },
  noir: { label: PAPER_PRESETS.noir.label, vibe: PAPER_PRESETS.noir.vibe },
  tinted: { label: "Tinted", vibe: "Neutrals carry the accent" },
};

// ── Color math (pure, no deps) ──────────────────────────────────────────────
function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
}
/** Mix a hex toward black (amount<0) or white (amount>0), amount in [-1,1]. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
/** Mix hex `a` toward hex `b` by `t` in [0,1]. */
export function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
/** Relative luminance (WCAG) of a hex color, 0..1. */
export function luminance(hex: string): number {
  const srgb = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}
/** WCAG contrast ratio between two hex colors, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)];
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
const INK_ON_ACCENT = "#15121C";
const PAPER_ON_ACCENT = "#FFFFFF";
/**
 * Readable text color to lay ON a filled accent — near-black or white,
 * whichever actually measures higher contrast against it.
 *
 * This used to switch on `luminance(hex) > 0.45`, a magic midpoint that gets
 * mid-tone accents wrong: gold #D4AF37 has luminance 0.4494, so it fell to the
 * white branch at 2.1:1 — while near-black on the same gold measures 8.8:1.
 * Comparing the two candidates directly is both simpler and always optimal, so
 * a light accent can't silently produce an unreadable primary button.
 */
export function readableOn(hex: string): string {
  return contrastRatio(INK_ON_ACCENT, hex) >= contrastRatio(PAPER_ON_ACCENT, hex)
    ? INK_ON_ACCENT
    : PAPER_ON_ACCENT;
}
/**
 * Darken/lighten `hex` toward black or white, just enough to clear `minRatio`
 * contrast against a representative surface color — so a "-strong" accent
 * variant derived from an arbitrary client-picked hue (see `resolveAccents`)
 * is contrast-safe for small text in fact, not just by convention.
 */
export function ensureContrast(hex: string, against: string, minRatio: number, toward: "black" | "white"): string {
  for (let amount = 0; amount <= 1; amount += 0.05) {
    const candidate = shade(hex, toward === "black" ? -amount : amount);
    if (contrastRatio(candidate, against) >= minRatio) return candidate;
  }
  return toward === "black" ? "#000000" : "#FFFFFF";
}

// ── The site's appearance (the canonical `Appearance` type is the zod-inferred
//    one exported from config.ts; this local shape mirrors it, deps-free) ─────
interface AppearanceShape {
  accent?: string;
  accentSecondary?: string;
  font?: FontChoice;
  paper?: PaperChoice;
  typeScale?: TypeScaleChoice;
  motion?: MotionChoice;
  radius?: RadiusChoice;
  mode?: ModeChoice;
}
export interface ThemeableConfig {
  theme?: string;
  appearance?: AppearanceShape;
}

// Worst-case surface per mode for contrast purposes — NOT the extremes
// (pure white / pure black). For a foreground darkening toward black on a
// light ground, contrast *drops* as the ground itself darkens, so the hard
// case is the darkest plausible "light" surface (a muted/surface2 band),
// not pure white; pure white is actually the easiest case. Mirrored for
// dark mode. The resolved paper itself is usually closer to the extreme
// than these floors/ceilings, which only adds margin.
const REPRESENTATIVE_SURFACE = { light: "#E0E0E0", dark: "#1E1E1E" };

/**
 * Resolve the final accent pair for a config in one mode. A custom
 * `appearance.accent` wins over the named preset; the "-strong" and dark-mode
 * variants are derived so a single picked color yields a full, contrast-safe set.
 */
export function resolveAccents(config: ThemeableConfig, mode: "light" | "dark"): AccentPair {
  const preset = THEME_PRESETS[config.theme ?? "default"] ?? THEME_PRESETS.default;
  const base = preset[mode];
  const ap = config.appearance;
  if (!ap?.accent) return base;

  // Custom primary: derive strong + dark-mode lift from the single picked hue.
  // "-strong" is nudged further toward black/white than the flat default
  // whenever the picked hue is too light/dark itself to clear 4.5:1 against a
  // representative surface — a pastel or gold accent (small AA text on it)
  // shouldn't depend on the client having picked an already-dark hue.
  const primary = mode === "light" ? ap.accent : shade(ap.accent, 0.28);
  const primaryStrong =
    mode === "light"
      ? ensureContrast(shade(ap.accent, -0.2), REPRESENTATIVE_SURFACE.light, 4.5, "black")
      : ensureContrast(shade(ap.accent, 0.5), REPRESENTATIVE_SURFACE.dark, 4.5, "white");

  const sec = ap.accentSecondary;
  const secondary = sec ? (mode === "light" ? sec : shade(sec, 0.28)) : base.secondary;
  const secondaryStrong = sec
    ? mode === "light"
      ? ensureContrast(shade(sec, -0.2), REPRESENTATIVE_SURFACE.light, 4.5, "black")
      : ensureContrast(shade(sec, 0.5), REPRESENTATIVE_SURFACE.dark, 4.5, "white")
    : base.secondaryStrong;

  return { primary, primaryStrong, secondary, secondaryStrong };
}

/**
 * Resolve the neutral palette for a config in one mode. "tinted" derives the
 * neutrals from the resolved accent so surfaces/ink carry the brand hue.
 */
export function resolvePaper(config: ThemeableConfig, mode: "light" | "dark"): Neutrals {
  const choice = config.appearance?.paper ?? "warm";
  if (choice !== "tinted") return PAPER_PRESETS[choice][mode];

  const accent = resolveAccents(config, mode).primary;
  if (mode === "light") {
    return {
      bg: mix("#FBFBFA", accent, 0.04),
      surface: mix("#F2F2F0", accent, 0.07),
      surface2: mix("#E8E8E5", accent, 0.1),
      elevated: "#FFFFFF",
      ink: mix("#131316", accent, 0.12),
      ink2: mix("#46464C", accent, 0.1),
      ink3: mix("#87878F", accent, 0.08),
      line: "rgba(20,20,24,0.10)",
      lineStrong: "rgba(20,20,24,0.18)",
    };
  }
  return {
    bg: mix("#09090B", accent, 0.09),
    surface: mix("#121215", accent, 0.11),
    surface2: mix("#1A1A1F", accent, 0.13),
    elevated: mix("#17171B", accent, 0.11),
    ink: mix("#F0F0F2", accent, 0.06),
    ink2: mix("#B2B2BA", accent, 0.08),
    ink3: mix("#7A7A84", accent, 0.08),
    line: "rgba(255,255,255,0.10)",
    lineStrong: "rgba(255,255,255,0.18)",
  };
}

export function resolveFont(config: ThemeableConfig): FontPairing {
  return FONT_PAIRINGS[config.appearance?.font ?? "jakarta"];
}
export function resolveRadius(config: ThemeableConfig) {
  return RADIUS_VALUES[config.appearance?.radius ?? "soft"];
}
export function resolveTypeScale(config: ThemeableConfig): TypeScalePreset {
  return TYPESCALE_VALUES[config.appearance?.typeScale ?? "classic"];
}
export function resolveMotion(config: ThemeableConfig): MotionPreset {
  return MOTION_PRESETS[config.appearance?.motion ?? "rise"];
}

/** Full token set for one mode — everything the preview needs to paint a site. */
export function resolveTheme(config: ThemeableConfig, mode: "light" | "dark") {
  const accents = resolveAccents(config, mode);
  const neutrals = resolvePaper(config, mode);
  const font = resolveFont(config);
  const radius = resolveRadius(config);
  const typeScale = resolveTypeScale(config);
  const motion = resolveMotion(config);
  return {
    ...accents,
    onPrimary: readableOn(accents.primary),
    onSecondary: readableOn(accents.secondary),
    ...neutrals,
    fontBody: font.body,
    fontDisplay: font.display,
    displayWeight: font.displayWeight ?? "700",
    displayTracking: font.displayTracking ?? "-0.025em",
    displayScale: typeScale.scale,
    radiusCard: radius.card,
    radiusPill: radius.pill,
    motion,
  };
}

/**
 * Produce the CSS the ENGINE injects into <head> to apply custom appearance on
 * the real deployed site. Only emitted when `appearance` overrides something,
 * so preset-only sites are untouched. Overrides the same variables globals.css
 * defines, for both light (`:root`) and dark (`.dark`) — accents, paper
 * neutrals, radius, display typography, and motion tokens.
 */
export function appearanceStyle(config: ThemeableConfig): string {
  const ap = config.appearance;
  if (!ap) return "";
  const hasAny =
    ap.accent || ap.font || ap.radius || ap.paper || ap.typeScale || ap.motion;
  if (!hasAny) return "";

  const rules: string[] = [];

  // Selectors below use `html:root` / `html:root.dark` rather than plain
  // `:root` / `.dark`. globals.css's THEME PRESETS block sets accent vars on
  // `[data-theme="X"]` / `.dark[data-theme="X"]` — the dark-mode compound
  // selector has HIGHER specificity (0,0,2,0) than a bare `.dark` (0,0,1,0),
  // so a plain `.dark{}` override here would silently lose to the preset for
  // any non-"default" theme, regardless of source order (confirmed: a
  // config with theme:"slate" + a custom appearance.accent rendered the
  // slate preset's blue in dark mode, not the custom accent). `html:root`/
  // `html:root.dark` add a type-selector, giving specificity (0,0,1,1) /
  // (0,0,2,1) — unambiguously higher, no reliance on injection order.
  // `.section-invert` (see globals.css) is a nested dark island for the
  // "dark hero, light body" look. Because it is a DESCENDANT (not `html.dark`),
  // the `html:root.dark{}` overrides below never reach it — so we also emit the
  // site's DARK palette/accent under `html:root .section-invert{}` (specificity
  // 0,0,1,1, beating globals' base `.dark, .section-invert{}` at 0,0,1,0), so a
  // dark hero band carries THIS site's noir/tinted dark neutrals + dark accent,
  // not the engine's generic warm-dark fallback.
  if (ap.accent) {
    const l = resolveAccents(config, "light");
    const d = resolveAccents(config, "dark");
    // `--color-on-accent` is the text color laid ON a filled accent surface
    // (`bg-ocean text-on-accent` — every primary button). globals.css defaults
    // it to white, which is only correct for a DARK accent; a light custom
    // accent (gold, lime, pastel) rendered white-on-light and failed WCAG AA
    // badly (gold #D4AF37 measured 2.1:1). It has to be derived per mode from
    // the resolved accent, alongside the accent itself.
    const onAccent = (a: AccentPair) => `--color-on-accent:${readableOn(a.primary)};`;
    const darkAccent =
      `--color-ocean:${d.primary};--color-ocean-strong:${d.primaryStrong};` +
      `--color-sunset:${d.secondary};--color-sunset-strong:${d.secondaryStrong};${onAccent(d)}`;
    rules.push(
      `html:root{--color-ocean:${l.primary};--color-ocean-strong:${l.primaryStrong};` +
        `--color-sunset:${l.secondary};--color-sunset-strong:${l.secondaryStrong};${onAccent(l)}}`,
      `html:root.dark{${darkAccent}}`,
      `html:root .section-invert{${darkAccent}}`,
    );
  }
  if (ap.paper) {
    const emit = (n: Neutrals) =>
      `--color-bg:${n.bg};--color-surface:${n.surface};--color-surface-2:${n.surface2};--color-elevated:${n.elevated};` +
      `--color-ink:${n.ink};--color-ink-2:${n.ink2};--color-ink-3:${n.ink3};` +
      `--color-line:${n.line};--color-line-strong:${n.lineStrong};`;
    const darkPaper = emit(resolvePaper(config, "dark"));
    rules.push(
      `html:root{${emit(resolvePaper(config, "light"))}}`,
      `html:root.dark{${darkPaper}}`,
      `html:root .section-invert{${darkPaper}}`,
    );
  }
  if (ap.radius) {
    const r = resolveRadius(config);
    rules.push(`html:root{--radius-card:${r.card};--radius-pill:${r.pill};}`);
  }
  // Display typography: per-pairing weight/tracking + sitewide scale.
  {
    const font = ap.font ? FONT_PAIRINGS[ap.font] : undefined;
    const decls: string[] = [];
    if (font?.displayWeight) decls.push(`--display-weight:${font.displayWeight}`);
    if (font?.displayTracking) decls.push(`--display-tracking:${font.displayTracking}`);
    if (ap.typeScale) decls.push(`--display-scale:${resolveTypeScale(config).scale}`);
    if (decls.length) rules.push(`html:root{${decls.join(";")};}`);
  }
  if (ap.motion) {
    const m = resolveMotion(config);
    rules.push(
      `html:root{--reveal-distance:${m.distance};--reveal-duration:${m.duration};--reveal-ease:${m.ease};` +
        `--reveal-blur:${m.blur};--reveal-scale:${m.scale};` +
        `--entrance-duration:${m.entranceDuration};--entrance-distance:${m.entranceDistance};--entrance-blur:${m.entranceBlur};}`,
    );
  }
  // Font family swap: the layout maps FontChoice → a loaded next/font variable
  // and sets --font-body / --font-display; nothing to emit here for families.
  return rules.join("\n");
}
