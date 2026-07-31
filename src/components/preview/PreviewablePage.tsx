"use client";

import { useSyncExternalStore } from "react";
import type { SitePage } from "@tzohar/schema";
import ComposedPage, { type BlockData } from "@/components/blocks/BlockRenderer";
import {
  subscribePreview,
  getPreviewDraft,
  getPreviewServerSnapshot,
} from "@/lib/preview-store";

/**
 * A composed page that Studio can take over.
 *
 * Renders the published page normally. When a Studio draft for THIS slug
 * arrives, it renders that instead — through the same `ComposedPage`, so what
 * the operator sees is the real renderer with real motion, not a mock-up.
 *
 * The slug check is the whole safety of it: Studio previews one page at a time
 * and a stale draft for a different page must never leak into this route.
 */
export default function PreviewablePage({
  slug,
  page,
  data,
}: {
  slug: string;
  page: SitePage;
  data?: BlockData;
}) {
  const draft = useSyncExternalStore(subscribePreview, getPreviewDraft, getPreviewServerSnapshot);
  const override = draft.page && draft.page.slug === slug ? draft.page : null;
  return <ComposedPage page={override ?? page} data={data} />;
}
