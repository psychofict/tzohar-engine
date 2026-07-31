// The Vault — superfan ("Inner Circle") drops feed. These items render
// locked/teased until a fan joins, then unlock. Edit freely: add a drop by
// pushing to `vaultDrops`. Dates are static ISO strings (no runtime clock) to
// keep server/client render identical.
//
// `type` drives the icon + accent. `cta` is optional; when present the unlocked
// card shows a button linking to `href` (use a real URL, an internal path, or
// "#" as a placeholder until the asset is ready).

export type DropType = "unreleased" | "presale" | "bts" | "download" | "event";

export interface VaultDrop {
  id: string;
  type: DropType;
  date: string; // ISO yyyy-mm-dd
  title: string;
  description: string;
  cta?: string;
  href?: string;
  /** "free" drops are public; "insider" drops unlock only for paid members. */
  tier: "free" | "insider";
}

export const vaultDrops: VaultDrop[] = [
  {
    id: "next-single-first-listen",
    tier: "insider",
    type: "unreleased",
    date: "2026-06-20",
    title: "First listen — the next single",
    description:
      "A 60-second preview of the unreleased single, shared with the Inner Circle before anyone else. Pre-save unlocks the full drop on release day.",
    cta: "Pre-save on Spotify",
    href: "https://open.spotify.com/artist/4mH71Zjiq36Q3SI7IZIBQK",
  },
  {
    id: "tour-presale",
    tier: "insider",
    type: "presale",
    date: "2026-06-12",
    title: "Tour presale access",
    description:
      "48-hour head start on tickets for the next run of shows, plus the Inner Circle presale code. Tickets go public after the window closes.",
    cta: "View tour dates",
    href: "/tour",
  },
  {
    id: "southern-africa-bts",
    tier: "free",
    type: "bts",
    date: "2026-05-28",
    title: "Behind the scenes — Southern Africa Tour",
    description:
      "Unseen photos and road notes from the 2025 run. The full set lives in the gallery — this is the director's cut.",
    cta: "Open the gallery",
    href: "/gallery",
  },
  {
    id: "echoes-digital-booklet",
    tier: "insider",
    type: "download",
    date: "2026-05-10",
    title: "Echoes of Love — digital booklet",
    description:
      "The full lyric sheet and artwork as a downloadable booklet. A small thank-you for being early.",
    cta: "Download",
    href: "#",
  },
  {
    id: "studio-livestream",
    tier: "insider",
    type: "event",
    date: "2026-04-30",
    title: "Studio livestream — invite only",
    description:
      "A private listening session and Q&A from the studio. Inner Circle members get the link and a calendar hold by email.",
  },
];
