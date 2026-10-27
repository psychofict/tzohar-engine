"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Lock, ArrowRight } from "lucide-react";
import Container from "@/components/ui/Container";
import { useMembership } from "@/lib/membership";

/** One tile of the blurred teaser: its shape and a tiny blur placeholder, never the photo. */
export interface GatePreview {
  w: number;
  h: number;
  blur?: string;
}

/**
 * The gallery's members-only gate (security review TZS-2, EBE-6325). It receives the number of
 * photos and, for the teaser, each tile's size and its generated blur placeholder (a few dozen
 * pixels); no photo's address or caption reaches a non-member's page.
 */
export default function GalleryGate({ previews, count }: { previews: GatePreview[]; count: number }) {
  const t = useTranslations("gallery");
  const tp = useTranslations("plans");
  const membership = useMembership();

  return (
    <Container size="xl" className="py-10 sm:py-14">
      <div className="relative overflow-hidden rounded-2xl">
        {/* Blurred preview — non-interactive, decorative */}
        <div
          aria-hidden="true"
          className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4 max-h-[60vh] overflow-hidden blur-[6px] opacity-50 select-none pointer-events-none"
        >
          {previews.map((p, i) => (
            <div key={i} className="mb-3 sm:mb-4 overflow-hidden rounded-xl bg-surface">
              {p.blur ? (
                <Image src={p.blur} alt="" width={p.w} height={p.h} className="w-full h-auto" unoptimized />
              ) : (
                <div className="w-full bg-surface-2" style={{ aspectRatio: `${p.w} / ${p.h}` }} />
              )}
            </div>
          ))}
        </div>

        {/* Gate card */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-bg via-bg/70 to-bg/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-elevated/95 p-7 text-center shadow-card backdrop-blur sm:p-9">
            <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-2">
              <Lock size={22} />
            </span>
            <h2 className="text-xl font-bold text-ink">{t("gateTitle")}</h2>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2">{t("gateDesc")}</p>
            <p className="mt-3 text-sm font-semibold text-ocean">{t("unlockCount", { count })}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/join"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-ocean px-6 text-[15px] font-semibold text-on-accent hover:bg-ocean-strong transition-colors"
              >
                {tp("status.seePlans")} <ArrowRight size={16} />
              </Link>
              {!membership.signedIn && (
                <a
                  href={membership.signInUrl}
                  className="inline-flex h-11 items-center rounded-full border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
                >
                  {tp("status.signIn")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
