"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { StoreStatus } from "@/lib/crm/store";

const NAV = [
  {
    head: "Content",
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/posts", label: "Posts" },
      { href: "/admin/pages", label: "Pages" },
      { href: "/admin/media", label: "Media" },
    ],
  },
  {
    head: "Site",
    items: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/help", label: "How this works" },
    ],
  },
];

export default function AdminShell({
  children,
  store,
  siteName,
}: {
  children: React.ReactNode;
  store: StoreStatus;
  siteName: string;
}) {
  const pathname = usePathname();
  const isCurrent = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="crm-shell">
      <aside className="crm-side">
        <Link href="/admin" className="crm-brand" style={{ textDecoration: "none" }}>
          <span className="crm-brand-mark" aria-hidden>
            {siteName.trim().charAt(0).toUpperCase() || "T"}
          </span>
          {siteName} CRM
        </Link>

        <nav className="crm-nav" aria-label="CRM sections">
          {NAV.map((group) => (
            <div key={group.head} className="crm-nav-group">
              <p className="crm-nav-head crm-label">{group.head}</p>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isCurrent(item.href, item.exact) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ marginTop: "auto", display: "grid", gap: 10 }}>
          {/*
            Where a save actually goes, stated in the chrome. The two drivers
            behave very differently — one edits the working tree instantly, the
            other commits and waits on a rebuild — and an operator who cannot see
            which is active will read a normal one-minute deploy as a lost edit.
          */}
          <div className="crm-store" title={store.problem ?? undefined}>
            <span
              className={`crm-dot ${store.problem ? "crm-dot--bad" : `crm-dot--${store.driver}`}`}
              aria-hidden
            />
            <span style={{ minWidth: 0 }}>
              <span className="crm-label" style={{ display: "block" }}>
                {store.problem ? "Publishing" : store.driver === "github" ? "Publishes to" : "Local dev"}
              </span>
              <span className="crm-mono" style={{ fontSize: 11.5, wordBreak: "break-all" }}>
                {store.target}
              </span>
            </span>
          </div>
          <a className="crm-btn crm-btn--sm" href="/" target="_blank" rel="noreferrer">
            View site ↗
          </a>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="crm-btn crm-btn--sm" style={{ width: "100%" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="crm-main">{children}</main>
    </div>
  );
}
