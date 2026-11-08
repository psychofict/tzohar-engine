/* eslint-disable */
// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// The shared Ebenworks email block library. Edit the source in the integration
// kit and re-run the sync; an edit here is overwritten and takes the fix away
// from every other product, which is the exact failure this file exists to end.
//
//   source: products/accounts-hub/integration-kit/email/blocks.ts
//   colours: products/accounts-hub/integration-kit/theme/tokens.json
//   sync:   infra/scripts/sync-email-kit.py
//   check:  infra/scripts/sync-email-kit.py --check
//   sha256: a3676aaed9a97934
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Ebenworks email block library.
 *
 * A mail client is not a browser. Outlook renders through Word, Gmail strips
 * <style> on some paths and every class on others, and no client resolves a CSS
 * variable. So everything here is a table with inline literal values, one column
 * at most 600px wide, and a system font stack. Boring beats clever: the reader on
 * a cheap Android handset is the case that has to work.
 *
 * The one idea worth stating. Every block returns BOTH parts:
 *
 *     { html, text }
 *
 * A template composes its block list once and two renderers walk the same list,
 * so the plain-text part is required by the type rather than by discipline. This
 * exists because the fleet's text parts were derived from the markup by the
 * sending service, and a key-value table, a line-item list and a one-time code
 * each need a different text shape — a stripper cannot know which it is holding.
 *
 * Three rules that are easy to get wrong:
 *
 *  - Escape every interpolated value. A customer controls their own name and
 *    their business name, and both land in this HTML. `esc()` is not optional.
 *  - Never let a sentence depend on an image. Most clients block images on a
 *    first send, so the logo's alt text is the wordmark and nothing below reads
 *    differently when the pictures do not arrive.
 *  - `accent` paints graphics. `accentText` is the only value allowed under type
 *    and the only ground allowed behind white type. See tokens.json's
 *    $accentRule: most product accents fail 4.5:1 as small text.
 */

/* TOKENS:BEGIN — generated from integration-kit/theme/tokens.json by
   infra/scripts/sync-email-kit.py. Do not edit between these markers. */
export const T = {
  width: 600,
  font: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  fontKo: "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','맑은 고딕',Roboto,Helvetica,Arial,sans-serif",
  mono: "ui-monospace,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace",
  page: "#f4f4f4",
  card: "#ffffff",
  band: "#eaeaea",
  ink: "#16100a",
  inkSoft: "#28282b",
  inkMuted: "#595550",
  inkFaint: "#6f695f",
  rule: "#e3e3e3",
  footerBg: "#eaeaea",
  footerText: "#16100a",
  footerMuted: "#595550",
  footerLink: "#b23700",
} as const;

export type IdentityKey =
  | "ebenworks" | "accounts" | "imali" | "chingu" | "phila" | "bidwright"
  | "izwi" | "tzohar" | "statosports" | "azdates" | "esotericones" | "diaspry";

export const IDENTITIES: Record<IdentityKey, { name: string; accent: string; accentText: string; site: string }> = {
  ebenworks: { name: "Ebenworks", accent: "#fc5f00", accentText: "#b23700", site: "ebenworks.co" },
  accounts: { name: "Ebenworks Accounts", accent: "#fc5f00", accentText: "#b23700", site: "accounts.ebenworks.co" },
  imali: { name: "Imali AI", accent: "#00a651", accentText: "#008842", site: "imali-ai.ebenworks.co" },
  chingu: { name: "Chingu Care AI", accent: "#c4613a", accentText: "#b85b37", site: "chingu-ai.ebenworks.co" },
  phila: { name: "Phila Health Ecosystem", accent: "#2f8f5b", accentText: "#2c8656", site: "phila-health.ebenworks.co" },
  bidwright: { name: "BidWright Tender AI", accent: "#2563eb", accentText: "#2563eb", site: "bidwright-ai.ebenworks.co" },
  izwi: { name: "Izwi Music OS", accent: "#c2873b", accentText: "#9b6c2f", site: "izwi-os.ebenworks.co" },
  tzohar: { name: "Tzohar Sites", accent: "#7c5cff", accentText: "#7655ff", site: "tzohar-sites.ebenworks.co" },
  statosports: { name: "StatoSports", accent: "#dc2626", accentText: "#dc2626", site: "statosports.statotec.com" },
  azdates: { name: "A–Z Dates", accent: "#fb4a8d", accentText: "#e5055a", site: "az.dates" },
  esotericones: { name: "The ESØTËRIC Ones", accent: "#e63057", accentText: "#e4214b", site: "esotericones.com" },
  diaspry: { name: "Diaspry Community OS", accent: "#3e8a66", accentText: "#3a8260", site: "diaspry.ebenworks.co" },
};
/* TOKENS:END */

/** Both halves of one piece of a message. Neither is optional. */
export type Block = { html: string; text: string };

/** Who the message is from. A tenant deployment may override the accent pair. */
export type Identity = {
  key: IdentityKey;
  /** Overrides, for a product whose accent belongs to the tenant rather than to us. */
  name?: string;
  accent?: string;
  accentText?: string;
  site?: string;
  /** Absolute URL. A relative asset URL in an email is always broken. */
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
};

export function identity(id: Identity) {
  const base = IDENTITIES[id.key];
  return {
    name: id.name ?? base.name,
    accent: id.accent ?? base.accent,
    accentText: id.accentText ?? base.accentText,
    site: id.site ?? base.site,
    logoUrl: id.logoUrl,
    logoWidth: id.logoWidth ?? 210,
    logoHeight: id.logoHeight ?? 127,
  };
}

/** Escape a raw string for safe interpolation into email HTML. */
export function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wrap a plain-text paragraph at 72 columns, the width a mail reader assumes. */
export function wrap(s: string, width = 72): string {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    if (!para.trim()) { out.push(""); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (line && line.length + 1 + word.length > width) { out.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) out.push(line);
  }
  return out.join("\n");
}

/** WCAG 2 relative luminance of a #rrggbb colour. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * A button ground under this luminance reads as dark. Light only (Eben, 12 Oct 2026,
 * EBE-1304): a brand colour used as a fill is mid-tone or bright, never a deep step.
 */
export const MIN_BUTTON_LUMINANCE = 0.16;

/**
 * The fill and type colour for a call to action. A product's accentText with white
 * type, unless that ground is deep: then the identity's own accent with ink type, the
 * company's primary action (infra/docs/BRAND.md, "Light only": orange with ink).
 */
export function buttonColours(accentText: string): { fill: string; type: string } {
  if (luminance(accentText) >= MIN_BUTTON_LUMINANCE) return { fill: accentText, type: "#ffffff" };
  const id = Object.values(IDENTITIES).find(
    (i) => i.accentText.toLowerCase() === accentText.toLowerCase() &&
      luminance(i.accent) >= MIN_BUTTON_LUMINANCE && contrast(i.accent, T.ink) >= 4.5,
  );
  return id ? { fill: id.accent, type: T.ink } : { fill: accentText, type: "#ffffff" };
}

/* ── blocks ──────────────────────────────────────────────────────────────── */
/* Each takes ALREADY-ESCAPED html where the parameter is named `html`, and a
   raw string where it is named `text`. Keeping that in the parameter names is
   what stops an unescaped value reaching the markup. */

