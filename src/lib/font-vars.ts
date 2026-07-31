import type { FontChoice } from "@tzohar/schema";

/**
 * Font pairing → the `next/font` CSS variables the root layout loads.
 *
 * Shared between the server layout and the live-preview bridge on purpose. The
 * layout applies the chosen pairing as an INLINE style on <html>, and an inline
 * style beats any stylesheet — so a preview that only injected a <style> block
 * could change a site's colours but never its typeface. (Observed exactly that
 * way: a draft asking for Sora kept rendering Fraunces while the accent updated
 * correctly.) The bridge therefore has to write the same two properties inline,
 * which means both sides must agree on this table.
 *
 * FONT VARIABLES BELONG ON <html>, NOT <body> — globals.css builds its tokens by
 * indirection (`--font-sans: var(--font-body)`) and Tailwind emits `@theme` into
 * `:root`, and a custom property is substituted using the referenced property's
 * computed value ON THE SAME ELEMENT. Defined only on <body>, `--font-sans`
 * computes at `:root` as guaranteed-invalid and every consumer silently falls
 * back to the UA default.
 */
export const FONT_VAR_MAP: Record<FontChoice, { bodyVar: string; displayVar: string }> = {
  jakarta: { bodyVar: "--font-body", displayVar: "--font-display" },
  inter: { bodyVar: "--font-inter", displayVar: "--font-inter" },
  sora: { bodyVar: "--font-inter", displayVar: "--font-sora" },
  space: { bodyVar: "--font-inter", displayVar: "--font-space" },
  manrope: { bodyVar: "--font-manrope", displayVar: "--font-manrope" },
  playfair: { bodyVar: "--font-nunito", displayVar: "--font-playfair" },
  fraunces: { bodyVar: "--font-inter", displayVar: "--font-fraunces" },
  unbounded: { bodyVar: "--font-manrope", displayVar: "--font-unbounded" },
  syne: { bodyVar: "--font-figtree", displayVar: "--font-syne" },
  bricolage: { bodyVar: "--font-schibsted", displayVar: "--font-bricolage" },
  anton: { bodyVar: "--font-archivo", displayVar: "--font-anton" },
  instrument: { bodyVar: "--font-instrument-sans", displayVar: "--font-instrument-serif" },
  dmserif: { bodyVar: "--font-dmsans", displayVar: "--font-dmserif" },
};

/** The two inline custom properties for a pairing, or null for the default. */
export function fontVarStyle(font: FontChoice | undefined): { "--font-body": string; "--font-display": string } | null {
  if (!font || font === "jakarta") return null;
  const pair = FONT_VAR_MAP[font];
  if (!pair) return null;
  return { "--font-body": `var(${pair.bodyVar})`, "--font-display": `var(${pair.displayVar})` };
}
