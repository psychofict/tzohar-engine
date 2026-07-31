"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, Eye, Handshake, Building2, ChevronDown } from "lucide-react";
import { macroInfluencer, brandPartnerships, eventAppearances } from "@/data/artist";
import { travelPosts, culturePosts, instagramPosts } from "@/data/instagram";
import { site } from "@/config/site";
import { orgLogos, instagramHandle, influencerHeroImage, influencerHeroAlt, influencerHeroTags } from "@/data/influencer";
import { InstagramPostGrid } from "@/components/InstagramPostCard";
import SectionDivider from "@/components/SectionDivider";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import Stat from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";

import { fadeUp as fadeUpAnim, stagger as staggerFactory } from "@/lib/animations";

const fadeUp = fadeUpAnim;
const stagger = staggerFactory(0.08);

// ─── Data preparation ───

// Group government roles by year
const grouped = macroInfluencer.reduce(
  (acc, item) => {
    if (!acc[item.year]) acc[item.year] = [];
    acc[item.year].push(item);
    return acc;
  },
  {} as Record<string, typeof macroInfluencer>,
);
const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));

// Consolidate repeated events
const consolidatedEvents = eventAppearances.reduce(
  (acc, event) => {
    const existing = acc.find((e) => e.name === event.name);
    if (existing) {
      existing.years.push(event.year);
    } else {
      acc.push({ name: event.name, years: [event.year], type: event.type });
    }
    return acc;
  },
  [] as { name: string; years: string[]; type: string }[],
);

// Group brands by category
const brandCategories = brandPartnerships.reduce(
  (acc, brand) => {
    if (!acc[brand.category]) acc[brand.category] = [];
    acc[brand.category].push(brand);
    return acc;
  },
  {} as Record<string, typeof brandPartnerships>,
);
const categoryOrder = ["Government", "Travel & Lifestyle", "Media", "Tech", "Lifestyle", "Fashion", "Beauty & Wellness"];
const sortedCategories = categoryOrder.filter((c) => brandCategories[c]);
const compactCategoryNames = new Set(["Tech", "Lifestyle", "Fashion", "Beauty & Wellness"]);
const fullWidthCategories = sortedCategories.filter((c) => !compactCategoryNames.has(c));
const compactCategories = sortedCategories.filter((c) => compactCategoryNames.has(c));

// Category accent colors
const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  Government: { border: "border-l-[#1B5E8A]", bg: "bg-[#1B5E8A]/5", text: "text-[#1B5E8A]" },
  "Travel & Lifestyle": { border: "border-l-[#27AE60]", bg: "bg-[#27AE60]/5", text: "text-[#27AE60]" },
  Media: { border: "border-l-sunset", bg: "bg-sunset/5", text: "text-sunset" },
  Tech: { border: "border-l-ocean", bg: "bg-ocean/5", text: "text-ocean" },
  Lifestyle: { border: "border-l-[#9B59B6]", bg: "bg-[#9B59B6]/5", text: "text-[#9B59B6]" },
  Fashion: { border: "border-l-[#E1306C]", bg: "bg-[#E1306C]/5", text: "text-[#E1306C]" },
  "Beauty & Wellness": { border: "border-l-[#E74C3C]", bg: "bg-[#E74C3C]/5", text: "text-[#E74C3C]" },
};

const eventTypeAccent: Record<string, { border: string; gradient: string }> = {
  Tech: { border: "border-l-ocean", gradient: "from-ocean/5" },
  Fashion: { border: "border-l-[#E1306C]", gradient: "from-[#E1306C]/5" },
  Culture: { border: "border-l-sunset", gradient: "from-sunset/5" },
  Government: { border: "border-l-[#1B5E8A]", gradient: "from-[#1B5E8A]/5" },
};

// Org logos come from influencer.json — this was a 31-entry literal pointing at
// /images/brands/*, a public/ path that only exists in the reference build.


function OrgLogo({ name, size = 28 }: { name: string; size?: number }) {
  const logo = orgLogos[name];
  if (!logo) return null;
  return (
    <div className="flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <Image src={logo} alt={name} width={size} height={size} className="max-w-full max-h-full object-contain" unoptimized={logo.endsWith(".svg")} />
    </div>
  );
}

