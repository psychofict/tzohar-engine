/**
 * BibTeX in, BibTeX out.
 *
 * The single most-used feature of an academic website, and the thing that
 * decides whether onboarding a researcher takes five minutes or an hour. Every
 * academic already has a `.bib` file — from Zotero, Mendeley, Overleaf or their
 * own hand — and retyping forty publications into a web form is the reason they
 * abandon a site builder halfway.
 *
 * Deliberately dependency-free. A BibTeX parser from npm brings a LaTeX stack
 * with it, and this has to run in the schema package, which is a leaf: the
 * engine, Studio and the client CMS all import it, so a heavy dependency here is
 * a heavy dependency in three places. What follows handles the ~95% of real
 * `.bib` files that come out of reference managers, and fails softly on the rest
 * — an entry it cannot parse is skipped and reported, never guessed at.
 */

import type { Publication } from "./content/research";
import { splitTex } from "./tex";

/** One entry, before it is narrowed to a Publication. */
export interface BibEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
}

export interface BibtexParseResult {
  publications: Publication[];
  entries: BibEntry[];
  /** Entries that could not be read, with why. Surfaced to the operator. */
  skipped: { key: string; reason: string }[];
}

/**
 * LaTeX escapes that appear in author and title fields constantly, because
 * BibTeX predates Unicode and reference managers still emit them.
 *
 * Not exhaustive, and not trying to be a LaTeX engine — these are the sequences
 * that actually show up in a bibliography. Anything unrecognised has its
 * backslash-and-braces stripped rather than being left as `\"o` in a name on
 * somebody's website.
 */
