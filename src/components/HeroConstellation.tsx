"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";

/**
 * Signature interactive backdrop: a drifting constellation that links up near
 * the pointer and echoes the brand's star mark (a few nodes are drawn as
 * 4-point stars). Self-contained and defensive:
 *  - pointer-events: none, so it never blocks the hero's buttons
 *  - DPR capped at 2; particle count scales with area then caps
 *  - pauses its RAF loop when the tab is hidden or the hero scrolls out of view
 *  - prefers-reduced-motion → one static frame, no loop, no pointer tracking
 *  - reads --color-ink / --color-ocean so it tracks light/dark automatically
 */
type Props = {
  className?: string;
  /** Higher = more nodes. ~1 node per (18000 / density) px². */
  density?: number;
  /** "auto" tracks the theme (--color-ink); "light" forces white nodes for use
   *  over an always-dark surface (e.g. the Vault hero) regardless of theme. */
  tone?: "auto" | "light";
};

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  star: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v.slice(0, 6) || "808080", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function HeroConstellation({ className, density = 1, tone = "auto" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let particles: P[] = [];
    let raf = 0;
    let running = false;

    // Pointer target (in CSS px, canvas-local). Off-screen until first move.
    const pointer = { x: -9999, y: -9999, active: false };

    let ink: [number, number, number] = [21, 18, 28];
    let accent: [number, number, number] = [31, 95, 224];
    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      ink = tone === "light" ? [255, 255, 255] : hexToRgb(cs.getPropertyValue("--color-ink") || "#15121C");
      accent = hexToRgb(cs.getPropertyValue("--color-ocean") || "#1F5FE0");
    };
    readColors();

    const LINK = 132; // px: max distance for a constellation line
    const seedField = () => {
      const target = Math.min(90, Math.round(((w * h) / 18000) * density));
      particles = Array.from({ length: target }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.4 + 0.7,
        star: i % 11 === 0, // ~1 in 11 nodes is a star mark
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedField();
    };

    const drawStar = (x: number, y: number, r: number, a: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (Math.PI / 4) * i - Math.PI / 2;
        const rad = i % 2 === 0 ? r * 2.4 : r * 0.9;
        const px = x + Math.cos(ang) * rad;
        const py = y + Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${a})`;
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      const [r, g, b] = ink;

      for (const p of particles) {
        // Drift + gentle gravitation toward the pointer when it's near.
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 26000 && d2 > 1) {
            const f = 0.4 / Math.sqrt(d2);
            p.vx += dx * f * 0.012;
            p.vy += dy * f * 0.012;
          }
        }
        p.x += p.vx;
        p.y += p.vy;
        // Friction keeps the gravitation from running away.
        p.vx *= 0.99;
        p.vy *= 0.99;
        // Wrap at edges.
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;
      }

      // Links between nearby nodes.
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const bp = particles[j];
          const dx = a.x - bp.x;
          const dy = a.y - bp.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.14 * (1 - dist / LINK)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(bp.x, bp.y);
            ctx.stroke();
          }
        }
        // Brighter links from the pointer to nearby nodes.
        if (pointer.active) {
          const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (pd < LINK * 1.4) {
            ctx.strokeStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${0.5 * (1 - pd / (LINK * 1.4))})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Nodes on top.
      for (const p of particles) {
        if (p.star) {
          drawStar(p.x, p.y, p.r, 0.85);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
          ctx.fill();
        }
      }
    };

    const loop = () => {
      render();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Pointer (window-level so the canvas can stay pointer-events:none).
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointer.active = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      pointer.x = x;
      pointer.y = y;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    // Subtle scroll parallax: drift up + fade as the hero leaves.
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
      canvas.style.transform = `translateY(${progress * -40}px)`;
      canvas.style.opacity = String(1 - progress * 0.85);
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    if (reduced) {
      render(); // single static frame
    } else {
      start();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    // Pause the loop entirely when the hero is off-screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);

    // Re-read theme colors when the <html> class/attributes change.
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, tone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={clsx("pointer-events-none select-none", className)}
    />
  );
}
