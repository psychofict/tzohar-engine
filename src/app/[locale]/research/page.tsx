"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink, Check, Quote, Download, Loader2 } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import Tabs, { useHashTab, type TabItem } from "@/components/ui/Tabs";
import { ButtonLink } from "@/components/ui/Button";
import { resolveIcon } from "@/lib/icons";
import { toBibtex } from "@tzohar/schema";
import { Tex, texToPlain } from "@/lib/tex";
import { orcidId, researchInterests, manualPublications, cvUrl, portfolioUrl, type Publication } from "@/data/research";

const TAB_KEYS = ["interests", "publications", "credentials"] as const;
type TabKey = (typeof TAB_KEYS)[number];

export default function ResearchPage() {
  const t = useTranslations("research");
  const [activeTab, setActiveTab] = useHashTab<TabKey>(TAB_KEYS, "interests");

  const items: TabItem[] = [
    { key: "interests", label: t("tabInterests") },
    { key: "publications", label: t("tabPublications") },
    { key: "credentials", label: t("tabCredentials") },
  ];

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} align="left" />

      <Container size="lg" className="py-10 sm:py-14">
        <Tabs items={items} activeKey={activeTab} onChange={(k) => setActiveTab(k as TabKey)}>
          {(key) => {
            if (key === "interests") return <InterestsPanel />;
            if (key === "publications") return <PublicationsPanel />;
            return <CredentialsPanel />;
          }}
        </Tabs>
      </Container>
    </main>
  );
}

function InterestsPanel() {
  const t = useTranslations("research");
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean mb-3">{t("interestsEyebrow")}</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-8">{t("interestsTitle")}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {researchInterests.map((interest) => {
          const Icon = resolveIcon(interest.icon);
          return (
            <div key={interest.label} className="flex items-center gap-3 rounded-card border border-line bg-elevated p-5 shadow-card">
              {Icon && (
                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill bg-ocean/10 text-ocean">
                  <Icon size={18} />
                </span>
              )}
              <span className="font-semibold text-ink">{interest.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PublicationsPanel() {
  const t = useTranslations("research");
  const [works, setWorks] = useState<Publication[]>(manualPublications);
  const [loading, setLoading] = useState(!!orcidId);

  useEffect(() => {
    if (!orcidId) return;
    fetch(`/api/orcid-publications?id=${orcidId}`)
      .then((r) => (r.ok ? r.json() : { works: [] }))
      .then((body: { works?: Publication[] }) => {
        if (body.works?.length) setWorks([...body.works, ...manualPublications]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean mb-1">
            {orcidId ? t("publicationsPoweredByOrcid") : t("publicationsEyebrow")}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">{t("publicationsTitle")}</h2>
        </div>
        {orcidId && (
          <a
            href={`https://orcid.org/${orcidId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-ocean hover:text-ocean-strong transition-colors whitespace-nowrap"
          >
            {t("viewFullListOrcid")} <ExternalLink size={14} />
          </a>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink-3" />
        </div>
      ) : works.length === 0 ? (
        <p className="text-ink-3 text-sm">{t("noPublications")}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                <th className="px-4 py-3">{t("colTitle")}</th>
                <th className="px-4 py-3 hidden sm:table-cell">{t("colJournal")}</th>
                <th className="px-4 py-3 hidden md:table-cell">{t("colType")}</th>
                <th className="px-4 py-3">{t("colPublished")}</th>
                <th className="px-4 py-3">{t("colDoi")}</th>
                {/* Literal, not a message key: "BibTeX" is a format name, and a NEW
                    key would throw for every client whose messages file predates it. */}
                <th className="px-4 py-3 hidden lg:table-cell">BibTeX</th>
              </tr>
            </thead>
            <tbody>
              {works.map((w, i) => (
                <tr key={`${w.title}-${i}`} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink"><Tex>{w.title}</Tex></td>
                  <td className="px-4 py-3 text-ink-2 hidden sm:table-cell">{w.journal ? <Tex>{w.journal}</Tex> : "—"}</td>
                  <td className="px-4 py-3 text-ink-2 hidden md:table-cell">{w.type ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-2">{w.year ?? "—"}</td>
                  <td className="px-4 py-3">
                    {w.doi ? (
                      <a href={w.url ?? `https://doi.org/${w.doi}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ocean hover:text-ocean-strong">
                        {w.doi} <ExternalLink size={12} />
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <CiteButton pub={w} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CredentialsPanel() {
  const t = useTranslations("research");
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ocean mb-3">{t("credentialsEyebrow")}</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-8">{t("credentialsTitle")}</h2>
      <div className="flex flex-wrap gap-3">
        {cvUrl && (
          <ButtonLink href={cvUrl} target="_blank" rel="noopener noreferrer" variant="primary" size="md">
            <Download size={16} /> {t("downloadCV")}
          </ButtonLink>
        )}
        {portfolioUrl && (
          <ButtonLink href={portfolioUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="md">
            {t("viewPortfolio")} <ExternalLink size={16} />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}

/**
 * Copy a publication as BibTeX.
 *
 * The cheapest courtesy an academic site can offer: a visitor who arrived from a
 * paper wants the citation in the form their reference manager eats, and every
 * academic site that actually gets used has this button.
 *
 * The label is the literal string "BibTeX" rather than a translated message.
 * It is a format name — untranslated in every language — and, more to the point,
 * adding a NEW key to `messages/` breaks every client whose catalogue predates
 * it, because next-intl throws on a missing key.
 */
function CiteButton({ pub }: { pub: Publication }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toBibtex(pub));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard is permission-gated and unavailable over plain http. Failing
      // silently is right: the citation is still readable in the DOI link.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy BibTeX for ${texToPlain(pub.title)}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-3 transition-colors hover:border-ocean hover:text-ocean"
    >
      {copied ? <Check size={12} /> : <Quote size={12} />}
      {copied ? "Copied" : "Cite"}
    </button>
  );
}
