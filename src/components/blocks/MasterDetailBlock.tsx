"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type { masterDetailBlockSchema } from "@tzohar/schema";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import { ButtonLink } from "@/components/ui/Button";
import { resolveIcon } from "@/lib/icons";
import { BlockHeaderRow } from "./LeafBlocks";

/**
 * Master–detail: a ruled index column driving a detail panel.
 *
 * The block-system generalization of the "featured engagements" pattern;
 * self-contained data, unlike the engagements module's `MasterDetailList` which
 * renders case-study entries.
 *
 * Redesigned as a register to match the rest of the page system. Previously the
 * index was a rounded card containing rows with accent-tinted roundels and an
 * accent chevron per row, and the detail's three steps repeated the same
 * roundel treatment — six gold circles on screen at once, and a short list
 * boxed on the left of a tall panel left a large empty well beneath it. Now the
 * index is hairline-ruled with a gold tick marking only the active row (the one
 * place a selected state genuinely is the signal), and the columns are balanced
 * so the list can breathe alongside the panel.
 */
export default function MasterDetailBlock({ block }: { block: z.infer<typeof masterDetailBlockSchema> }) {
  const [active, setActive] = useState(0);
  const item = block.items[active];
  if (!item) return null;

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div className="grid items-start gap-x-14 gap-y-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        {/* index */}
        <div className="lg:sticky lg:top-24">
          {block.kicker && (
            <div className="mb-5 flex items-center gap-3.5">
              <Eyebrow>{block.kicker}</Eyebrow>
              <span className="bg-line h-px flex-1" aria-hidden />
            </div>
          )}
          <ul className="border-line border-t">
            {block.items.map((it, i) => {
              const Icon = resolveIcon(it.icon);
              const isActive = i === active;
              return (
                <li key={i} className="border-line border-b">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-pressed={isActive}
                    className={clsx(
                      "group flex w-full items-start gap-4 py-4 pl-4 pr-2 text-left transition-colors",
                      // The active marker is a filled gold rule on the leading
                      // edge — readable at a glance without tinting the row.
                      isActive ? "bg-surface-2/60" : "hover:bg-surface-2/30",
                    )}
                    style={
                      isActive
                        ? { boxShadow: "inset 2px 0 0 0 var(--color-ocean)" }
                        : { boxShadow: "inset 2px 0 0 0 transparent" }
                    }
                  >
                    {it.thumb ? (
                      <Image
                        src={it.thumb}
                        alt=""
                        width={220}
                        height={172}
                        sizes="88px"
                        className="border-line mt-0.5 aspect-4/3 w-[5.5rem] flex-none rounded-[calc(var(--radius-card)*0.5)] border object-cover"
                      />
                    ) : (
                      <span className="type-label text-ink-3 mt-1 w-[2.25rem] flex-none tabular-nums" aria-hidden>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={clsx(
                          "block text-[14.5px] font-semibold leading-snug",
                          isActive ? "text-ink" : "text-ink-2 group-hover:text-ink",
                        )}
                      >
                        {it.title}
                      </span>
                      {it.meta?.map((m, mi) => (
                        <span key={mi} className="type-record text-ink-3 mt-1 block text-[12px]">
                          {m}
                        </span>
                      ))}
                    </span>
                    {Icon && <Icon size={14} strokeWidth={1.6} className="text-ink-3 mt-1 flex-none" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          {block.viewAllLabel && block.viewAllHref && (
            <ButtonLink href={block.viewAllHref} variant="outline" fullWidth className="mt-6">
              {block.viewAllLabel}
              <ArrowRight size={16} aria-hidden />
            </ButtonLink>
          )}
        </div>

        {/* detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            {item.detail.eyebrow && (
              <div className="mb-5 flex items-center gap-3.5">
                <span className="accent-rule" aria-hidden />
                <Eyebrow>{item.detail.eyebrow}</Eyebrow>
                <span className="bg-line h-px flex-1" aria-hidden />
              </div>
            )}
            <h3 className="type-display text-ink text-balance leading-[1.16] text-[calc(clamp(1.375rem,2.4vw,1.875rem)*var(--display-scale))]">
              {item.title}
            </h3>
            {item.meta && item.meta.length > 0 && (
              <p className="type-record text-ink-3 mt-3 flex flex-wrap gap-x-6 gap-y-1">
                {item.meta.map((m, mi) => (
                  <span key={mi}>{m}</span>
                ))}
              </p>
            )}
            {item.detail.media && (
              <figure className="mt-7">
                <div className="relative overflow-hidden rounded-[var(--radius-card)]">
                  {/* Content image for the selected item — falls back to the
                      item title rather than an empty alt (the list thumb IS
                      decorative: its row already announces the same title). */}
                  <Image
                    src={item.detail.media}
                    alt={item.detail.mediaAlt ?? item.title}
                    width={720}
                    height={420}
                    sizes="(max-width: 1024px) 92vw, 56vw"
                    className="border-line aspect-12/7 w-full rounded-[var(--radius-card)] border object-cover"
                  />
                  {item.detail.videoUrl && (
                    <a
                      href={item.detail.videoUrl}
                      aria-label="Play video"
                      className="bg-ocean text-on-accent absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full transition-transform hover:scale-105"
                    >
                      <Play size={18} aria-hidden />
                    </a>
                  )}
                </div>
                {item.detail.mediaCaption && (
                  <figcaption className="type-record text-ink-3 mt-3">{item.detail.mediaCaption}</figcaption>
                )}
              </figure>
            )}
            {/*
              The three steps are an ordered account (what it was → how it ran →
              what came of it), so the ordinal is real information and stays. It
              is set in the mono index voice against a hairline rail instead of
              being repeated twice per row — once in a gold circle and again in
              the heading, as it was before.
            */}
            <ol className="border-line mt-9 space-y-7 border-l pl-6">
              {item.detail.rows.map((row, ri) => (
                <li key={ri} className="relative">
                  <span className="bg-line-strong absolute -left-6 top-2.5 h-px w-3.5" aria-hidden />
                  <p className="type-label text-ink-3 tabular-nums">{String(ri + 1).padStart(2, "0")}</p>
                  <p className="text-ink mt-1.5 text-[15px] font-semibold">{row.title}</p>
                  <p className="text-ink-2 measure mt-2 text-[14.5px] leading-[1.68]">{row.body}</p>
                </li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </Container>
  );
}
