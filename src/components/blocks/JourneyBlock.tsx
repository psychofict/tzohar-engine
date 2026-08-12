"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { z } from "zod";
import type { journeyBlockSchema } from "@tzohar/schema";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { BlockHeaderRow } from "./LeafBlocks";
import { getBlurDataURL } from "@/lib/image-blur";

type JourneyBlockType = z.infer<typeof journeyBlockSchema>;
type Stop = JourneyBlockType["stops"][number];

/**
 * Bounds-fitted equirectangular projection.
 *
 * Projecting onto the WHOLE globe was the original mistake: five stops spanning
 * Philadelphia to Seoul occupied a horizontal band about a third of the frame and
 * a vertical one about a sixth, so the diagram was mostly empty ocean-coloured
 * nothing and the pins clustered into an ambiguous row. Fitting the projection to
 * the stops' own bounding box (plus padding) spends the whole frame on the part of
 * the world the journey actually touches.
 *
 * This is a route DIAGRAM, not cartography — there is no coastline, and the
 * caption says so. Real relative geography plus labelled nodes is what makes it
 * legible; a fake landmass would only make it wrong.
 */
type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

/*
 * The diagram's SVG viewBox is sized to the FIGURE'S ASPECT, not forced to a
 * square with `preserveAspectRatio="none"`.
 *
 * A 100×100 viewBox stretched into a 2.35:1 box scales x ~2.35× more than y.
 * Under that non-uniform transform, `vectorEffect="non-scaling-stroke"` plus
 * framer-motion's `pathLength` (which it implements as a normalised
 * `strokeDasharray`) computed dash lengths in a space that no longer matched the
 * rendered geometry, and every route drew as a few disconnected stray strokes.
 * It also horizontally stretched the coordinate labels. Matching the viewBox to
 * the aspect keeps the transform uniform, so strokes, dashes and text all behave.
 */
const VB_H = 100;
const DIAGRAM_AR = 2.35;
const vbW = (ar: number) => VB_H * ar;

function boundsOf(stops: readonly { lat: number; lng: number }[]): Bounds {
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  // Pad generously so no pin sits on an edge and labels have room.
  const padLat = 18;
  const padLng = 26;
  return {
    minLat: Math.max(-85, Math.min(...lats) - padLat),
    maxLat: Math.min(85, Math.max(...lats) + padLat),
    minLng: Math.max(-180, Math.min(...lngs) - padLng),
    maxLng: Math.min(180, Math.max(...lngs) + padLng),
  };
}

/** → percentage coordinates inside the fitted frame. */
function projectIn(b: Bounds, lat: number, lng: number): [number, number] {
  const x = ((lng - b.minLng) / (b.maxLng - b.minLng)) * 100;
  const y = ((b.maxLat - lat) / (b.maxLat - b.minLat)) * 100;
  return [x, y];
}

/**
 * Interactive journey — the stops of an academic/professional path, connected in
 * chronological order, each one openable.
 *
 * Two map surfaces, chosen by whether the content supplies artwork:
 *
 * - With `mapImage`, the client's own designed map is the surface and markers
 *   are placed against it by percentage (`x`/`y`). Illustrative maps restyle and
 *   rescale their continents, so projecting real coordinates onto one drops the
 *   pins in the ocean — hence the separate coordinate space.
 * - Without it, the stops are projected from lat/lng over a graticule. No
 *   mapping library either way: this repo forks per client, and a tile key or a
 *   React-18-capped dependency is an operational cost per fork.
 *
 * The connectors animate in once on scroll, which is the "animated travel paths"
 * the brief asks for; `future` stops draw hollow so a planned move is not
 * presented as somewhere already been.
 */
