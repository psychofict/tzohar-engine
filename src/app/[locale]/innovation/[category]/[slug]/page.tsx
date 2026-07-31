import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import CaseStudyLayout from "@/components/CaseStudyLayout";
import { site, canonicalUrl } from "@/config/site";
import { innovationEntries, getInnovationEntry, getInnovationCategory } from "@/data/innovation";

interface Props {
  params: Promise<{ category: string; slug: string; locale: string }>;
}

export async function generateStaticParams() {
  return innovationEntries.flatMap((e) =>
    routing.locales.map((locale) => ({ locale, category: e.category, slug: e.slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug, locale } = await params;
  const entry = getInnovationEntry(category, slug);
  if (!entry) return {};
  return {
    title: `${entry.title} — Innovation — ${site.name}`,
    description: entry.summary,
    alternates: { canonical: canonicalUrl(locale, `/innovation/${category}/${slug}`) },
  };
}

export default async function InnovationEntryPage({ params }: Props) {
  const { category, slug, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("innovation");
  const entry = getInnovationEntry(category, slug);
  if (!entry) notFound();
  const cat = getInnovationCategory(category);

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 sm:pt-28">
      <CaseStudyLayout
        sections={entry.sections}
        backHref={`/innovation/${category}`}
        backLabel={t("backToCategory", { category: cat?.label ?? "" })}
        eyebrow={cat?.label}
        title={entry.title}
        summary={entry.summary}
      />
    </main>
  );
}