export const b = {
  /** A paragraph. `text` defaults to the markup with its tags removed. */
  p(html: string, text?: string): Block {
    return {
      html: `<p style="margin:0 0 14px;font-family:${T.font};font-size:16px;line-height:1.62;color:${T.inkSoft};">${html}</p>`,
      text: wrap(text ?? strip(html)),
    };
  },

  /** The lead sentence under a heading. One per message, at most. */
  lead(html: string, text?: string): Block {
    return {
      html: `<p style="margin:0 0 18px;font-family:${T.font};font-size:17px;line-height:1.5;color:${T.inkMuted};">${html}</p>`,
      text: wrap(text ?? strip(html)),
    };
  },

  /** Small print: a legal line, a retention period, a "you received this because". */
  note(html: string, text?: string): Block {
    return {
      html: `<p style="margin:0 0 12px;font-family:${T.font};font-size:13px;line-height:1.55;color:${T.inkFaint};">${html}</p>`,
      text: wrap(text ?? strip(html)),
    };
  },

  h2(html: string, text?: string): Block {
    const t = text ?? strip(html);
    return {
      html: `<h2 style="margin:26px 0 10px;font-family:${T.font};font-size:18px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${T.ink};">${html}</h2>`,
      text: `${t}\n${"-".repeat(Math.min(t.length, 72))}`,
    };
  },

  /** An eyebrow over a section. Uses accentText, never accent: it is type. */
  eyebrow(accentText: string, html: string, text?: string): Block {
    return {
      html: `<h3 style="margin:16px 0 5px;font-family:${T.font};font-size:13px;line-height:1.4;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${accentText};">${html}</h3>`,
      text: (text ?? strip(html)).toUpperCase(),
    };
  },

  bullets(items: string[], textItems?: string[]): Block {
    const raw = textItems ?? items.map(strip);
    return {
      html: `<ul style="margin:0 0 14px;padding-left:20px;font-family:${T.font};font-size:16px;line-height:1.62;color:${T.inkSoft};">${
        items.map(i => `<li style="margin:5px 0;">${i}</li>`).join("")}</ul>`,
      text: raw.map(i => `  * ${wrap(i, 68).replace(/\n/g, "\n    ")}`).join("\n"),
    };
  },

  divider(): Block {
    return {
      html: `<div style="border-top:1px solid ${T.rule};margin:22px 0;font-size:0;line-height:0;">&nbsp;</div>`,
      text: "-".repeat(72),
    };
  },

  /**
   * The call to action. The ground is accentText, not accent, because the type
   * on it is white: accent alone fails 4.5:1 for most products. Outlook squares
   * off the radius and keeps the link, which is the degradation we want.
   * A deep accentText (Ebenworks' #b23700) is not a button ground: see buttonColours.
   */
  button(accentText: string, href: string, label: string): Block {
    const { fill, type } = buttonColours(accentText);
    return {
      html: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;"><tr>` +
        `<td align="center" bgcolor="${fill}" style="background:${fill};border-radius:999px;">` +
        `<a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${T.font};font-size:15px;font-weight:600;line-height:1;color:${type};text-decoration:none;border-radius:999px;">${esc(label)} &rarr;</a>` +
        `</td></tr></table>`,
      text: `${label}:\n${href}`,
    };
  },

  /** Label/value rows. In text these become aligned "Label: value" lines. */
  keyValue(rows: [string, string][]): Block {
    const pad = Math.max(0, ...rows.map(([k]) => k.length));
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:collapse;">${
        rows.map(([k, v]) =>
          `<tr>` +
          `<td bgcolor="${T.page}" style="padding:8px 12px;background:${T.page};border:1px solid ${T.rule};font-family:${T.font};font-size:13px;font-weight:600;color:${T.inkMuted};white-space:nowrap;vertical-align:top;">${esc(k)}</td>` +
          `<td style="padding:8px 12px;border:1px solid ${T.rule};font-family:${T.font};font-size:14px;color:${T.ink};vertical-align:top;">${esc(v) || "&mdash;"}</td>` +
          `</tr>`).join("")}</table>`,
      text: rows.map(([k, v]) => `${k.padEnd(pad)}  ${v || "—"}`).join("\n"),
    };
  },

  /** A line-item list: description on the left, amount on the right. */
  lineItems(items: { label: string; amount: string }[], total?: { label: string; amount: string }): Block {
    const pad = Math.max(0, ...items.map(i => i.label.length), total ? total.label.length : 0);
    const row = (label: string, amount: string, strong: boolean) =>
      `<tr>` +
      `<td style="padding:9px 0;border-bottom:1px solid ${T.rule};font-family:${T.font};font-size:14px;line-height:1.5;color:${strong ? T.ink : T.inkSoft};${strong ? "font-weight:700;" : ""}">${esc(label)}</td>` +
      `<td align="right" style="padding:9px 0;border-bottom:1px solid ${T.rule};font-family:${T.font};font-size:14px;line-height:1.5;color:${strong ? T.ink : T.inkSoft};${strong ? "font-weight:700;" : ""}white-space:nowrap;">${esc(amount)}</td>` +
      `</tr>`;
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;border-collapse:collapse;">${
        items.map(i => row(i.label, i.amount, false)).join("")}${total ? row(total.label, total.amount, true) : ""}</table>`,
      text: [...items.map(i => `${i.label.padEnd(pad)}  ${i.amount}`),
             ...(total ? ["-".repeat(pad + 12), `${total.label.padEnd(pad)}  ${total.amount}`] : [])].join("\n"),
    };
  },

  /**
   * A header row and body rows. For a spec table, not for label/value pairs —
   * use keyValue for those. In text the columns are padded to their widest cell,
   * which is the only shape that survives a monospaced reader.
   */
  dataTable(accentText: string, headers: string[], rows: string[][]): Block {
    const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] ?? "").length || 1)));
    const line = (cells: string[]) => cells.map((c, i) => (c || "\u2014").padEnd(widths[i]!)).join("  ");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border-collapse:collapse;">` +
        `<tr>${headers.map(h =>
          `<th align="left" bgcolor="${T.band}" style="text-align:left;background:${T.band};border:1px solid ${T.rule};padding:7px 9px;font-family:${T.font};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${accentText};">${esc(h)}</th>`).join("")}</tr>` +
        rows.map(r => `<tr>${r.map(c =>
          `<td style="border:1px solid ${T.rule};padding:7px 9px;font-family:${T.font};font-size:13px;line-height:1.5;color:${T.inkSoft};white-space:pre-wrap;vertical-align:top;">${esc(c) || "&mdash;"}</td>`).join("")}</tr>`).join("") +
        // Closed, as in blocks.py: an open table made a browser lift the next paragraph above it (EBE-2295).
        `</table>`,
      text: [line(headers), widths.map(w => "-".repeat(w)).join("  "), ...rows.map(line)]
        .map(row => row.replace(/\s+$/, "")).join("\n"),
    };
  },

  /**
   * A one-time code. It gets its own shape in text as well, because a code run
   * into a sentence is the thing people mistype.
   */
  code(value: string, caption?: string): Block {
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>` +
        `<td align="center" bgcolor="${T.band}" style="background:${T.band};border-radius:10px;padding:18px 12px;">` +
        `<div style="font-family:${T.mono};font-size:28px;font-weight:700;letter-spacing:0.22em;color:${T.ink};">${esc(value)}</div>` +
        (caption ? `<div style="margin-top:8px;font-family:${T.font};font-size:12px;line-height:1.5;color:${T.inkFaint};">${esc(caption)}</div>` : "") +
        `</td></tr></table>`,
      text: `\n    ${value}\n${caption ? `\n${wrap(caption)}\n` : ""}`,
    };
  },

  /** A quoted free-text block: a contact message, a client note, a reply. */
  quote(accent: string, text: string): Block {
    return {
      // A one-cell table, not a division: Outlook drops a div's background AND its
      // left border, which is the whole visual idea of a quote.
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>` +
        `<td width="3" bgcolor="${accent}" style="width:3px;background:${accent};font-size:0;line-height:0;">&nbsp;</td>` +
        `<td bgcolor="${T.page}" style="background:${T.page};padding:14px 16px;font-family:${T.font};font-size:15px;line-height:1.6;color:${T.inkSoft};white-space:pre-wrap;">${esc(text)}</td>` +
        `</tr></table>`,
      text: text.split("\n").map(line => `> ${line}`).join("\n"),
    };
  },

  /** Raw markup with a text twin the caller supplies. The escape hatch. */
  raw(html: string, text: string): Block {
    return { html, text };
  },
};

/** The entities our own blocks emit. A text part showing "&middot;" is the bug
 *  this table exists to stop; it reached a fixture before it reached an inbox. */
const ENTITY = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  mdash: "\u2014", ndash: "\u2013", middot: "\u00b7", hellip: "\u2026",
  rsquo: "\u2019", lsquo: "\u2018", ldquo: "\u201c", rdquo: "\u201d",
  times: "\u00d7", rarr: "->",
} as const;

/** Remove every tag. One pass of this pattern leaves no whole tag; the loop keeps that true if the pattern is ever narrowed, and code scanning reads it as a full strip. */
function withoutTags(s: string): string {
  let prev: string;
  do {
    prev = s;
    s = s.replace(/<[^>]+>/g, "");
  } while (s !== prev);
  return s;
}

/** Strip tags for the default text twin. Only ever used on markup we built. */
function strip(html: string): string {
  return withoutTags(html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m, href, label) => `${label} (${href})`))
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&(nbsp|amp|lt|gt|quot|apos|mdash|ndash|middot|hellip|rsquo|lsquo|ldquo|rdquo|times|rarr);/g,
      (_m, name) => ENTITY[name as keyof typeof ENTITY])
    .trim();
}

/**
 * The shell's one style block: on a screen under 620px the page margin and the
 * card's side padding narrow, so a 390px phone gets about 330px of text instead of
 * 286px. Classes only, no colours: Gmail drops the block on some paths, and the
 * inline padding it falls back to is still a fluid column.
 */
const SHELL_STYLE = `<style>
@media only screen and (max-width:620px){
  .ew-outer{padding:16px 8px !important;}
  .ew-pad{padding-left:22px !important;padding-right:22px !important;}
}
</style>`;

/**
 * Every brand picture a mail shows is a linked https picture from the mail picture host: a private bucket behind
 * its own CDN name, apart from every site and domain of ours, and no picture rides inside a message (EBE-9568,
 * Eben 5 Nov 2026). The Gmail iPhone app never fetches a nameless inline picture and lists a named one as an
 * attachment, so neither inline form showed the brand there. A file's name holds the first 12 hex of its
 * SHA-256 and is never changed or deleted, so a mail keeps the picture it was sent with; a new picture is a new
 * file, a new row here and a new kit version. The table holds each name's current file and is generated from
 * mail-pictures.json (infra/scripts/mail-pictures.py build --hub) by infra/scripts/sync-email-kit.py.
 */
/* MAIL_PICTURES:BEGIN — generated from integration-kit/email/mail-pictures.json by
   infra/scripts/sync-email-kit.py. Do not edit by hand. */
export const MAIL_PICTURE_BASE = "https://d2206v2aiz5pdr.cloudfront.net";
export const MAIL_PICTURES = {
  "azdates-icon": { file: "m/azdates-icon-f1177ba85edc.png", width: 192, height: 192, alt: "A–Z Dates app icon", altKo: "A–Z Dates 앱 아이콘" },
  "bidwright-lockup": { file: "m/bidwright-lockup-7031f90c18f0.png", width: 520, height: 136, alt: "BidWright Tender AI", altKo: "" },
  "chingu-logo": { file: "m/chingu-logo-5cd05deb2279.png", width: 192, height: 192, alt: "Chingu Care AI logo", altKo: "친구케어 AI 로고" },
  "ebenworks-email-strip": { file: "m/ebenworks-email-strip-f057c713d56d.png", width: 680, height: 152, alt: "Ebenworks. AI for the people who run the world.", altKo: "" },
  "ebenworks-joint-stamp": { file: "m/ebenworks-joint-stamp-553c2df73827.png", width: 556, height: 140, alt: "A joint product of Ebenworks and Statotech Systems", altKo: "Ebenworks와 Statotech Systems의 공동 제품" },
  "ebenworks-lockup": { file: "m/ebenworks-lockup-d5640b439e5a.png", width: 900, height: 121, alt: "Ebenworks", altKo: "" },
  "ebenworks-logo": { file: "m/ebenworks-logo-3fe140dd5725.png", width: 420, height: 254, alt: "Ebenworks", altKo: "" },
  "ebenworks-stamp": { file: "m/ebenworks-stamp-90382a070010.png", width: 364, height: 126, alt: "An Ebenworks product", altKo: "Ebenworks의 제품" },
  "imali-ai-logo": { file: "m/imali-ai-logo-0b6d4d27f9b8.png", width: 464, height: 143, alt: "Imali AI", altKo: "" },
  "imali-welcome-business": { file: "m/imali-welcome-business-7bc701535790.jpg", width: 640, height: 494, alt: "", altKo: "" },
  "imali-welcome-chat": { file: "m/imali-welcome-chat-1c67bb70fe12.jpg", width: 640, height: 368, alt: "", altKo: "" },
  "imali-welcome-scale": { file: "m/imali-welcome-scale-d75e4d2ba435.jpg", width: 640, height: 512, alt: "", altKo: "" },
  "imali-welcome-solo": { file: "m/imali-welcome-solo-55f6eb392e20.jpg", width: 640, height: 296, alt: "", altKo: "" },
  "imali-welcome-team": { file: "m/imali-welcome-team-bc500fdf0ae4.jpg", width: 640, height: 508, alt: "", altKo: "" },
  "imali-welcome-trade": { file: "m/imali-welcome-trade-c64c3fdf747f.jpg", width: 640, height: 478, alt: "", altKo: "" },
  "izwi-lockup": { file: "m/izwi-lockup-b45c7fa4447a.png", width: 240, height: 203, alt: "Izwi Music OS", altKo: "" },
  "phila-logo": { file: "m/phila-logo-35afe80b8c24.png", width: 420, height: 120, alt: "Phila Health Ecosystem", altKo: "" },
  "tzohar-logo": { file: "m/tzohar-logo-b916c43a89ea.png", width: 340, height: 185, alt: "Tzohar Sites", altKo: "" },
} as const;
/* MAIL_PICTURES:END */

