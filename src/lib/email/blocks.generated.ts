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
//   sha256: 72c4377d67e9c73c
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The Ebenworks email block library.
 *
 * A mail client is not a browser. Outlook renders through Word, Gmail strips
 * <style> on some paths and every class on others, and no client resolves a CSS
 * variable. So everything here is a table with inline literal values, one 600px
 * column, and a system font stack. Boring beats clever: the reader on a cheap
 * Android handset is the case that has to work.
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
  footerBg: "#1d1009",
  footerText: "#d4cec2",
  footerMuted: "#a7a096",
  footerLink: "#ffb280",
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
   */
  button(accentText: string, href: string, label: string): Block {
    return {
      html: `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 6px;"><tr>` +
        `<td align="center" bgcolor="${accentText}" style="background:${accentText};border-radius:999px;">` +
        `<a href="${esc(href)}" style="display:inline-block;padding:13px 28px;font-family:${T.font};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(label)} &rarr;</a>` +
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
          `<td style="border:1px solid ${T.rule};padding:7px 9px;font-family:${T.font};font-size:13px;line-height:1.5;color:${T.inkSoft};white-space:pre-wrap;vertical-align:top;">${esc(c) || "&mdash;"}</td>`).join("")}</tr>`).join(""),
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
 */
export function renderEmail(opts: EmailOpts): { html: string; text: string } {
  const id = identity(opts.identity);
  const year = new Date().getUTCFullYear();
  const ko = opts.lang?.startsWith("ko");
  const font = ko ? T.fontKo : T.font;
  const preheader = opts.preheader || opts.title;

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
</head>
<body bgcolor="${T.page}" style="margin:0;padding:0;background:${T.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${T.page}" style="background:${T.page};margin:0;padding:0;">
<tr><td align="center" style="padding:30px 16px;">
<table role="presentation" width="${T.width}" cellpadding="0" cellspacing="0" style="width:${T.width}px;max-width:${T.width}px;border-collapse:separate;">
  <tr><td bgcolor="${id.accent}" style="height:5px;background:${id.accent};border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td align="center" bgcolor="${T.card}" style="background:${T.card};padding:30px 36px 18px;">
    ${id.logoUrl
      ? `<img src="${esc(id.logoUrl)}" alt="${esc(id.name)}" width="${id.logoWidth}" height="${id.logoHeight}" style="width:${id.logoWidth}px;height:auto;max-width:62%;display:inline-block;border:0;outline:none;text-decoration:none;">`
      : `<div style="font-family:${font};font-size:20px;font-weight:800;letter-spacing:-0.01em;color:${T.ink};">${esc(id.name)}</div>`}
  </td></tr>
  <tr><td bgcolor="${T.card}" style="background:${T.card};padding:0 36px;"><div style="border-top:1px solid ${T.rule};font-size:0;line-height:0;">&nbsp;</div></td></tr>
  <tr><td bgcolor="${T.card}" style="background:${T.card};padding:26px 36px 34px;">
    ${opts.heading ? `<h1 style="margin:0 0 16px;font-family:${font};font-size:23px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:${T.ink};">${opts.heading}</h1>` : ""}
    ${opts.blocks.map(block => block.html).join("\n    ")}
  </td></tr>
  <tr><td bgcolor="${T.footerBg}" style="background:${T.footerBg};padding:24px 36px 26px;border-radius:0 0 16px 16px;">
    <p style="margin:0 0 5px;font-family:${font};font-size:14px;font-weight:700;letter-spacing:0.02em;color:#ffffff;">${esc(id.name)}</p>
    ${opts.tagline ? `<p style="margin:0 0 12px;font-family:${font};font-size:12px;line-height:1.5;color:${T.footerMuted};">${esc(opts.tagline)}</p>` : ""}
    ${opts.reason ? `<p style="margin:0 0 10px;font-family:${font};font-size:12px;line-height:1.5;color:${T.footerMuted};">${esc(opts.reason)}</p>` : ""}
    <p style="margin:0 0 10px;font-family:${font};font-size:12px;line-height:1.6;">${
      footerLinks.map(l => `<a href="${esc(l.href)}" style="color:${T.footerLink};text-decoration:none;">${esc(l.label)}</a>`)
        .join('<span style="color:#48413a;">&nbsp;&nbsp;·&nbsp;&nbsp;</span>')}</p>
    ${opts.unsubscribeUrl ? `<p style="margin:0 0 10px;font-family:${font};font-size:12px;line-height:1.6;"><a href="${esc(opts.unsubscribeUrl)}" style="color:${T.footerMuted};text-decoration:underline;">Unsubscribe</a></p>` : ""}
    <p style="margin:0;font-family:${font};font-size:11px;color:${T.footerMuted};">© ${year} Ebenworks Systems (Pvt) Ltd</p>
  </td></tr>
</table>
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
    `© ${year} Ebenworks Systems (Pvt) Ltd`,
    "",
  ].join("\n");

  return { html, text };
}
