"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Music, Users } from "lucide-react";
import type { Release } from "@/data/releases";
import { useAudioPlayer } from "@/components/AudioPlayerContext";
import SpotifyEmbed from "@/components/SpotifyEmbed";
import { fadeUp, stagger } from "@/lib/animations";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { site } from "@/config/site";
import { artist } from "@/data/artist";
import { streamingPlatforms } from "@/lib/streaming";

/* Were literals: every client's release pages credited the reference build's
   artist and linked to his Apple Music page. */
const artistName = artist.name || site.name;
const appleMusicUrl = streamingPlatforms.find((p) => p.icon === "apple")?.url;

const containerVariants = stagger(0.1);

interface AlbumImage {
  image: string | null;
  name: string;
  tracks: number;
  releaseDate: string;
  label: string;
}

export default function ReleaseClient({ release }: { release: Release }) {
  const { playTrack } = useAudioPlayer();
  const t = useTranslations("release");
  const tc = useTranslations("common");
  const [coverImage, setCoverImage] = useState<string | null>(release.coverImage || null);

  // Fetch cover art from Spotify API only if no local cover
  useEffect(() => {
    if (release.coverImage) return;
    fetch(`/api/spotify-albums?ids=${release.spotifyId}`)
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, AlbumImage>) => {
        if (data[release.spotifyId]?.image) {
          setCoverImage(data[release.spotifyId].image);
        }
      })
      .catch(() => {});
  }, [release]);

  const formattedDate = new Date(release.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <section className="pt-20 sm:pt-32 pb-10 md:pb-20 px-6">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-3 mb-8">
            <Link href="/" className="hover:text-ocean transition-colors">{t("home")}</Link>
            <span aria-hidden="true">/</span>
            <Link href="/music" className="hover:text-ocean transition-colors">{t("music")}</Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink-2 truncate max-w-[200px]" aria-current="page">{release.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* ─── Artwork ─── */}
            <motion.div
              className="aspect-square rounded-2xl overflow-hidden relative shadow-2xl shadow-ocean/10"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={release.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-ocean to-ink flex flex-col items-center justify-center p-8">
                  <span className="text-white/10 text-[8rem] sm:text-[10rem] font-black leading-none select-none">{release.title.charAt(0)}</span>
                  <p className="text-white/30 text-sm font-medium mt-2 text-center">{release.title}</p>
                </div>
              )}
            </motion.div>

            {/* ─── Info ─── */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Type badge */}
              <motion.div variants={fadeUp}>
                <span className="inline-block text-xs text-ocean uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-ocean/10 mb-3">
                  {release.type}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink mt-2 mb-4">
                  {release.title}
                </h1>
              </motion.div>

              {/* Artist + date */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-5">
                <span className="flex items-center gap-2 text-sm text-ink-2 bg-surface px-3 py-1.5 rounded-full">
                  <Users size={14} /> {artistName}
                </span>
                <span className="flex items-center gap-2 text-sm text-ink-2 bg-surface px-3 py-1.5 rounded-full">
                  <Calendar size={14} /> {formattedDate}
                </span>
                <span className="text-sm text-ink-3">
                  {release.tracklist.length} {release.tracklist.length === 1 ? t("track") : t("tracks")}
                </span>
              </motion.div>

              {/* Genres */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-8">
                {release.genres.map((genre) => (
                  <span
                    key={genre}
                    className="text-xs px-3 py-1 rounded-full bg-sunset/10 text-sunset font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </motion.div>

              {/* Stream buttons */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mb-8">
                <a
                  href={`https://open.spotify.com/${release.spotifyUri}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1DB954] text-white rounded-full text-sm font-semibold hover:bg-[#1ed760] transition-all shadow-lg shadow-[#1DB954]/20"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  {t("listenOnSpotify")}
                </a>
                {appleMusicUrl && (
                  <a
                    href={appleMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#FA243C] text-white rounded-full text-sm font-semibold hover:bg-[#FA243C]/90 transition-all"
                  >
                    {t("appleMusic")}
                  </a>
                )}
                <button
                  onClick={() =>
                    playTrack({
                      title: release.title,
                      artist: artistName,
                      spotifyUri: release.spotifyUri,
                    })
                  }
                  className="inline-flex items-center gap-2 px-6 py-3 border border-line text-ink-2 rounded-full text-sm font-medium hover:bg-surface transition-colors cursor-pointer"
                >
                  <Music size={14} aria-hidden="true" /> {t("playHere")}
                </button>
              </motion.div>

              {/* Spotify Embed */}
              <motion.div variants={fadeUp}>
                <SpotifyEmbed uri={release.spotifyUri} type="large" theme="dark" />
              </motion.div>

              {/* ─── Tracklist ─── */}
              {release.tracklist.length > 1 && (
                <motion.div variants={fadeUp} className="mt-8">
                  <h2 className="text-lg font-bold text-ink mb-4">{t("tracklist")}</h2>
                  <div className="rounded-xl border border-line overflow-hidden">
                    {release.tracklist.map((track, i) => (
                      <div
                        key={track.number}
                        className={`flex items-center gap-4 py-3 px-4 hover:bg-surface/30 transition-colors group ${
                          i < release.tracklist.length - 1 ? "border-b border-line" : ""
                        }`}
                      >
                        <span className="text-sm text-ink-3 w-6 text-right group-hover:text-ocean transition-colors">
                          {track.number}
                        </span>
                        <Music size={14} className="text-ocean/40 group-hover:text-ocean transition-colors flex-shrink-0" />
                        <span className="text-sm text-ink flex-1 min-w-0">
                          {track.title}
                          {track.feat && (
                            <span className="text-ink-3"> (feat. {track.feat})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─── Credits ─── */}
              {release.credits.length > 0 && (
                <motion.div variants={fadeUp} className="mt-8">
                  <h2 className="text-lg font-bold text-ink mb-4">{t("credits")}</h2>
                  <div className="space-y-2">
                    {release.credits.map((credit, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm text-ink-3 min-w-[80px]">{credit.role}</span>
                        <span className="text-sm text-ink">{credit.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
