"use client";

import { PDFViewer } from "@react-pdf/renderer";
import type { z } from "zod";
import type { portfolioBlockSchema } from "@tzohar/schema";
import PortfolioPdf from "./PortfolioPdf";

type Section = z.infer<typeof portfolioBlockSchema>["sections"][number];

/**
 * Inline PDF preview. Split into its own module purely so `PortfolioBlock` can
 * `next/dynamic` it — importing `PDFViewer` at module scope would drag the PDF
 * engine into the first load of any page carrying the builder.
 */
export default function PortfolioPreview({ sections }: { sections: Section[] }) {
  return (
    <div className="border-line-strong overflow-hidden rounded-[var(--radius-card)] border" style={{ height: 600 }}>
      <PDFViewer width="100%" height="100%" showToolbar={false}>
        <PortfolioPdf sections={sections} />
      </PDFViewer>
    </div>
  );
}
