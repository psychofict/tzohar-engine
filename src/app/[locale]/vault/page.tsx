"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Lock, ArrowRight, Music, Ticket, Camera, Download, CalendarDays,
  Sparkles, type LucideIcon,
} from "lucide-react";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";
import Reveal from "@/components/ui/Reveal";
import HeroConstellation from "@/components/HeroConstellation";
import MembershipPanel from "@/components/MembershipPanel";
import { useMembership } from "@/lib/membership";
import { vaultDrops, type DropType } from "@/data/vault";

const dropMeta: Record<DropType, { icon: LucideIcon; tint: string }> = {
  unreleased: { icon: Music, tint: "text-ocean" },
  presale: { icon: Ticket, tint: "text-sunset" },
  bts: { icon: Camera, tint: "text-violet" },
  download: { icon: Download, tint: "text-emerald" },
  event: { icon: CalendarDays, tint: "text-magenta" },
};

// Icons for the "What's inside" perks (order matches the `vault.perks` array).
const perkIcons = [Music, Ticket, Camera, CalendarDays];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Deterministic, locale-independent date label (avoids hydration drift).
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m || 1) - 1]} ${y}`;
}

export default function VaultPage() {
  const t = useTranslations("vault");
  const membership = useMembership();

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      {/* ─── Signature hero ─── */}
      <section className="relative overflow-hidden bg-ink min-h-[62svh] flex flex-col justify-end">
        <HeroConstellation className="absolute inset-0 h-full w-full" density={1.15} tone="light" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-transparent" />
        <Container size="lg" className="relative z-10 pt-32 pb-12 sm:pb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1">
            <Sparkles size={14} className="text-sunset" />
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white">
              {t("eyebrow")}
            </span>
          </div>
          <h1 className="mt-4 font-bold tracking-tight text-white leading-[1.05] text-[clamp(2.5rem,6vw,4.5rem)] drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85 leading-relaxed">
            {t("subtitle")}
          </p>
        </Container>
      </section>

      {/* ─── Membership status / gate ─── */}
      <Container size="md" className="-mt-8 relative z-20">
        <MembershipPanel state={membership} />
      </Container>

      {/* ─── What's inside (non-members) ─── */}
      {!membership.loading && !membership.member && (
        <Container size="md" className="pt-12 sm:pt-14">
          <div className="mb-6 flex items-center gap-3">
            <Eyebrow>{t("whatsInside")}</Eyebrow>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(t.raw("perks") as { title: string; desc: string }[]).map((perk, i) => {
              const Icon = perkIcons[i] ?? Sparkles;
              return (
                <div key={perk.title} className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated text-ocean">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{perk.title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{perk.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      )}

      {/* ─── Drops feed ─── */}
      <Container size="md" className="py-14 sm:py-20">
        <div className="flex items-center gap-3 mb-6">
          <Eyebrow>{t("dropsEyebrow")}</Eyebrow>
          <span className="h-px flex-1 bg-line" />
        </div>

        <ul className="flex flex-col gap-4">
          {vaultDrops.map((drop) => {
            const meta = dropMeta[drop.type];
            const Icon = meta.icon;
            const unlocked = drop.tier === "free" || membership.member;
            return (
              <Reveal as="li" key={drop.id}>
                <article
                  className={`relative overflow-hidden rounded-2xl border border-line bg-surface p-5 sm:p-6 ${
                    unlocked ? "" : "select-none"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-elevated border border-line ${meta.tint}`}>
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3">
                          {t(`type.${drop.type}`)}
                        </span>
                        <span className="text-[11px] text-ink-3">{fmtDate(drop.date)}</span>
                        {drop.tier === "insider" && (
                          <span className="rounded-full bg-sunset/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sunset">
                            {t("insiderTag")}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1.5 text-lg font-bold text-ink">{drop.title}</h3>
                      <p className={`mt-1 text-[15px] text-ink-2 leading-relaxed ${unlocked ? "" : "blur-[5px]"}`}>
                        {drop.description}
                      </p>

                      {unlocked && drop.cta && drop.href && (
                        <div className="mt-3">
                          {drop.href.startsWith("/") ? (
                            <Link
                              href={drop.href as "/tour" | "/gallery"}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-ocean-strong"
                            >
                              {drop.cta} <ArrowRight size={15} />
                            </Link>
                          ) : (
                            <a
                              href={drop.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-ocean-strong"
                            >
                              {drop.cta} <ArrowRight size={15} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface/40 backdrop-blur-[1px]">
                      <Link
                        href="/join"
                        className="inline-flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2 text-xs font-semibold text-bg hover:bg-ink transition-colors"
                      >
                        <Lock size={14} /> {t("locked")}
                      </Link>
                    </div>
                  )}
                </article>
              </Reveal>
            );
          })}
        </ul>
      </Container>
    </main>
  );
}
