"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { Globe, ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeNames, localeCodes, type Locale } from "@/i18n/config";

// Only the locales this site actually enables (`routing.locales`, gated by
// `site.locales.enabled`) — never the engine's full supported set.
const locales = routing.locales as readonly Locale[];

export default function LanguageSwitcher({ scrolled = false }: { scrolled?: boolean }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function onLocaleChange(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
    setOpen(false);
  }

  // A single-locale site has nothing to switch between.
  if (locales.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 pl-2.5 pr-2 rounded-full border border-line text-ink-2 hover:text-ink hover:bg-surface transition-colors"
      >
        <Globe size={15} aria-hidden="true" />
        <span className="text-[12px] font-semibold tracking-wider">{localeCodes[locale]}</span>
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-2 min-w-[150px] rounded-xl bg-elevated/95 backdrop-blur-xl py-1.5 shadow-lg border border-line z-50 list-none"
        >
          {locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === locale}>
              <button
                onClick={() => onLocaleChange(loc)}
                className={`block w-full text-left px-3 py-2 text-sm transition-colors rounded-lg mx-1 ${
                  loc === locale
                    ? "text-ocean font-semibold bg-surface"
                    : "text-ink hover:bg-surface"
                }`}
              >
                {localeNames[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MobileLanguageSwitcher({ onSelect }: { onSelect?: () => void }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function onLocaleChange(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
    onSelect?.();
  }

  if (locales.length <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap" role="group" aria-label="Select language">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => onLocaleChange(loc)}
          aria-pressed={loc === locale}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean ${
            loc === locale
              ? "bg-ocean text-on-accent"
              : "bg-surface text-ink-2 hover:bg-ocean/10"
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
