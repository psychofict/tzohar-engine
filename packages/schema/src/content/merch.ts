import { z } from "zod";

/**
 * The merch store — content, not code.
 *
 * The preview photographs were a literal array in `merch/page.tsx` pointing at
 * `/images/…/merch-*.jpg`, and both the page title and the OG
 * description named the reference build's record label. `public/` is
 * client-owned, so those four paths 404 in every client repo — the module
 * rendered four broken images captioned with somebody else's brand.
 *
 * Everything is optional. With no previews the page shows its coming-soon state,
 * which is what a client who has just enabled the module should see.
 */
export const merchPreviewSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
});

export const merchSchema = z.object({
  /** Falls back to the label's name, then the site's. */
  storeName: z.string().default(""),
  description: z.string().default(""),
  /** External storefront, if the merch lives somewhere else. */
  storeUrl: z.string().optional(),
  previews: z.array(merchPreviewSchema).default([]),
});

export type MerchPreview = z.infer<typeof merchPreviewSchema>;
export type MerchContent = z.infer<typeof merchSchema>;
