"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type { galleryBlockSchema } from "@tzohar/schema";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { BlockHeaderRow } from "./LeafBlocks";
import { getBlurDataURL, getImageSize } from "@/lib/image-blur";

type GalleryBlockType = z.infer<typeof galleryBlockSchema>;
type Item = GalleryBlockType["items"][number];

const COLS: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
};

/**
 * Captioned media grid — photographs and video stills on one filterable wall,
 * opening into a viewer.
 *
 * The caption is deliberately *outside* the frame rather than laid over it on
 * hover. These are documentary photographs of named events, and the caption is
 * the part that makes the archive usable — a hover-only caption is invisible on
 * touch, unprintable, and unsearchable by anyone scanning the page.
 */
export default function GalleryBlock({ block }: { block: GalleryBlockType }) {
  const categories = block.categories ?? [];
  const [active, setActive] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (active === "all" ? block.items : block.items.filter((i) => i.category === active)),
    [active, block.items],
  );

  // Changing the filter re-indexes `visible`, so a viewer left open would jump
  // to an unrelated frame. Close it instead.
  const changeFilter = (key: string) => {
    setOpenIndex(null);
    setActive(key);
  };

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />

      {categories.length > 0 && (
        <div className="scrollbar-hide -mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ key: "all", label: "All" }, ...categories].map((c) => {
            const on = active === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => changeFilter(c.key)}
                aria-pressed={on}
                className={clsx(
                  "type-label flex-none rounded-[calc(var(--radius-card)*0.5)] border px-3.5 py-2 transition-colors",
                  on
                    ? "border-ink bg-ink text-bg"
                    : "border-line-strong text-ink-2 hover:border-ink hover:text-ink",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      <ul className={clsx("grid gap-x-5 gap-y-9", COLS[block.columns ?? 3])}>
        {visible.map((item, i) => (
          <Reveal key={`${item.src}-${i}`} direction="up" delay={Math.min(i, 6) * 50} as="li" className={clsx(item.wide && "sm:col-span-2")}>
            <GalleryTile item={item} onOpen={() => setOpenIndex(i)} priority={i < 3} />
          </Reveal>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="text-ink-3 border-line rounded-[var(--radius-card)] border border-dashed p-10 text-center text-[15px]">
          Nothing filed under this category yet.
        </p>
      )}

      <MediaViewer items={visible} index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />
    </Container>
  );
}

function GalleryTile({ item, onOpen, priority }: { item: Item; onOpen: () => void; priority?: boolean }) {
  const size = getImageSize(item.src);
  return (
    <figure className="group flex h-full flex-col">
      <button
        type="button"
        onClick={onOpen}
        className="border-line-strong bg-surface relative block w-full overflow-hidden rounded-[var(--radius-card)] border"
        style={{ aspectRatio: "4 / 3" }}
        aria-label={item.video ? `Play: ${item.caption ?? item.alt ?? "video"}` : `Enlarge: ${item.caption ?? item.alt ?? "photograph"}`}
      >
        <Image
          src={item.src}
          alt={item.alt ?? item.caption ?? ""}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          placeholder={getBlurDataURL(item.src) ? "blur" : undefined}
          blurDataURL={getBlurDataURL(item.src)}
          priority={priority}
        />
        {item.video && (
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/15"
            aria-hidden
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/92 text-neutral-900 shadow-lg">
              <Play size={22} className="ml-0.5" fill="currentColor" />
            </span>
          </span>
        )}
        {/* Intrinsic ratio is kept for the viewer, not the tile — the wall reads
            as a wall only if every frame is the same shape. */}
        <span className="sr-only">
          {size.w}×{size.h}
        </span>
      </button>
      {(item.caption || item.meta || item.credit) && (
        <figcaption className="mt-3.5">
          {item.meta && <p className="type-label text-ink-3">{item.meta}</p>}
          {item.caption && <p className="text-ink-2 mt-1.5 text-[14.5px] leading-relaxed">{item.caption}</p>}
          {item.credit && <p className="type-label text-ink-3 mt-1.5 opacity-80">{item.credit}</p>}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Viewer for both media kinds. A photo opens as a contained `next/image` at its
 * real ratio; a video item opens its file with controls. Escape / arrows / a
 * click on the backdrop all close or move, and focus is parked on the close
 * button so keyboard users are not left behind the overlay.
 */
function MediaViewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: Item[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const open = index !== null && !!items[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const step = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onIndex((index + delta + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  const current = open ? items[index!] : null;
  const size = current ? getImageSize(current.src) : null;

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption ?? current.alt ?? "Media"}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25"
          >
            <X size={22} />
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous"
                className="absolute left-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 sm:left-6"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                aria-label="Next"
                className="absolute right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/25 sm:right-6"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <motion.figure
            key={current.src}
            className="flex max-h-full max-w-full flex-col items-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {current.video ? (
              <video
                src={current.video}
                poster={current.src}
                controls
                autoPlay
                playsInline
                className="max-h-[78vh] w-auto max-w-full rounded-lg bg-black"
              />
            ) : (
              <Image
                src={current.src}
                alt={current.alt ?? current.caption ?? ""}
                width={size!.w}
                height={size!.h}
                sizes="100vw"
                className="max-h-[78vh] w-auto rounded-lg object-contain"
                priority
              />
            )}
            <figcaption className="mt-4 max-w-3xl text-center">
              {current.meta && <p className="type-label text-white/55">{current.meta}</p>}
              {current.caption && <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">{current.caption}</p>}
              {current.credit && <p className="type-label mt-2 text-white/45">{current.credit}</p>}
              <p className="type-label mt-3 text-white/35">
                {index! + 1} / {items.length}
              </p>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
