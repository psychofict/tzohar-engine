"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * One switch for every Framer Motion animation on the site: with
 * `reducedMotion="user"` a visitor whose system asks for less motion keeps
 * the opacity changes and loses the movement (translate, scale, rotate), so a
 * menu, tab, lightbox or reveal still appears and nothing travels.
 * Without it Framer ignores the preference (EBE-12569, motion standard of 15 Nov 2026).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
