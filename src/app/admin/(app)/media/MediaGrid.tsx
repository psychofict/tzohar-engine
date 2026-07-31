"use client";

import { useState } from "react";

const VIDEO = /\.(mp4|mov|webm)$/i;

export default function MediaGrid({ files }: { files: { path: string; size: number }[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      setTimeout(() => setCopied((c) => (c === path ? null : c)), 1600);
    } catch {
      // Clipboard is unavailable over plain http on some browsers; the caption
      // shows the full path anyway, so this degrades to "select it yourself".
      setCopied(null);
    }
  };

  return (
    <div className="crm-media">
      {files.map((file) => {
        const isVideo = VIDEO.test(file.path);
        return (
          <figure key={file.path}>
            <button
              type="button"
              onClick={() => copy(file.path)}
              style={{ display: "block", width: "100%", padding: 0, border: 0, background: "none", cursor: "pointer" }}
              title={`Copy ${file.path}`}
            >
              {isVideo ? (
                <div
                  style={{
                    aspectRatio: "4 / 3",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--bg)",
                    color: "var(--ink-3)",
                    fontSize: 26,
                  }}
                  aria-hidden
                >
                  ▶
                </div>
              ) : (
                // Plain <img>: these are operator thumbnails of arbitrary
                // client-uploaded paths, and next/image would demand each one be
                // a configured, optimisable source.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.path} alt="" loading="lazy" />
              )}
            </button>
            <figcaption>
              {copied === file.path ? "✓ path copied" : file.path}
              <br />
              {(file.size / 1024).toFixed(0)}kB
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
