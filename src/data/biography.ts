// CONTENT lives in ./biography.json — the git-as-DB artifact Tzohar Studio
// edits and commits (see docs/studio.md). Validated against the shared
// schema at load, same pattern as ./gallery.ts.

import { biographySchema, type JourneyStop, type TimelineMilestone } from "@tzohar/schema";
import raw from "./biography.json";

const content = biographySchema.parse(raw);

export const heroIntro: string = content.heroIntro;
export const achievements: string[] = content.achievements;
export const journeyStops: JourneyStop[] = content.journey;
export const educationTimeline: TimelineMilestone[] = content.timeline;
export const story: string = content.story;
export const futurePlans: string[] = content.futurePlans;

export type { JourneyStop, TimelineMilestone } from "@tzohar/schema";
