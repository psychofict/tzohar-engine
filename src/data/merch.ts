// CONTENT lives in ./merch.json — the git-as-DB artifact Tzohar Studio edits and
// commits (see docs/studio.md). Validated against the shared schema at load, same
// pattern as ./gallery.ts.

import { merchSchema, type MerchPreview } from "@tzohar/schema";
import { site } from "@/config/site";
import { labelName } from "./roster";
import raw from "./merch.json";

const content = merchSchema.parse(raw);

export type { MerchPreview };
export const merchPreviews: MerchPreview[] = content.previews;
export const merchDescription: string = content.description;
export const merchStoreUrl: string | undefined = content.storeUrl;

/** The store's name: its own, else the label's, else the site's. */
export const merchStoreName: string = content.storeName || labelName || site.name;
