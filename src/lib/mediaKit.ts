import { hasModule } from "@/config/site";
import { heroIntro, achievements, educationTimeline, story } from "@/data/biography";
import { researchInterests, manualPublications } from "@/data/research";
import { innovationEntries } from "@/data/innovation";
import { engagementEntries } from "@/data/engagements";

export interface MediaKitSection {
  key: string;
  label: string;
}

/**
 * Which "Media Kit" sections a visitor can include, computed from what's
 * actually enabled AND non-empty — never a hardcoded list. A site with only
 * `research` on offers Research/Publications/Contact; enabling `biography`
 * later adds Biography/Education with zero changes here. New modules register
 * themselves the same way MediaKitPdf's SECTION_RENDERERS does (one entry per
 * key, in both places) — this file only decides "is it worth offering."
 */
export function getAvailableSections(): MediaKitSection[] {
  const sections: MediaKitSection[] = [];
  if (hasModule("biography") && (heroIntro.trim() || story.trim() || achievements.length > 0)) {
    sections.push({ key: "biography", label: "Biography" });
  }
  if (hasModule("biography") && educationTimeline.length > 0) {
    sections.push({ key: "education", label: "Education Timeline" });
  }
  if (hasModule("research") && researchInterests.length > 0) {
    sections.push({ key: "research", label: "Research Interests" });
  }
  if (hasModule("research") && manualPublications.length > 0) {
    sections.push({ key: "publications", label: "Publications" });
  }
  if (hasModule("innovation") && innovationEntries.length > 0) {
    sections.push({ key: "innovation", label: "Innovation Projects" });
  }
  if (hasModule("engagements") && engagementEntries.length > 0) {
    sections.push({ key: "engagements", label: "Engagements" });
  }
  sections.push({ key: "contact", label: "Contact Information" });
  return sections;
}