export type MailPictureName = keyof typeof MAIL_PICTURES;

/** Today's address of one brand picture on the mail picture host. */
export function mailPictureUrl(name: MailPictureName): string {
  return `${MAIL_PICTURE_BASE}/${MAIL_PICTURES[name].file}`;
}

/**
 * The stamp every product email carries (SO-39, Eben 22 Oct 2026): "An Ebenworks product", or the
 * joint stamp on a product Ebenworks builds with Statotech Systems. Mail clients show no SVG, so
 * each is a 2x PNG drawn from theme/EbenworksStamp.tsx and theme/JointStamp.tsx by
 * ebenworks-website's scripts/assets/build-email-stamps.mjs and linked from the mail picture host.
 * Keep the copies the company site serves at /brand/email/: older mail links them. The company's
 * own mail and the label's carry none: neither is a product's.
 *
 * The height is pixels, never auto, and the style sets a font size and a colour: a client that
 * holds linked pictures back, or cannot fetch one, shows the brand line in a box of the stamp's size.
 */
export const STAMP_HREF = "https://ebenworks.co";
export const STAMPS = {
  product: { src: mailPictureUrl("ebenworks-stamp"), width: 182, height: 63,
    alt: "An Ebenworks product", ko: "Ebenworks의 제품" },
  joint: { src: mailPictureUrl("ebenworks-joint-stamp"), width: 278, height: 70,
    alt: "A joint product of Ebenworks and Statotech Systems", ko: "Ebenworks와 Statotech Systems의 공동 제품" },
} as const;

export const STAMP_OF: Record<IdentityKey, keyof typeof STAMPS | null> = {
  ebenworks: null, accounts: "product", imali: "product", chingu: "product", phila: "product", bidwright: "product",
  izwi: "product", tzohar: "joint", statosports: "joint", azdates: "product", esotericones: null, diaspry: "joint",
};

/** A sender's stamp as both parts, linked to the company site; null where its mail carries none. */
export function productStamp(key: IdentityKey, ko = false, margin = "0 0 16px"): Block | null {
  const which = STAMP_OF[key];
  if (!which) return null;
  const s = STAMPS[which];
  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:${margin};"><tr><td>` +
      `<a href="${STAMP_HREF}" style="display:inline-block;text-decoration:none;border:0;">` +
      `<img src="${s.src}" width="${s.width}" height="${s.height}" alt="${s.alt}" ` +
      `style="display:block;width:${s.width}px;height:${s.height}px;border:0;outline:none;text-decoration:none;` +
      `font-size:12px;color:${T.inkMuted};"></a></td></tr></table>`,
    text: `${ko ? s.ko : s.alt}: ${STAMP_HREF}`,
  };
}

/**
 * The shape of a picture a message used to carry inside itself (kit 1.10.0 to 1.13.0). Kept so that a
 * caller's own picture table still compiles; since kit 1.14.0 nothing is sent from it.
 */
export type InlineImage = { url: string; contentId: string; filename: string; contentType: string; content: string };

/** One inline part in the Resend SDK's shape. Kit 1.14.0 makes none; the type stays for callers. */
export type InlineAttachment = { content: string; contentType: string; contentId: string };

/**
 * Kept so every caller still compiles, and returns no attachments. Since kit 1.14.0 a message carries no
 * picture inside itself; each `img` names its picture on the mail picture host (`mailPictureUrl`). A row of
 * `extra` whose `contentId` is a picture name on the host (`tzohar-logo`, `izwi-lockup`...) has its `url`
 * in a `src` replaced by that picture's host address, where kit 1.13.0 put `cid:`; any other row is left
 * linked from its own `url`. A caller can drop the call and its attachments.
 */
export function inlineImages(html: string, extra: InlineImage[] = []): { html: string; attachments: InlineAttachment[] } {
  for (const row of extra) {
    if (!row.url || !Object.prototype.hasOwnProperty.call(MAIL_PICTURES, row.contentId)) continue;
    const to = mailPictureUrl(row.contentId as MailPictureName);
    html = html.split(`src="${row.url}"`).join(`src="${to}"`).split(`src='${row.url}'`).join(`src='${to}'`);
  }
  return { html, attachments: [] };
}

/** An inline part in Resend's REST shape (`POST /emails`). Kept for callers; kit 1.14.0 makes none. */
export function restAttachment(a: InlineAttachment): { content: string; content_type: string; content_id: string } {
  return { content: a.content, content_type: a.contentType, content_id: a.contentId };
}

export type EmailOpts = {
  identity: Identity;
  /** <title>, and the preview line's fallback. */
  title: string;
  /** The hidden line the inbox shows beside the subject. Always set it. */
  preheader?: string;
  heading?: string;
  blocks: Block[];
  /** A line under the name in the footer. The company tagline, or a product's. */
  tagline?: string;
  /** Footer links beyond the site itself. */
  links?: { label: string; href: string }[];
  /** A one-click unsubscribe target for anything that is not transactional. */
  unsubscribeUrl?: string;
  /** Why this person is receiving this. Required for anything not transactional. */
  reason?: string;
  lang?: string;
};

/**
 * Render both parts of a message from one block list.
 *
 * The shell is a table, not a division: Outlook ignores max-width on a div and
 * the message goes full-bleed. Both colour-scheme metas are declared so a client
 * in dark mode leaves our light values alone rather than inverting them badly.
 *
 * The column is fluid: width 100%, at most T.width (600px). A fixed 600px table made
 * a 390px phone shrink the whole message to fit, so 16px body type read at about
 * 10px (EBE-1667). Classic Outlook ignores max-width, so a conditional fixed-width
 * table holds it at 600px there. The style block only narrows the padding on a
 * phone; a client that drops it keeps the inline padding and a fluid column.
 */
export function renderEmail(opts: EmailOpts): { html: string; text: string } {
  const id = identity(opts.identity);
  const year = new Date().getUTCFullYear();
  const ko = opts.lang?.startsWith("ko");
  const font = ko ? T.fontKo : T.font;
  // Korean keeps each word whole: by default a phone breaks between any two syllables, so a
  // footer read "...보내 드리는 메일입니" / "다." at 390px (EBE-2295). keep-all breaks only
  // at spaces. The body blocks were built before the language was known, so in a Korean
  // message their Latin stack is swapped for the Korean one with keep-all beside it; a
  // block that already names the Korean stack is left as it is. English output is unchanged.
  const ff = `font-family:${font};${ko ? "word-break:keep-all;" : ""}`;
  const latin = `font-family:${T.font};`;
  const preheader = opts.preheader || opts.title;
  const stamp = productStamp(opts.identity.key, !!ko, "4px 0 14px");
  // The opt-out link reads in the message's language, as the record editions' footer does.
  const unsubWord = ko ? KO_WORDS.unsub : EN_WORDS.unsub;

  const footerLinks = [
    { label: id.site, href: `https://${id.site}` },
    ...(opts.links ?? []),
  ];

  const html = `<!DOCTYPE html>
<html lang="${esc(opts.lang ?? "en")}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(opts.title)}</title>
${SHELL_STYLE}
</head>
<body bgcolor="${T.page}" style="margin:0;padding:0;background:${T.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${esc(preheader)}${PREHEADER_FILL}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${T.page}" style="background:${T.page};margin:0;padding:0;">
<tr><td align="center" class="ew-outer" style="padding:30px 16px;">
<!--[if mso]><table role="presentation" width="${T.width}" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:${T.width}px;border-collapse:separate;">
  <tr><td bgcolor="${id.accent}" style="height:5px;background:${id.accent};border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td align="center" bgcolor="${T.card}" class="ew-pad" style="background:${T.card};padding:30px 36px 18px;">
    ${id.logoUrl
      ? `<img src="${esc(id.logoUrl)}" alt="${esc(id.name)}" width="${id.logoWidth}" height="${id.logoHeight}" style="width:${id.logoWidth}px;height:auto;max-width:62%;display:inline-block;border:0;outline:none;text-decoration:none;font-family:${T.font};font-size:18px;font-weight:800;color:${T.ink};">`
      : `<div style="${ff}font-size:20px;font-weight:800;letter-spacing:-0.01em;color:${T.ink};">${esc(id.name)}</div>`}
  </td></tr>
  <tr><td bgcolor="${T.card}" class="ew-pad" style="background:${T.card};padding:0 36px;"><div style="border-top:1px solid ${T.rule};font-size:0;line-height:0;">&nbsp;</div></td></tr>
  <tr><td bgcolor="${T.card}" class="ew-pad" style="background:${T.card};padding:26px 36px 34px;">
    ${opts.heading ? `<h1 style="margin:0 0 16px;${ff}font-size:23px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:${T.ink};">${opts.heading}</h1>` : ""}
    ${opts.blocks.map(block => (ko ? block.html.split(latin).join(ff) : block.html)).join("\n    ")}
  </td></tr>
  <tr><td bgcolor="${T.footerBg}" class="ew-pad" style="background:${T.footerBg};padding:24px 36px 26px;border-radius:0 0 16px 16px;">
    <p style="margin:0 0 5px;${ff}font-size:14px;font-weight:700;letter-spacing:0.02em;color:${T.footerText};">${esc(id.name)}</p>
    ${opts.tagline ? `<p style="margin:0 0 12px;${ff}font-size:12px;line-height:1.5;color:${T.footerMuted};">${esc(opts.tagline)}</p>` : ""}
    ${opts.reason ? `<p style="margin:0 0 10px;${ff}font-size:12px;line-height:1.5;color:${T.footerMuted};">${esc(opts.reason)}</p>` : ""}
    <p style="margin:0 0 10px;${ff}font-size:12px;line-height:1.6;">${
      footerLinks.map(l => `<a href="${esc(l.href)}" style="color:${T.footerLink};text-decoration:none;">${esc(l.label)}</a>`)
        .join(`<span style="color:${T.footerMuted};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`)}</p>
    ${opts.unsubscribeUrl ? `<p style="margin:0 0 10px;${ff}font-size:12px;line-height:1.6;"><a href="${esc(opts.unsubscribeUrl)}" style="color:${T.footerMuted};text-decoration:underline;">${unsubWord}</a></p>` : ""}
    ${stamp ? stamp.html : ""}
    <p style="margin:0;${ff}font-size:11px;color:${T.footerMuted};">© ${year} Ebenworks Systems (Pvt) Ltd</p>
  </td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    id.name.toUpperCase(),
    "=".repeat(Math.min(id.name.length, 72)),
    "",
    ...(opts.heading ? [wrap(strip(opts.heading)), ""] : []),
    // A blank line between blocks. Without it the text part reads as a flattened
    // table rather than a letter, which is the failure this whole pairing exists
    // to fix: a stripper produced one run-on line and nobody read it.
    ...opts.blocks.flatMap(block => (block.text === "" ? [] : [block.text, ""])),
    "-".repeat(72),
    ...(opts.tagline ? [opts.tagline] : []),
    ...(opts.reason ? [wrap(opts.reason)] : []),
    footerLinks.map(l => l.href).join("  ·  "),
    ...(opts.unsubscribeUrl ? [`${unsubWord}: ${opts.unsubscribeUrl}`] : []),
    ...(stamp ? [stamp.text] : []),
    `© ${year} Ebenworks Systems (Pvt) Ltd`,
    "",
  ].join("\n");

  return { html, text };
}

