import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { site, canonicalUrl } from "@/config/site";
import { innovationCategories, getInnovationCategory, entriesInCategory } from "@/data/innovation";

interface Props {
  params: Promise<{ category: string; locale: string }>;
}

export async function generateStaticParams() {
  return innovationCategories.flatMap((c) => routing.locales.map((locale) => ({ locale, category: c.key })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, locale } = await params;
  const cat = getInnovationCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.label} — Innovation — ${site.name}`,
    alternates: { canonical: canonicalUrl(locale, `/innovation/${category}`) },
  };
}

export default async function InnovationCategoryPage({ params }: Props) {
  const { category, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("innovation");
  const cat = getInnovationCategory(category);
  if (!cat) notFound();
  const entries = entriesInCategory(category);

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <Container size="xl" className="pt-28 sm:pt-32 pb-14">
        <Link href="/innovation" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink transition-colors">
          <ArrowLeft size={15} />
          {t("backToInnovation")}
        </Link>

        <h1 className="mt-5 text-3xl sm:text-4xl font-bold text-ink">{cat.label}</h1>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map((entry, i) => (
            <Reveal key={entry.slug} delay={i * 80}>
              <Link
                href={`/innovation/${category}/${entry.slug}`}
                className="group block rounded-card border border-line bg-elevated shadow-card hover:shadow-card-hover transition-all overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden bg-surface-2">
                  <Image
                    src={entry.heroImage}
                    alt={entry.title}
                    fill
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-ink leading-tight">{entry.title}</h3>
                  <p className="mt-2 text-sm text-ink-2 leading-relaxed line-clamp-2">{entry.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ocean">
                    {t("readCaseStudy")}
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </main>
  );
}
