"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Wrench, Code, Layers, ArrowRight, BookOpen, FlaskConical, BriefcaseBusiness, GraduationCap } from "lucide-react";
import { site } from "@/config/site";
import { aiProfile, artist, heroes } from "@/data/artist";
import SectionDivider from "@/components/SectionDivider";
import PageHero from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import Stat from "@/components/ui/Stat";
import { resolveIcon } from "@/lib/icons";

/*
 * Skill icons come from CONTENT now (`artist.json`), so the name is a plain string
 * and cannot index a four-key literal map. `resolveIcon` is the same lookup the
 * block system uses for author-supplied icon names, and returns undefined for one
 * it doesn't know instead of crashing the page.
 */

import { stagger as staggerFactory } from "@/lib/animations";

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

/*
 * Which author in a publication's list is this site's owner — it was compared
 * against a hardcoded name, so every client's papers bolded a stranger. Matches
 * the artist profile's real name, then its stage name, then the site name.
 */
const SELF = [artist.realName, artist.name, site.name].filter(Boolean).map((n) => n!.toLowerCase());
const isSelf = (a: string) => SELF.includes(a.trim().toLowerCase());

const stagger = staggerFactory(0.1);

const projectImages: Record<string, string> = {
  "Dual-Embedding Guided Backdoor Attack on Multimodal Contrastive Learning": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640&q=80",
  "Semantic-Aware Multi-Label Adversarial Attacks": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=640&q=80",
  "Self-Training for Semi-Supervised Semantic Segmentation": "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=640&q=80",
  "Scalable Urban Dynamic Scenes (NeRF)": "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=640&q=80",
  "Speech Emotion Recognition": "https://images.unsplash.com/photo-1589254065878-42c9da997008?w=640&q=80",
  "Autoregressive Text-to-Image Generation (Parti)": "https://images.unsplash.com/photo-1547954575-855750c57bd3?w=640&q=80",
  "Controllable Text-to-Image Generation (ControlGAN)": "https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=640&q=80",
  "Diffusion Based Text-to-Image Generation (Imagen)": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=640&q=80",
  "Aligning SAM to Open Context via Reinforcement Learning": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=640&q=80",
  "Tool-Augmented Reward Modeling (Themis)": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=640&q=80",
  "ASD Classification with Multi-Site fMRI Data": "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=640&q=80",
  "Mutual Correction Framework for Semi-Supervised Medical Image Segmentation": "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=640&q=80",
  "Why Does the Effective Context Length of LLMs Fall Short?": "https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=640&q=80",
  "AgriLet — AI Crop Disease Detection Platform": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=640&q=80",
  "3D Digital Twin Traffic Monitoring System": "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=640&q=80",
  "eLearn — E-Learning Platform": "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=640&q=80",
};

const projectCategories = ["All", ...Array.from(new Set(aiProfile.projects.map((p) => p.category)))];

