import type { ZodTypeAny } from "zod";
import { gallerySchema } from "./content/gallery";
import { releasesSchema } from "./content/releases";
import { merchSchema } from "./content/merch";
import { pressSchema } from "./content/press";
import { influencerSchema } from "./content/influencer";
import { rosterContentSchema } from "./content/roster";
import { researchSchema } from "./content/research";
import { caseStudySchema } from "./content/caseStudy";
import { biographySchema } from "./content/biography";
import { pagesSchema } from "./content/pages";
import { postsSchema } from "./content/posts";

/**
 * Single source of truth for "which modules have Studio-editable content,
 * validated by which schema, published to which file in the client repo."
 * Before this, three different places (Studio's `Tenant.content` type,
 * `publish.ts`'s `MODULE_ARTIFACTS`, `actions.ts`'s per-module parsing)
 * each hand-maintained their own copy of this mapping — adding a module meant
 * editing all three. New modules only need an entry here (plus their own
 * SiteEditor UI section, since that's hand-authored per module's shape, not
 * descriptor-driven — see `docs/studio.md`).
 */
export interface ModuleContentEntry {
  /** Matches a `SiteModule` key. */
  key: string;
  /** Human label for error messages. */
  label: string;
  schema: ZodTypeAny;
  /** Path (relative to the client repo root) this content publishes to. */
  artifactPath: string;
}

export const MODULE_CONTENT_REGISTRY: readonly ModuleContentEntry[] = [
  { key: "gallery", label: "Gallery", schema: gallerySchema, artifactPath: "src/data/gallery.json" },
  { key: "releases", label: "Music", schema: releasesSchema, artifactPath: "src/data/releases.json" },
  { key: "label", label: "Record label", schema: rosterContentSchema, artifactPath: "src/data/roster.json" },
  { key: "merch", label: "Merch", schema: merchSchema, artifactPath: "src/data/merch.json" },
  { key: "press", label: "Press kit", schema: pressSchema, artifactPath: "src/data/press.json" },
  { key: "influencer", label: "Influence", schema: influencerSchema, artifactPath: "src/data/influencer.json" },
  { key: "research", label: "Research", schema: researchSchema, artifactPath: "src/data/research.json" },
  { key: "innovation", label: "Innovation", schema: caseStudySchema, artifactPath: "src/data/innovation.json" },
  { key: "engagements", label: "Engagements", schema: caseStudySchema, artifactPath: "src/data/engagements.json" },
  { key: "biography", label: "Biography", schema: biographySchema, artifactPath: "src/data/biography.json" },
  { key: "pages", label: "Pages", schema: pagesSchema, artifactPath: "src/data/pages.json" },
  { key: "posts", label: "Posts", schema: postsSchema, artifactPath: "src/data/posts.json" },
] as const;

export function getModuleContentEntry(key: string): ModuleContentEntry | undefined {
  return MODULE_CONTENT_REGISTRY.find((e) => e.key === key);
}
