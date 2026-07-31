"use client";

import { useState, useEffect, useRef } from "react";

interface InstagramEmbedProps {
  postId: string;
  className?: string;
}

export default function InstagramEmbed({ postId, className = "" }: InstagramEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`rounded-xl border border-ocean/20 bg-white/5 p-8 text-center ${className}`}>
        <InstagramSvg className="w-10 h-10 mx-auto mb-3 text-[#E1306C]" />
        <a
          href={`https://instagram.com/p/${postId}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#E1306C] hover:underline font-medium"
        >
          View on Instagram
        </a>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ocean/10 to-sunset/10 animate-pulse" />
      )}
      <iframe
        src={`https://www.instagram.com/p/${postId}/embed`}
        width="100%"
        height="480"
        frameBorder="0"
        scrolling="no"
        loading="lazy"
        className={`rounded-xl transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        title="Instagram Post"
      />
    </div>
  );
}

const featuredPosts = [
  "DEpYnb4SABe",
];

function InstagramSvg({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function processEmbeds() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ig = (window as any).instgrm;
  if (ig?.Embeds?.process) ig.Embeds.process();
}

export function InstagramFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Instagram embed.js script
  useEffect(() => {
    if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      processEmbeds();
    };
    document.body.appendChild(script);
  }, []);

  // Re-process embeds when script loads
  useEffect(() => {
    if (scriptLoaded) processEmbeds();
  }, [scriptLoaded]);

  return (
    <div ref={containerRef}>
      <div className="grid grid-cols-1 sm:max-w-lg mx-auto">
        {featuredPosts.map((shortcode) => (
          <div key={shortcode} className="relative min-h-[400px]">
            {!loaded[shortcode] && (
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-ocean/10 to-sunset/10 animate-pulse" />
            )}
            <iframe
              src={`https://www.instagram.com/p/${shortcode}/embed/captioned/`}
              className={`w-full rounded-xl border-0 transition-opacity duration-500 ${loaded[shortcode] ? "opacity-100" : "opacity-0"}`}
              height="480"
              frameBorder="0"
              scrolling="no"
              allowTransparency
              loading="lazy"
              onLoad={() => setLoaded((prev) => ({ ...prev, [shortcode]: true }))}
              title={`Instagram post ${shortcode}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
