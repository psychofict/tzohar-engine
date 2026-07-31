"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type { videoBlockSchema } from "@tzohar/schema";
import { Play } from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { BlockHeaderRow, BlockButtons } from "./LeafBlocks";
import { getBlurDataURL } from "@/lib/image-blur";

type VideoBlockType = z.infer<typeof videoBlockSchema>;

/**
 * One featured film.
 *
 * Click-to-load, not autoplay: the `<video>` element is only mounted after the
 * poster is clicked, so an unwatched video costs exactly one JPEG rather than
 * its file — the institute film here is 19MB, which is the entire rest of the
 * page several times over. That also keeps the block honest on mobile data and
 * sidesteps browsers' autoplay policies instead of fighting them.
 */
export default function VideoBlock({ block }: { block: VideoBlockType }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const portrait = block.orientation === "portrait";

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div className={clsx("grid items-start gap-8", block.body && "lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12")}>
        <Reveal direction="up">
          <figure>
            <div
              className={clsx(
                "border-line-strong relative overflow-hidden rounded-[var(--radius-card)] border bg-black",
                portrait ? "mx-auto max-w-sm" : "w-full",
              )}
              style={{ aspectRatio: portrait ? "2 / 3" : "16 / 9" }}
            >
              {playing ? (
                <video
                  ref={videoRef}
                  src={block.src}
                  poster={block.poster}
                  controls
                  autoPlay
                  playsInline
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group absolute inset-0 h-full w-full"
                  aria-label={`Play video${block.caption ? `: ${block.caption}` : ""}`}
                >
                  {block.poster && (
                    <Image
                      src={block.poster}
                      alt=""
                      fill
                      sizes={portrait ? "(max-width: 640px) 92vw, 24rem" : "(max-width: 1024px) 92vw, 58vw"}
                      className="object-cover"
                      placeholder={getBlurDataURL(block.poster) ? "blur" : undefined}
                      blurDataURL={getBlurDataURL(block.poster)}
                    />
                  )}
                  <span
                    className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/12"
                    aria-hidden
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/92 text-neutral-900 shadow-xl transition-transform duration-300 group-hover:scale-105">
                      <Play size={26} className="ml-1" fill="currentColor" />
                    </span>
                  </span>
                </button>
              )}
            </div>
            {(block.caption || block.credit) && (
              <figcaption className="mt-4">
                {block.caption && <p className="text-ink-2 text-[14.5px] leading-relaxed">{block.caption}</p>}
                {block.credit && <p className="type-label text-ink-3 mt-2">{block.credit}</p>}
              </figcaption>
            )}
          </figure>
        </Reveal>

        {block.body && (
          <Reveal direction="up" delay={100}>
            <div>
              <p className="text-ink-2 measure text-[15.5px] leading-[1.75]">{block.body}</p>
              <BlockButtons buttons={block.buttons} className="mt-7" />
            </div>
          </Reveal>
        )}
      </div>
    </Container>
  );
}
