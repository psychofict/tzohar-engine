"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { Home, Music, BrainCircuit, Globe2, Sparkles, Mail, FileText, type LucideIcon } from "lucide-react";
import { hasModule, site, type SiteModule } from "@/config/site";
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
 * Shorten a nav label only when it cannot fit its cell.
 *
 * The rule used to be "first word", unconditionally — which rendered
 * "Public Diplomacy" as **"Public"**, a label that names the wrong thing. Taking
 * the LAST word keeps the distinctive half ("Diplomacy"), and short labels are
 * left exactly as authored.
 */
const shortLabel = (label: string) => {
  if (label.length <= 11) return label;
  const words = label.split(/[\s·—-]+/).filter(Boolean);
  return words[words.length - 1] ?? label;
};

/**
 * Composed pages carry their own literal nav label and icon, so they can join
 * the quick-bar directly. `inBar: false` keeps a page out of the top bar, and
 * the mobile bar honours the same flag — otherwise the two navigations disagree
 * about what the site's sections are.
 */
const pageItems: NavItem[] = hasModule("pages")
  ? routedPages
      .filter((p) => p.nav && p.nav.inBar !== false)
      .map((p) => ({
        href: `/${p.slug}`,
        icon: resolveIcon(p.nav!.icon) ?? FileText,
        label: shortLabel(p.nav!.label),
      }))
  : [];

/*
 * One navigation, not two — so the Home tab follows the header's.
 *
 * A site that hides Home from the header (`layout.navHide`) has decided the
 * wordmark is its home link, and spending a thumb-sized cell here to disagree
 * put a seven-item hamburger above a five-item bar whose last label was
 * truncated. A site that keeps the header tab keeps this one, unchanged.
 */
const showHome = !(site.layout?.navHide ?? []).includes("home");

const navItems: NavItem[] = [
  ...(showHome ? [{ href: "/", icon: Home, label: "Home" }] : []),
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
