"use client";

import { useState } from "react";
import { Reorder } from "framer-motion";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { GripVertical, Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { getAvailableSections } from "@/lib/mediaKit";
import MediaKitPdf from "./MediaKitPdf";

/**
 * Visitor-facing "build your own PDF" tool: check which available sections
 * to include, drag to reorder (framer-motion's built-in Reorder — not a port
 * of Studio's admin-only HTML5-drag RowList, which is CMS-specific), preview
 * inline, then download. Section availability is computed from what's
 * actually enabled + non-empty (src/lib/mediaKit.ts), so this degrades
 * gracefully — a site with only Research on offers a 3-section kit, not a
 * checklist of dead entries for modules that aren't there.
 */
export default function MediaKitBuilder() {
  const available = getAvailableSections();
  const [order, setOrder] = useState(available.map((s) => s.key));
  const [selected, setSelected] = useState<Set<string>>(new Set(available.map((s) => s.key)));
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const orderedSelected = order.filter((k) => selected.has(k));

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await pdf(<MediaKitPdf sectionKeys={orderedSelected} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "media-kit.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (available.length === 0) return null;

  return (
    <div className="rounded-card border border-line bg-elevated p-6 sm:p-8">
      <h3 className="text-lg sm:text-xl font-bold text-ink mb-1">Build my media kit</h3>
      <p className="text-sm text-ink-2 mb-6">Select the sections to include, reorder them, preview, then download a personalized PDF.</p>

      <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
        {order.map((key) => {
          const section = available.find((s) => s.key === key);
          if (!section) return null;
          return (
            <Reorder.Item
              key={key}
              value={key}
              className="flex items-center gap-3 rounded-card border border-line bg-bg px-4 py-3 cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={16} className="text-ink-3 flex-shrink-0" />
              <label className="flex items-center gap-2.5 flex-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggle(key)}
                  className="h-4 w-4 accent-ocean"
                />
                <span className="text-sm font-medium text-ink">{section.label}</span>
              </label>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="inline-flex h-11 items-center gap-2 rounded-pill border border-line-strong px-6 text-[15px] font-semibold text-ink hover:bg-surface transition-colors"
        >
          {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPreview ? "Hide preview" : "Preview portfolio"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading || orderedSelected.length === 0}
          className="inline-flex h-11 items-center gap-2 rounded-pill bg-ocean text-on-accent px-6 text-[15px] font-semibold hover:bg-ocean-strong transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {downloading ? "Preparing…" : "Download PDF"}
        </button>
      </div>

      {showPreview && orderedSelected.length > 0 && (
        <div className="mt-6 rounded-card overflow-hidden border border-line" style={{ height: 600 }}>
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <MediaKitPdf sectionKeys={orderedSelected} />
          </PDFViewer>
        </div>
      )}
    </div>
  );
}
