"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";
type Mode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  /** True when the site pins a palette, so the UI can hide the toggle. */
  locked: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  locked: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Resolves the theme with the SAME precedence as the pre-paint inline script in
 * the root layout:
 *
 *   canToggle = appearance.toggle === true || mode === "system"
 *   canToggle → stored choice wins, else the mode's own default.
 *   otherwise → the pinned mode, full stop (a stored value can only be stale).
 *
 * where the mode's own default is: "dark" → dark, "light" → light,
 * "system" → prefers-color-scheme. So `mode: "dark"` + `toggle: true` opens dark
 * for a first-time visitor yet still shows the switch and remembers a choice.
 *
 * That agreement is the whole point. This provider used to initialise to "light"
 * and consult only localStorage + `prefers-color-scheme`, ignoring the configured
 * mode entirely. On a site configured `mode: "dark"` viewed on a light-mode OS,
 * the inline script correctly added `.dark` before paint and this component then
 * REMOVED it on mount — and wrote "light" to localStorage on the way past.
 *
 * WHY A PINNED MODE OUTRANKS localStorage. That old write happened on EVERY mount,
 * not just on a toggle, so every visitor who ever loaded the site carries a stored
 * "light" they never chose. Letting a stored value win would hand those visitors a
 * cream site permanently — and on a site that pins its mode the toggle is hidden,
 * so there is no way back. A stored preference is only meaningful where the user
 * could have expressed one; under a pinned mode it can only be stale. Reproduced
 * exactly that way: `localStorage.theme = "light"` with `mode: "dark"` rendered
 * `rgb(247,246,244)` and no control to change it.
 *
 * localStorage is written only by an explicit toggle, and only read under
 * "system", so the stale values simply stop mattering.
 */
export default function ThemeProvider({
  children,
  mode = "light",
  toggle = false,
}: {
  children: React.ReactNode;
  mode?: Mode;
  toggle?: boolean;
}) {
  // A pinned mode is only unlocked when the site opts into a toggle; "system"
  // always allows one.
  const canToggle = toggle || mode === "system";
  // Match the inline script's first guess so the initial client render agrees
  // with the DOM it hydrates into.
  const [theme, setTheme] = useState<Theme>(mode === "dark" ? "dark" : "light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = canToggle ? (localStorage.getItem("theme") as Theme | null) : null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else if (mode === "dark") {
      setTheme("dark");
    } else if (mode === "light") {
      setTheme("light");
    } else {
      // light-theme:allow a client's own appearance.mode ("system" only when the site sets it; Tzohar's default is light)
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    setMounted(true);
  }, [mode, canToggle]);

  // Apply the theme class to <html>. No persistence here — see above.
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* private mode — the choice just won't survive the session */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, locked: !canToggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