/* ══════════════════════════════════════════════════════════════════════════
 * THE RECORD — customer mail, approved by Eben on 20 Oct 2026.
 *
 * Account, security and billing mail from Ebenworks, and every product's own
 * service mail (welcome, support, notices), each product in its own edition.
 * Product news keeps the release-email kit above (renderEmail); this is for
 * the mail a customer gets because of something they or their account did.
 *
 * Ebenworks is "record": a white sheet with an orange ledger margin, a
 * reference strip and big figures. The editions keep that spine and change the
 * character to suit the trade: Imali AI a till slip, Chingu Care AI a family
 * letter, Phila Health Ecosystem a clinical chart, BidWright Tender AI a tender
 * dossier, Izwi Music OS liner notes, Tzohar Sites a site proof, Diaspry
 * Community OS a notice board, A–Z Dates a ticket. "tenant" is mail sent in a
 * customer's own name (a merchant's invoice), with the product footer block.
 *
 * blocks.py holds the same code; both render byte-identical output
 * (integration-kit/email/parity.mjs checks it). Change both or neither.
 * ══════════════════════════════════════════════════════════════════════════ */

export const RC = {
  sans: "-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Roboto,Arial,sans-serif",
  ksans: "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif",
  serif: "Georgia,'Iowan Old Style','Palatino Linotype',Palatino,'Times New Roman',serif",
  kserif: "'AppleMyungjo','Nanum Myeongjo','Noto Serif KR','Batang',Georgia,serif",
  mono: "'SF Mono',ui-monospace,Menlo,Consolas,'Liberation Mono','Courier New',monospace",
  ink: "#17140f",
  ink2: "#3b3630",
  muted: "#6a645b",
  faint: "#8a8378",
  hair: "#e6e1d9",
  entity: "Ebenworks Systems (Private) Limited",
  motto: "Better Products. Better People. Better Tomorrow.",
} as const;

/** What follows the preheader in the hidden preview line: characters a mail app counts but does
 *  not show, so the inbox preview ends after the preheader instead of running on into the
 *  sheet's first words (Gmail showed "ACCOUNT RE…" after a short preheader, 20 Oct 2026). */
export const PREHEADER_FILL = "&#8199;&#65279;&#847;&zwnj;&nbsp;".repeat(90);

export type EditionKey =
  | "record" | "slip" | "letter" | "chart" | "dossier" | "liner" | "proof" | "board" | "ticket" | "tenant";

export type Edition = {
  page: string; sheet: string; accent: string; text: string; fill: string; fillType: string;
  tint: string; rule: string; dashed: boolean; head: "ink2" | "dashed" | "soft" | "accent2" | "double" | "none" | "hair";
  radius: number; border: string; top: "spine" | "bar" | "tab" | "none"; face: "sans" | "serif" | "caps";
  btnRadius: number; btnFull: boolean;
};

export const EDITIONS: Record<EditionKey, Edition> = {
  record: { page: "#f0f0ee", sheet: "#ffffff", accent: "#fc5f00", text: "#b23700", fill: "#fc5f00", fillType: "#17140f",
    tint: "#ffe6d5", rule: "#e6e1d9", dashed: false, head: "ink2", radius: 0, border: "", top: "spine", face: "sans", btnRadius: 999, btnFull: false },
  slip: { page: "#eef3ef", sheet: "#ffffff", accent: "#00a651", text: "#007b3c", fill: "#007b3c", fillType: "#ffffff",
    tint: "#e8f7ee", rule: "#b9c9bf", dashed: true, head: "dashed", radius: 0, border: "", top: "bar", face: "sans", btnRadius: 12, btnFull: true },
  letter: { page: "#f2f1ef", sheet: "#fffdfa", accent: "#c4613a", text: "#a55131", fill: "#a55131", fillType: "#ffffff",
    tint: "#fde3d6", rule: "#ecd9cc", dashed: false, head: "soft", radius: 18, border: "1px solid #efe2d8", top: "none", face: "serif", btnRadius: 14, btnFull: true },
  chart: { page: "#eef2f1", sheet: "#ffffff", accent: "#2f8f5b", text: "#28794e", fill: "#28794e", fillType: "#ffffff",
    tint: "#eaf5ef", rule: "#e6e1d9", dashed: false, head: "accent2", radius: 4, border: "1px solid #dde6e2", top: "none", face: "sans", btnRadius: 8, btnFull: false },
  dossier: { page: "#eef1f6", sheet: "#ffffff", accent: "#2563eb", text: "#1f55cc", fill: "#2563eb", fillType: "#ffffff",
    tint: "#edf3ff", rule: "#e3e8f2", dashed: false, head: "accent2", radius: 12, border: "1px solid #d9e1ef", top: "tab", face: "sans", btnRadius: 8, btnFull: false },
  liner: { page: "#f1f0ee", sheet: "#fffdfb", accent: "#c2873b", text: "#8f622a", fill: "#c2873b", fillType: "#17140f",
    tint: "#f6e6c9", rule: "#eadfcd", dashed: false, head: "double", radius: 0, border: "", top: "none", face: "caps", btnRadius: 999, btnFull: false },
  proof: { page: "#f1effa", sheet: "#ffffff", accent: "#7c5cff", text: "#5b3fe0", fill: "#7655ff", fillType: "#ffffff",
    tint: "#f2eeff", rule: "#e6e1d9", dashed: false, head: "none", radius: 16, border: "", top: "none", face: "sans", btnRadius: 10, btnFull: false },
  board: { page: "#eef2ee", sheet: "#ffffff", accent: "#3e8a66", text: "#2f7553", fill: "#3a8260", fillType: "#ffffff",
    tint: "#e9f4ee", rule: "#e6e1d9", dashed: false, head: "hair", radius: 14, border: "", top: "none", face: "sans", btnRadius: 10, btnFull: false },
  ticket: { page: "#fbf0f4", sheet: "#ffffff", accent: "#fb4a8d", text: "#d6065a", fill: "#fb4a8d", fillType: "#17140f",
    tint: "#fff0f6", rule: "#e6e1d9", dashed: false, head: "ink2", radius: 20, border: "", top: "none", face: "sans", btnRadius: 999, btnFull: false },
  tenant: { page: "#f1f1ef", sheet: "#ffffff", accent: "#6a645b", text: "#3b3630", fill: "#3b3630", fillType: "#ffffff",
    tint: "#f5f5f3", rule: "#e6e1d9", dashed: true, head: "ink2", radius: 0, border: "", top: "bar", face: "sans", btnRadius: 10, btnFull: false },
};

/** The edition each sender writes in when the caller names none. */
export const EDITION_OF: Record<IdentityKey, EditionKey> = {
  ebenworks: "record", accounts: "record", imali: "slip", chingu: "letter", phila: "chart", bidwright: "dossier",
  izwi: "liner", tzohar: "proof", statosports: "record", azdates: "ticket", esotericones: "liner", diaspry: "board",
};

/** An edition with a tenant's own colours laid over it. */
export function edition(key: EditionKey, over?: { accent?: string; text?: string; fill?: string; fillType?: string; tint?: string }): Edition {
  const base = EDITIONS[key];
  if (!over) return base;
  return {
    ...base,
    accent: over.accent ?? base.accent,
    text: over.text ?? base.text,
    fill: over.fill ?? base.fill,
    fillType: over.fillType ?? base.fillType,
    tint: over.tint ?? base.tint,
  };
}

/** Plain-text wrapping, one algorithm in both languages (greedy, at spaces). */
export function rwrap(s: string, width = 72): string {
  const out: string[] = [];
  for (const para of s.split("\n")) {
    if (!para.trim()) { out.push(""); continue; }
    let line = "";
    for (const word of para.split(" ").filter((w) => w !== "")) {
      if (line && line.length + 1 + word.length > width) { out.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) out.push(line);
  }
  return out.join("\n");
}

function rstrip(html: string): string {
  return withoutTags(html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m, href, label) => `${label} (${href})`))
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&(nbsp|amp|lt|gt|quot|apos|mdash|ndash|middot|hellip|rsquo|lsquo|ldquo|rdquo|times|rarr);/g,
      (_m, name) => ENTITY[name as keyof typeof ENTITY])
    .trim();
}

const rspacer = (h: number) => `<div style="height:${h}px;line-height:${h}px;font-size:0;">&nbsp;</div>`;

function rrule(color: string, margin: string, style = "solid", width = 1): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:${margin};">` +
    `<tr><td style="border-top:${width}px ${style} ${color};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
}

function rlabel(text: string, color: string, margin = "0 0 10px", size = 11, spacing = "0.16em", font: string = RC.sans): string {
  return `<p style="margin:${margin};font-family:${font};font-size:${size}px;line-height:1.3;font-weight:700;` +
    `letter-spacing:${spacing};text-transform:uppercase;color:${color};">${esc(text)}</p>`;
}

function rbutton(ed: Edition, label: string, href: string, full: boolean): string {
  const r = ed.btnRadius;
  return `<table role="presentation" cellpadding="0" cellspacing="0"${full ? ' width="100%"' : ""} style="margin:6px 0 0;">` +
    `<tr><td align="center" bgcolor="${ed.fill}" style="background:${ed.fill};border-radius:${r}px;">` +
    `<a href="${esc(href)}" style="display:${full ? "block" : "inline-block"};padding:15px 26px;font-family:${RC.sans};` +
    `font-size:15px;font-weight:700;line-height:1.1;color:${ed.fillType};text-decoration:none;border-radius:${r}px;` +
    `letter-spacing:0.01em;">${esc(label)}&nbsp;&nbsp;&rarr;</a></td></tr></table>`;
}

/* ── record blocks ─────────────────────────────────────────────────────────
   As above: a parameter named `html` is already escaped; every other string is
   raw and escaped here. A block that needs colour takes the edition key. */

