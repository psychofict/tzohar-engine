"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { z } from "zod";
import type { portfolioBlockSchema } from "@tzohar/schema";
import { Reorder } from "framer-motion";
import { GripVertical, Download, Eye, EyeOff, Loader2, Check } from "lucide-react";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { BlockHeaderRow } from "./LeafBlocks";

type PortfolioBlockType = z.infer<typeof portfolioBlockSchema>;

/*
 * @react-pdf/renderer pulls in a large PDF engine and touches browser-only
 * APIs, so it is loaded on demand rather than bundled into the page that merely
 * *contains* the builder. `ssr: false` because there is nothing to render on the
 * server: the document only exists once a visitor has chosen sections.
 */
const PdfPreview = dynamic(() => import("./PortfolioPreview"), {
  ssr: false,
  loading: () => (
    <div className="text-ink-3 border-line flex h-[600px] items-center justify-center rounded-[var(--radius-card)] border">
      <Loader2 size={18} className="animate-spin" />
    </div>
  ),
});

/**
 * "Build my portfolio" — pick sections, reorder them, preview, download a PDF.
 *
 * Everything the document says comes from the block's own `sections`, so this
 * works on a site composed entirely of pages and the PDF can differ from the web
 * copy where that reads better. Section order is the visitor's, not the
 * author's — which is the point of the tool: a funder and a university want the
 * same material in a different order.
 */
export default function PortfolioBlock({ block }: { block: PortfolioBlockType }) {
  const all = block.sections;
  const [order, setOrder] = useState(all.map((s) => s.key));
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(all.filter((s) => s.default !== false).map((s) => s.key)),
  );
  const [showPreview, setShowPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const chosen = order
    .map((k) => all.find((s) => s.key === k))
    .filter((s): s is PortfolioBlockType["sections"][number] => !!s && selected.has(s.key));

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Both the renderer and the document are pulled in only at click time.
      const [{ pdf }, { default: PortfolioPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./PortfolioPdf"),
      ]);
      const blob = await pdf(<PortfolioPdf sections={chosen} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${block.fileName ?? "portfolio"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (all.length === 0) return null;

  return (
    <Container size="xl">
      <BlockHeaderRow header={block.header} />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
        <Reveal direction="up">
          <div>
            <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2">
              {order.map((key) => {
                const section = all.find((s) => s.key === key);
                if (!section) return null;
                const on = selected.has(key);
                return (
                  <Reorder.Item
                    key={key}
                    value={key}
                    className="border-line-strong bg-elevated flex cursor-grab items-center gap-3 rounded-[calc(var(--radius-card)*0.6)] border px-4 py-3 active:cursor-grabbing"
                  >
                    <GripVertical size={16} className="text-ink-3 flex-none" aria-hidden />
                    <label className="flex flex-1 cursor-pointer items-center gap-3 select-none">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(key)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={clsx(
                          "flex h-5 w-5 flex-none items-center justify-center rounded-[5px] border transition-colors",
                          on ? "border-ink bg-ink text-bg" : "border-line-strong",
                        )}
                      >
                        {on && <Check size={13} strokeWidth={3} />}
                      </span>
                      <span className="text-ink text-[15px] font-medium">{section.label}</span>
                    </label>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {block.note && <p className="text-ink-3 mt-5 text-[13.5px] leading-relaxed">{block.note}</p>}

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || chosen.length === 0}
                className="bg-ink text-bg inline-flex h-11 items-center gap-2 rounded-[var(--radius-pill)] px-6 text-[14.5px] font-semibold transition-colors hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {downloading ? "Preparing…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                disabled={chosen.length === 0}
                className="border-line-strong text-ink hover:bg-surface inline-flex h-11 items-center gap-2 rounded-[var(--radius-pill)] border px-6 text-[14.5px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40"
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPreview ? "Hide preview" : "Preview"}
              </button>
            </div>
            <p className="type-label text-ink-3 mt-4">
              {chosen.length} of {all.length} sections selected
            </p>
          </div>
        </Reveal>

        <Reveal direction="up" delay={100}>
          {showPreview && chosen.length > 0 ? (
            <PdfPreview sections={chosen} />
          ) : (
            <div className="border-line text-ink-3 flex h-full min-h-[18rem] items-center justify-center rounded-[var(--radius-card)] border border-dashed p-8 text-center text-[14px] leading-relaxed">
              Choose and order the sections, then preview or download the portfolio as a PDF.
            </div>
          )}
        </Reveal>
      </div>
    </Container>
  );
}
