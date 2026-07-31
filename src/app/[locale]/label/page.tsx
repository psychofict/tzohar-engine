"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowRight, ExternalLink } from "lucide-react";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import { useTheme } from "@/components/ThemeProvider";
import PageHero from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";

import { fadeUp, stagger } from "@/lib/animations";
import { label, labelName } from "@/data/roster";
import LabelSocialLinks from "@/components/label/LabelSocialLinks";

const containerVariants = stagger(0.12);
const itemVariants = fadeUp;

const PINK = "#E8385D";

/*
 * The label's name, marks, links, stat row and genre list all used to be
 * literals in this file, so enabling the `label` module gave a client a page
 * for the reference build's record label — its logo, its Spotify, its four
 * social accounts. They live in roster.json now, and each section renders only
 * if this label has content for it.
 */
const stats = label.stats;
const genres = label.genres;
const spotifyUrl = label.spotifyArtistId
  ? `https://open.spotify.com/artist/${label.spotifyArtistId}`
  : undefined;

export default function LabelPage() {
  const t = useTranslations("label");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const labelEmail = label.email;

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <PageHero
        eyebrow={t("independentLabel")}
        title={labelName}
        subtitle={t("subtitle")}
        meta={t("founded")}
        accent="sunset"
        actions={
          <>
            {label.url && (
              <ButtonLink href={label.url} target="_blank" rel="noopener noreferrer" variant="primary" size="md">
                {t("visitFullWebsite")}
                <ExternalLink size={14} />
              </ButtonLink>
            )}
            {spotifyUrl && (
              <ButtonLink href={spotifyUrl} target="_blank" rel="noopener noreferrer" variant="outline" size="md">
                {t("listenOnSpotify")}
              </ButtonLink>
            )}
          </>
        }
      >
        {(isDark ? label.logoDark : label.logoLight) && (
          <div className="mt-2 mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-card border border-line">
            <Image
              src={(isDark ? label.logoDark : label.logoLight) as string}
              alt={labelName}
              width={144}
              height={144}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        )}
      </PageHero>

      {/* ─── Stats ─── */}
      <section className="border-t border-line">
        <motion.div
          className="max-w-4xl mx-auto px-6 py-14"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
        >
          <div className="grid grid-cols-4 gap-3 sm:gap-6 md:gap-8 text-center">
            {stats.map((stat) => (
              <motion.div key={stat.labelKey} variants={itemVariants}>
                <p className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-none" style={{ color: PINK }}>
                  {stat.value}
                </p>
                <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-xs text-ink-3 uppercase tracking-[0.1em] sm:tracking-widest leading-tight">{t(stat.labelKey)}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Our Sound ─── */}
      <section className="border-t border-line py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold mb-6 md:mb-8 text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("ourSound")}
          </motion.h2>
          <motion.div
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {genres.map((genre) => (
              <motion.span
                key={genre}
                variants={itemVariants}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                style={{ borderColor: `${PINK}30`, color: `${PINK}` }}
              >
                {genre}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Label Playlist ─── */}
      <section className="border-t border-line py-10 md:py-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold mb-3 text-center text-ink"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("labelPlaylist")}
          </motion.h2>
          <motion.p
            className="text-center text-ink-3 mb-8 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("labelPlaylistDesc")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SpotifyEmbed uri="playlist/2y6gkLil8b3R6sw0rW7Ih8" type="large" />
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-line py-10 md:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="text-3xl sm:text-4xl font-bold mb-4 text-ink"
            >
              {t("joinRoster")}
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-ink-3 mb-10 max-w-md mx-auto"
            >
              {t("joinRosterDesc")}
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
              {label.url && (
                <a
                  href={label.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: PINK }}
                >
                  {t("exploreWebsite")}
                  <ArrowRight size={18} />
                </a>
              )}
              {labelEmail && (
                <a
                  href={`mailto:${labelEmail}`}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-line text-ink-2 font-semibold text-lg hover:bg-surface transition-colors"
                >
                  {labelEmail}
                </a>
              )}
            </motion.div>
            <motion.div variants={itemVariants} className="mt-8">
              <LabelSocialLinks socials={label.socials} name={labelName} />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
