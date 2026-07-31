"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { fadeUp, stagger } from "@/lib/animations";
import SectionDivider from "@/components/SectionDivider";
import { useTheme } from "@/components/ThemeProvider";
import PageHero from "@/components/ui/PageHero";
import { tourPosters } from "@/data/artist";

const containerVariants = stagger(0.15);
const itemVariants = fadeUp;

export default function TourPage() {
  const t = useTranslations("tour");
  const tc = useTranslations("common");
  const { theme } = useTheme();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetRef.current) return;

    // Create the Songkick anchor element
    const anchor = document.createElement("a");
    anchor.href = "https://www.songkick.com/artists/10171965";
    anchor.className = "songkick-widget";
    anchor.dataset.theme = theme === "dark" ? "dark" : "light";
    anchor.dataset.trackButton = "on";
    anchor.dataset.detectStyle = "off";
    anchor.dataset.backgroundColor = theme === "dark" ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)";
    anchor.dataset.fontColor = theme === "dark" ? "rgba(255,255,255,1)" : "rgba(0,0,0,1)";
    anchor.dataset.buttonBgColor = theme === "dark" ? "rgba(255,255,255,1)" : "rgba(46,134,222,1)";
    anchor.dataset.buttonTextColor = theme === "dark" ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)";
    anchor.dataset.locale = "en";
    anchor.dataset.otherArtists = "on";
    anchor.dataset.shareButton = "on";
    anchor.dataset.countryFilter = "on";
    anchor.dataset.rsvp = "on";
    anchor.dataset.requestShow = "on";
    anchor.dataset.pastEvents = "off";
    anchor.dataset.pastEventsOfftour = "off";
    anchor.dataset.remindMe = "off";
    anchor.style.display = "none";
    widgetRef.current.appendChild(anchor);

    // Load the Songkick widget script
    const script = document.createElement("script");
    script.src = "https://widget-app.songkick.com/injector/10171965";
    script.async = true;
    widgetRef.current.appendChild(script);

    const container = widgetRef.current;
    return () => {
      container.innerHTML = "";
    };
  }, [theme]);

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("liveShows")}
        title={t("title")}
        subtitle={t("subtitle")}
        accent="ocean"
      />

      {/* Past Tours — lead with proof of recent runs */}
      <section className="max-w-4xl mx-auto px-6 pt-10 sm:pt-14 md:pt-16 pb-10 md:pb-16">
        <motion.h2
          className="text-2xl sm:text-3xl font-bold text-center mb-3 text-ink"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("pastTours")}
        </motion.h2>
        <motion.p
          className="text-center text-ink-3 mb-10 text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("pastToursDesc")}
        </motion.p>
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {tourPosters.map((tour) => (
            <motion.div
              key={tour.src}
              className="rounded-2xl overflow-hidden shadow-lg"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
              <Image
                src={tour.src}
                alt={tour.alt}
                width={600}
                height={800}
                className="w-full h-auto"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Songkick Widget — upcoming dates / track / request a show */}
      <motion.section
        className="max-w-4xl mx-auto px-6 pb-10 md:pb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div ref={widgetRef} className="min-h-[200px]" />
      </motion.section>

      {/* Terminal CTA — Book Now (desktop only) */}
      <section className="hidden md:block bg-bg pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <motion.div
            className="rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-ink to-ink-2 text-bg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.p variants={itemVariants} className="text-sunset uppercase tracking-[0.22em] text-xs font-semibold mb-4">
              {tc("bookNow")}
            </motion.p>
            <motion.h2 variants={itemVariants} className="text-3xl md:text-5xl font-bold mb-5">
              {t("bookTitle")}
            </motion.h2>
            <motion.p variants={itemVariants} className="text-bg/75 text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              {t("bookDesc")}
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-bg text-ink font-semibold hover:bg-surface transition-colors"
              >
                {tc("getInTouch")}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
