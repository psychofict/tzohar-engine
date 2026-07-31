"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import clsx from "clsx";

export interface TimelineItem {
  key: string;
  title: string;
  /** e.g. a company/institution name, optionally linked via `subtitleUrl`. */
  subtitle?: string;
  subtitleUrl?: string;
  period?: string;
  place?: string;
  /** A sensitive/personal aside shown alongside the milestone. */
  note?: string;
  photo?: string;
  bullets?: readonly string[];
  current?: boolean;
}

interface TimelineProps {
  items: readonly TimelineItem[];
  /** "vertical" (career/experience style, one column, line on the left) or
   *  "horizontal" (education-journey style, numbered chain with arrows). */
  orientation?: "vertical" | "horizontal";
  /** Show a step number in each dot/badge. */
  numbered?: boolean;
  className?: string;
}

/**
 * Generalizes the real array-driven timeline on the `ai` module's Work
 * Experience section (connecting line + dot + card, one row per
 * `aiProfile.experience` entry) into a reusable primitive: step numbering,
 * an optional `note` aside, and a horizontal chain-of-milestones variant
 * (for education/journey-style timelines with a photo per step).
 */
export default function Timeline({ items, orientation = "vertical", numbered = false, className }: TimelineProps) {
  return orientation === "horizontal" ? (
    <HorizontalTimeline items={items} numbered={numbered} className={className} />
  ) : (
    <VerticalTimeline items={items} numbered={numbered} className={className} />
  );
}

function VerticalTimeline({ items, numbered, className }: Omit<TimelineProps, "orientation">) {
  return (
    <div className={clsx("relative", className)}>
      <div className="absolute left-5 sm:left-7 top-2 bottom-2 w-0.5 bg-gradient-to-b from-ocean via-ocean/40 to-transparent hidden sm:block" />
      <div className="space-y-8">
        {items.map((item, i) => (
          <motion.div
            key={item.key}
            className="relative flex gap-5 sm:gap-8"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            <div className="hidden sm:flex flex-col items-center flex-shrink-0">
              <div
                className={clsx(
                  "flex items-center justify-center rounded-full border-4 z-10 text-[10px] font-bold",
                  numbered ? "w-7 h-7" : "w-3.5 h-3.5",
                  i === 0 ? "bg-ocean border-surface text-on-accent" : "bg-bg border-ocean/30 text-ink-3",
                )}
              >
                {numbered ? i + 1 : null}
              </div>
            </div>

            <div
              className={clsx(
                "flex-1 rounded-card border bg-bg shadow-card p-5 sm:p-6 transition-all hover:shadow-card-hover",
                i === 0 ? "border-ocean/30" : "border-line",
              )}
            >
              <div className="flex items-start gap-4">
                {item.photo && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-card bg-surface overflow-hidden relative hidden sm:block">
                    <Image src={item.photo} alt={item.title} fill className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-0.5">
                    <h3 className="text-base sm:text-lg font-semibold text-ink">{item.title}</h3>
                    {item.current && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald/10 text-emerald px-2 py-0.5 rounded-pill">
                        Current
                      </span>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-sm text-ocean font-medium">
                      {item.subtitleUrl ? (
                        <a href={item.subtitleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                          {item.subtitle}
                          <ArrowRight size={12} className="-rotate-45" aria-hidden="true" />
                        </a>
                      ) : (
                        item.subtitle
                      )}
                    </p>
                  )}
                  {(item.period || item.place) && (
                    <p className="text-xs text-ink-3 mt-1 mb-3">
                      {[item.period, item.place].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {item.note && <p className="text-sm text-ink-2 italic mb-3">{item.note}</p>}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="space-y-1.5">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="text-sm text-ink-2 flex gap-2">
                          <span className="text-ocean mt-0.5 flex-shrink-0">&#8226;</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function HorizontalTimeline({ items, numbered, className }: Omit<TimelineProps, "orientation">) {
  return (
    <div className={clsx("overflow-x-auto scrollbar-hide", className)}>
      <div className="flex items-stretch gap-1 min-w-max sm:min-w-0 sm:flex-wrap sm:gap-x-2 sm:gap-y-8">
        {items.map((item, i) => (
          <motion.div
            key={item.key}
            className="flex items-start"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <div className="w-40 sm:w-44 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ocean text-on-accent text-xs font-bold">
                  {numbered ? i + 1 : ""}
                </span>
                <h3 className="text-sm font-semibold text-ink leading-tight">{item.title}</h3>
              </div>
              {item.place && <p className="text-xs text-ink-3">{item.place}</p>}
              {item.period && <p className="text-xs text-ink-3">{item.period}</p>}
              {item.note && <p className="text-xs text-ink-2 italic mt-1">{item.note}</p>}
              {item.photo && (
                <div className="relative mt-3 aspect-square rounded-card overflow-hidden bg-surface">
                  <Image src={item.photo} alt={item.title} fill className="object-cover grayscale" />
                </div>
              )}
            </div>
            {i < items.length - 1 && (
              <ChevronRight size={18} className="text-ink-3 flex-shrink-0 mt-1.5 mx-1" aria-hidden="true" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
