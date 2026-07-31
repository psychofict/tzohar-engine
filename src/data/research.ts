// CONTENT lives in ./research.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). Validated against the shared
// schema at load, same pattern as ./gallery.ts.

import { researchSchema, type ResearchInterest, type Publication } from "@tzohar/schema";
import raw from "./research.json";

const content = researchSchema.parse(raw);

export const orcidId: string | undefined = content.orcidId;
export const researchInterests: ResearchInterest[] = content.interests;
export const manualPublications: Publication[] = content.publications;
export const cvUrl: string | undefined = content.cvUrl;
export const portfolioUrl: string | undefined = content.portfolioUrl;

export type { ResearchInterest, Publication } from "@tzohar/schema";
