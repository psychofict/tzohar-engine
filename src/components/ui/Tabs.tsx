"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";

export interface TabItem {
  key: string;
  label: string;
}

/**
 * Seeds a tab's active key from the URL hash once on mount (client-only, so it
 * can't seed useState directly without a hydration mismatch — same pattern as
 * the original hand-rolled tabs on the contact page), and keeps the hash in
 * sync on every change via `history.replaceState` (no extra navigation entry).
 */
export function useHashTab<T extends string>(keys: readonly T[], initial: T): [T, (k: T) => void] {
  const [active, setActive] = useState<T>(initial);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if ((keys as readonly string[]).includes(hash)) setActive(hash as T);
  }, [keys]);

  const setTab = (k: T) => {
    setActive(k);
    window.history.replaceState(null, "", `#${k}`);
  };
  return [active, setTab];
}

/**
 * Generic tabbed content switcher — pill buttons on sm+, a native <select> on
 * mobile, AnimatePresence panel crossfade. Extracted from the real tab
 * implementation on the contact page (the gallery page's `role="tablist"` is
 * a filter-chip UI over one shared grid, not real per-tab panels — this is
 * the genuine pattern). `activeKey`/`onChange` are controlled — pass
 * `useHashTab`'s tuple to get URL-hash sync, or a plain `useState` for a tab
 * group that shouldn't touch the URL.
 */
export default function Tabs({
  items,
  activeKey,
  onChange,
  children,
  className,
}: {
  items: readonly TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  /** Render prop — receives the active key, returns that panel's content. */
  children: (activeKey: string) => ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-6 md:mb-8">
        {/* Mobile: native select */}
        <select
          className="sm:hidden w-full px-4 py-3 rounded-card bg-surface border border-line text-ink text-sm font-medium focus-visible:outline-2 focus-visible:outline-ocean"
          value={activeKey}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Select section"
        >
          {items.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Desktop: pill tabs */}
        <div role="tablist" className="hidden sm:flex overflow-x-auto scrollbar-hide gap-2">
          {items.map((item) => {
            const active = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                id={`tab-${item.key}`}
                aria-selected={active}
                aria-controls={`panel-${item.key}`}
                onClick={() => onChange(item.key)}
                className={clsx(
                  "px-5 py-2 rounded-pill text-sm font-semibold whitespace-nowrap transition-colors",
                  active ? "bg-ocean text-on-accent shadow-card" : "bg-surface text-ink-2 hover:text-ink hover:bg-surface-2",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeKey}
          id={`panel-${activeKey}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeKey}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {children(activeKey)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
