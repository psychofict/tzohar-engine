"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const HUB = (process.env.NEXT_PUBLIC_ACCOUNTS_URL || "https://accounts.ebenworks.co").replace(/\/+$/, "");

// Consent line shown at points of data collection. "privacy" → this site's own
// notice; "terms"/"refunds" → the hub's umbrella legal pages.
export default function LegalConsent({
  variant = "privacy",
  className,
}: {
  variant?: "privacy" | "paid";
  className?: string;
}) {
  const t = useTranslations("legal");

  const privacy = (chunks: ReactNode) => (
    <Link href="/privacy" className="underline hover:text-ink">{chunks}</Link>
  );
  const terms = (chunks: ReactNode) => (
    <a href={`${HUB}/terms`} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">{chunks}</a>
  );
  const refunds = (chunks: ReactNode) => (
    <a href={`${HUB}/refunds`} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">{chunks}</a>
  );

  return (
    <p className={className ?? "text-xs leading-relaxed text-ink-3"}>
      {variant === "paid"
        ? t.rich("consentPaid", { terms, refunds, privacy })
        : t.rich("consentPrivacy", { privacy })}
    </p>
  );
}
