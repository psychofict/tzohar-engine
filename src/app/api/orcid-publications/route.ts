import { NextResponse } from "next/server";

/**
 * Live publications for the `research` module's Publications tab, sourced
 * from ORCID's public read API — no OAuth needed (unlike Spotify's
 * client-credentials flow), since https://pub.orcid.org is unauthenticated.
 * Same in-memory cache-with-TTL + Cache-Control shape as
 * src/app/api/spotify-albums/route.ts, simplified by dropping the token cache.
 */

interface OrcidWork {
  title: string;
  journal: string | null;
  type: string | null;
  year: string | null;
  doi: string | null;
  url: string | null;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const cache = new Map<string, { data: OrcidWork[]; expiry: number }>();

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

function extractDoi(work: Record<string, unknown>): string | null {
  const ids = (work["external-ids"] as { "external-id"?: unknown[] } | undefined)?.["external-id"];
  if (!Array.isArray(ids)) return null;
  const doi = ids.find((i) => (i as { "external-id-type"?: string })["external-id-type"] === "doi") as
    | { "external-id-value"?: string }
    | undefined;
  return doi?.["external-id-value"] ?? null;
}

function toWork(summary: Record<string, unknown>): OrcidWork {
  const title = (summary.title as { title?: { value?: string } } | undefined)?.title?.value ?? "Untitled";
  const journal = (summary["journal-title"] as { value?: string } | undefined)?.value ?? null;
  const type = (summary.type as string | undefined) ?? null;
  const year = (summary["publication-date"] as { year?: { value?: string } } | undefined)?.year?.value ?? null;
  const doi = extractDoi(summary);
  const url = (summary.url as { value?: string } | undefined)?.value ?? (doi ? `https://doi.org/${doi}` : null);
  return { title, journal, type, year, doi, url };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !ORCID_RE.test(id)) {
    return NextResponse.json({ error: "Missing or invalid ORCID id" }, { status: 400 });
  }

  const cached = cache.get(id);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(
      { works: cached.data },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } },
    );
  }

  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${id}/works`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "ORCID lookup failed", works: [] }, { status: 502 });
    }
    const body = (await res.json()) as { group?: Record<string, unknown>[] };
    const works = (body.group ?? [])
      .map((g) => (g["work-summary"] as Record<string, unknown>[] | undefined)?.[0])
      .filter((s): s is Record<string, unknown> => !!s)
      .map(toWork)
      .sort((a, b) => (b.year ?? "").localeCompare(a.year ?? ""));

    cache.set(id, { data: works, expiry: Date.now() + CACHE_DURATION });
    return NextResponse.json(
      { works },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800" } },
    );
  } catch {
    return NextResponse.json({ error: "ORCID lookup failed", works: [] }, { status: 502 });
  }
}