export default function JourneyBlock({ block }: { block: JourneyBlockType }) {
  const stops = block.stops;
  const [activeKey, setActiveKey] = useState(stops[0]?.key);
  const active = stops.find((s) => s.key === activeKey) ?? stops[0];

  // Supplied artwork keeps its own 3:2 crop; the generated diagram is wider.
  const ar = block.mapImage ? 1.5 : DIAGRAM_AR;

  // Percentage coordinates when the artwork is in play, projected ones otherwise.
  const bounds = boundsOf(stops);
  const placed = stops.map((s) => {
    if (block.mapImage && s.x !== undefined && s.y !== undefined) return { stop: s, x: s.x, y: s.y };
    const [x, y] = projectIn(bounds, s.lat, s.lng);
    return { stop: s, x, y };
  });

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />

      {/*
        Map full width, controls and detail beneath it — not map-beside-detail.
        Side by side, the diagram was squeezed into a ~470px column while the
        detail card (facts plus a portrait photograph) ran three times its
        height, so the row left a screen's worth of empty paper under the map.
        Full width also gives the projection enough room for the pin labels,
        which is what makes the geography legible at all.
      */}
      <div className="space-y-8">
        <Reveal direction="up">
          {/*
            `section-invert bg-surface`, NOT `bg-ink`.

            This plate is a permanently dark island: the graticule, the travel
            paths, the pin labels and the caption are all literal
            `rgba(255,255,255,…)`, so it only works over a dark ground. `bg-ink`
            expressed that as "the ink colour", which is near-black in light mode
            but near-WHITE in dark mode — so on this dark site the map inverted to
            a cream slab with white labels on it and the whole journey map, the
            headline feature of the biography page, became unreadable.
            `.section-invert` pins the site's dark palette here regardless of the
            root theme, which is what "always dark" actually means.
          */}
          <figure className="border-line-strong section-invert bg-surface overflow-hidden rounded-[var(--radius-card)] border">
            <div className="relative" style={{ aspectRatio: `${ar} / 1` }}>
              {block.mapImage ? (
                <Image
                  src={block.mapImage}
                  alt={block.mapImageAlt ?? "Journey map"}
                  fill
                  sizes="(max-width: 1280px) 92vw, 1152px"
                  className="object-cover"
                  placeholder={getBlurDataURL(block.mapImage) ? "blur" : undefined}
                  blurDataURL={getBlurDataURL(block.mapImage)}
                />
              ) : (
                <Graticule bounds={bounds} ar={ar} />
              )}

              {/* Connectors sit above the surface but below the buttons. */}
              <svg
                viewBox={`0 0 ${vbW(ar)} ${VB_H}`}
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden
              >
                {placed.slice(1).map((p, i) => {
                  const prev = placed[i];
                  // Percent → viewBox units.
                  const ax = (prev.x / 100) * vbW(ar);
                  const ay = (prev.y / 100) * VB_H;
                  const bx = (p.x / 100) * vbW(ar);
                  const by = (p.y / 100) * VB_H;
                  // Arc height scales with the leg's span, so a short hop and a
                  // hemisphere-crossing flight don't get the same curve.
                  const span = Math.hypot(bx - ax, by - ay);
                  /*
                   * Clamped to >= 4. An unclamped control point put the peak of
                   * the long trans-continental legs above the top edge, so the
                   * arcs were cropped and read as unrelated stray strokes rather
                   * than as a route.
                   */
                  const midY = Math.max(4, Math.min(ay, by) - Math.max(5, span * 0.16));
                  return (
                    <motion.path
                      key={p.stop.key}
                      d={`M ${ax} ${ay} Q ${(ax + bx) / 2} ${midY} ${bx} ${by}`}
                      fill="none"
                      stroke="var(--color-ocean)"
                      /* In viewBox units, which are ~4.8× smaller than CSS pixels
                         at the rendered width — 1.1 here read as a 5px cable. */
                      strokeWidth={0.36}
                      strokeLinecap="round"
                      /*
                       * NO `strokeDasharray` here. framer-motion implements
                       * `pathLength` by driving `strokeDasharray` and
                       * `strokeDashoffset` itself, so setting a dash pattern as well
                       * means both are writing the same attribute — which rendered
                       * each route as a handful of disconnected stray strokes rather
                       * than a line being drawn. A solid stroke that draws on is the
                       * effect that was wanted anyway.
                       */
                      /*
                       * `animate`, not `whileInView`. The route is the point of the
                       * figure, and with whileInView a viewport that already had the
                       * map on screen at mount (or any environment where the observer
                       * doesn't fire) left every path at pathLength 0 — an empty box.
                       * Animating on mount always resolves to the drawn state.
                       */
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.8 }}
                      transition={{ duration: 1, delay: 0.2 + i * 0.22, ease: "easeInOut" }}
                    />
                  );
                })}
              </svg>

              {placed.map(({ stop, x, y }, i) => {
                const on = stop.key === active?.key;
                // Flip the label inboard near an edge so it can't be clipped.
                const labelSide = x > 72 ? "right" : "left";
                return (
                  <button
                    key={stop.key}
                    type="button"
                    onClick={() => setActiveKey(stop.key)}
                    aria-pressed={on}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-offset-4"
                  >
                    <span className="sr-only">
                      {i + 1}. {stop.label}
                      {stop.future ? " (planned)" : ""}
                    </span>
                    <span
                      aria-hidden
                      className={clsx(
                        "block rounded-full transition-all duration-200",
                        on ? "h-4 w-4" : "h-3 w-3 group-hover:h-4 group-hover:w-4",
                      )}
                      style={
                        stop.future
                          ? { border: "2px solid var(--color-sunset)", background: "transparent" }
                          : { background: "var(--color-ocean)", boxShadow: "0 0 0 2px rgba(255,255,255,0.9)" }
                      }
                    />
                    {on && (
                      <motion.span
                        aria-hidden
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
                        style={{ borderColor: "var(--color-ocean)", width: 34, height: 34 }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 0.55, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    {/* Labels ON the diagram — without them the pins are five
                        anonymous dots and the geography carries no information. */}
                    <span
                      aria-hidden
                      className={clsx(
                        "type-label absolute top-1/2 -translate-y-1/2 whitespace-nowrap transition-colors",
                        labelSide === "left" ? "left-[calc(100%+10px)]" : "right-[calc(100%+10px)]",
                        on ? "text-white" : "text-white/60 group-hover:text-white/90",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")} {stop.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Say what the figure is. Without a coastline it would otherwise be
                read as a map that had failed to load rather than as a diagram. */}
            <figcaption className="type-label border-t border-white/10 px-5 py-3.5 text-white/50">
              {block.mapImageAlt ??
                `Route diagram — ${stops.length} stops, plotted by coordinate and connected in chronological order`}
            </figcaption>
          </figure>
        </Reveal>

        {/* Chronological rail + detail. On narrow viewports the rail is the
            primary control, since precise taps on a map marker are unreliable. */}
        <Reveal direction="up" delay={100}>
          <div>
            <ol className="mb-6 flex flex-wrap gap-2">
              {stops.map((s, i) => {
                const on = s.key === active?.key;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onClick={() => setActiveKey(s.key)}
                      aria-pressed={on}
                      className={clsx(
                        "type-label rounded-[calc(var(--radius-card)*0.5)] border px-3 py-2 transition-colors",
                        on ? "border-ink bg-ink text-bg" : "border-line-strong text-ink-2 hover:border-ink hover:text-ink",
                      )}
                    >
                      {/*
                        The number has to follow the pill it sits in. `text-ink-3`
                        is a mid grey chosen against the PAGE; on the active pill
                        the ground is `bg-ink`, which is near-white in dark mode,
                        so the prefix measured 2.27:1 there — under the 4.5:1 that
                        12px text needs. On the active pill it is the pill's own
                        ink, held back with opacity instead of a fixed grey.
                      */}
                      <span className={clsx("mr-2 tabular-nums", on ? "text-bg/65" : "text-ink-3")}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ol>

            {active && <StopDetail stop={active} />}
          </div>
        </Reveal>
      </div>
    </Container>
  );
}

function StopDetail({ stop }: { stop: Stop }) {
  return (
    <article
      className={clsx(
        "border-line-strong bg-elevated grid gap-6 rounded-[var(--radius-card)] border p-6 sm:p-7",
        // Photo beside the facts, not stacked under them: a portrait-orientation
        // photograph in a full-width card runs taller than everything it
        // illustrates and pushes the next section off the screen.
        stop.image && "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-8",
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            {stop.period && <p className="type-label text-ink-3">{stop.period}</p>}
            <h3 className="type-display text-ink mt-2 text-[1.45rem] leading-tight">{stop.label}</h3>
          </div>
          {stop.future && (
            <span className="type-label border-sunset text-sunset-strong flex-none rounded-[calc(var(--radius-card)*0.5)] border px-2.5 py-1.5">
              Planned
            </span>
          )}
        </div>

        {(stop.institution || stop.program) && (
          <dl className="border-line mt-5 space-y-3 border-t pt-5">
            {stop.institution && (
              <div>
                <dt className="type-label text-ink-3">Institution</dt>
                <dd className="type-record text-ink mt-1">{stop.institution}</dd>
              </div>
            )}
            {stop.program && (
              <div>
                <dt className="type-label text-ink-3">Programme</dt>
                <dd className="type-record text-ink mt-1">{stop.program}</dd>
              </div>
            )}
          </dl>
        )}

        {stop.achievements && stop.achievements.length > 0 && (
          <ul className="border-line mt-5 space-y-2.5 border-t pt-5">
            {stop.achievements.map((a) => (
              <li key={a} className="text-ink-2 flex gap-3 text-[14.5px] leading-relaxed">
                <span className="bg-ocean mt-2 h-1.5 w-1.5 flex-none rounded-full" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>

      {stop.image && (
        <div
          className="border-line relative overflow-hidden rounded-[calc(var(--radius-card)*0.7)] border"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={stop.image}
            alt={stop.imageAlt ?? stop.label}
            fill
            sizes="(max-width: 768px) 92vw, 32vw"
            className="object-cover"
            placeholder={getBlurDataURL(stop.image) ? "blur" : undefined}
            blurDataURL={getBlurDataURL(stop.image)}
          />
        </div>
      )}
    </article>
  );
}

/**
 * Diagram ground: a graticule drawn on the SAME fitted bounds as the pins, so
 * every 30° line lands where the projection says it should and the equator is
 * where the equator is. Labelled, because an unlabelled grid is decoration
 * whereas a labelled one tells you the diagram is geographic.
 */
function Graticule({ bounds, ar }: { bounds: Bounds; ar: number }) {
  const W = vbW(ar);
  const step = 30;
  const meridians: number[] = [];
  for (let lng = Math.ceil(bounds.minLng / step) * step; lng <= bounds.maxLng; lng += step) meridians.push(lng);
  const parallels: number[] = [];
  for (let lat = Math.ceil(bounds.minLat / step) * step; lat <= bounds.maxLat; lat += step) parallels.push(lat);

  const fmtLng = (v: number) => (v === 0 ? "0°" : `${Math.abs(v)}°${v > 0 ? "E" : "W"}`);
  const fmtLat = (v: number) => (v === 0 ? "EQ" : `${Math.abs(v)}°${v > 0 ? "N" : "S"}`);

  return (
    <svg viewBox={`0 0 ${W} ${VB_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <pattern id="jb-dots" width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <circle cx="0.4" cy="0.4" r="0.32" fill="rgba(255,255,255,0.14)" />
        </pattern>
        <radialGradient id="jb-glow" cx="62%" cy="30%" r="62%">
          <stop offset="0%" stopColor="var(--color-ocean)" stopOpacity="0.20" />
          <stop offset="100%" stopColor="var(--color-ocean)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={VB_H} fill="url(#jb-dots)" />
      <rect width={W} height={VB_H} fill="url(#jb-glow)" />
      {meridians.map((lng) => {
        const x = (projectIn(bounds, 0, lng)[0] / 100) * W;
        return (
          <g key={`m${lng}`}>
            <line x1={x} y1={0} x2={x} y2={VB_H} stroke="rgba(255,255,255,0.08)" strokeWidth={0.4} />
            <text x={x + 1.4} y={97.2} fill="rgba(255,255,255,0.32)" style={{ fontSize: 3, fontFamily: "var(--font-mono)" }}>
              {fmtLng(lng)}
            </text>
          </g>
        );
      })}
      {parallels.map((lat) => {
        const [, y] = projectIn(bounds, lat, 0);
        return (
          <g key={`p${lat}`}>
            <line
              x1={0}
              y1={y}
              x2={W}
              y2={y}
              stroke={lat === 0 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)"}
              strokeWidth={lat === 0 ? 0.5 : 0.4}
              strokeDasharray={lat === 0 ? undefined : "2 3"}
            />
            <text x={1.6} y={y - 1.4} fill="rgba(255,255,255,0.32)" style={{ fontSize: 3, fontFamily: "var(--font-mono)" }}>
              {fmtLat(lat)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
