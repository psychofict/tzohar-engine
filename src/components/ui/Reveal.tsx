"use client";

import { ReactNode, useEffect, useRef, useState, ElementType, HTMLAttributes } from "react";
import clsx from "clsx";

type Direction = "up" | "down" | "left" | "right" | "scale" | "fade" | "wipe";

type Props = {
  as?: ElementType;
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  /** Override in ms. Omit to use the site's motion preset (--reveal-duration). */
  duration?: number;
  rootMargin?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "children">;

/**
 * SSR-safe replacement for framer-motion's whileInView + initial=hidden pattern.
 *
 * Robustness model:
 * - Server renders with `data-reveal="pending"`. Without JS, CSS leaves content visible.
 * - The inline script in <head> sets `.js-on` on <html> synchronously, before paint.
 * - With `.js-on`, CSS hides any `[data-reveal="pending"]` element until this component
 *   flips it to `data-reveal="visible"` via IntersectionObserver.
 * - Under `prefers-reduced-motion`, content stays visible (CSS gate) and we skip the observer.
 * - Above-fold elements detected at mount (already on screen) skip the hide-then-show cycle.
 */
export default function Reveal({
  as: Tag = "div",
  children,
  direction = "up",
  delay = 0,
  duration,
  rootMargin = "0px 0px -8% 0px",
  className,
  ...rest
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setRevealed(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      data-reveal={revealed ? "visible" : "pending"}
      data-reveal-direction={direction}
      style={{
        ...(duration !== undefined ? { transitionDuration: `${duration}ms` } : {}),
        ...(delay ? { transitionDelay: `${delay}ms` } : {}),
      }}
      className={clsx("reveal", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
