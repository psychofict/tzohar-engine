"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { Home, Music, BrainCircuit, Globe2, Sparkles, Mail, FileText, type LucideIcon } from "lucide-react";
import { hasModule, type SiteModule } from "@/config/site";
import { routedPages } from "@/data/pages";
import { resolveIcon } from "@/lib/icons";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  module?: SiteModule;
}

// Mobile quick-bar: core links + enabled pillars. Everything else lives in the
// hamburger drawer. Filtered by the site's enabled modules.
const moduleItems: NavItem[] = [
  { href: "/music", icon: Music, label: "Music", module: "music" },
  { href: "/ai", icon: BrainCircuit, label: "AI", module: "ai" },
  { href: "/macro-influencer", icon: Globe2, label: "Influence", module: "influencer" },
  { href: "/join", icon: Sparkles, label: "Members", module: "membership" },
];

/**
 * Composed pages carry their own literal nav label and icon, so they can join
 * the quick-bar directly. Without them a site built entirely from composed
 * pages — the usual shape for a bespoke build — got a bottom bar holding just
 * Home and Contact while every actual section was reachable only through the
 * hamburger.
 *
 * Labels are shortened to the first word: the bar allots each item roughly a
 * fifth of a 390px viewport, and "Public Diplomacy" does not fit in 78px.
 */
const pageItems: NavItem[] = hasModule("pages")
  ? routedPages
      .filter((p) => p.nav)
      .map((p) => ({
        href: `/${p.slug}`,
        icon: resolveIcon(p.nav!.icon) ?? FileText,
        label: p.nav!.label.split(/[\s·—-]+/)[0],
      }))
  : [];

// Five is the most that stays tappable at 390px; Home and Contact are fixed
// anchors, so the middle is what gets truncated when a site has many sections.
const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Home" },
  ...moduleItems.filter((i) => !i.module || hasModule(i.module)),
  ...pageItems,
]
  .slice(0, 4)
  .concat([{ href: "/contact", icon: Mail, label: "Contact" }]);

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-bg/92 backdrop-blur-xl border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid h-16" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href as "/"}
                aria-current={active ? "page" : undefined}
                className={`flex-1 inline-flex flex-col items-center justify-center gap-1 px-1 transition-colors ${
                  active ? "text-ink" : "text-ink-3 hover:text-ink"
                }`}
              >
                {/* The active marker is the gold tick above the icon, not a
                    recolored icon: a mid-tone accent at 20px against paper is
                    weaker than ink, so accent-as-active actually made the
                    selected item the *least* prominent one in the bar. */}
                <span
                  aria-hidden
                  className={`h-0.5 w-5 ${active ? "bg-ocean" : "bg-transparent"}`}
                />
                <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
                {/*
                  Sentence-case sans, not the mono label voice. A tab bar is a
                  control the thumb aims at, not apparatus annotating content —
                  and uppercase mono with letter-spacing made "BIOGRAPHY" wider
                  than its ~78px cell at 390px, so adjacent labels collided.
                */}
                <span className="w-full truncate px-0.5 text-center text-[10px] font-semibold">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
