import { z } from "zod";
import type { FormField } from "../config.form";

/**
 * Biography module CONTENT — an optional "deluxe" alternative to the always-on
 * core `about` route, for clients who want the full interactive treatment: a
 * journey map, an education/career timeline, a long-form narrative, and future
 * plans. Generic (not tied to any one client's life story shape) — `journey`
 * models geographic life stages (for the map), `timeline` models chronological
 * milestones (education, career, etc.), independent of each other since not
 * every client's map stops line up 1:1 with their timeline entries.
 */

export const journeyStopSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  /** Decimal degrees. */
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  period: z.string().optional(),
  institution: z.string().optional(),
  program: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  photo: z.string().optional(),
  /** True for a stop that hasn't happened yet (renders distinctly on the map/timeline). */
  future: z.boolean().optional(),
});

export const timelineMilestoneSchema = z.object({
  title: z.string().min(1),
  place: z.string().optional(),
  period: z.string().optional(),
  /** A sensitive/personal aside shown alongside the milestone. */
  note: z.string().optional(),
  photo: z.string().optional(),
});

export const biographySchema = z.object({
  heroIntro: z.string(),
  achievements: z.array(z.string()),
  journey: z.array(journeyStopSchema),
  timeline: z.array(timelineMilestoneSchema),
  story: z.string(),
  futurePlans: z.array(z.string()),
});

export type JourneyStop = z.infer<typeof journeyStopSchema>;
export type TimelineMilestone = z.infer<typeof timelineMilestoneSchema>;
export type BiographyContent = z.infer<typeof biographySchema>;

export const journeyStopFields: readonly FormField[] = [
  { key: "label", label: "Place", widget: "text", required: true, group: "Stop" },
  { key: "lat", label: "Latitude", widget: "number", required: true, group: "Stop" },
  { key: "lng", label: "Longitude", widget: "number", required: true, group: "Stop" },
  { key: "period", label: "Period", widget: "text", group: "Stop", help: "e.g. \"2018 – Present\"." },
  { key: "institution", label: "Institution", widget: "text", group: "Stop" },
  { key: "program", label: "Program", widget: "text", group: "Stop" },
  { key: "photo", label: "Photo", widget: "image", group: "Stop" },
] as const;

export const timelineMilestoneFields: readonly FormField[] = [
  { key: "title", label: "Milestone", widget: "text", required: true, group: "Milestone" },
  { key: "place", label: "Place", widget: "text", group: "Milestone" },
  { key: "period", label: "Period", widget: "text", group: "Milestone" },
  { key: "note", label: "Note", widget: "textarea", group: "Milestone" },
  { key: "photo", label: "Photo", widget: "image", group: "Milestone" },
] as const;
