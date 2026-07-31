import { z } from "zod";

/**
 * Page COPY overrides — a curated subset of the engine's next-intl message keys
 * (namespace → key → string) that clients can edit in Studio. On publish, these
 * are DEEP-MERGED into the client repo's `messages/<locale>.json`; untouched
 * keys keep the engine's defaults, so the engine needs no code change. Only the
 * fields in `COPY_FIELDS` are surfaced in the editor.
 */
export const copySchema = z.object({
  common: z.record(z.string(), z.string()).optional(),
  home: z.record(z.string(), z.string()).optional(),
});

export type CopyContent = z.infer<typeof copySchema>;

export interface CopyField {
  ns: "common" | "home";
  key: string;
  label: string;
  help?: string;
  multiline?: boolean;
}

/** The homepage strings worth editing per-client (label + which message key). */
export const COPY_FIELDS: readonly CopyField[] = [
  { ns: "home", key: "location", label: "Hero eyebrow", help: "Small line above your name (e.g. a location or status)." },
  { ns: "home", key: "heroTagline", label: "Hero tagline", help: "The big line under your name." },
  { ns: "home", key: "heroCredibility", label: "Hero credibility line", help: "A short proof line under the tagline." },
  { ns: "common", key: "exploreMyWork", label: "Primary button label" },
  { ns: "common", key: "getInTouch", label: "Secondary button label" },
  { ns: "home", key: "whatIDo", label: "Sections kicker", help: 'Small label above "Where I operate".' },
  { ns: "home", key: "whereIOperate", label: "Sections heading" },
  { ns: "home", key: "whereIOperateDesc", label: "Sections description", multiline: true },
  { ns: "home", key: "letsBuild", label: "Closing CTA heading" },
  { ns: "home", key: "collabDesc", label: "Closing CTA subtext", multiline: true },
] as const;

/** Read a copy value from a CopyContent object for a given field. */
export function copyValue(copy: CopyContent | undefined, f: CopyField): string {
  return copy?.[f.ns]?.[f.key] ?? "";
}
