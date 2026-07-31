"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Download, Music, Mail, Copy, Check } from "lucide-react";
import SectionDivider from "@/components/SectionDivider";
import PageHero from "@/components/ui/PageHero";
import { stagger as staggerFactory } from "@/lib/animations";
import { useState } from "react";
import { site } from "@/config/site";
import {
  pressShortBio as shortBio,
  pressKeyFacts as keyFacts,
  pressPhotos,
  pressLogos as logos,
  pressStreamingLinks as streamingLinks,
  pressHeroImage,
  pressHeroAlt,
  pressLockupLight,
  pressLockupDark,
} from "@/data/press";

/* ── animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const stagger = staggerFactory(0.1);

/* ── data ──
 * All of it used to be literals right here: the reference build owner's short
 * bio, his real name and birthplace in the fact sheet, his four press photos,
 * his four logo files and his streaming links. A press page exists to be quoted,
 * so this was the worst place in the engine for another person's identity.
 */
/* ── component ── */
export default function PressPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyBio = async () => {
    try {
      await navigator.clipboard.writeText(shortBio);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silent fail
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow="Electronic Press Kit"
        title={<>Press <span className="text-ocean">& Media</span></>}
        subtitle="Everything you need for press coverage, event promotion, and brand storytelling."
        accent="ocean"
        backgroundImage={pressHeroImage}
        backgroundAlt={pressHeroAlt ?? site.name}
        imagePosition="center 25%"
      />

      <section className="max-w-4xl mx-auto px-6 py-10 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl md:text-5xl font-bold mb-8 text-center text-ink"
          >
            Quick Bio
          </motion.h2>
          <motion.div
            variants={fadeUp}
            custom={1}
            className="relative rounded-2xl border border-line bg-surface shadow-sm p-6 sm:p-8"
          >
            <p className="text-base sm:text-lg text-ink-2 leading-relaxed">
              &ldquo;{shortBio}&rdquo;
            </p>
            <button
              onClick={handleCopyBio}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-line text-ink-2 hover:bg-foreground/[0.04] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#27AE60]" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy bio
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Key Facts Grid ─── */}
      <section className="bg-surface py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-8 md:mb-12 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Key Facts
          </motion.h2>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {keyFacts.map((fact, i) => (
              <motion.div
                key={fact.label}
                variants={fadeUp}
                custom={i}
                className="rounded-xl border border-line bg-bg shadow-sm p-5"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-ocean mb-1">
                  {fact.label}
                </p>
                <p className="text-base sm:text-lg font-semibold text-ink">
                  {fact.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Press Photos ─── */}
      <section className="py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-5xl font-bold mb-4 text-center text-ink"
            >
              Press Photos
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-ink-3 text-center mb-10 max-w-lg mx-auto"
            >
              High-resolution versions are available upon request. Contact us for media-ready files.
            </motion.p>
          </motion.div>
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {pressPhotos.map((photo, i) => (
              <motion.div
                key={photo.title}
                variants={fadeUp}
                custom={i}
                className="group rounded-2xl border border-line bg-bg shadow-sm overflow-hidden hover:border-ocean/30 hover:shadow-md transition-all"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 text-[11px] font-medium text-ink">
                      <Download className="w-3 h-3" />
                      Contact for high-res
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-ink">{photo.title}</h3>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Logo Assets ─── */}
      <section className="bg-surface py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-5xl font-bold mb-4 text-center text-ink"
            >
              Logo Assets
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-ink-3 text-center mb-10 max-w-lg mx-auto"
            >
              Use the {site.name} logo in your publications. Contact us for vector files and additional formats.
            </motion.p>
          </motion.div>

          {/* Horizontal lockup — primary brand signature */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 mb-3 sm:mb-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="rounded-2xl border border-line bg-elevated flex items-center justify-center p-10"
            >
              <Image
                src={pressLockupLight}
                alt={`${site.name} horizontal lockup`}
                width={228}
                height={96}
                className="h-12 md:h-16 w-auto"
              />
            </motion.div>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="rounded-2xl bg-[#0E0E10] flex items-center justify-center p-10"
            >
              <Image
                src={pressLockupDark}
                alt={`${site.name} horizontal lockup`}
                width={233}
                height={96}
                className="h-12 md:h-16 w-auto"
              />
            </motion.div>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {logos.map((logo, i) => (
              <motion.div
                key={logo.label}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl overflow-hidden border border-line shadow-sm"
              >
                <div
                  className={`relative aspect-square flex items-center justify-center p-8 ${logo.on === "dark" ? "bg-[#0E0E10]" : "bg-elevated border border-line"}`}
                >
                  <Image
                    src={logo.src}
                    alt={logo.label}
                    width={160}
                    height={160}
                    className="object-contain max-w-full max-h-full"
                  />
                </div>
                <div className="bg-bg p-4 border-t border-line">
                  <p className="text-sm font-medium text-ink">{logo.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Music / Streaming ─── */}
      <section className="py-10 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-5xl font-bold mb-4 text-center text-ink"
            >
              Music
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-ink-3 text-center mb-10 max-w-lg mx-auto"
            >
              Stream and explore {site.name}&apos;s catalogue across major platforms.
            </motion.p>
          </motion.div>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {streamingLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                custom={i}
                className="inline-flex items-center gap-3 px-6 py-4 rounded-xl border border-line bg-bg shadow-sm hover:shadow-md hover:border-ocean/30 transition-all w-full sm:w-auto justify-center"
              >
                <Music className="w-5 h-5" style={{ color: link.color }} />
                <span className="text-base font-semibold text-ink">{link.name}</span>
                <ArrowRight className="w-4 h-4 text-ink-3" />
              </motion.a>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="hidden md:block bg-bg pb-16 sm:pb-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <motion.div
            className="rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-ink to-ink-2 text-bg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg/10 mb-5">
              <Mail className="w-5 h-5 text-bg" />
            </motion.div>
            <motion.p variants={fadeUp} custom={1} className="text-sunset uppercase tracking-[0.22em] text-xs font-semibold mb-4">
              Get in Touch
            </motion.p>
            <motion.h2 variants={fadeUp} custom={2} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
              Press Inquiries
            </motion.h2>
            <motion.p variants={fadeUp} custom={3} className="text-bg/75 text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              For press inquiries, interview requests, and media access, get in touch.
            </motion.p>
            <motion.div variants={fadeUp} custom={4}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-bg text-ink font-semibold hover:bg-surface transition-colors"
              >
                Contact Us
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
