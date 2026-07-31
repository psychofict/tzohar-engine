import { ReactNode } from "react";
import clsx from "clsx";
import Eyebrow from "./Eyebrow";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
  accent?: "ocean" | "sunset" | "ink";
};

export default function SectionHeader({ eyebrow, title, description, align = "center", className, accent = "ocean" }: Props) {
  return (
    <header
      className={clsx(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {/* `accent` still picks this header's *hue* vocabulary for callers that
          set it, but the eyebrow itself is apparatus and renders in the
          structural label voice regardless — see Eyebrow's note on why small
          accent-colored labels were removed sitewide. */}
      {eyebrow && <Eyebrow tone={accent === "ink" ? "ink" : "label"}>{eyebrow}</Eyebrow>}
      <h2 className="type-display text-ink text-balance leading-tight text-[calc(clamp(1.625rem,3vw,2.5rem)*var(--display-scale))] max-w-3xl">
        {title}
      </h2>
      {description && (
        <p className={clsx(
          "text-ink-2 text-pretty max-w-2xl text-base sm:text-[17px] leading-relaxed",
          align === "center" && "mx-auto",
        )}>
          {description}
        </p>
      )}
    </header>
  );
}
