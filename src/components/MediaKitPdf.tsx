"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { site } from "@/config/site";
import { heroIntro, achievements, educationTimeline, story } from "@/data/biography";
import { researchInterests, manualPublications, cvUrl } from "@/data/research";
import { innovationEntries } from "@/data/innovation";
import { engagementEntries } from "@/data/engagements";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10.5, fontFamily: "Helvetica", color: "#15121C" },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  tagline: { fontSize: 11, color: "#4A4456", marginBottom: 18 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8, borderBottom: "1 solid #E7E1D6", paddingBottom: 4 },
  p: { fontSize: 10, lineHeight: 1.5, marginBottom: 6 },
  item: { marginBottom: 8 },
  itemTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  itemMeta: { fontSize: 9, color: "#877F92", marginBottom: 2 },
  tag: { fontSize: 9.5, marginBottom: 3 },
});

/**
 * PDF renderer for one Media Kit section. Keyed the same as
 * `getAvailableSections()` in src/lib/mediaKit.ts — a new module's section
 * needs an entry in both places. @react-pdf/renderer has its own primitive
 * components (Document/Page/View/Text) — this is a parallel render path from
 * the website's HTML, not a reuse of the page components.
 */
const SECTION_RENDERERS: Record<string, () => React.ReactNode> = {
  biography: () => (
    <View>
      <Text style={styles.h2}>Biography</Text>
      {heroIntro && <Text style={styles.p}>{heroIntro}</Text>}
      {achievements.map((a) => (
        <Text key={a} style={styles.tag}>
          • {a}
        </Text>
      ))}
      {story && <Text style={styles.p}>{story}</Text>}
    </View>
  ),
  education: () => (
    <View>
      <Text style={styles.h2}>Education</Text>
      {educationTimeline.map((m, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemTitle}>{m.title}</Text>
          {(m.place || m.period) && <Text style={styles.itemMeta}>{[m.place, m.period].filter(Boolean).join(" · ")}</Text>}
        </View>
      ))}
    </View>
  ),
  research: () => (
    <View>
      <Text style={styles.h2}>Research Interests</Text>
      {researchInterests.map((r) => (
        <Text key={r.label} style={styles.tag}>
          • {r.label}
        </Text>
      ))}
    </View>
  ),
  publications: () => (
    <View>
      <Text style={styles.h2}>Publications</Text>
      {manualPublications.map((p, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemTitle}>{p.title}</Text>
          {(p.journal || p.year) && <Text style={styles.itemMeta}>{[p.journal, p.year].filter(Boolean).join(" · ")}</Text>}
        </View>
      ))}
    </View>
  ),
  innovation: () => (
    <View>
      <Text style={styles.h2}>Innovation Projects</Text>
      {innovationEntries.map((e) => (
        <View key={e.slug} style={styles.item}>
          <Text style={styles.itemTitle}>{e.title}</Text>
          <Text style={styles.p}>{e.summary}</Text>
        </View>
      ))}
    </View>
  ),
  engagements: () => (
    <View>
      <Text style={styles.h2}>Engagements</Text>
      {engagementEntries.map((e) => (
        <View key={e.slug} style={styles.item}>
          <Text style={styles.itemTitle}>{e.title}</Text>
          {(e.location || e.date) && <Text style={styles.itemMeta}>{[e.location, e.date].filter(Boolean).join(" · ")}</Text>}
        </View>
      ))}
    </View>
  ),
  contact: () => (
    <View>
      <Text style={styles.h2}>Contact</Text>
      <Text style={styles.p}>{site.email}</Text>
      {site.socials.map((s) => (
        <Text key={s.name} style={styles.tag}>
          {s.name}: {s.url}
        </Text>
      ))}
      {cvUrl && <Text style={styles.p}>Full CV: {site.url}{cvUrl}</Text>}
    </View>
  ),
};

export default function MediaKitPdf({ sectionKeys }: { sectionKeys: readonly string[] }) {
  return (
    <Document title={`${site.name} — Media Kit`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{site.name}</Text>
        {site.tagline && <Text style={styles.tagline}>{site.tagline}</Text>}
        {sectionKeys.map((key) => {
          const render = SECTION_RENDERERS[key];
          return render ? <View key={key}>{render()}</View> : null;
        })}
      </Page>
    </Document>
  );
}
