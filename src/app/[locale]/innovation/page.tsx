import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { resolveIcon } from "@/lib/icons";
import { innovationCategories, entriesInCategory } from "@/data/innovation";

export default async function InnovationPage() {
  const t = await getTranslations("innovation");

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} align="left" />

      <Container size="xl" className="py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {innovationCategories.map((cat, i) => {
            const Icon = resolveIcon(cat.icon);
            const count = entriesInCategory(cat.key).length;
            const cover = entriesInCategory(cat.key)[0]?.heroImage;
            return (
              <Reveal key={cat.key} delay={i * 80}>
                <Link
                  href={`/innovation/${cat.key}`}
                  className="group block rounded-card border border-line bg-elevated shadow-card hover:shadow-card-hover transition-all overflow-hidden"
                >
                  <div className="relative aspect-video overflow-hidden bg-surface-2">
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.04] transition-all duration-500"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-2">
                      {Icon && (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-pill bg-ocean/10 text-ocean">
                          <Icon size={16} />
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-ink">{cat.label}</h3>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ocean">
                      {t("viewProjects", { count })}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </main>
  );
}
