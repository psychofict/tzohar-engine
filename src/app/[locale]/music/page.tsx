"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { topTracks, artist, heroes } from "@/data/artist";
import { streamingPlatforms } from "@/lib/streaming";
import { socialIconMap } from "@/components/ui/SocialIcons";
import { releases, albumsAndEPs, allSingles } from "@/data/releases";
import { musicPosts } from "@/data/instagram";
import { InstagramPostGrid } from "@/components/InstagramPostCard";
import SectionDivider from "@/components/SectionDivider";
import JsonLd from "@/components/JsonLd";
import { getMusicAlbumSchema, getMusicRecordingSchema } from "@/lib/structured-data";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import Section from "@/components/ui/Section";
import SectionHeader from "@/components/ui/SectionHeader";
import Stat from "@/components/ui/Stat";
import { ButtonLink } from "@/components/ui/Button";

type FilterType = "all" | "album" | "single";

const filterButtons: { labelKey: string; value: FilterType }[] = [
  { labelKey: "all", value: "all" },
  { labelKey: "albums", value: "album" },
  { labelKey: "singlesFilter", value: "single" },
];

import { fadeUp, stagger } from "@/lib/animations";

const containerVariants = stagger(0.1);
const itemVariants = fadeUp;

interface AlbumImages {
  [id: string]: {
    image: string | null;
    name: string;
    tracks: number;
    releaseDate: string;
    label: string;
  };
}

function getAlbumGradient(index: number) {
  const gradients = [
    "from-ocean to-ink",
    "from-sunset to-ocean",
    "from-ink to-sunset",
    "from-ocean to-sunset",
    "from-sunset to-ink",
  ];
  return gradients[index % gradients.length];
}