const eventTypeColors: Record<string, string> = {
  Tech: "bg-ocean/10 text-ocean",
  Fashion: "bg-[#E1306C]/10 text-[#E1306C]",
  Culture: "bg-sunset/10 text-sunset",
  Government: "bg-[#1B5E8A]/10 text-[#1B5E8A]",
};

// ─── Component ───

export default function MacroInfluencerPage() {
  const t = useTranslations("macroInfluencer");
  const tc = useTranslations("common");
  const [expandedYear, setExpandedYear] = useState<string>(sortedYears[0]);

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("label")}
        title={t("title")}
        subtitle={t("subtitle")}
        accent="sunset"
        backgroundImage={influencerHeroImage}
        backgroundAlt={influencerHeroAlt ?? site.name}
        imagePosition="center 30%"
      >
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {influencerHeroTags.map((tag) => (
            <span key={tag} className="rounded-full bg-white/15 backdrop-blur border border-white/30 px-3 py-1.5 text-xs sm:text-[13px] font-medium text-white">
              {tag}
            </span>
          ))}
        </div>
      </PageHero>

      {/* ─── Stats Bar ─── */}
      <Section variant="muted" className="!py-14">
        <Container size="lg">
          <motion.div className="grid grid-cols-4 gap-3 sm:gap-7 md:gap-10" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}>
            {[
              { value: "200K+", labelKey: "followersStat", icon: Users },
              { value: "15M+", labelKey: "socialViews", icon: Eye },
              { value: "50+", labelKey: "brandPartners", icon: Handshake },
              { value: `${macroInfluencer.length}+`, labelKey: "govAppointments", icon: Building2 },
            ].map((stat) => (
              <motion.div key={stat.labelKey} variants={fadeUp}>
                <Stat value={stat.value} label={t(stat.labelKey)} icon={<stat.icon size={18} className="text-sunset" />} accent="sunset" />
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ─── Brand Partnerships (pill layout by category) ─── */}
      <section id="partnerships" className="scroll-mt-20 bg-surface py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-4 text-ink" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("brandPartnerships")}
          </motion.h2>
          <motion.p className="text-center text-ink-2 mb-8 md:mb-14 max-w-xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("brandPartnershipsDesc")}
          </motion.p>

          {(() => {
            const renderCategory = (category: string) => {
              const colors = categoryColors[category] || categoryColors["Lifestyle"];
              return (
                <motion.div
                  key={category}
                  className={`rounded-2xl border-l-4 ${colors.border} ${colors.bg} p-3 sm:p-6`}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className={`text-xs font-bold uppercase tracking-[0.2em] ${colors.text} mb-4`}>
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {brandCategories[category].map((brand) => (
                      <div
                        key={brand.name}
                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-bg border border-line px-2.5 sm:px-4 py-1.5 sm:py-2.5 shadow-sm hover:shadow-md hover:border-line transition-all"
                      >
                        {brand.logo && (
                          <div className="w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                            <Image
                              src={brand.logo}
                              alt={brand.name}
                              width={24}
                              height={24}
                              className="max-w-full max-h-full object-contain"
                              unoptimized={brand.logo.endsWith(".svg")}
                            />
                          </div>
                        )}
                        <span className="text-xs sm:text-sm font-medium text-ink whitespace-nowrap">{brand.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            };
            return (
              <div className="space-y-4 sm:space-y-8">
                {fullWidthCategories.map(renderCategory)}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {compactCategories.map(renderCategory)}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Travel Campaigns ─── */}
      <section id="travel" className="scroll-mt-20 bg-bg py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-4 text-ink" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("travelCampaigns")}
          </motion.h2>
          <motion.p className="text-center text-ink-2 mb-8 md:mb-12 max-w-xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("travelCampaignsDesc")}
          </motion.p>
          <InstagramPostGrid posts={travelPosts} size="featured" columns="grid-cols-2 lg:grid-cols-3" />
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Event Appearances (horizontal cards with type accent) ─── */}
      <section id="events" className="scroll-mt-20 bg-surface py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-4 text-ink" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("eventAppearances")}
          </motion.h2>
          <motion.p className="text-center text-ink-2 mb-8 md:mb-12 max-w-xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("eventAppearancesDesc")}
          </motion.p>
          <motion.div
            className="grid grid-cols-2 gap-2.5 sm:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {consolidatedEvents.map((event) => {
              const accent = eventTypeAccent[event.type] || eventTypeAccent["Culture"];
              return (
                <motion.div
                  key={event.name}
                  variants={fadeUp}
                  className={`rounded-xl border border-line border-l-4 ${accent.border} bg-gradient-to-r ${accent.gradient} to-white shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 sm:gap-4 p-3 sm:p-5`}
                >
                  <OrgLogo name={event.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-semibold leading-snug text-ink">{event.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${eventTypeColors[event.type] || "bg-gray-100 text-gray-600"}`}>
                        {event.type}
                      </span>
                      {event.years.sort((a, b) => parseInt(b) - parseInt(a)).map((year) => (
                        <span key={year} className="text-[10px] px-2 py-0.5 rounded-full bg-surface text-ocean font-medium">{year}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── In The Spotlight ─── */}
      <section id="spotlight" className="scroll-mt-20 bg-bg py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-4 text-ink" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("inTheSpotlight")}
          </motion.h2>
          <motion.p className="text-center text-ink-2 mb-8 md:mb-12 max-w-xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("inTheSpotlightDesc")}
          </motion.p>
          <InstagramPostGrid posts={culturePosts} columns="grid-cols-2 sm:grid-cols-3" />
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Life on Instagram ─── */}
      <section className="bg-surface py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-5xl font-bold text-ink text-center mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Life on Instagram
          </motion.h2>
          <motion.p
            className="text-center text-ink-2 mb-6 md:mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Behind the scenes, day to day — @{instagramHandle}
          </motion.p>

          <InstagramPostGrid
            posts={[...instagramPosts].sort((a, b) => b.likes - a.likes).slice(0, 6)}
            columns="grid-cols-3"
          />

          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-full bg-gradient-to-r from-[#E1306C] to-sunset px-5 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base text-white font-semibold shadow-lg hover:opacity-90 transition-opacity"
            >
              Follow @{instagramHandle}
            </a>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Government & Official Roles (accordion) ─── */}
      <section id="government" className="scroll-mt-20 bg-bg py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-center mb-4 text-ink" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("governmentRoles")}
          </motion.h2>
          <motion.p className="text-center text-ink-2 mb-8 md:mb-14 max-w-xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            {t("governmentRolesDesc")}
          </motion.p>

          <div className="space-y-4">
            {sortedYears.map((year) => {
              const items = grouped[year];
              const isOpen = expandedYear === year;
              return (
                <motion.div
                  key={year}
                  className="rounded-2xl border border-line bg-bg shadow-sm overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Accordion trigger */}
                  <button
                    onClick={() => setExpandedYear(isOpen ? "" : year)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-sunset">{year}</span>
                      <span className="text-xs text-ink-3 font-medium bg-surface px-2.5 py-0.5 rounded-full">{items.length} {tc("roles")}</span>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-ink-3 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Expandable content */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-line">
                          {items.map((amb, i) => (
                            <div
                              key={`${amb.org}-${amb.role}`}
                              className={`flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3.5 ${
                                i < items.length - 1 ? "border-b border-line" : ""
                              } hover:bg-surface/30 transition-colors`}
                            >
                              <OrgLogo name={amb.org} size={32} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm sm:text-base font-semibold leading-snug truncate">{amb.role}</p>
                                <p className="text-xs sm:text-sm text-ink-3 truncate">{amb.org}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <Section variant="default" className="!pb-20">
        <Container size="md">
          <motion.div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-ink to-ink-2 text-bg" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p variants={fadeUp} className="text-sunset uppercase tracking-[0.22em] text-xs font-semibold mb-4">
              {tc("collaborate")}
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
              {t("letsWorkTogether")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-bg/75 text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              {t("letsWorkTogetherDesc")}
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-bg text-ink font-semibold hover:bg-surface transition-colors"
              >
                {tc("getInTouch")}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </Section>
    </main>
  );
}
