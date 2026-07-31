import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  /**
   * `label` (default) is the structural voice — mono, ink-3, no accent. Use it
   * for the eyebrow above a heading, which is apparatus, not signal.
   * `accent` is the exception: a label that IS the signal (one highlighted
   * band, a live state). Reach for it rarely.
   */
  tone?: "label" | "accent" | "ink";
  className?: string;
};

/*
 * Eyebrows used to render in the site accent at 11–12px. That is the single
 * biggest reason a gold-accented page reads as decorated rather than designed:
 * a mid-tone accent at label size is too light to carry text contrast against
 * paper (gold #D4AF37 on #F7F6F4 measures ~1.9:1, which is why this had to be
 * routed through the derived `-strong` variant just to be legible) and too
 * saturated to recede — so every section shouted in gold and none of it meant
 * anything. The accent now appears as a *rule* beside the label
 * (`.accent-rule`) or as a filled mark, never as small text. See `.type-label`
 * in globals.css for why these are mono.
 */
const toneClass = {
  label: "text-ink-3",
  accent: "text-ocean-strong",
  ink: "text-ink-2",
};

export default function Eyebrow({ children, tone = "label", className }: Props) {
  return <span className={clsx("type-label inline-block", toneClass[tone], className)}>{children}</span>;
}
