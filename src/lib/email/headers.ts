/**
 * The plain-text parts of a mail's headers: the subject and the From line (EBE-9909).
 *
 * A header is not HTML, so a value a person typed goes in as typed ("Tendai & Sons", not
 * "Tendai &amp; Sons"), on one line, and within the length a mail app shows. Only the HTML body
 * escapes what was typed.
 */

/** The most characters a subject may have. */
export const SUBJECT_MAX = 78;

const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/** One line: line breaks, tabs and other control characters become a space, and runs of spaces
 *  become one. */
export function oneLine(s: string): string {
  return s.replace(/[\p{Cc}\u2028\u2029\s]+/gu, " ").trim();
}

/** A subject made of fixed words and a typed value, as plain text on one line. A value too long for
 *  the limit is cut with "…"; the fixed words stay whole. The first typed value with any text in it
 *  is used. */
export function subjectWith(lead: string, ...typed: Array<string | undefined>): string {
  const value = typed.map((t) => oneLine(t ?? "")).find(Boolean) ?? "";
  const room = Math.max(0, SUBJECT_MAX - lead.length);
  if (value.length <= room) return lead + value;
  // The cut falls between characters as a reader sees them: a flag is two regional indicators and a
  // family is several people joined by zero-width joiners, so a plain cut would leave half of one.
  let cut = "";
  for (const { segment } of GRAPHEMES.segment(value)) {
    if (cut.length + segment.length > room - 1) break;
    cut += segment;
  }
  return `${lead}${cut.trimEnd()}…`;
}

/** A From line for a site's own name and address. The name loses `"`, `\`, `<`, `>` and line breaks,
 *  which an address header cannot carry, and is quoted when it holds anything besides letters,
 *  digits, spaces and hyphens (an ampersand, apostrophe, comma or full stop). */
export function fromHeader(name: string, address: string): string {
  const clean = oneLine(name.replace(/["\\<>]/g, ""));
  if (!clean) return address;
  return /^[\p{L}\p{N} -]+$/u.test(clean) ? `${clean} <${address}>` : `"${clean}" <${address}>`;
}
