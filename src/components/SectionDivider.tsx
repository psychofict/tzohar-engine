"use client";

import { useTheme } from "./ThemeProvider";

interface SectionDividerProps {
  variant?: "wave" | "gradient" | "diagonal";
  direction?: "light-to-dark" | "dark-to-light" | "light-to-tint" | "tint-to-light" | "tint-to-dark" | "dark-to-tint" | "soft-to-dark" | "dark-to-soft" | "light-to-soft" | "soft-to-light";
  className?: string;
}

const lightColors = {
  light: "#ffffff",
  dark: "#E8F1FA",
  tint: "#EAF4FC",
  soft: "#F8FBFF",
};

const darkColors = {
  light: "#0a0a14",
  dark: "#1A1A2E",
  tint: "#141424",
  soft: "#0f0f1c",
};

function resolveColors(direction: string, isDark: boolean) {
  const colors = isDark ? darkColors : lightColors;
  const parts = direction.split("-to-");
  const fromKey = parts[0] as keyof typeof lightColors;
  const toKey = parts[1] as keyof typeof lightColors;
  return {
    from: colors[fromKey] || colors.light,
    to: colors[toKey] || colors.dark,
  };
}

export default function SectionDivider({
  variant = "wave",
  direction = "light-to-dark",
  className = "",
}: SectionDividerProps) {
  const { theme } = useTheme();
  const { from, to } = resolveColors(direction, theme === "dark");

  if (variant === "wave") {
    return (
      <div className={`relative w-full overflow-hidden leading-[0] ${className}`} aria-hidden="true">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[40px] sm:h-[60px]"
        >
          <path
            d="M0,0 C300,100 900,0 1200,80 L1200,120 L0,120 Z"
            fill={to}
          />
        </svg>
        <div className="absolute inset-0" style={{ background: from }} />
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[40px] sm:h-[60px] -mt-[40px] sm:-mt-[60px]"
          style={{ zIndex: 1 }}
        >
          <path
            d="M0,0 C300,100 900,0 1200,80 L1200,120 L0,120 Z"
            fill={to}
          />
        </svg>
      </div>
    );
  }

  if (variant === "gradient") {
    return (
      <div
        className={`w-full h-16 sm:h-24 ${className}`}
        style={{
          background: `linear-gradient(to bottom, ${from}, ${to})`,
        }}
        aria-hidden="true"
      />
    );
  }

  // diagonal
  return (
    <div
      className={`relative w-full h-20 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ background: to }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: from,
          clipPath: "polygon(0 0, 100% 0, 100% 0%, 0 100%)",
        }}
      />
    </div>
  );
}
