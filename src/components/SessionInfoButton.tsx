"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SessionInfoButton — the header auth control. Provider-agnostic: it reads state
// from useMembership() and builds the sign-in link from signInUrl(), so it works
// for both the hub and the client-owned Stripe provider (see src/lib/membership).
//
//   Signed out / loading / error → "Sign in" CTA (fail to least-privilege UI).
//   Signed in                    → name + "account" link (→ /account).
// ─────────────────────────────────────────────────────────────────────────────

import { type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useMembership, signInUrl } from "@/lib/membership";

export interface SessionInfoButtonProps {
  /** Layout variant: compact pill for the desktop bar, full-width for the mobile drawer. */
  variant?: "desktop" | "mobile";
  /** Called after a navigation click (e.g. to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
}

export default function SessionInfoButton({
  variant = "desktop",
  onNavigate,
  className,
}: SessionInfoButtonProps) {
  const t = useTranslations("nav");
  const { loading, signedIn, name, email, signInUrl: safeSignInUrl } = useMembership();
  const isMobile = variant === "mobile";

  // Compute the sign-in URL at click time (window is reliable then) — an inline
  // SSR href can bake to the wrong origin and miss hydration correction.
  const onSignIn = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate?.();
    window.location.href = signInUrl();
  };

  // Before state resolves, OR signed-out / error → signed-out CTA.
  if (loading || !signedIn) {
    if (isMobile) {
      return (
        <a
          href={safeSignInUrl}
          onClick={onSignIn}
          className={["block py-4 text-xl font-semibold text-ink", className].filter(Boolean).join(" ")}
        >
          {t("signIn")}
        </a>
      );
    }
    return (
      <a
        href={safeSignInUrl}
        onClick={onSignIn}
        className={[
          "hidden sm:inline-flex h-9 items-center rounded-full border border-line px-4 text-[13px] font-semibold text-ink hover:bg-surface transition-colors",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {t("signIn")}
      </a>
    );
  }

  const label = name ?? email ?? t("account");

  if (isMobile) {
    return (
      <Link
        href="/account"
        onClick={onNavigate}
        className={["block py-4 text-xl font-semibold text-ink", className].filter(Boolean).join(" ")}
      >
        {label}
        <span className="block text-sm font-normal text-ink-3 mt-0.5">{t("account")}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/account"
      title={t("account")}
      className={[
        "hidden sm:inline-flex h-9 items-center gap-2 rounded-full border border-line pl-1 pr-3 text-[13px] font-semibold text-ink hover:bg-surface transition-colors",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-ink-2 text-[12px] uppercase">
        {(name ?? email ?? "?").trim().charAt(0) || "?"}
      </span>
      <span className="max-w-[120px] truncate">{label}</span>
    </Link>
  );
}