const LATEX: [RegExp, string][] = [
  [/\\`\{?([aeiouAEIOU])\}?/g, "$1̀"], // grave
  [/\\'\{?([aeiouyAEIOUY])\}?/g, "$1́"], // acute
  [/\\\^\{?([aeiouAEIOU])\}?/g, "$1̂"], // circumflex
  [/\\~\{?([anoANO])\}?/g, "$1̃"], // tilde
  [/\\"\{?([aeiouyAEIOUY])\}?/g, "$1̈"], // umlaut
  [/\\c\{?([cC])\}?/g, "$1̧"], // cedilla
  [/\\v\{?([a-zA-Z])\}?/g, "$1̌"], // caron
  [/\\[Hu]\{?([a-zA-Z])\}?/g, "$1"], // double acute / breve — drop the mark
  [/\{\\ss\}|\\ss\b/g, "ß"],
  [/\{\\aa\}|\\aa\b/g, "å"],
  [/\{\\AA\}|\\AA\b/g, "Å"],
  [/\{\\o\}|\\o\b/g, "ø"],
  [/\{\\O\}|\\O\b/g, "Ø"],
  [/\{\\ae\}|\\ae\b/g, "æ"],
  [/\{\\AE\}|\\AE\b/g, "Æ"],
  [/\\&/g, "&"],
  [/\\%/g, "%"],
  [/\\\$/g, "$"],
  [/\\_/g, "_"],
  [/---/g, "—"],
  [/--/g, "–"],
  [/``|''/g, '"'],
];

/** Decode LaTeX escapes and strip the brace-protection BibTeX uses for casing. */
export function deTex(raw: string): string {
  let s = raw;
  for (const [re, to] of LATEX) s = s.replace(re, to);
  s = s.normalize("NFC");
  /*
   * `{DNA}` and `{Nature}` protect capitalisation, so those braces are not
   * content and come out. But braces INSIDE a maths span are TeX grouping and
   * are load-bearing: stripping them turns `$10^{-9}$` into `$10^-9$`, which
   * renders as 10⁻9 — a wrong number in the title of somebody's paper. So the
   * maths spans are left exactly as written and only the prose is de-braced.
   */
  s = splitTex(s)
    .map((part) => (part.math ? `$${part.value}$` : part.value.replace(/[{}]/g, "")))
    .join("");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Split a BibTeX author field on `and` at brace depth zero.
 *
 * Depth matters: `{Smith and Jones Ltd}` is one corporate author, not two, and
 * splitting naively on " and " produces a fictitious researcher called Jones Ltd.
 */
function splitAuthors(raw: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  const tokens = raw.split(/(\s+and\s+|\{|\})/i);
  for (const t of tokens) {
    if (t === "{") depth++;
    else if (t === "}") depth--;
    if (/^\s+and\s+$/i.test(t) && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += t;
  }
  if (cur.trim()) out.push(cur);
  return out.map((a) => a.trim()).filter(Boolean);
}

/** "Doe, Jane A." → "Jane A. Doe"; "Jane Doe" is left alone. */
export function normaliseAuthor(raw: string): string {
  const name = deTex(raw);
  const parts = name.split(",");
  if (parts.length === 2) return `${parts[1].trim()} ${parts[0].trim()}`.trim();
  // "von Last, Jr, First" — BibTeX's three-part form.
  if (parts.length === 3) return `${parts[2].trim()} ${parts[0].trim()}, ${parts[1].trim()}`.trim();
  return name;
}

/**
 * Read the fields of one entry body, respecting brace depth and quotes.
 *
 * A regex over `key = {value}` breaks on the first title containing a brace —
 * `{The {DNA} of X}` — which is common enough that it is the default case, not
 * an edge case. So this scans.
 */
function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let i = 0;
  const readKey = (): string | null => {
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    const start = i;
    while (i < body.length && /[A-Za-z0-9_-]/.test(body[i])) i++;
    if (i === start) return null;
    return body.slice(start, i).toLowerCase();
  };
  while (i < body.length) {
    const key = readKey();
    if (!key) break;
    while (i < body.length && /\s/.test(body[i])) i++;
    if (body[i] !== "=") continue;
    i++;
    while (i < body.length && /\s/.test(body[i])) i++;

    let value = "";
    if (body[i] === "{") {
      let depth = 0;
      do {
        if (body[i] === "{") depth++;
        else if (body[i] === "}") depth--;
        value += body[i];
        i++;
      } while (i < body.length && depth > 0);
      value = value.slice(1, -1);
    } else if (body[i] === '"') {
      i++;
      let depth = 0;
      while (i < body.length && !(body[i] === '"' && depth === 0)) {
        if (body[i] === "{") depth++;
        else if (body[i] === "}") depth--;
        value += body[i];
        i++;
      }
      i++;
    } else {
      // A bare value: a number, or a @string macro we cannot resolve.
      while (i < body.length && !/[,\s]/.test(body[i])) {
        value += body[i];
        i++;
      }
    }
    fields[key] = value;
  }
  return fields;
}

/** Human label for an entry type — what a reader sees, not what BibTeX calls it. */
const TYPE_LABEL: Record<string, string> = {
  article: "Journal article",
  inproceedings: "Conference paper",
  conference: "Conference paper",
  incollection: "Book chapter",
  inbook: "Book chapter",
  book: "Book",
  phdthesis: "PhD thesis",
  mastersthesis: "Master's thesis",
  techreport: "Technical report",
  misc: "Preprint",
  unpublished: "Preprint",
};

/**
 * Parse a `.bib` file into publications.
 *
 * Entries are returned in file order — reference managers export newest-first or
 * alphabetically depending on their settings, and second-guessing the author's
 * chosen order is worse than preserving it.
 */
export function parseBibtex(source: string): BibtexParseResult {
  const publications: Publication[] = [];
  const entries: BibEntry[] = [];
  const skipped: { key: string; reason: string }[] = [];

  // Strip full-line comments; @comment/@string/@preamble are skipped below.
  const text = source.replace(/^\s*%.*$/gm, "");

  const re = /@(\w+)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const type = m[1].toLowerCase();
    const open = re.lastIndex - 1;
    let depth = 0;
    let end = open;
    for (let i = open; i < text.length; i++) {
      if (text[i] === "{") depth++;
      else if (text[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (depth !== 0) {
      skipped.push({ key: `@${type}`, reason: "unbalanced braces — entry never closes" });
      break;
    }
    const inner = text.slice(open + 1, end);
    re.lastIndex = end;

    if (type === "comment" || type === "string" || type === "preamble") continue;

    const comma = inner.indexOf(",");
    const key = (comma === -1 ? inner : inner.slice(0, comma)).trim();
    const fields = parseFields(comma === -1 ? "" : inner.slice(comma + 1));
    entries.push({ type, key, fields });

    const title = fields.title ? deTex(fields.title) : "";
    if (!title) {
      skipped.push({ key: key || `@${type}`, reason: "no title" });
      continue;
    }

    const venue = fields.journal || fields.booktitle || fields.publisher || fields.school || fields.institution;
    const year = (fields.year || fields.date || "").match(/\d{4}/)?.[0];
    const authors = fields.author ? splitAuthors(fields.author).map(normaliseAuthor) : [];

    publications.push({
      title,
      ...(venue ? { journal: deTex(venue) } : {}),
      ...(TYPE_LABEL[type] ? { type: TYPE_LABEL[type] } : {}),
      ...(year ? { year } : {}),
      ...(fields.doi ? { doi: fields.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "").trim() } : {}),
      ...(fields.url ? { url: fields.url.trim() } : {}),
      ...(authors.length ? { authors } : {}),
    });
  }

  return { publications, entries, skipped };
}

/**
 * Render a publication back to a BibTeX entry, for a "Cite" button.
 *
 * A visitor who found the page from a paper wants the citation in the form their
 * reference manager eats, and offering it is the cheapest possible courtesy —
 * every academic site that gets used has one.
 */
export function toBibtex(pub: Publication, keyHint?: string): string {
  const firstAuthorSurname = pub.authors?.[0]?.split(/\s+/).slice(-1)[0]?.toLowerCase().replace(/\W/g, "");
  const titleWord = pub.title.split(/\s+/).find((w) => w.length > 3)?.toLowerCase().replace(/\W/g, "");
  const key = keyHint || [firstAuthorSurname, pub.year, titleWord].filter(Boolean).join("");

  const kind =
    pub.type && /conference|proceeding/i.test(pub.type)
      ? "inproceedings"
      : pub.type && /chapter/i.test(pub.type)
        ? "incollection"
        : pub.type && /book/i.test(pub.type)
          ? "book"
          : pub.type && /thesis/i.test(pub.type)
            ? "phdthesis"
            : "article";
  const venueField = kind === "inproceedings" || kind === "incollection" ? "booktitle" : "journal";

  const rows: [string, string | undefined][] = [
    ["title", pub.title],
    ["author", pub.authors?.join(" and ")],
    [venueField, pub.journal],
    ["year", pub.year],
    ["doi", pub.doi],
    ["url", pub.url],
  ];
  const body = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `  ${k} = {${v}}`)
    .join(",\n");
  return `@${kind}{${key || "citation"},\n${body}\n}`;
}
