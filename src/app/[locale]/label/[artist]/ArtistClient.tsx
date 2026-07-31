"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import SpotifyEmbed from "@/components/SpotifyEmbed";

interface TopTrack {
  name: string;
  albumName: string;
  albumImage: string | null;
  durationMs: number;
  spotifyUrl: string | null;
}

interface Album {
  name: string;
  image: string | null;
  releaseDate: string;
  totalTracks: number;
  type: string;
  spotifyId: string;
  spotifyUrl: string | null;
}

interface RelatedArtist {
  name: string;
  spotifyId: string;
  image: string | null;
  genres: string[];
  followers: number;
}

interface ArtistDetail {
  name: string;
  image: string | null;
  url: string | null;
  followers: number;
  genres: string[];
  popularity: number;
  topTracks: TopTrack[];
  albums: Album[];
  relatedArtists: RelatedArtist[];
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ArtistClient({ artistId }: { artistId: string }) {
  const t = useTranslations("label");
  const [data, setData] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!artistId) return;
    fetch(`/api/spotify-artist/${artistId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [artistId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg text-ink">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
          <div className="mb-8">
            <div className="h-4 w-32 bg-foreground/10 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="w-40 h-40 rounded-full bg-foreground/10 animate-pulse" />
            <div className="h-8 w-48 bg-foreground/10 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-foreground/10 rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-foreground/10 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="mt-16 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-foreground/[0.06] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center px-6">
        <p className="text-lg text-ink-2 mb-6">{t("failedToLoad")}</p>
        <Link href="/label" className="text-ocean hover:text-sunset transition-colors font-medium">
          &larr; {t("backToRoster")}
        </Link>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-3">
          <Link href="/" className="hover:text-ocean transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/label" className="hover:text-ocean transition-colors">Label</Link>
          <span aria-hidden="true">/</span>
          <span className="text-ink-2 truncate max-w-[200px]" aria-current="page">{data.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <motion.section
        className="max-w-4xl mx-auto px-6 py-8 md:py-12 flex flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {data.image && (
          <motion.div variants={fadeUp} className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden shadow-lg mb-6">
            <Image
              src={data.image}
              alt={data.name}
              width={192}
              height={192}
              className="w-full h-full object-cover"
              priority
            />
          </motion.div>
        )}
        <motion.h1 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-4">
          {data.name}
        </motion.h1>
        {data.genres.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2 mb-4">
            {data.genres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 text-xs font-medium rounded-full bg-surface text-ocean"
              >
                {genre}
              </span>
            ))}
          </motion.div>
        )}
        <motion.div variants={fadeUp} className="flex items-center gap-6 text-sm text-ink-2 mb-4">
          <span>{formatFollowers(data.followers)} followers</span>
          <span className="flex items-center gap-2">
            Popularity
            <span className="inline-block w-24 h-2 bg-foreground/10 rounded-full overflow-hidden">
              <span
                className="block h-full bg-sunset rounded-full"
                style={{ width: `${data.popularity}%` }}
              />
            </span>
            <span className="text-xs">{data.popularity}</span>
          </span>
        </motion.div>
        {data.url && (
          <motion.a
            variants={fadeUp}
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1DB954] text-white text-sm font-semibold hover:bg-[#1ed760] transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Open in Spotify
          </motion.a>
        )}
      </motion.section>

      {/* Spotify Player */}
      <motion.section
        className="max-w-4xl mx-auto px-6 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <SpotifyEmbed uri={`artist/${artistId}`} type="large" />
      </motion.section>

      {/* Top Tracks */}
      {data.topTracks.length > 0 && (
        <section className="bg-surface py-10 md:py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.h2
              className="text-2xl font-bold mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Top Tracks
            </motion.h2>
            <motion.div
              className="space-y-2"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {data.topTracks.slice(0, 10).map((track, i) => (
                <motion.div key={`${track.name}-${i}`} variants={itemVariants}>
                  {track.spotifyUrl ? (
                    <a
                      href={track.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg/80 transition-colors group"
                    >
                      <span className="w-6 text-right text-sm text-ink-3 font-medium">
                        {i + 1}
                      </span>
                      {track.albumImage && (
                        <Image
                          src={track.albumImage}
                          alt={track.albumName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-ocean transition-colors">
                          {track.name}
                        </p>
                        <p className="text-xs text-ink-3 truncate">{track.albumName}</p>
                      </div>
                      <span className="text-xs text-ink-3">{formatDuration(track.durationMs)}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 p-3 rounded-xl">
                      <span className="w-6 text-right text-sm text-ink-3 font-medium">
                        {i + 1}
                      </span>
                      {track.albumImage && (
                        <Image
                          src={track.albumImage}
                          alt={track.albumName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{track.name}</p>
                        <p className="text-xs text-ink-3 truncate">{track.albumName}</p>
                      </div>
                      <span className="text-xs text-ink-3">{formatDuration(track.durationMs)}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Discography */}
      {data.albums.length > 0 && (
        <section className="py-10 md:py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.h2
              className="text-2xl font-bold mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Discography
            </motion.h2>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {data.albums.map((album) => (
                <motion.div key={album.spotifyId} variants={itemVariants} className="group">
                  <div className="rounded-xl overflow-hidden mb-3">
                    <SpotifyEmbed uri={`album/${album.spotifyId}`} type="compact" />
                  </div>
                  <p className="text-sm font-semibold leading-tight truncate">{album.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-ink-3">
                      {album.releaseDate?.slice(0, 4)}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface text-ocean font-medium">
                      {album.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
      {/* Related Artists */}
      {data.relatedArtists.length > 0 && (
        <section className="bg-surface py-10 md:py-16">
          <div className="max-w-4xl mx-auto px-6">
            <motion.h2
              className="text-2xl font-bold mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Related Artists
            </motion.h2>
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {data.relatedArtists.map((artist) => (
                <motion.a
                  key={artist.spotifyId}
                  href={`https://open.spotify.com/artist/${artist.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  className="rounded-2xl p-4 bg-bg border border-line shadow-sm hover:border-sunset/40 hover:shadow-md transition-all text-center group"
                  whileHover={{ y: -4 }}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-surface">
                    {artist.image ? (
                      <Image
                        src={artist.image}
                        alt={artist.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-ocean">
                        {artist.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold truncate group-hover:text-ocean transition-colors">
                    {artist.name}
                  </p>
                  {artist.genres.length > 0 && (
                    <p className="text-[10px] text-ink-3 mt-1 truncate">
                      {artist.genres.join(", ")}
                    </p>
                  )}
                  <p className="text-[10px] text-ink-3 mt-0.5">
                    {formatFollowers(artist.followers)} followers
                  </p>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </main>
  );
}
