// CONTENT lives in ./engagements.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). Validated against the shared
// caseStudySchema at load, same pattern as ./gallery.ts.

import { caseStudySchema, type CaseStudyCategory, type CaseStudyEntry } from "@tzohar/schema";
import raw from "./engagements.json";

const content = caseStudySchema.parse(raw);

export const engagementCategories: CaseStudyCategory[] = content.categories;
export const engagementEntries: CaseStudyEntry[] = content.entries;

export function getEngagementBySlug(slug: string): CaseStudyEntry | undefined {
  return engagementEntries.find((e) => e.slug === slug);
}

export type { CaseStudyCategory, CaseStudyEntry } from "@tzohar/schema";
