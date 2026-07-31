"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import PageHero from "@/components/ui/PageHero";
import Container from "@/components/ui/Container";
import Tabs, { useHashTab, type TabItem } from "@/components/ui/Tabs";
import MasterDetailList from "@/components/MasterDetailList";
import { engagementCategories, engagementEntries } from "@/data/engagements";

// Static import, so this is safe to compute once at module scope — keeps a
// stable reference for useHashTab's effect deps (a fresh array from .map()
// on every render would re-run that effect more than necessary).
const CATEGORY_KEYS = engagementCategories.map((c) => c.key);

export default function EngagementsPage() {
  const t = useTranslations("engagements");
  const [activeCategory, setActiveCategory] = useHashTab<string>(CATEGORY_KEYS, CATEGORY_KEYS[0] ?? "");

  const items: TabItem[] = engagementCategories.map((c) => ({ key: c.key, label: c.label }));

  const entriesByCategory = useMemo(() => {
    const map: Record<string, typeof engagementEntries> = {};
    for (const c of engagementCategories) map[c.key] = engagementEntries.filter((e) => e.category === c.key);
    return map;
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} align="left" />

      <Container size="xl" className="py-10 sm:py-14">
        <Tabs items={items} activeKey={activeCategory} onChange={setActiveCategory}>
          {(key) => <MasterDetailList entries={entriesByCategory[key] ?? []} />}
        </Tabs>
      </Container>
    </main>
  );
}
