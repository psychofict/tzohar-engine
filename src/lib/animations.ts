import type { Variants, Transition, Easing } from "framer-motion";
import { resolveMotion } from "@tzohar/schema";
import { site } from "@/config/site";

/**
 * Framer-motion variants derived from the site's `appearance.motion` preset
 * (@tzohar/schema theme.ts) so every page's reveals — not just the CSS-driven
 * <Reveal> on the home page — carry the site's signature motion. `site` is a
 * static config resolved once at module load, so these stay static objects.
 */
const preset = resolveMotion(site);
const distance = parseFloat(preset.distance) || 0;
const duration = (parseFloat(preset.duration) || 600) / 1000;
const blur = preset.blur === "0px" ? undefined : preset.blur;
const scale = parseFloat(preset.scale) || 0.96;
const ease = cubicBezierFromCss(preset.ease);

function cubicBezierFromCss(css: string): Easing {
  const m = css.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return [0.25, 0.46, 0.45, 0.94];
  const [x1, y1, x2, y2] = m[1].split(",").map((n) => parseFloat(n.trim()));
  return [x1, y1, x2, y2];
}

const transition: Transition = { duration, ease };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: distance, filter: blur ? `blur(${blur})` : undefined },
  visible: { opacity: 1, y: 0, filter: blur ? "blur(0px)" : undefined, transition },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -distance, filter: blur ? `blur(${blur})` : undefined },
  visible: { opacity: 1, y: 0, filter: blur ? "blur(0px)" : undefined, transition },
};

export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -distance, filter: blur ? `blur(${blur})` : undefined },
  visible: { opacity: 1, x: 0, filter: blur ? "blur(0px)" : undefined, transition },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: distance, filter: blur ? `blur(${blur})` : undefined },
  visible: { opacity: 1, x: 0, filter: blur ? "blur(0px)" : undefined, transition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale, filter: blur ? `blur(${blur})` : undefined },
  visible: { opacity: 1, scale: 1, filter: blur ? "blur(0px)" : undefined, transition },
};

export const countUp: Variants = {
  hidden: { opacity: 0, y: distance * 0.83, filter: blur ? `blur(${blur})` : undefined },
  visible: {
    opacity: 1,
    y: 0,
    filter: blur ? "blur(0px)" : undefined,
    transition: { ...transition, duration: duration * 0.83 },
  },
};

export function stagger(delay = 0.15): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: delay,
      },
    },
  };
}

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};
