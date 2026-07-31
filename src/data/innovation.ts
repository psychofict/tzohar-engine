// CONTENT lives in ./innovation.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). Validated against the shared
// caseStudySchema at load, same pattern as ./gallery.ts.

import { caseStudySchema, type CaseStudyCategory, type CaseStudyEntry } from "@tzohar/schema";
import raw from "./innovation.json";

const content = caseStudySchema.parse(raw);

export const innovationCategories: CaseStudyCategory[] = content.categories;
export const innovationEntries: CaseStudyEntry[] = content.entries;

export function getInnovationEntry(category: string, slug: string): CaseStudyEntry | undefined {
  return innovationEntries.find((e) => e.category === category && e.slug === slug);
}
export function getInnovationCategory(key: string): CaseStudyCategory | undefined {
  return innovationCategories.find((c) => c.key === key);
}
export function entriesInCategory(category: string): CaseStudyEntry[] {
  return innovationEntries.filter((e) => e.category === category);
}

export type { CaseStudyCategory, CaseStudyEntry } from "@tzohar/schema";
