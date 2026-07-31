"use client";

import { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "ghost-inverse" | "outline" | "outline-inverse";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ocean text-on-accent hover:bg-ocean-strong shadow-sm hover:shadow-md",
  secondary:
    "bg-ink text-bg hover:bg-ink-2",
  ghost:
    "bg-transparent text-ink hover:bg-surface",
  "ghost-inverse":
    "bg-transparent text-white/85 hover:text-white hover:bg-white/10",
  outline:
    "bg-transparent text-ink border border-line-strong hover:bg-surface",
  "outline-inverse":
    "bg-white/10 backdrop-blur-md text-white border border-white/35 hover:bg-white/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 rounded-full",
  md: "h-11 px-6 text-[15px] gap-2 rounded-full",
  lg: "h-13 px-7 py-3.5 text-base gap-2 rounded-full",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center font-semibold transition-colors transition-shadow duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2";

type ButtonProps = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;
type AnchorProps = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export function Button({ variant = "primary", size = "md", className, children, fullWidth, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", className, children, fullWidth, ...rest }: AnchorProps) {
  return (
    <a
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </a>
  );
}
