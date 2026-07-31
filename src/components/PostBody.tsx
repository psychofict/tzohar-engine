import { Fragment } from "react";

/**
 * Minimal prose renderer for a post body.
 *
 * Deliberately NOT an HTML pass-through and not a full Markdown library. The CRM
 * writes this field, so the renderer defines exactly what a body can express —
 * paragraphs, `## ` subheadings, `> ` pull quotes, `- ` bullets and `1. ` lists.
 * Anything else arrives as literal text. That keeps a content field from being a
 * stored-XSS vector (no `dangerouslySetInnerHTML` anywhere in this path) and
 * keeps the typography inside the site's own scale instead of importing a
 * stylesheet's idea of one.
 *
 * Inline emphasis is supported for `**bold**` and `*italic*` only, tokenised
 * rather than regex-replaced into markup, for the same reason.
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

function parse(body: string): Block[] {
  const blocks: Block[] = [];
  // Blank line separates blocks; a run of list lines is one block.
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    if (lines.every((l) => l.startsWith("- "))) {
      blocks.push({ kind: "ul", items: lines.map((l) => l.slice(2)) });
      continue;
    }
    if (lines.every((l) => /^\d+\.\s/.test(l))) {
      blocks.push({ kind: "ol", items: lines.map((l) => l.replace(/^\d+\.\s/, "")) });
      continue;
    }
    if (lines[0].startsWith("## ")) {
      blocks.push({ kind: "h2", text: lines[0].slice(3) });
      // A heading chunk may carry its paragraph in the same block.
      const rest = lines.slice(1).join(" ");
      if (rest) blocks.push({ kind: "p", text: rest });
      continue;
    }
    if (lines[0].startsWith("> ")) {
      blocks.push({ kind: "quote", text: lines.map((l) => l.replace(/^>\s?/, "")).join(" ") });
      continue;
    }
    blocks.push({ kind: "p", text: lines.join(" ") });
  }
  return blocks;
}

/** `**bold**` / `*italic*` → elements, by tokenising rather than injecting HTML. */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-ink font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function PostBody({ body }: { body: string }) {
  const blocks = parse(body);
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "h2":
            return (
              <h2 key={i} className="type-display text-ink measure pt-4 text-[1.5rem] leading-tight">
                {block.text}
              </h2>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-ocean measure my-8 border-l-2 pl-6">
                <p className="text-ink text-[1.2rem] leading-[1.5] font-medium">{inline(block.text)}</p>
              </blockquote>
            );
          case "ul":
            return (
              <ul key={i} className="measure space-y-2.5">
                {block.items.map((item, j) => (
                  <li key={j} className="text-ink-2 flex gap-3 text-[16.5px] leading-[1.75]">
                    <span className="bg-ocean mt-2.5 h-1.5 w-1.5 flex-none rounded-full" aria-hidden />
                    <span>{inline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="measure space-y-2.5">
                {block.items.map((item, j) => (
                  <li key={j} className="text-ink-2 flex gap-3.5 text-[16.5px] leading-[1.75]">
                    <span className="type-label text-ink-3 mt-1.5 flex-none tabular-nums">
                      {String(j + 1).padStart(2, "0")}
                    </span>
                    <span>{inline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={i} className="text-ink-2 measure text-[16.5px] leading-[1.8]">
                {inline(block.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
