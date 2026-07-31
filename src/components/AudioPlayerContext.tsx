"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Track {
  title: string;
  artist: string;
  spotifyUri: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isVisible: boolean;
  playTrack: (track: Track) => void;
  closePlayer: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentTrack: null,
  isVisible: false,
  playTrack: () => {},
  closePlayer: () => {},
});

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const playTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsVisible(true);
  };

  const closePlayer = () => {
    setIsVisible(false);
    setCurrentTrack(null);
  };

  return (
    <AudioPlayerContext.Provider value={{ currentTrack, isVisible, playTrack, closePlayer }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
