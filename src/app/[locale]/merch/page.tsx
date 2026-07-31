"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { fadeUp, stagger } from "@/lib/animations";
import PageHero from "@/components/ui/PageHero";
// The four previews were literals here, pointing at the reference build's photos
// under a public/ path that does not exist in a client repo.
import { merchPreviews } from "@/data/merch";

const containerVariants = stagger(0.1);
const itemVariants = fadeUp;

const PINK = "#E8385D";

export default function MerchPage() {
  const t = useTranslations("merch");
  const tc = useTranslations("common");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={tc("comingSoon")}
        title={t("title")}
        subtitle={t("subtitle")}
        accent="sunset"
        actions={
          <>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center gap-1.5 px-6 rounded-full bg-ocean text-on-accent text-[15px] font-semibold hover:bg-ocean-strong transition-colors"
            >
              {tc("notifyMe")} <ArrowRight size={16} />
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-1.5 px-6 rounded-full border border-line-strong text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
            >
              {tc("backToHome")}
            </Link>
          </>
        }
      >
        <div className="mt-2 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-elevated border border-line">
          <ShoppingBag className="w-6 h-6 text-sunset" />
        </div>
      </PageHero>

      {/* ─── Preview Grid ─── */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <motion.p
            className="text-center text-xs font-bold uppercase tracking-[0.3em] text-ink-3 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {tc("preview")}
          </motion.p>
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {merchPreviews.map((item, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="aspect-square rounded-2xl overflow-hidden relative group"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs sm:text-sm font-medium">{item.alt}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
