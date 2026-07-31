# @tzohar/schema

The **single source of truth** for a Tzohar Sites build's configuration and content
shapes. One Zod definition is consumed three ways:

1. **Engine validation** — `src/config/site.values.ts` and `src/data/*.ts` parse their
   JSON against these schemas at load (fail-fast on bad data).
2. **Studio forms** — Tzohar Studio renders its editors from the form descriptors here.
3. **Serialization** — Studio validates + serializes back to the JSON artifacts on publish.

Because there's one definition, the engine and Studio cannot drift. The package is a
**leaf**: it imports nothing from the engine; the engine's types
(`src/config/site.ts`) are re-exported *from* here.

---

## Exports

```ts
// config (identity)
configSchema, KINDS, THEMES, LOCALES, MODULES, socialLinkSchema
type SiteConfig, SiteModule, ThemePreset, Locale, SiteKind, SocialLink

// config form descriptor (Studio renders identity from this)
configFormFields, configFormGroups()
type FormField, Widget        // "text"|"textarea"|"url"|"email"|"number"|"select"|"multiselect"|"string-list"|"image"

// theme engine (accent presets + custom colors + font pairings + radius/mode)
FONT_CHOICES, RADIUS_CHOICES, MODE_CHOICES, FONT_PAIRINGS, THEME_PRESETS
resolveTheme(config, mode), appearanceStyle(config), readableOn(hex)
type FontChoice, RadiusChoice, ModeChoice, FontPairing, ThemeableConfig

// starter templates (one-click module/theme/font presets)
STARTER_TEMPLATES
type StarterTemplate

// content — gallery (reference module)
gallerySchema, galleryItemSchema, galleryVideoSchema, galleryCategoryEnum,
GALLERY_CATEGORIES, galleryItemFields
type GalleryContent, GalleryItem, GalleryVideo, GalleryCategory

// content — music / releases (discography)
releasesSchema, releaseSchema, trackSchema, creditSchema, releaseTypeEnum,
RELEASE_TYPES, releaseFields
type ReleasesContent, Release, Track, Credit, ReleaseType

// content — page copy (homepage strings → deep-merged into messages/ on publish)
copySchema, COPY_FIELDS, copyValue()
type CopyContent, CopyField

// serialization
serializeConfig(config)   // validate → pretty JSON (+ newline)
parseConfig(raw)          // string|object → validated SiteConfig
```

## Layout

```
packages/schema/
  package.json            name "@tzohar/schema", exports → ./src/index.ts
  src/
    config.ts             configSchema + enums + inferred types (incl. appearance)
    theme.ts              theme engine: FONT_PAIRINGS/THEME_PRESETS + resolveTheme/appearanceStyle
    templates.ts          STARTER_TEMPLATES (one-click module/theme/font presets)
    config.form.ts        FormField/Widget + configFormFields (identity editor)
    content/gallery.ts    gallerySchema + galleryItemFields (content pattern)
    content/releases.ts   releasesSchema + releaseFields (music / discography)
    content/copy.ts       copySchema + COPY_FIELDS (homepage strings → messages merge)
    serialize.ts          serializeConfig / parseConfig
    index.ts              barrel
```

## How it's consumed

- **Engine** imports it via the tsconfig path alias `@tzohar/schema` →
  `./packages/schema/src/index.ts` (compiled as in-project source; forks inherit it).
- **Studio** installs it as a real dependency via npm **`install-links`** (copied into
  `studio/node_modules`, compiled by `transpilePackages`) — because Studio's Turbopack
  root is pinned to `studio/`. Studio's **`prebuild`** re-copies this package into
  `node_modules` before every `npm run build`, so builds (incl. Vercel, whose cache
  would otherwise serve a stale copy) always see the current schema. For `npm run dev`,
  run `npm run sync-schema` after editing this package.

---

## Adding a module

Two modules are implemented as reference: **gallery** (flat items) and **music /
releases** (`content/releases.ts` — rows with preserved nested tracklists/credits).
Adding content editing for another module (press, vault, …) is the same mechanical
four steps:

### 1. Define the content schema + form descriptor

`src/content/<module>.ts`:

```ts
import { z } from "zod";
import type { FormField } from "../config.form";

export const releaseSchema = z.object({
  title: z.string().min(1),
  year: z.number().int(),
  // … mirror the existing src/data/<module>.ts shape exactly …
});
export const musicSchema = z.object({ releases: z.array(releaseSchema) });

export type MusicContent = z.infer<typeof musicSchema>;

// Fields for ONE repeatable item (Studio renders an array editor from this):
export const releaseFields: readonly FormField[] = [
  { key: "title", label: "Title", widget: "text", required: true, group: "Release" },
  { key: "year",  label: "Year",  widget: "number", required: true, group: "Release" },
];
```

Add `export * from "./content/<module>";` to `src/index.ts`.

### 2. Refactor the engine data file to validated JSON

- Create `src/data/<module>.json` with the current values (expand any `${VAR}` template
  paths to literals).
- Rewrite `src/data/<module>.ts` to load + validate + export the same names:

```ts
import { musicSchema, type ... } from "@tzohar/schema";
import raw from "./<module>.json";
const content = musicSchema.parse(raw);
export const releases = content.releases;
export type { ... } from "@tzohar/schema";
```

Run `npm run build` at the repo root — the engine must stay green and the module's
pages keep rendering.

### 3. Register the artifact in Studio's publisher

`studio/lib/publish.ts` → `MODULE_ARTIFACTS`:

```ts
<module>: { path: "src/data/<module>.json", serialize: (d) => JSON.stringify(<module>Schema.parse(d), null, 2) + "\n" },
```

Add the field to `Tenant.content` in `studio/lib/store.ts`.

### 4. Add the Studio editor panel

Since the **v2 live editor** (2026-07) there are no per-module `<Module>Editor.tsx`
components — everything is a section inside one live editor.

- Add the module to `studio/app/tenants/[slug]/SiteEditor.tsx`: extend the `SectionId`
  union and render a panel for it (gated on the module being enabled), reusing the widget
  kit `EditorWidgets.tsx` (`RowList` for repeatable rows, as the gallery/music sections do).
- The whole draft (config + each content type) is held in editor state and saved/published
  together via `saveDraft` / `publishDraft` in `studio/app/actions.ts` — no per-module save
  action is needed.
- `cd studio && npm run build` (its `prebuild` re-syncs the schema automatically).

> Migrated to validated JSON: `gallery`, `releases`. Engine data files still as TS
> (candidates to migrate): `artist`, `instagram`, `plans`, `roster`, `vault`.

---

## The config form descriptor

Identity fields are described in `config.form.ts` as `FormField[]` (key is a dot-path
into the config, e.g. `brand.logoLight`). Keys mirror `configSchema`; Studio renders
inputs by `widget`. Advanced/array-of-object config fields (socials, `locales.enabled`)
are handled by dedicated editors rather than this flat descriptor.

> Note: `configSchema` (validation) and `configFormFields` (presentation) are authored
> together; keep them in sync when adding identity fields.
