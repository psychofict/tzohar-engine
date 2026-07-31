"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { JourneyStop } from "@tzohar/schema";

const VIEW_W = 1000;
const VIEW_H = 500;

/** Simple equirectangular projection — good enough for a handful of labeled
 *  pins on a stylized world backdrop; not meant for precise cartography. */
function project(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * VIEW_W;
  const y = ((90 - lat) / 180) * VIEW_H;
  return [x, y];
}

/**
 * Interactive journey map — hand-rolled SVG (no mapbox/leaflet/react-simple-maps
 * dependency: those need an API key or cap at React 18, an operational burden
 * for a product that forks into many client repos). A dotted backdrop, pins
 * projected from lat/lng, and animated dashed arcs connecting them in the
 * order given. Click a pin to see that stop's detail below the map.
 */
export default function JourneyMap({ stops }: { stops: readonly JourneyStop[] }) {
  const [activeKey, setActiveKey] = useState(stops[0]?.key);
  const active = stops.find((s) => s.key === activeKey);
  const points = stops.map((s) => ({ ...s, xy: project(s.lat, s.lng) }));

  return (
    <div className="rounded-card overflow-hidden border border-line bg-ink">
      <div className="relative aspect-[2/1]">
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <pattern id="jm-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(255,255,255,0.16)" />
            </pattern>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#jm-dots)" />

          {points.slice(1).map((p, i) => {
            const prev = points[i];
            const [x1, y1] = prev.xy;
            const [x2, y2] = p.xy;
            const midY = Math.min(y1, y2) - 70;
            const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY} ${x2} ${y2}`;
            return (
              <motion.path
                key={p.key}
                d={d}
                fill="none"
                stroke="var(--color-ocean)"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: i * 0.2, ease: "easeInOut" }}
              />
            );
          })}

          {points.map((p) => {
            const on = activeKey === p.key;
            return (
              <g key={p.key} transform={`translate(${p.xy[0]}, ${p.xy[1]})`}>
                {on && <circle r={13} fill="none" stroke="var(--color-ocean)" strokeWidth={1} opacity={0.5} />}
                <circle
                  r={on ? 7 : 5}
                  fill={p.future ? "var(--color-sunset)" : "var(--color-ocean)"}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>

        {points.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setActiveKey(p.key)}
            style={{ left: `${(p.xy[0] / VIEW_W) * 100}%`, top: `${(p.xy[1] / VIEW_H) * 100}%` }}
            className="absolute -translate-x-1/2 translate-y-2.5 text-[11px] font-semibold text-white/90 whitespace-nowrap hover:text-white transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {active && (
        <div className="p-6 bg-elevated">
          {active.period && <p className="text-xs uppercase tracking-wide text-ocean font-semibold">{active.period}</p>}
          <h3 className="text-xl font-bold text-ink mt-1">
            {active.label}
            {active.future && <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-sunset align-middle">Future</span>}
          </h3>
          {(active.institution || active.program) && (
            <p className="text-sm text-ink-2 mt-1">{[active.institution, active.program].filter(Boolean).join(" · ")}</p>
          )}
          {active.achievements && active.achievements.length > 0 && (
            <ul className="mt-3 space-y-1">
              {active.achievements.map((a) => (
                <li key={a} className="text-sm text-ink-2 flex gap-2">
                  <span className="text-ocean mt-0.5">&#8226;</span>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
