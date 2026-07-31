import { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  value: ReactNode;
  label: ReactNode;
  icon?: ReactNode;
  accent?: "ocean" | "sunset" | "ink";
  className?: string;
};

const accentRing: Record<string, string> = {
  ocean: "before:bg-ocean/20",
  sunset: "before:bg-sunset/20",
  ink: "before:bg-ink/10",
};

export default function Stat({ value, label, icon, accent = "ocean", className }: Props) {
  return (
    <div
      className={clsx(
        "relative flex flex-col items-center text-center isolate",
        className,
      )}
    >
      {icon && (
        <div className={clsx(
          "relative mb-2 sm:mb-3 inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl",
          "before:absolute before:inset-0 before:rounded-xl before:opacity-100",
          accentRing[accent],
        )}>
          <span className="relative z-10 text-ink">{icon}</span>
        </div>
      )}
      <p className="type-display text-xl sm:text-2xl md:text-3xl lg:text-5xl text-ink leading-none">
        {value}
      </p>
      <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-medium uppercase tracking-[0.1em] sm:tracking-[0.14em] md:tracking-[0.18em] text-ink-3 leading-tight text-balance">
        {label}
      </p>
    </div>
  );
}