export const R = {
  p(html: string, text?: string): Block {
    return {
      html: `<p style="margin:0 0 14px;font-family:${RC.sans};font-size:16px;line-height:1.6;color:${RC.ink2};">${html}</p>`,
      text: rwrap(text ?? rstrip(html)),
    };
  },

  lead(html: string, text?: string): Block {
    return {
      html: `<p style="margin:0 0 24px;font-family:${RC.sans};font-size:17px;line-height:1.6;color:${RC.ink2};">${html}</p>`,
      text: rwrap(text ?? rstrip(html)),
    };
  },

  small(html: string, text?: string): Block {
    return {
      html: `<p style="margin:0 0 12px;font-family:${RC.sans};font-size:14px;line-height:1.55;color:${RC.muted};">${html}</p>`,
      text: rwrap(text ?? rstrip(html)),
    };
  },

  label(key: EditionKey, text: string): Block {
    return { html: rlabel(text, EDITIONS[key].text, "18px 0 10px"), text: text.toUpperCase() };
  },

  spacer(h: number): Block {
    return { html: rspacer(h), text: "" };
  },

  rule(key: EditionKey, strong = false): Block {
    const ed = EDITIONS[key];
    return {
      html: strong ? rrule(RC.ink, "22px 0 4px", "solid", 2) : rrule(ed.rule, "24px 0", ed.dashed ? "dashed" : "solid"),
      text: "-".repeat(72),
    };
  },

  button(key: EditionKey, label: string, href: string, opts?: { full?: boolean; over?: Parameters<typeof edition>[1] }): Block {
    const ed = edition(key, opts?.over);
    const full = opts?.full ?? ed.btnFull;
    return { html: rspacer(6) + rbutton(ed, label, href, full), text: `${label}:\n${href}` };
  },

  /** Label and value rows. `mono` sets the value in the figure face (a reference, a code). */
  facts(rows: { k: string; v: string; mono?: boolean }[], opts?: { key?: EditionKey; strongLast?: boolean }): Block {
    const hair = opts?.key ? EDITIONS[opts.key].rule : RC.hair;
    const pad = Math.max(0, ...rows.map((r) => r.k.length));
    const trs = rows.map((r, i) => {
      const last = !!opts?.strongLast && i === rows.length - 1;
      return `<tr><td style="padding:12px 0;border-bottom:1px solid ${hair};font-family:${RC.sans};font-size:14px;` +
        `color:${RC.muted};vertical-align:top;">${esc(r.k)}</td>` +
        `<td align="right" style="padding:12px 0 12px 12px;border-bottom:1px solid ${hair};font-family:${r.mono ? RC.mono : RC.sans};` +
        `font-size:${last ? 15 : 14}px;font-weight:${last ? 800 : 600};color:${RC.ink};text-align:right;vertical-align:top;">${esc(r.v) || "&mdash;"}</td></tr>`;
    }).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 6px;">${trs}</table>`,
      text: rows.map((r) => `${r.k.padEnd(pad)}  ${r.v || "—"}`).join("\n"),
    };
  },

  /** A one-time code, one digit to a cell, with its terms on one line under it. */
  digits(key: EditionKey, code: string, caption: string, heading: string): Block {
    const ed = EDITIONS[key];
    const cells = [...code].map((d) =>
      `<td width="15%" align="center" style="width:15%;padding:0 3px;">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
      `<td align="center" bgcolor="${ed.tint}" style="background:${ed.tint};border-bottom:3px solid ${ed.accent};` +
      `padding:16px 0 13px;font-family:${RC.mono};font-size:34px;font-weight:700;color:${RC.ink};line-height:1;">${esc(d)}</td>` +
      `</tr></table></td>`).join("");
    return {
      html: rlabel(heading, RC.muted, "0 0 8px", 10) +
        // data-text: the code whole, for a text part built from this HTML (one digit to a cell
        // would come out one digit to a line).
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" data-text="${esc(code)}" style="margin:4px 0 12px;max-width:420px;"><tr>${cells}</tr></table>` +
        `<p style="margin:0 0 28px;font-family:${RC.mono};font-size:12px;letter-spacing:0.06em;line-height:1.6;color:${RC.muted};">${esc(caption)}</p>`,
      text: `${heading}:\n\n    ${code}\n\n${rwrap(caption)}`,
    };
  },

  /** The total on a receipt: the figure large, the cents small, and a round seal beside it. */
  amount(key: EditionKey, label: string, major: string, minor: string, seal?: { top: string; bottom: string }): Block {
    const ed = EDITIONS[key];
    const sealHtml = seal
      ? `<td valign="bottom" width="100" style="vertical-align:bottom;width:100px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>` +
        `<td width="92" height="92" align="center" valign="middle" style="width:92px;height:92px;border:2px solid ${ed.accent};` +
        `border-radius:50%;font-family:${RC.mono};text-align:center;">` +
        `<span style="font-size:15px;font-weight:800;letter-spacing:0.18em;color:${ed.text};">${esc(seal.top)}</span><br>` +
        `<span style="font-size:9px;letter-spacing:0.08em;color:${ed.text};">${esc(seal.bottom)}</span></td></tr></table></td>`
      : "";
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr>` +
        `<td valign="bottom" style="vertical-align:bottom;">` + rlabel(label, RC.muted, "0 0 4px", 10) +
        `<p class="big" style="margin:0;font-family:${RC.sans};font-size:56px;line-height:1;font-weight:800;letter-spacing:-0.035em;color:${RC.ink};">` +
        `${esc(major)}<span style="font-size:28px;color:${RC.muted};">${esc(minor)}</span></p></td>${sealHtml}</tr></table>` +
        rrule(RC.ink, "22px 0 4px", "solid", 2),
      text: `${label}: ${major}${minor}${seal ? `  [${seal.top} ${seal.bottom}]` : ""}`,
    };
  },

  /** A short warning set against an ink bar: "keep this private", "if this wasn't you". */
  notice(title: string, lines: string[]): Block {
    const body = lines.map((l, i) =>
      `<p style="margin:0 0 ${i === lines.length - 1 ? 0 : 8}px;font-family:${RC.sans};font-size:15px;line-height:1.6;color:${RC.ink2};">` +
      (i === 0 ? `<strong style="color:${RC.ink};">${esc(title)}</strong> ` : "") + `${esc(l)}</p>`).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;"><tr>` +
        `<td width="3" bgcolor="${RC.ink}" style="width:3px;background:${RC.ink};font-size:0;">&nbsp;</td>` +
        `<td style="padding:2px 0 2px 18px;">${body}</td></tr></table>`,
      text: rwrap(`${title} ${lines.join(" ")}`),
    };
  },

  /** Two answers side by side: it was me / it wasn't me, with the action on the second. */
  choice(key: EditionKey, yes: { label: string; text: string }, no: { label: string; text: string; button: string; href: string }): Block {
    const ed = EDITIONS[key];
    const box = (inner: string, bg: string, border: string) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
      `<td${bg ? ` bgcolor="${bg}"` : ""} style="${bg ? `background:${bg};` : ""}border:1px solid ${border};border-radius:14px;padding:18px 18px 16px;">${inner}</td></tr></table>`;
    const yesHtml = rlabel(yes.label, "#2b7a3f", "0 0 6px", 10) +
      `<p style="margin:0;font-family:${RC.sans};font-size:14px;line-height:1.55;color:${RC.ink2};">${esc(yes.text)}</p>`;
    const noHtml = rlabel(no.label, ed.text, "0 0 6px", 10) +
      `<p style="margin:0 0 12px;font-family:${RC.sans};font-size:14px;line-height:1.55;color:${RC.ink2};">${esc(no.text)}</p>` +
      rbutton({ ...ed, btnRadius: 10 }, no.button, no.href, false);
    return {
      html: rspacer(18) + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0;"><tr>` +
        `<td class="stack" width="50%" valign="top" style="padding:0 6px 10px 0;">${box(yesHtml, "", RC.hair)}</td>` +
        `<td class="stack" width="50%" valign="top" style="padding:0 0 10px 6px;">${box(noHtml, ed.tint, ed.rule)}</td></tr></table>`,
      text: `${yes.label}: ${yes.text}\n${no.label}: ${no.text}\n${no.button}: ${no.href}`,
    };
  },

  /** Numbered first steps: 01, 02, 03. */
  steps(key: EditionKey, items: { title: string; body: string }[]): Block {
    const ed = EDITIONS[key];
    const rows = items.map((it, i) => {
      const n = String(i + 1).padStart(2, "0");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>` +
        `<td width="48" valign="top" style="width:48px;vertical-align:top;font-family:${RC.mono};font-size:13px;font-weight:700;color:${ed.text};padding-top:3px;">${n}</td>` +
        `<td valign="top" style="vertical-align:top;">` +
        `<p style="margin:0 0 3px;font-family:${RC.sans};font-size:17px;line-height:1.4;font-weight:700;color:${RC.ink};">${esc(it.title)}</p>` +
        `<p style="margin:0;font-family:${RC.sans};font-size:14px;line-height:1.55;color:${RC.muted};">${esc(it.body)}</p></td></tr></table>`;
    }).join("");
    return {
      html: rows,
      text: items.map((it, i) => `${String(i + 1).padStart(2, "0")}  ${it.title}\n    ${rwrap(it.body, 68).replace(/\n/g, "\n    ")}`).join("\n\n"),
    };
  },

  /** A WhatsApp chat window: what the person sends, and the reply. Imali AI's welcome. */
  chat(key: EditionKey, name: string, status: string, turns: { label: string; out: string; reply: string; note: string; time: string }[]): Block {
    const ed = EDITIONS[key];
    const head = `<tr><td bgcolor="#ffffff" style="background:#ffffff;border-bottom:1px solid #e4ded4;border-radius:16px 16px 0 0;padding:12px 16px;">` +
      `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
      `<td width="34" height="34" align="center" bgcolor="${ed.tint}" style="width:34px;height:34px;background:${ed.tint};border-radius:50%;` +
      `font-family:${RC.sans};font-size:13px;font-weight:800;color:${ed.text};">${esc(name.slice(0, 2).toLowerCase())}</td>` +
      `<td style="padding-left:10px;font-family:${RC.sans};font-size:15px;font-weight:700;color:${RC.ink};">${esc(name)}` +
      `<br><span style="font-size:11px;font-weight:500;color:${ed.text};">${esc(status)}</span></td></tr></table></td></tr>`;
    const body = turns.map((t, i) =>
      `<p style="margin:14px 0 0;text-align:center;"><span style="display:inline-block;background:#e4ded4;border-radius:8px;padding:3px 10px;` +
      `font-family:${RC.mono};font-size:10px;letter-spacing:0.1em;color:#5c564d;">${String(i + 1).padStart(2, "0")} &middot; ${esc(t.label.toUpperCase())}</span></p>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td>` +
      `<table role="presentation" cellpadding="0" cellspacing="0" align="right" style="margin:8px 0 0;"><tr>` +
      `<td bgcolor="${ed.tint}" style="background:${ed.tint};border-radius:16px 16px 4px 16px;padding:10px 14px 7px;font-family:${RC.sans};` +
      `font-size:15px;line-height:1.45;color:${RC.ink};">${esc(t.out)}` +
      `<span style="display:block;text-align:right;font-size:10px;color:#5d7d68;margin-top:2px;">${esc(t.time)} &#10003;&#10003;</span></td></tr></table>` +
      `</td></tr><tr><td>` +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;"><tr>` +
      `<td bgcolor="#ffffff" style="background:#ffffff;border-radius:16px 16px 16px 4px;padding:10px 14px 7px;font-family:${RC.sans};` +
      `font-size:14px;line-height:1.45;color:${RC.ink};"><strong>&#10003; ${esc(t.reply)}</strong><br><span style="color:${RC.muted};">${esc(t.note)}</span>` +
      `<span style="display:block;text-align:right;font-size:10px;color:${RC.faint};margin-top:2px;">${esc(t.time)}</span></td></tr></table>` +
      `</td></tr></table>`).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;border-collapse:separate;">${head}` +
        `<tr><td bgcolor="#e7ece9" style="background:#e7ece9;border-radius:0 0 16px 16px;padding:6px 14px 18px;">${body}</td></tr></table>`,
      text: turns.map((t, i) => `${String(i + 1).padStart(2, "0")}  ${t.label}\n    You send: ${t.out}\n    ${name}: ${t.reply}. ${t.note}`).join("\n\n"),
    };
  },

  /** What happens next, as done / next / later. */
  trail(key: EditionKey, items: { title: string; when: string; state: "done" | "next" | "later" }[], words?: { done: string; next: string; later: string }): Block {
    const ed = EDITIONS[key];
    const w = words ?? { done: "DONE", next: "NEXT", later: "LATER" };
    const rows = items.map((it) => {
      const done = it.state === "done";
      const later = it.state === "later";
      return `<tr><td width="34" valign="top" style="width:34px;padding:0 0 16px;">` +
        `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="22" height="22" align="center" bgcolor="${done ? ed.text : "#ffffff"}" ` +
        `style="width:22px;height:22px;border-radius:50%;border:2px solid ${later ? "#c9d6cf" : ed.text};background:${done ? ed.text : "#ffffff"};` +
        `font-family:${RC.sans};font-size:12px;font-weight:800;color:${done ? "#ffffff" : ed.text};">${done ? "&#10003;" : "&nbsp;"}</td></tr></table></td>` +
        `<td valign="top" style="padding:0 0 16px;font-family:${RC.sans};">` +
        `<span style="font-size:15px;font-weight:700;color:${later ? RC.muted : RC.ink};">${esc(it.title)}</span><br>` +
        `<span style="font-size:13px;color:${RC.muted};">${esc(it.when)}</span></td>` +
        `<td align="right" valign="top" style="padding:0 0 16px;"><span style="display:inline-block;border:1px solid ${done ? ed.tint : ed.rule};` +
        `border-radius:999px;padding:3px 9px;font-family:${RC.mono};font-size:10px;letter-spacing:0.08em;color:${later ? RC.faint : ed.text};">` +
        `${esc(done ? w.done : later ? w.later : w.next)}</span></td></tr>`;
    }).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">${rows}</table>`,
      text: items.map((it) => `[${it.state === "done" ? "x" : " "}] ${it.title} (${it.when})`).join("\n"),
    };
  },

  /** Labelled fields two to a row, like a chart. */
  fields(key: EditionKey, items: { code: string; label: string; value: string }[]): Block {
    const ed = EDITIONS[key];
    const cell = (it: { code: string; label: string; value: string }) =>
      `<td class="stack" width="50%" valign="top" style="padding:0 6px 12px 0;">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border:1px solid ${ed.rule};border-radius:8px;padding:10px 12px;">` +
      `<p style="margin:0 0 3px;font-family:${RC.mono};font-size:10px;letter-spacing:0.1em;color:${ed.text};">${esc(it.code)} &middot; ${esc(it.label.toUpperCase())}</p>` +
      `<p style="margin:0;font-family:${RC.sans};font-size:15px;font-weight:700;color:${RC.ink};">${esc(it.value)}</p></td></tr></table></td>`;
    const rows: string[] = [];
    for (let i = 0; i < items.length; i += 2) {
      const a = items[i];
      const b2 = items[i + 1];
      if (!a) continue;
      rows.push(`<tr>${cell(a)}${b2 ? cell(b2) : `<td class="stack" width="50%">&nbsp;</td>`}</tr>`);
    }
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">${rows.join("")}</table>`,
      text: items.map((it) => `${it.code} ${it.label}: ${it.value}`).join("\n"),
    };
  },

  /** Deadlines with the days left set large. BidWright Tender AI. */
  deadlines(key: EditionKey, items: { ref: string; title: string; meta: string; status: string; ok: boolean; days: string; soon: boolean; word?: string }[], daysWord: string): Block {
    const ed = EDITIONS[key];
    const rows = items.map((it) =>
      `<tr><td style="padding:16px 0;border-bottom:1px solid ${ed.rule};" valign="top">` +
      `<p style="margin:0 0 2px;font-family:${RC.mono};font-size:10px;letter-spacing:0.08em;color:${RC.muted};">${esc(it.ref)}</p>` +
      `<p style="margin:0 0 3px;font-family:${RC.sans};font-size:15px;font-weight:700;color:${RC.ink};">${esc(it.title)}</p>` +
      `<p style="margin:0;font-family:${RC.sans};font-size:13px;color:${RC.muted};">${esc(it.meta)}</p>` +
      `<p style="margin:6px 0 0;font-family:${RC.sans};font-size:12px;font-weight:600;color:${it.ok ? "#1d7a46" : "#a64b00"};">${it.ok ? "&#10003;" : "&#9675;"}&nbsp; ${esc(it.status)}</p></td>` +
      `<td width="84" align="right" valign="top" style="width:84px;padding:16px 0;border-bottom:1px solid ${ed.rule};text-align:right;">` +
      `<p class="big" style="margin:0;font-family:${RC.sans};font-size:44px;line-height:0.95;font-weight:800;letter-spacing:-0.03em;color:${it.soon ? "#c2410c" : ed.text};">${esc(it.days)}</p>` +
      `<p style="margin:2px 0 0;font-family:${RC.mono};font-size:9px;letter-spacing:0.12em;color:${RC.muted};">${esc(it.word ?? daysWord)}</p></td></tr>`).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:2px solid ${RC.ink};margin:0 0 8px;">${rows}</table>`,
      // The text names no bare count ("1 days left"): each item's status says when.
      text: items.map((it) => `${it.title}\n    ${it.ref} · ${it.meta}\n    ${it.status}`).join("\n\n"),
    };
  },

  /** A running order in the manner of a tracklist: A1, A2, B1. Izwi Music OS. */
  tracklist(key: EditionKey, items: { side: string; title: string; when: string }[]): Block {
    const ed = EDITIONS[key];
    const rows = items.map((it) =>
      `<tr><td width="40" style="width:40px;padding:11px 0;border-bottom:1px solid ${ed.rule};font-family:${RC.mono};font-size:12px;font-weight:700;color:${ed.text};">${esc(it.side)}</td>` +
      `<td style="padding:11px 0;border-bottom:1px solid ${ed.rule};font-family:${RC.sans};font-size:15px;color:${RC.ink};">${esc(it.title)}</td>` +
      `<td align="right" style="padding:11px 0 11px 10px;border-bottom:1px solid ${ed.rule};font-family:${RC.mono};font-size:11px;color:${RC.muted};text-align:right;white-space:nowrap;">${esc(it.when)}</td></tr>`).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${RC.ink};margin:0 0 8px;">${rows}</table>`,
      text: items.map((it) => `${it.side}  ${it.title} (${it.when})`).join("\n"),
    };
  },

  /** A site shown in a browser window. Tzohar Sites. */
  browser(key: EditionKey, site: { url: string; title: string; sub: string; cta: string; note: string }): Block {
    const dots = ["#f0b5b5", "#f3d9a1", "#bfe3c4"].map((c) =>
      `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${c};margin-right:5px;"></span>`).join("");
    void key;
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">` +
        `<tr><td bgcolor="#f4f3f8" style="background:#f4f3f8;border:1px solid #e3e0ef;border-bottom:0;border-radius:12px 12px 0 0;padding:10px 12px;">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td width="52" style="width:52px;font-size:0;">${dots}</td>` +
        `<td><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#ffffff" style="background:#ffffff;border-radius:999px;` +
        `padding:5px 12px;font-family:${RC.mono};font-size:11px;color:${RC.muted};">${esc(site.url)}</td></tr></table></td></tr></table></td></tr>` +
        `<tr><td style="border:1px solid #e3e0ef;border-radius:0 0 12px 12px;padding:30px 26px 28px;">` +
        `<p style="margin:0 0 6px;font-family:${RC.serif};font-size:26px;line-height:1.15;color:${RC.ink};">${esc(site.title)}</p>` +
        `<p style="margin:0 0 16px;font-family:${RC.sans};font-size:13px;color:${RC.muted};">${esc(site.sub)}</p>` +
        `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border:1px solid ${RC.ink};border-radius:999px;padding:7px 14px;` +
        `font-family:${RC.sans};font-size:12px;font-weight:600;color:${RC.ink};">${esc(site.cta)}</td>` +
        `<td style="padding-left:10px;font-family:${RC.sans};font-size:12px;color:${RC.muted};">${esc(site.note)}</td></tr></table></td></tr></table>`,
      text: `[${site.url}] ${site.title}: ${site.sub}`,
    };
  },

  /** An admit-one ticket with a perforated stub. A–Z Dates. */
  ticket(key: EditionKey, t: { kicker: string; title: string; meta: string; letter: string; count: string }): Block {
    const ed = EDITIONS[key];
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 26px;"><tr>` +
        `<td valign="middle" style="border:2px solid ${RC.ink};border-right:0;border-radius:16px 0 0 16px;padding:20px 22px;">` +
        `<p style="margin:0 0 4px;font-family:${RC.mono};font-size:10px;letter-spacing:0.16em;color:${RC.muted};">${esc(t.kicker)}</p>` +
        `<p style="margin:0 0 6px;font-family:${RC.sans};font-size:19px;font-weight:800;color:${RC.ink};">${esc(t.title)}</p>` +
        `<p style="margin:0;font-family:${RC.sans};font-size:13px;color:${RC.muted};">${esc(t.meta)}</p></td>` +
        `<td width="104" align="center" valign="middle" bgcolor="${ed.tint}" style="width:104px;background:${ed.tint};border:2px solid ${RC.ink};` +
        `border-left:2px dashed ${RC.ink};border-radius:0 16px 16px 0;font-family:${RC.serif};">` +
        `<span class="big" style="font-size:66px;line-height:1;font-weight:700;color:${ed.text};">${esc(t.letter)}</span><br>` +
        `<span style="font-family:${RC.mono};font-size:9px;letter-spacing:0.14em;color:${RC.ink};">${esc(t.count)}</span></td></tr></table>`,
      text: `${t.kicker}\n${t.title}\n${t.meta}`,
    };
  },

  /** An event stub with the date set large. Diaspry Community OS. */
  event(key: EditionKey, e: { month: string; day: string; weekday: string; kicker: string; title: string; meta: string }): Block {
    const ed = EDITIONS[key];
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>` +
        `<td width="92" align="center" valign="middle" bgcolor="${ed.tint}" style="width:92px;background:${ed.tint};border-radius:14px 0 0 14px;` +
        `border-right:2px dashed ${ed.rule};padding:16px 0;font-family:${RC.sans};">` +
        `<span style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:${ed.text};">${esc(e.month)}</span><br>` +
        `<span style="font-size:38px;line-height:1;font-weight:800;color:${RC.ink};">${esc(e.day)}</span><br>` +
        `<span style="font-size:11px;color:${RC.muted};">${esc(e.weekday)}</span></td>` +
        `<td valign="middle" style="border:1px solid ${ed.rule};border-left:0;border-radius:0 14px 14px 0;padding:16px 18px;">` +
        `<p style="margin:0 0 3px;font-family:${RC.sans};font-size:11px;font-weight:700;letter-spacing:0.12em;color:${ed.text};">${esc(e.kicker)}</p>` +
        `<p style="margin:0 0 3px;font-family:${RC.sans};font-size:16px;font-weight:700;color:${RC.ink};">${esc(e.title)}</p>` +
        `<p style="margin:0;font-family:${RC.sans};font-size:13px;color:${RC.muted};">${esc(e.meta)}</p></td></tr></table>`,
      text: `${e.kicker}: ${e.title}, ${e.day} ${e.month} (${e.weekday}). ${e.meta}`,
    };
  },

  /** A week as seven cells, the days with a call ticked. Chingu Care AI's letter. */
  week(key: EditionKey, days: { d: string; on: boolean }[], heading: string): Block {
    const ed = EDITIONS[key];
    const cells = days.map((x) =>
      `<td align="center" width="14%" style="width:14%;padding:0 2px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
      `<td align="center" bgcolor="${x.on ? ed.tint : "#f0f0ee"}" style="background:${x.on ? ed.tint : "#f0f0ee"};border-radius:10px;padding:10px 0 9px;font-family:${RC.sans};">` +
      `<span style="font-size:11px;color:${RC.muted};">${esc(x.d)}</span><br>` +
      `<span style="font-size:15px;font-weight:700;color:${x.on ? ed.text : RC.faint};">${x.on ? "&#10003;" : "&middot;"}</span></td></tr></table></td>`).join("");
    return {
      html: rlabel(heading, RC.muted, "0 0 10px", 12, "0.04em") +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>${cells}</tr></table>`,
      text: `${heading}: ${days.map((x) => `${x.d} ${x.on ? "✓" : "·"}`).join("  ")}`,
    };
  },

  /** A tinted panel with a small label: credits, a summary, a quoted message. */
  panel(key: EditionKey, label: string, body: string, opts?: { pre?: boolean }): Block {
    const ed = EDITIONS[key];
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr>` +
        `<td bgcolor="${ed.tint}" style="background:${ed.tint};border-radius:12px;padding:16px 18px;">` +
        rlabel(label, ed.text, "0 0 6px", 10) +
        `<p style="margin:0;font-family:${RC.sans};font-size:15px;line-height:1.6;color:${RC.ink2};${opts?.pre ? "white-space:pre-wrap;" : ""}">${esc(body)}</p></td></tr></table>`,
      text: `${label}\n${opts?.pre ? body.split("\n").map((l) => `> ${l}`).join("\n") : rwrap(body)}`,
    };
  },

  /** Invoice lines with quantity and amount, ruled to match the edition. */
  lines(key: EditionKey, items: { label: string; qty?: string; amount: string }[], total: { label: string; amount: string }): Block {
    const ed = EDITIONS[key];
    const border = `1px ${ed.dashed ? "dashed" : "solid"} ${ed.rule}`;
    const pad = Math.max(0, ...items.map((i) => i.label.length + (i.qty ? i.qty.length + 3 : 0)), total.label.length);
    const rows = items.map((it) =>
      `<tr><td style="padding:11px 0;border-bottom:${border};font-family:${RC.sans};font-size:14px;color:${RC.ink2};">${esc(it.label)}</td>` +
      `<td align="center" style="padding:11px 6px;border-bottom:${border};font-family:${RC.mono};font-size:13px;color:${RC.muted};">${it.qty ? `&times;${esc(it.qty)}` : ""}</td>` +
      `<td align="right" style="padding:11px 0;border-bottom:${border};font-family:${RC.mono};font-size:14px;color:${RC.ink};text-align:right;">${esc(it.amount)}</td></tr>`).join("");
    return {
      html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px;">${rows}` +
        `<tr><td colspan="2" style="padding:14px 0 0;font-family:${RC.sans};font-size:15px;font-weight:800;color:${RC.ink};">${esc(total.label)}</td>` +
        `<td align="right" style="padding:14px 0 0;font-family:${RC.mono};font-size:17px;font-weight:800;color:${RC.ink};text-align:right;">${esc(total.amount)}</td></tr></table>`,
      text: [...items.map((it) => `${(it.label + (it.qty ? ` x${it.qty}` : "")).padEnd(pad)}  ${it.amount}`),
        "-".repeat(pad + 12), `${total.label.padEnd(pad)}  ${total.amount}`].join("\n"),
    };
  },

  /** A sign-off in the edition's own voice. */
  signoff(key: EditionKey, lines: string[]): Block {
    const ed = EDITIONS[key];
    const html = lines.map((l, i) => {
      if (ed.face === "serif") {
        return `<p style="margin:0 0 4px;font-family:${RC.serif};font-size:${i === 0 ? 18 : 15}px;line-height:1.5;color:${i === 0 ? RC.ink : RC.muted};">${esc(l)}</p>`;
      }
      if (ed.dashed) {
        return `<p style="margin:0 0 4px;font-family:${RC.mono};font-size:12px;letter-spacing:0.08em;line-height:1.6;color:${RC.ink2};">&mdash; ${esc(l.toUpperCase())} &mdash;</p>`;
      }
      return `<p style="margin:0 0 4px;font-family:${RC.sans};font-size:14px;line-height:1.55;color:${i === 0 ? RC.ink2 : RC.muted};${i === lines.length - 1 ? "font-weight:700;" : ""}">${esc(l)}</p>`;
    }).join("");
    return { html: rspacer(10) + html, text: lines.join("\n") };
  },
};

