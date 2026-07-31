import { ReactNode } from "react";
import clsx from "clsx";

type Variant = "default" | "muted" | "deep" | "feature";

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  id?: string;
  ariaLabel?: string;
};

/**
 * Page section with consistent vertical rhythm.
 * - default: page bg
 * - muted: surface color (1-step warmer than bg)
 * - deep: surface-2 (2-step warmer; replaces "section-dark")
 * - feature: gradient surface for callouts/CTAs
 */
const variantClasses: Record<Variant, string> = {
  default: "bg-bg",
  muted: "bg-surface",
  deep: "bg-surface-2",
  feature: "bg-gradient-to-br from-surface via-surface-2 to-surface",
};

export default function Section({ children, variant = "default", className, id, ariaLabel }: Props) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={clsx(
        "relative scroll-mt-20 py-14 sm:py-20 lg:py-28",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </section>
  );
}
