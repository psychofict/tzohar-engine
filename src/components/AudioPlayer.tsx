"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import { useAudioPlayer } from "./AudioPlayerContext";
import SpotifyEmbed from "./SpotifyEmbed";
import { useTranslations } from "next-intl";

export default function AudioPlayer() {
  const { currentTrack, isVisible, closePlayer } = useAudioPlayer();
  const tc = useTranslations("common");
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {isVisible && currentTrack && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
        >
          {/* Expanded Spotify embed */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-bg/95 backdrop-blur-xl border-t border-line overflow-hidden"
              >
                <div className="max-w-2xl mx-auto px-4 py-4">
                  <SpotifyEmbed uri={currentTrack.spotifyUri} type="normal" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact player bar */}
          <div className="bg-bg/95 backdrop-blur-xl border-t border-line">
            <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 sm:h-20 flex items-center gap-3 sm:gap-4 safe-bottom">
              {/* Track info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial sm:w-48">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-ocean to-ink flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-ink truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-ink-2 truncate">
                    {currentTrack.artist}
                  </p>
                </div>
              </div>

              {/* Spotify compact embed in center */}
              <div className="flex-1 hidden sm:block">
                <SpotifyEmbed
                  uri={currentTrack.spotifyUri}
                  type="compact"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-3 rounded-full hover:bg-foreground/5 transition-colors text-ink-2 hover:text-ocean"
                  aria-label={expanded ? tc("collapsePlayer") : tc("expandPlayer")}
                >
                  {expanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronUp className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={closePlayer}
                  className="p-3 rounded-full hover:bg-foreground/5 transition-colors text-ink-2 hover:text-red-500"
                  aria-label={tc("closePlayer")}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