export type RecordOpts = {
  identity: Identity;
  /** Defaults to the identity's own edition. */
  edition?: EditionKey;
  /** A tenant's colours over its edition (mail sent in a customer's own name). */
  over?: Parameters<typeof edition>[1];
  title: string;
  preheader: string;
  lang?: string;
  /** The reference strip at the top right: what this document is, and its number and date. */
  strip?: { top: string; bottom?: string };
  /** A stamp in place of the strip (the letter edition). */
  stamp?: { big: string; small: string };
  /** A line under a type-set name (no logo): "Chingu Care AI" under 친구케어 AI. */
  brandSub?: string;
  /** The tab above the sheet (the dossier edition). */
  tab?: string;
  eyebrow?: string;
  /** Parent mail about a product: a "For <product>" chip above the heading. */
  product?: string;
  /** Escaped markup; <br> allowed. */
  heading: string;
  blocks: Block[];
  /** Why this person got it. Raw. */
  why: string;
  links: { label: string; href: string }[];
  /** The company sign-off line (Ebenworks mail). */
  motto?: boolean;
  /** false leaves the Ebenworks stamp off (productStamp; SO-39 puts it on every product email). */
  productMark?: false;
  /** The product footer block on mail sent in a customer's own name; it carries the stamp. */
  sentWith?: { name: string; line: string; linkLabel: string; href: string; logoUrl?: string; logoWidth?: number; logoHeight?: number };
  unsubscribeUrl?: string;
  /** Korean advertising mail (Network Act art 50, decree annex 6): sender details and a bilingual opt-out. */
  koreanAd?: { sender: string; email: string; phone: string; address: string; optOutUrl: string };
};

