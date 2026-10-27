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
//   sha256: a5bbb6f9d1833059
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
  bidwright: { name: "BidWright AI", accent: "#2563eb", accentText: "#2563eb", site: "bidwright-ai.ebenworks.co" },
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

/** Strip tags for the default text twin. Only ever used on markup we built. */
function strip(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m, href, label) => `${label} (${href})`)
    .replace(/<[^>]+>/g, "")
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
 * The stamp every product email carries (SO-39, Eben 22 Oct 2026): "An Ebenworks product", or the
 * joint stamp on a product Ebenworks builds with Statotech Systems. Mail clients show no SVG, so
 * each is a 2x PNG on the company site, drawn from theme/EbenworksStamp.tsx and
 * theme/JointStamp.tsx by ebenworks-website's scripts/assets/build-email-stamps.mjs; keep the
 * URLs, mail already sent links them. The company's own mail and the label's carry none: neither
 * is a product's.
 *
 * The height is pixels, never auto: on 22 Oct 2026 ebenworks.co's name servers failed often enough
 * that Gmail showed the stamp broken, and with height:auto the broken picture was a box about as tall
 * as it was wide. A sender that can attach files carries the picture inline instead of linking it
 * (Content-ID; Resend's content_id): Imali AI's app/services/email_images.py swaps the URL at send.
 */
export const STAMP_HREF = "https://ebenworks.co";
export const STAMPS = {
  product: { src: "https://ebenworks.co/brand/email/ebenworks-stamp.png", width: 182, height: 63,
    alt: "An Ebenworks product", ko: "Ebenworks의 제품" },
  joint: { src: "https://ebenworks.co/brand/email/joint-stamp-ebenworks-statotech.png", width: 278, height: 70,
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

/* STAMP_PNG:BEGIN — generated from ebenworks-website/public/brand/email/ by
   infra/scripts/sync-email-kit.py. Do not edit by hand. */
export const STAMP_PNG_BASE64: Record<keyof typeof STAMPS, string> = {
  product:
    "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" +
    "SURBVAMAMCgaKYKI5iAAAAAASUVORK5CYII=",
  joint:
    "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",
};
/* STAMP_PNG:END */

/**
 * A picture a message carries inside itself: the hosted address its `img` names (without any `?v=`
 * key), the Content-ID that replaces it, and the bytes as base64.
 */
export type InlineImage = { url: string; contentId: string; filename: string; contentType: string; content: string };

/** One inline part in the Resend SDK's shape (`resend.emails.send({ attachments })`). */
export type InlineAttachment = { filename: string; content: string; contentType: string; contentId: string };

/** The kit's own pictures: both stamps, whose bytes the sync script writes into this file. */
export const KIT_INLINE_IMAGES: InlineImage[] = (Object.keys(STAMPS) as Array<keyof typeof STAMPS>).map((k) => ({
  url: STAMPS[k].src,
  contentId: k === "product" ? "ebenworks-stamp" : "ebenworks-joint-stamp",
  filename: STAMPS[k].src.slice(STAMPS[k].src.lastIndexOf("/") + 1),
  contentType: "image/png",
  content: STAMP_PNG_BASE64[k],
}));

const INLINE_SRC = /(\bsrc=")(https:\/\/[^"?#]+)(?:[?#][^"]*)?(")/g;

/**
 * Carry the stamp (and any picture in `extra`) inside the message instead of linking it.
 *
 * On 22 Oct 2026 Gmail showed the stamp broken: the file was there, but ebenworks.co's name servers
 * answered SERVFAIL often enough that Gmail's image proxy found no address (EBE-4879). A message that
 * holds its own pictures needs no lookup and no proxy. Call this at send, on the final HTML: each
 * known `src` becomes `cid:<id>` and the picture is listed once as an inline attachment, however many
 * times the message shows it. An address it does not know is left as it is. Renderers keep the hosted
 * address, which stays right wherever a message cannot carry an attachment (a browser preview,
 * Resend's batch endpoint, which takes no attachments). A REST caller maps each part with
 * `restAttachment`.
 */
export function inlineImages(html: string, extra: InlineImage[] = []): { html: string; attachments: InlineAttachment[] } {
  const known = new Map<string, InlineImage>();
  for (const img of [...KIT_INLINE_IMAGES, ...extra]) if (img.content) known.set(img.url, img);
  const found = new Map<string, InlineAttachment>();
  const out = html.replace(INLINE_SRC, (whole, pre: string, url: string, post: string) => {
    const img = known.get(url);
    if (!img) return whole;
    if (!found.has(img.contentId)) {
      found.set(img.contentId, { filename: img.filename, content: img.content, contentType: img.contentType, contentId: img.contentId });
    }
    return `${pre}cid:${img.contentId}${post}`;
  });
  return { html: out, attachments: [...found.values()] };
}

/** An inline part in Resend's REST shape (`POST /emails`), for a caller that does not use the SDK. */
export function restAttachment(a: InlineAttachment): { filename: string; content: string; content_type: string; content_id: string } {
  return { filename: a.filename, content: a.content, content_type: a.contentType, content_id: a.contentId };
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
      ? `<img src="${esc(id.logoUrl)}" alt="${esc(id.name)}" width="${id.logoWidth}" height="${id.logoHeight}" style="width:${id.logoWidth}px;height:auto;max-width:62%;display:inline-block;border:0;outline:none;text-decoration:none;">`
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
    ${opts.unsubscribeUrl ? `<p style="margin:0 0 10px;${ff}font-size:12px;line-height:1.6;"><a href="${esc(opts.unsubscribeUrl)}" style="color:${T.footerMuted};text-decoration:underline;">Unsubscribe</a></p>` : ""}
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
    ...(opts.unsubscribeUrl ? [`Unsubscribe: ${opts.unsubscribeUrl}`] : []),
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
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_m, href, label) => `${label} (${href})`)
    .replace(/<[^>]+>/g, "")
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
      `style="display:block;width:${id.logoWidth}px;height:auto;border:0;outline:none;text-decoration:none;font-family:${RC.sans};font-size:18px;font-weight:800;color:${RC.ink};">`
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
          `style="display:block;width:${o.sentWith.logoWidth ?? 88}px;height:auto;border:0;font-family:${RC.sans};font-size:13px;font-weight:800;color:${RC.ink};"></td>`
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
