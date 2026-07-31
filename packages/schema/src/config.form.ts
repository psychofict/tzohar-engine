import { THEMES, KINDS, MODULES } from "./config";

/**
 * Form DESCRIPTOR for the identity config. Tzohar Studio renders its editor
 * from this, so the form lives next to the schema it edits (one package, the
 * keystone promise). Keys are dot-paths into the config object and must mirror
 * `configSchema`; `assertFormMatchesSchema()` guards that at startup/test time.
 *
 * Advanced/array-of-object fields (socials, locales.enabled, alternateNames,
 * sameAs) are handled by dedicated UI later — they're intentionally not here.
 */
export type Widget =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "number"
  | "select"
  | "multiselect"
  | "string-list"
  | "image";

export interface FormField {
  /** dot-path into the config object, e.g. "brand.logoLight" */
  key: string;
  label: string;
  help?: string;
  widget: Widget;
  required?: boolean;
  options?: readonly string[];
  /** UI grouping / wizard step */
  group: string;
}

export const configFormFields: readonly FormField[] = [
  { key: "name", label: "Name", widget: "text", required: true, group: "Identity", help: "Public brand name — shown across the site." },
  { key: "legalName", label: "Legal name", widget: "text", group: "Identity", help: "Used in schema.org + copyright." },
  { key: "kind", label: "Kind", widget: "select", options: KINDS, required: true, group: "Identity" },
  { key: "tagline", label: "Tagline", widget: "text", required: true, group: "Identity" },
  { key: "description", label: "Description", widget: "textarea", required: true, group: "Identity", help: "~150–160 chars for SEO + social." },
  { key: "url", label: "Site URL", widget: "url", required: true, group: "Identity", help: "Production origin, no trailing slash." },
  { key: "email", label: "Contact email", widget: "email", required: true, group: "Identity" },
  { key: "location.based", label: "Based in", widget: "text", group: "Location" },
  { key: "location.from", label: "From", widget: "text", group: "Location" },
  { key: "brand.logoLight", label: "Logo — light backgrounds", widget: "image", required: true, group: "Brand" },
  { key: "brand.logoDark", label: "Logo — dark backgrounds", widget: "image", required: true, group: "Brand" },
  { key: "brand.ogImage", label: "Social share image (1200×630)", widget: "image", required: true, group: "Brand" },
  { key: "theme", label: "Accent theme", widget: "select", options: THEMES, group: "Brand" },
  { key: "seo.titleDefault", label: "Homepage title", widget: "text", required: true, group: "SEO" },
  { key: "seo.keywords", label: "SEO keywords", widget: "string-list", group: "SEO", help: "One per line." },
  { key: "twitter", label: "Twitter / X handle", widget: "text", group: "Social", help: "Include the @." },
  { key: "modules", label: "Modules", widget: "multiselect", options: MODULES, required: true, group: "Modules", help: "Sections switched on for this site." },
] as const;

/** Group fields in declared order for a stepped/grouped form. */
export function configFormGroups(): { group: string; fields: FormField[] }[] {
  const out: { group: string; fields: FormField[] }[] = [];
  for (const f of configFormFields) {
    let g = out.find((x) => x.group === f.group);
    if (!g) {
      g = { group: f.group, fields: [] };
      out.push(g);
    }
    g.fields.push(f);
  }
  return out;
}