const KO_WORDS = { why: "이 메일을 받은 이유", unsub: "수신 거부", forProduct: (p: string) => `${p} 이용` };
const EN_WORDS = { why: "Why you received this", unsub: "Unsubscribe", forProduct: (p: string) => `For ${p}` };

/** The subject of a Korean advertising email starts with (광고). */
export function koreanAdSubject(subject: string): string {
  return subject.startsWith("(광고)") ? subject : `(광고) ${subject}`;
}

/** Render one customer email in The Record. */
export function renderRecord(o: RecordOpts): { html: string; text: string } {
  const key = o.edition ?? EDITION_OF[o.identity.key];
  const ed = edition(key, o.over);
  const id = identity(o.identity);
  const ko = !!o.lang?.startsWith("ko");
  const words = ko ? KO_WORDS : EN_WORDS;
  const body = ko ? RC.ksans : RC.sans;
  const ff = `font-family:${body};${ko ? "word-break:keep-all;" : ""}`;
  const headFace = ed.face === "serif" ? (ko ? RC.kserif : RC.serif) : body;

  const brand = id.logoUrl
    ? `<img src="${esc(id.logoUrl)}" width="${id.logoWidth}" height="${id.logoHeight}" alt="${esc(id.name)}" ` +
      `style="display:block;width:${id.logoWidth}px;height:${id.logoHeight}px;border:0;outline:none;text-decoration:none;font-family:${RC.sans};font-size:18px;font-weight:800;color:${RC.ink};">`
    : `<p style="margin:0;font-family:${headFace};font-size:21px;line-height:1.2;font-weight:800;letter-spacing:-0.01em;color:${RC.ink};">${esc(id.name)}</p>` +
      (o.brandSub ? `<p style="margin:4px 0 0;font-family:${RC.sans};font-size:12px;letter-spacing:0.02em;color:${RC.muted};">${esc(o.brandSub)}</p>` : "");
  const right = o.stamp
    ? `<table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr><td width="64" height="74" align="center" valign="middle" ` +
      `style="width:64px;height:74px;border:2px dashed ${ed.accent};border-radius:6px;font-family:${headFace};text-align:center;">` +
      `<span style="font-size:20px;font-weight:700;color:${ed.text};">${esc(o.stamp.big)}</span><br>` +
      `<span style="font-family:${RC.mono};font-size:9px;letter-spacing:0.08em;color:${ed.text};">${esc(o.stamp.small)}</span></td></tr></table>`
    : o.strip
      ? `<span data-text="" style="font-family:${RC.mono};font-size:10px;line-height:1.6;letter-spacing:0.08em;color:${RC.muted};">${esc(o.strip.top)}` +
        (o.strip.bottom ? `<br><span style="color:${RC.faint};">${esc(o.strip.bottom)}</span>` : "") + `</span>`
      : "";
  const headRule = {
    ink2: rrule(RC.ink, "22px 0 30px", "solid", 2),
    dashed: rrule(ed.rule, "22px 0 28px", "dashed"),
    soft: rrule(ed.rule, "24px 0 30px"),
    accent2: rrule(ed.accent, "20px 0 28px", "solid", 2),
    double: rrule(RC.ink, "22px 0 8px", "solid", 3) + rrule(RC.ink, "0 0 30px"),
    none: rspacer(22),
    hair: rrule(RC.hair, "20px 0 28px"),
  }[ed.head];
  const header = rspacer(30) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
    `<td valign="middle" style="vertical-align:middle;">${brand}</td>` +
    `<td valign="middle" align="right" class="hide-sm" style="vertical-align:middle;text-align:right;">${right}</td></tr></table>` +
    headRule;

  const chip = o.product
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>` +
      `<td style="border:1px solid ${RC.hair};border-radius:999px;padding:6px 12px 6px 10px;font-family:${body};font-size:12px;font-weight:600;color:${RC.ink2};">` +
      `<span style="color:${ed.accent};">&#9679;</span>&nbsp;&nbsp;${esc(words.forProduct(o.product))}</td></tr></table>`
    : "";
  const h1Style = ed.face === "caps"
    ? `font-size:38px;line-height:1.0;font-weight:900;letter-spacing:-0.01em;text-transform:uppercase;`
    : ed.face === "serif"
      ? `font-size:31px;line-height:1.35;font-weight:700;letter-spacing:-0.005em;`
      : `font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-0.025em;`;
  const title = (o.eyebrow ? rlabel(o.eyebrow, ed.text, "0 0 14px", 11, ko ? "0.06em" : "0.16em", body) : "") + chip +
    `<h1 class="h1" style="margin:0 0 16px;font-family:${headFace};${h1Style}color:${RC.ink};${ko ? "word-break:keep-all;" : ""}">${o.heading}</h1>`;

  const blocks = o.blocks.map((blk) => (ko ? blk.html.split(`font-family:${RC.sans};`).join(ff) : blk.html)).join("\n");

  // The stamp sits where "<product> is an Ebenworks product." used to; mail in a customer's name
  // carries it only inside the product footer block, and without that block not at all.
  const stamp = o.productMark === false ? null
    : key === "tenant" ? (o.sentWith ? productStamp(o.identity.key, ko, "0") : null)
    : productStamp(o.identity.key, ko);
  const sentWith = o.sentWith
    ? rrule(RC.hair, "30px 0 18px") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#f6f6f4" style="background:#f6f6f4;border-radius:12px;padding:14px 16px;">` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>` +
      (o.sentWith.logoUrl
        ? `<td width="${(o.sentWith.logoWidth ?? 88) + 8}" valign="middle" style="width:${(o.sentWith.logoWidth ?? 88) + 8}px;">` +
          `<img src="${esc(o.sentWith.logoUrl)}" width="${o.sentWith.logoWidth ?? 88}" height="${o.sentWith.logoHeight ?? 27}" alt="${esc(o.sentWith.name)}" ` +
          `style="display:block;width:${o.sentWith.logoWidth ?? 88}px;height:${o.sentWith.logoHeight ?? 27}px;border:0;font-family:${RC.sans};font-size:13px;font-weight:800;color:${RC.ink};"></td>`
        : "") +
      `<td valign="middle" style="${o.sentWith.logoUrl ? "padding-left:12px;" : ""}font-family:${body};font-size:12px;line-height:1.5;color:${RC.muted};">` +
      `${esc(o.sentWith.line)} <a href="${esc(o.sentWith.href)}" style="color:${EDITIONS[EDITION_OF[o.identity.key]].text};font-weight:600;">${esc(o.sentWith.linkLabel)}</a></td>` +
      (stamp && key === "tenant"
        ? `</tr><tr><td colspan="${o.sentWith.logoUrl ? 2 : 1}" style="padding-top:12px;">${stamp.html}</td>`
        : "") +
      `</tr></table></td></tr></table>`
    : "";

  const linkHtml = o.links.map((l) =>
    `<a href="${esc(l.href)}" style="color:${ed.text};text-decoration:underline;font-weight:600;">${esc(l.label)}</a>`)
    .join(`<span style="color:#b9b2a7;">&nbsp;&nbsp;/&nbsp;&nbsp;</span>`);
  const mark = stamp && key !== "tenant" ? stamp.html : "";
  const ad = o.koreanAd
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px;"><tr><td style="border:1px solid ${RC.hair};border-radius:10px;padding:12px 14px;">` +
      `<p style="margin:0 0 6px;font-family:${RC.ksans};font-size:12px;line-height:1.6;color:${RC.ink2};word-break:keep-all;">` +
      `수신을 원하지 않으시면 <a href="${esc(o.koreanAd.optOutUrl)}" style="color:${ed.text};font-weight:700;">수신 거부</a>를 눌러 주세요. ` +
      `To stop these messages, select <a href="${esc(o.koreanAd.optOutUrl)}" style="color:${ed.text};font-weight:700;">Unsubscribe</a>.</p>` +
      `<p style="margin:0;font-family:${RC.ksans};font-size:11px;line-height:1.6;color:${RC.muted};word-break:keep-all;">` +
      `보낸 곳 ${esc(o.koreanAd.sender)} &middot; ${esc(o.koreanAd.email)} &middot; ${esc(o.koreanAd.phone)} &middot; ${esc(o.koreanAd.address)}</p></td></tr></table>`
    : "";
  const footer = sentWith + rrule(ed.rule, "34px 0 22px", ed.dashed ? "dashed" : "solid") +
    rlabel(words.why, RC.muted, "0 0 6px", 10, ko ? "0.04em" : "0.16em", body) +
    `<p style="margin:0 0 16px;${ff}font-size:13px;line-height:1.55;color:${RC.muted};">${esc(o.why)}</p>` +
    mark + ad +
    `<p style="margin:0 0 14px;${ff}font-size:13px;line-height:1.6;">${linkHtml}</p>` +
    (o.unsubscribeUrl
      ? `<p style="margin:0 0 14px;${ff}font-size:12px;line-height:1.6;"><a href="${esc(o.unsubscribeUrl)}" style="color:${RC.muted};text-decoration:underline;">${esc(words.unsub)}</a></p>`
      : "") +
    // Mail in a customer's name carries no Ebenworks entity line: the customer sends it, and the
    // product footer block above is its one mention of us (decision 14).
    (key === "tenant" ? "" : `<p style="margin:0 0 4px;font-family:${RC.sans};font-size:12px;line-height:1.5;color:${RC.faint};">${esc(RC.entity)}</p>`) +
    (o.motto ? `<p style="margin:0;font-family:${RC.sans};font-size:12px;line-height:1.5;color:${RC.faint};">${esc(RC.motto)}</p>` : "") +
    rspacer(36);

  const sheetStyle = `background:${ed.sheet};${ed.border ? `border:${ed.border};` : ""}border-radius:${ed.radius}px;`;
  const inner = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;"><tr>` +
    (ed.top === "spine"
      ? `<td width="5" bgcolor="${ed.accent}" style="width:5px;background:${ed.accent};font-size:0;line-height:0;">&nbsp;</td>`
      : "") +
    `<td class="pad" style="padding:0 44px;">${header}${title}${blocks}${footer}</td></tr></table>`;
  const topRow = ed.top === "bar"
    ? `<tr><td bgcolor="${ed.accent}" style="height:6px;background:${ed.accent};font-size:0;line-height:0;">&nbsp;</td></tr>`
    : ed.top === "tab" && o.tab
      ? `<tr><td style="padding:0 0 0 36px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
        `<td bgcolor="${ed.sheet}" style="background:${ed.sheet};border-radius:10px 10px 0 0;border:1px solid #d9e1ef;border-bottom:0;padding:9px 16px 7px;` +
        `font-family:${RC.mono};font-size:10px;letter-spacing:0.14em;color:${ed.text};">${esc(o.tab)}</td></tr></table></td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="${esc(o.lang ?? "en")}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(o.title)}</title>
<style>
@media only screen and (max-width:620px){
  .outer{padding:14px 8px !important;}
  .pad{padding-left:22px !important;padding-right:22px !important;}
  .h1{font-size:27px !important;}
  .big{font-size:44px !important;}
  .stack{display:block !important;width:100% !important;}
  .hide-sm{display:none !important;}
}
</style>
</head>
<body bgcolor="${ed.page}" style="margin:0;padding:0;background:${ed.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${esc(o.preheader)}${PREHEADER_FILL}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${ed.page}" style="background:${ed.page};">
<tr><td align="center" class="outer" style="padding:36px 16px;">
<!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
${topRow}
<tr><td bgcolor="${ed.sheet}" style="${sheetStyle}">${inner}</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;

  const t: string[] = [id.name.toUpperCase(), "=".repeat(Math.min(id.name.length, 72)), ""];
  if (o.eyebrow) t.push(o.eyebrow.toUpperCase());
  if (o.product) t.push(words.forProduct(o.product));
  t.push(rwrap(rstrip(o.heading.replace(/<br\s*\/?>/gi, " "))), "");
  for (const blk of o.blocks) if (blk.text !== "") t.push(blk.text, "");
  if (o.sentWith) t.push(`${o.sentWith.line} ${o.sentWith.href}`, ...(stamp ? [stamp.text] : []), "");
  t.push("-".repeat(72), rwrap(`${words.why}: ${o.why}`));
  if (stamp && key !== "tenant") t.push(stamp.text);
  if (o.koreanAd) {
    t.push(`수신 거부 / Unsubscribe: ${o.koreanAd.optOutUrl}`,
      `보낸 곳 ${o.koreanAd.sender} · ${o.koreanAd.email} · ${o.koreanAd.phone} · ${o.koreanAd.address}`);
  }
  for (const l of o.links) t.push(`${l.label}: ${l.href}`);
  if (o.unsubscribeUrl) t.push(`${words.unsub}: ${o.unsubscribeUrl}`);
  if (key !== "tenant") t.push(RC.entity);
  if (o.motto) t.push(RC.motto);
  t.push("");
  return { html, text: t.join("\n") };
}