export default function AIPage() {
  const t = useTranslations("ai");
  const tc = useTranslations("common");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showAllProjects, setShowAllProjects] = useState(false);

  const filteredProjects =
    activeCategory === "All"
      ? aiProfile.projects
      : aiProfile.projects.filter((p) => p.category === activeCategory);

  const visibleProjects = showAllProjects ? filteredProjects : filteredProjects.slice(0, 6);

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("badge")}
        title={
          <>
            {t("title")} <span className="text-ocean">{t("titleHighlight")}</span>
          </>
        }
        subtitle={aiProfile.bio}
        accent="ocean"
        backgroundImage={heroes.ai?.image}
        backgroundAlt={heroes.ai?.alt}
        imagePosition="center 35%"
        actions={
          <>
            <ButtonLink href={aiProfile.links.cv} target="_blank" rel="noopener noreferrer" variant="primary" size="md">
              {t("downloadCV")}
            </ButtonLink>
            <ButtonLink href={aiProfile.links.portfolio} target="_blank" rel="noopener noreferrer" variant="outline-inverse" size="md">
              {t("fullPortfolio")}
            </ButtonLink>
            <ButtonLink href={aiProfile.links.googleScholar} target="_blank" rel="noopener noreferrer" variant="ghost-inverse" size="md">
              {t("googleScholar")}
            </ButtonLink>
            <ButtonLink href={aiProfile.links.github} target="_blank" rel="noopener noreferrer" variant="ghost-inverse" size="md">
              {t("gitHub")}
            </ButtonLink>
          </>
        }
      />

      {/* ─── Section Nav (sticky, desktop only) ─── */}
      <nav className="hidden md:block sticky top-16 z-30 bg-bg/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            {[
              { id: "publications", label: t("featuredPublications") },
              { id: "projects", label: t("projectsResearch") },
              { id: "experience", label: t("workExperience") },
              { id: "education", label: t("educationTitle") },
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="px-3 py-2 rounded-full text-sm font-medium text-ink-2 hover:text-ink hover:bg-surface whitespace-nowrap transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ─── Stats Bar ─── */}
      <Section variant="muted" className="!py-14">
        <Container size="lg">
          <motion.div
            className="grid grid-cols-4 gap-3 sm:gap-7 md:gap-10 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={stagger}
          >
            {[
              { value: "2", labelKey: "publicationsStat", icon: BookOpen },
              { value: "16+", labelKey: "projectsStat", icon: FlaskConical },
              { value: "4+", labelKey: "yearsExperience", icon: BriefcaseBusiness },
              { value: "MSc", labelKey: "koreaUniversity", icon: GraduationCap },
            ].map((stat) => (
              <motion.div key={stat.labelKey} variants={fadeUp} custom={0}>
                <Stat value={stat.value} label={t(stat.labelKey)} icon={<stat.icon size={18} className="text-ocean" />} />
              </motion.div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* ─── Featured Publications ─── */}
      <section id="publications" className="scroll-mt-20 max-w-6xl mx-auto px-6 py-10 md:py-20">
        <motion.h2
          className="text-3xl font-bold mb-8 md:mb-12 text-center text-ink"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("featuredPublications")}
        </motion.h2>
        <div className="space-y-8">
          {aiProfile.publications
            .filter((p) => p.featured)
            .map((pub, i) => (
              <motion.div
                key={pub.title}
                className="rounded-2xl border border-line bg-bg shadow-sm overflow-hidden hover:border-ocean/30 hover:shadow-md transition-all"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <div className="grid md:grid-cols-[250px_1fr] lg:grid-cols-[300px_1fr] gap-0">
                  <div className="relative h-36 sm:h-48 md:h-full bg-gradient-to-br from-surface to-ocean/10">
                    {pub.image && (
                      <Image
                        src={pub.image}
                        alt={pub.title}
                        fill
                        className="object-cover"
                        unoptimized={pub.image.endsWith(".gif")}
                      />
                    )}
                  </div>
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-white bg-ocean px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {pub.venue}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 leading-snug">
                      {pub.title}
                    </h3>
                    <p className="text-sm text-ink-3 mb-2">
                      {pub.authors.map((a, j) => (
                        <span key={a}>
                          {isSelf(a) ? (
                            <strong className="text-ink">{a}</strong>
                          ) : (
                            a
                          )}
                          {j < pub.authors.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </p>
                    <p className="text-sm text-ink-2 mb-5">
                      {pub.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pub.paper && (
                        <a href={pub.paper} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full text-xs font-semibold bg-ocean text-white hover:bg-[#1B5E8A] transition-colors">
                          {tc("readPaper")}
                        </a>
                      )}
                      {pub.code && (
                        <a href={pub.code} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full text-xs font-semibold bg-foreground text-background hover:bg-foreground/80 transition-colors">
                          {tc("code")}
                        </a>
                      )}
                      {pub.projectPage && (
                        <a href={pub.projectPage} target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-full text-xs font-semibold border border-line text-ink-2 hover:bg-foreground/[0.04] transition-colors">
                          {tc("projectPage")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Projects & Research ─── */}
      <section id="projects" className="scroll-mt-20 bg-surface py-10 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold mb-4 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("projectsResearch")}
          </motion.h2>
          <motion.p
            className="text-ink-3 text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("projectsResearchDesc")}
          </motion.p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
            {projectCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setShowAllProjects(false); }}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-ocean text-white"
                    : "bg-bg text-ink-2 hover:bg-ocean/10 hover:text-ink border border-line"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {visibleProjects.map((project, i) => (
                <motion.a
                  key={project.title}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-line bg-bg shadow-sm overflow-hidden hover:border-ocean/30 hover:shadow-md transition-all hover:-translate-y-1"
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                >
                  {projectImages[project.title] && (
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={projectImages[project.title]}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-[10px] font-medium bg-white/90 text-ocean">
                        {project.category}
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-sm font-semibold leading-snug mb-3 group-hover:text-ocean transition-colors">
                      {project.title}
                    </h3>
                    <span className="text-xs text-ocean group-hover:text-sunset font-medium transition-colors">
                      {tc("viewProject")} &rarr;
                    </span>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProjects.length > 6 && !showAllProjects && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllProjects(true)}
                className="px-6 py-2.5 rounded-full border border-ocean/30 text-ocean font-medium hover:bg-ocean/10 transition-colors cursor-pointer"
              >
                {tc("showAll", { count: filteredProjects.length })}
              </button>
            </div>
          )}
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Work Experience (timeline) ─── */}
      <section id="experience" className="scroll-mt-20 py-10 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold mb-8 md:mb-14 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("workExperience")}
          </motion.h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 sm:left-7 top-2 bottom-2 w-0.5 bg-gradient-to-b from-ocean via-ocean/40 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {aiProfile.experience.map((job, i) => (
                <motion.div
                  key={`${job.company ?? ""}-${job.role}`}
                  className="relative flex gap-5 sm:gap-8"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  {/* Timeline dot */}
                  <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                    <div className={`w-3.5 h-3.5 rounded-full border-4 ${i === 0 ? "bg-ocean border-surface" : "bg-bg border-ocean/30"} z-10`} />
                  </div>

                  {/* Card */}
                  <div className={`flex-1 rounded-2xl border bg-bg shadow-sm p-5 sm:p-6 transition-all hover:shadow-md ${i === 0 ? "border-ocean/30" : "border-line"}`}>
                    <div className="flex items-start gap-4">
                      {job.logo && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface overflow-hidden relative hidden sm:block">
                          <Image src={job.logo} alt={job.company ?? job.role} fill className="object-contain p-1.5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-0.5">
                          <h3 className="text-base sm:text-lg font-semibold">{job.role}</h3>
                          {job.current && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#27AE60]/10 text-[#27AE60] px-2 py-0.5 rounded-full">{tc("current")}</span>
                          )}
                        </div>
                        <p className="text-sm text-ocean font-medium">
                          {"url" in job && job.url ? (
                            <a href={job.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:underline">
                              {job.company}
                              <ArrowRight size={12} className="-rotate-45" aria-hidden="true" />
                            </a>
                          ) : (
                            job.company
                          )}
                        </p>
                        <p className="text-xs text-ink-3 mt-1 mb-3">
                          {job.period} &middot; {job.location}
                        </p>
                        <ul className="space-y-1.5">
                          {job.bullets.map((bullet) => (
                            <li key={bullet} className="text-sm text-ink-2 flex gap-2">
                              <span className="text-ocean mt-0.5 flex-shrink-0">&#8226;</span>
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Education ─── */}
      <section id="education" className="scroll-mt-20 bg-surface py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold mb-8 md:mb-12 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("educationTitle")}
          </motion.h2>
          <motion.div
            className="max-w-3xl mx-auto rounded-2xl border border-line bg-bg shadow-sm overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className={aiProfile.portrait ? "grid md:grid-cols-[240px_1fr] gap-0" : "grid gap-0"}>
              {aiProfile.portrait && (
                <div className="relative h-48 md:h-full">
                  <Image
                    src={aiProfile.portrait}
                    alt={aiProfile.portraitAlt ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 240px"
                  />
                </div>
              )}
              <div className="p-6 sm:p-8 flex items-center">
                <div className="flex items-center gap-4 sm:gap-5">
                  {aiProfile.education.logo && (
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface overflow-hidden relative">
                      <Image
                        src={aiProfile.education.logo}
                        alt={aiProfile.education.school ?? ""}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold">{aiProfile.education.school}</h3>
                    <p className="text-sm text-ink-2 mt-1">{aiProfile.education.degree}</p>
                    <p className="text-xs text-ink-3 mt-1">
                      {aiProfile.education.years} &middot; {t("advisedBy")}{" "}
                      <a href={aiProfile.education.advisorUrl} target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline">
                        {aiProfile.education.advisor}
                      </a>
                    </p>
                    {aiProfile.education.scholarship && (
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider bg-sunset/10 text-sunset px-2.5 py-0.5 rounded-full">
                        {aiProfile.education.scholarship}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Skills & Tools (compact) ─── */}
      <section className="py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold mb-8 md:mb-12 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("skillsTools")}
          </motion.h2>
          <motion.div
            className="grid sm:grid-cols-2 gap-4 sm:gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {aiProfile.skills.map((skill, i) => {
              const Icon = resolveIcon(skill.icon);
              return (
                <motion.div
                  key={skill.category}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-xl border border-line bg-bg shadow-sm p-5 flex items-start gap-4"
                >
                  {Icon && (
                    <div className="w-10 h-10 rounded-lg bg-ocean/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-ocean" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-ink mb-1">{skill.category}</h3>
                    <p className="text-sm text-ink-3 leading-relaxed">{skill.items}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* ─── Certificates (compact pills) ─── */}
      <section className="bg-surface py-10 md:py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold mb-8 md:mb-12 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("certificates")}
          </motion.h2>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {aiProfile.certificates.map((cert, i) => (
              <motion.div
                key={cert.name}
                variants={fadeUp}
                custom={i}
                className="inline-flex items-center gap-2.5 rounded-xl border border-line bg-bg shadow-sm px-4 py-3 hover:shadow-md transition-all"
              >
                {cert.logo && (
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Image src={cert.logo} alt={cert.org ?? cert.name} width={32} height={32} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink leading-tight">{cert.name}</p>
                  <p className="text-[11px] text-ocean">{cert.org}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── Music Cross-Link ─── */}
      <section className="py-8 md:py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="rounded-2xl border border-line bg-bg p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-xl bg-[#FFB800]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-[#FFB800]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-bold text-ink">Beyond the Lab</h3>
              <p className="text-sm text-ink-3 mt-1">5M+ streams across piano house, Amapiano, and dance-pop. Three albums. Charted in 3 countries.</p>
            </div>
            <Link
              href="/music"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFB800]/10 text-[#FFB800] text-sm font-semibold hover:bg-[#FFB800]/20 transition-colors flex-shrink-0"
            >
              Explore Music
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA — desktop only; mobile uses BottomNav contact icon ─── */}
      <Section variant="default" className="!pb-20 hidden md:block">
        <Container size="md">
          <motion.div
            className="rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-ink to-ink-2 text-bg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p variants={fadeUp} custom={0} className="text-sunset uppercase tracking-[0.22em] text-xs font-semibold mb-4">
              {tc("collaborate")}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
              {t("researchEngineering")}
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-bg/75 text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              {t("researchCollabDesc")}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full bg-bg text-ink font-semibold hover:bg-surface transition-colors"
              >
                {tc("getInTouch")}
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <a
                href={aiProfile.links.cv}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-full border border-bg/25 text-bg font-semibold hover:bg-bg/10 transition-colors"
              >
                {t("viewFullCV")}
              </a>
            </motion.div>
          </motion.div>
        </Container>
      </Section>
    </main>
  );
}
