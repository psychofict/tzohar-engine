"use client";

import { useEffect, useState } from "react";
import { installPreviewBridge, previewRequested } from "@/lib/preview-store";

/**
 * Mounted in the root layout of every build; inert unless the URL carries
 * `?tzohar-preview`. It costs an ordinary visitor one `URLSearchParams` check.
 *
 * The badge matters more than it looks: this is the real, publicly reachable
 * site, and without a marker it is genuinely possible to edit a draft in the
 * belief you are looking at production, or to screenshot a preview as though it
 * were live.
 */
export default function PreviewBridge() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!previewRequested()) return;
    installPreviewBridge();
    setOn(true);
  }, []);

  if (!on) return null;

  return (
    <>
      <style>{`
        /* Flash used when Studio asks the preview to jump to a section. */
        .tzohar-preview-flash {
          animation: tzohar-preview-flash 1.4s ease-out;
        }
        @keyframes tzohar-preview-flash {
          0%, 100% { box-shadow: inset 0 0 0 0 transparent; }
          15%      { box-shadow: inset 0 0 0 3px var(--color-ocean, #6E48E5); }
          70%      { box-shadow: inset 0 0 0 3px var(--color-ocean, #6E48E5); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tzohar-preview-flash { animation: none; outline: 3px solid var(--color-ocean, #6E48E5); }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: "fixed",
          zIndex: 2147483000,
          bottom: 10,
          left: 10,
          padding: "4px 9px",
          borderRadius: 999,
          font: "600 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
          letterSpacing: ".09em",
          textTransform: "uppercase",
          color: "#fff",
          background: "rgba(17,17,20,.82)",
          backdropFilter: "blur(6px)",
          pointerEvents: "none",
        }}
      >
        Studio preview · draft
      </div>
    </>
  );
}
