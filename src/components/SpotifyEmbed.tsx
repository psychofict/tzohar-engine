"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface SpotifyEmbedProps {
  uri: string;
  type?: "compact" | "normal" | "large";
  theme?: "light" | "dark";
  className?: string;
}

/**
 * Lazy-mounts the Spotify iframe only when the embed scrolls into view
 * (or comes within 200px of the viewport). Saves a network connection
 * to open.spotify.com + iframe paint cost on every page where it's
 * rendered below the fold.
 */
export default function SpotifyEmbed({ uri, type = "normal", theme = "dark", className = "" }: SpotifyEmbedProps) {
  const tc = useTranslations("common");
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const height = type === "compact" ? 80 : 352;
  const themeParam = theme === "dark" ? "&theme=0" : "";

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  if (error) {
    return (
      <div className={`rounded-xl border border-line bg-surface p-8 flex flex-col items-center gap-3 ${className}`}>
        <svg className="w-10 h-10 text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <a
          href={`https://open.spotify.com/${uri}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#1DB954] hover:underline font-medium"
        >
          {tc("openInSpotify")}
        </a>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`} style={{ height }}>
      {(!inView || !loaded) && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-surface to-surface-2 animate-pulse" aria-hidden="true" />
      )}
      {inView && (
        <iframe
          src={`https://open.spotify.com/embed/${uri}?utm_source=generator${themeParam}`}
          width="100%"
          height={height}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className={`rounded-xl transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          title={tc("spotifyPlayer")}
        />
      )}
    </div>
  );
}
