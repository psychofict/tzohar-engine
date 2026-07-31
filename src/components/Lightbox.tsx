"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import { site } from "@/config/site";

export interface LightboxItem {
  src: string;
  alt: string;
  w: number;
  h: number;
}

type Props = {
  items: LightboxItem[];
  index: number | null;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  closeLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
  downloadLabel?: string;
  shareLabel?: string;
};

export default function Lightbox({
  items,
  index,
  onIndexChange,
  onClose,
  closeLabel = "Close",
  prevLabel = "Previous",
  nextLabel = "Next",
  downloadLabel = "Download",
  shareLabel = "Share",
}: Props) {
  const open = index !== null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Body scroll lock + focus management while open.
  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  // Keyboard navigation.
  useEffect(() => {
    if (!open || index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndexChange((index + 1) % items.length);
      else if (e.key === "ArrowLeft") onIndexChange((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, index, items.length, onClose, onIndexChange]);

  const current = index !== null ? items[index] : null;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!current || typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${site.name} — ${current.alt}`, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled or unsupported */
    }
  };

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={closeLabel}
            className="absolute top-4 right-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <X size={22} />
          </button>

          {/* Download + share */}
          <div className="absolute top-4 left-4 z-10 flex gap-2">
            <a
              href={current.src}
              download
              onClick={(e) => e.stopPropagation()}
              aria-label={downloadLabel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Download size={20} />
            </a>
            <button
              onClick={handleShare}
              aria-label={shareLabel}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Share2 size={19} />
            </button>
          </div>

          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange((index! - 1 + items.length) % items.length);
                }}
                aria-label={prevLabel}
                className="absolute left-3 sm:left-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange((index! + 1) % items.length);
                }}
                aria-label={nextLabel}
                className="absolute right-3 sm:right-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <motion.figure
            key={current.src}
            className="relative max-w-full max-h-full flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.src}
              alt={current.alt}
              width={current.w}
              height={current.h}
              className="max-h-[82vh] w-auto h-auto object-contain rounded-lg"
              sizes="100vw"
              priority
            />
            <figcaption className="mt-3 text-center text-sm text-white/80">
              {current.alt}
              <span className="ml-2 text-white/40">
                {index! + 1} / {items.length}
              </span>
            </figcaption>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
