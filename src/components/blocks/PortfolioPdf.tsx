"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { z } from "zod";
import type { portfolioBlockSchema } from "@tzohar/schema";
import { site } from "@/config/site";

type PortfolioBlockType = z.infer<typeof portfolioBlockSchema>;
type Section = PortfolioBlockType["sections"][number];

/*
 * @react-pdf/renderer has its own primitives, so this is a second render path
 * rather than a reuse of the page components — it cannot read Tailwind tokens.
 * The palette below is therefore a deliberate, literal copy of the light-mode
 * ink/paper/rule values from globals.css: a PDF is a fixed artefact on white
 * paper, so it wants the light values baked in whatever mode the site is in.
 */
const INK = "#15121C";
const INK_2 = "#4A4456";
const INK_3 = "#877F92";
const RULE = "#DED8CC";
const ACCENT = "#8A6A12";

const styles = StyleSheet.create({
  page: { paddingTop: 52, paddingBottom: 56, paddingHorizontal: 52, fontSize: 10.5, fontFamily: "Helvetica", color: INK },
  eyebrow: { fontSize: 8, letterSpacing: 1.6, color: INK_3, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  /*
   * `Helvetica-Bold`, not `Times-Bold`.
   *
   * The PDF ran its one big headline in a serif while every other word on the
   * page was Helvetica — the same display/body mismatch the client objected to
   * on the site itself ("the main big font need to be same as the standard font
   * used"), reproduced in the artefact he actually hands to people. Of the
   * PDF-standard faces Helvetica is the closest to the brand's Inter, so the
   * document now speaks in one voice.
   */
  h1: { fontSize: 26, fontFamily: "Helvetica-Bold", marginBottom: 6, lineHeight: 1.15 },
  standfirst: { fontSize: 11, color: INK_2, lineHeight: 1.5, marginBottom: 16, maxWidth: 400 },
  rule: { borderBottomWidth: 1.5, borderBottomColor: ACCENT, width: 44, marginBottom: 22 },
  h2: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
    color: INK_3,
    marginTop: 22,
    marginBottom: 9,
    borderBottomWidth: 0.75,
    borderBottomColor: RULE,
    paddingBottom: 5,
  },
  p: { fontSize: 10, lineHeight: 1.6, marginBottom: 7, color: INK_2 },
  bullet: { flexDirection: "row", marginBottom: 5 },
  bulletDot: { width: 10, fontSize: 10, color: ACCENT },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.55, color: INK_2 },
  recordRow: { flexDirection: "row", marginBottom: 5 },
  recordLabel: { width: 108, fontSize: 8, letterSpacing: 1.1, fontFamily: "Helvetica-Bold", color: INK_3, paddingTop: 1.5 },
  recordValue: { flex: 1, fontSize: 10, lineHeight: 1.5, color: INK },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 52,
    right: 52,
    borderTopWidth: 0.75,
    borderTopColor: RULE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: INK_3,
  },
});

/** Blank-line-separated prose → paragraphs. */
function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function SectionBody({ section }: { section: Section }) {
  return (
    <View wrap={false}>
      <Text style={styles.h2}>{section.label.toUpperCase()}</Text>
      {section.body && paragraphs(section.body).map((p, i) => <Text key={i} style={styles.p}>{p}</Text>)}
      {section.records?.map((r, i) => (
        <View key={i} style={styles.recordRow}>
          <Text style={styles.recordLabel}>{r.label.toUpperCase()}</Text>
          <Text style={styles.recordValue}>{r.value}</Text>
        </View>
      ))}
      {section.items?.map((item, i) => (
        <View key={i} style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PortfolioPdf({
  sections,
  title,
  standfirst,
}: {
  sections: Section[];
  title?: string;
  standfirst?: string;
}) {
  return (
    <Document title={`${site.name} — Portfolio`} author={site.legalName ?? site.name}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>PORTFOLIO</Text>
        <Text style={styles.h1}>{title ?? site.legalName ?? site.name}</Text>
        {standfirst && <Text style={styles.standfirst}>{standfirst}</Text>}
        <View style={styles.rule} />

        {sections.map((s) => (
          <SectionBody key={s.key} section={s} />
        ))}

        <View style={styles.footer} fixed>
          <Text>{site.name}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