export default function MusicPage() {
  const t = useTranslations("music");
  const tc = useTranslations("common");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [albumImages, setAlbumImages] = useState<AlbumImages>({});

  // Fetch cover art from Spotify for releases without local covers
  useEffect(() => {
    const missingIds = releases
      .filter((r) => !r.coverImage && r.spotifyId)
      .map((r) => r.spotifyId);
    const uniqueIds = [...new Set(missingIds)];
    if (uniqueIds.length === 0) return;

    fetch(`/api/spotify-albums?ids=${uniqueIds.join(",")}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setAlbumImages(data))
      .catch(() => {});
  }, []);

  const filteredReleases = (activeFilter === "all" ? releases : activeFilter === "single" ? allSingles : albumsAndEPs);

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      {/* Structured Data */}
      {albumsAndEPs.map((r) => (
        <JsonLd
          key={`jsonld-${r.slug}`}
          data={getMusicAlbumSchema({ title: r.title, year: r.year, tracks: r.tracklist.length })}
        />
      ))}
      {topTracks.map((track) => (
        <JsonLd
          key={`jsonld-track-${track.title}`}
          data={getMusicRecordingSchema({
            title: track.title,
            source: track.source,
            spotifyUrl: track.spotifyUrl,
            streams: track.streams,
          })}
        />
      ))}

      <PageHero
        eyebrow={t("musicLabel")}
        title={t("title")}
        subtitle={t("subtitle")}
        accent="ocean"
        backgroundImage={heroes.music?.image}
        backgroundAlt={heroes.music?.alt}
        imagePosition="center 30%"
        actions={
          <>
            <ButtonLink href="https://open.spotify.com/artist/4mH71Zjiq36Q3SI7IZIBQK" target="_blank" rel="noopener noreferrer" variant="primary" size="md">
              {tc("listenNow")}
            </ButtonLink>
            <ButtonLink href="#discography" variant="outline-inverse" size="md">
              {t("browseDiscography")}
            </ButtonLink>
          </>
        }
      />

      {/* Spotify Wrapped */}
      <Section variant="muted" className="!py-14 sm:!py-16">
        <Container size="lg">
          <motion.div
            className="grid grid-cols-4 gap-3 sm:gap-7 md:gap-10 text-center"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {[
              { value: "5M+", labelKey: "streamsLabel" },
              { value: "208K+", labelKey: "listenersLabel" },
              { value: "175K+", labelKey: "hoursStreamed" },
              { value: "184", labelKey: "countriesLabel" },
            ].map((stat) => (
              <div key={stat.labelKey}>
                <p className="font-display text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-none">{stat.value}</p>
                <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[0.1em] sm:tracking-[0.18em] text-ink-3 leading-tight">{t(stat.labelKey)}</p>
              </div>
            ))}
          </motion.div>
        </Container>
      </Section>

      {/* Music Milestones */}
      <section className="bg-surface py-10 md:py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-ink mb-3 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("milestones")}
          </motion.h2>
          <motion.p
            className="text-center text-ink-3 mb-10 max-w-md mx-auto text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("milestonesDesc")}
          </motion.p>
          <InstagramPostGrid
            posts={musicPosts.slice(0, 4)}
            size="featured"
            columns="grid-cols-2 lg:grid-cols-4"
          />
        </div>
      </section>

      {/* Filter Buttons */}
      <section id="discography" className="max-w-6xl mx-auto px-6 py-10 scroll-mt-20">
        <div className="flex gap-2 sm:gap-3 justify-center mb-8 sm:mb-12 overflow-x-auto scrollbar-hide snap-x pb-2 -mx-2 px-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setActiveFilter(btn.value)}
              className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap snap-start ${
                activeFilter === btn.value
                  ? "bg-ocean text-white shadow-lg shadow-ocean/30"
                  : "bg-surface text-ink hover:bg-ocean/10"
              }`}
            >
              {t(btn.labelKey)}
            </button>
          ))}
        </div>

        {/* Albums & EPs Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          key={activeFilter}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {filteredReleases.map((release, index) => {
            const coverImage = release.coverImage || albumImages[release.spotifyId]?.image;
            return (
              <motion.div key={release.slug} variants={itemVariants}>
                <Link
                  href={`/music/${release.slug}`}
                  className="group block"
                >
                  <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.96 }}>
                    <div className="aspect-square rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300 mb-3">
                      {coverImage ? (
                        <Image
                          src={coverImage}
                          alt={release.title}
                          width={400}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${getAlbumGradient(index)} flex items-center justify-center`}>
                          <span className="text-white/20 text-6xl font-bold select-none">{release.title.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-ink leading-tight line-clamp-2 group-hover:text-ocean transition-colors">
                      {release.title}
                    </h3>
                    <p className="text-xs text-ink-3 mt-0.5">{release.year}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-surface text-ocean font-medium">{release.type}</span>
                      <span className="text-[10px] text-ink-3">{release.tracklist.length} {t("tracks")}</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {filteredReleases.length === 0 && (
          <p className="text-center text-ink-3 py-8">
            {t("noReleasesFound")}
          </p>
        )}
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* Top Tracks Section */}
      <section id="top-tracks" className="py-10 md:py-16 px-6 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-ink mb-8"
          >
            {t("topTracks")}
          </motion.h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {topTracks.map((track, index) => {
              // A track need not belong to an album, so the id can be absent.
              const coverImage = track.albumId ? albumImages[track.albumId]?.image : undefined;
              return (
                <motion.a
                  key={track.title}
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  className="flex items-center gap-2 sm:gap-4 bg-bg rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-line group"
                >
                  {/* Cover Art */}
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={track.source ?? track.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-ocean to-ink" />
                    )}
                  </div>

                  {/* Rank */}
                  <span
                    className={`text-lg sm:text-2xl font-black w-6 sm:w-8 text-center flex-shrink-0 ${
                      index === 0
                        ? "text-sunset"
                        : index === 1
                          ? "text-ocean"
                          : index === 2
                            ? "text-ocean/60"
                            : "text-ink-3"
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0 py-3 sm:py-4">
                    <h3 className="text-sm sm:text-base font-semibold text-ink group-hover:text-ocean transition-colors truncate">
                      {track.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-ink-3 truncate">{track.source}</p>
                  </div>

                  {/* Streams + Spotify icon */}
                  <div className="text-right flex-shrink-0 pr-3 sm:pr-4 flex items-center gap-2 sm:gap-3">
                    <div>
                      <p className="text-sm sm:text-base font-bold text-ink">{track.streams}</p>
                      <p className="text-[10px] sm:text-xs text-ink-3">{tc("streams")}</p>
                    </div>
                    <svg className="w-5 h-5 text-[#1DB954] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </div>
                </motion.a>
              );
            })}
          </motion.div>
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-ink-3 text-sm mb-3">
              {t("discoverMore")}
            </p>
            <Link
              href="/label"
              className="inline-flex items-center gap-2 text-ocean hover:text-sunset font-medium transition-colors"
            >
              {t("exploreLabel")}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="light-to-soft" />

      {/* Genres */}
      <section className="bg-surface py-10 md:py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-2xl sm:text-3xl font-bold text-ink mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("genres")}
          </motion.h2>
          <motion.p
            className="text-ink-3 text-sm mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {t("genresDesc")}
          </motion.p>
          <motion.div
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {artist.genres.map((genre) => (
              <motion.span
                key={genre}
                variants={fadeUp}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 border-ocean text-ocean text-xs sm:text-sm font-semibold hover:bg-ocean hover:text-white transition-colors duration-300 cursor-default"
              >
                {genre}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider variant="wave" direction="soft-to-light" />

      {/* ─── AI Cross-Link ─── */}
      <section className="py-8 md:py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="rounded-2xl border border-line bg-bg p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:shadow-md transition-shadow"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-xl bg-ocean/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-ocean" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-bold text-ink">Beyond the Studio</h3>
              <p className="text-sm text-ink-3 mt-1">Published in Neural Networks and at IJCNN. MSc in AI from Korea University. Building CV/ML pipelines for smart city infrastructure.</p>
            </div>
            <Link
              href="/ai"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ocean/10 text-ocean text-sm font-semibold hover:bg-ocean/20 transition-colors flex-shrink-0"
            >
              View Research
              <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Listen Everywhere CTA */}
      <Section variant="default" className="!pb-20">
        <Container size="md">
          <motion.div
            className="rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center bg-gradient-to-br from-ink to-ink-2 text-bg"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              {t("listenEverywhere")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-bg/75 mb-8 max-w-md mx-auto leading-relaxed">
              {t("listenEverywhereDesc")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
              {streamingPlatforms.map((p) => (
                <a
                  key={p.url}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    p.color
                      ? "inline-flex items-center gap-2 h-11 px-5 rounded-full text-white font-semibold hover:brightness-110 transition-all"
                      : "inline-flex items-center gap-2 h-11 px-5 rounded-full border border-bg/25 text-bg/90 font-medium hover:bg-bg/10 transition-colors"
                  }
                  style={p.color ? { backgroundColor: p.color } : undefined}
                >
                  {socialIconMap[p.icon]}
                  {p.name}
                </a>
              ))}
            </motion.div>
          </motion.div>
        </Container>
      </Section>
    </main>
  );
}
