/**
 * Inline TeX in publication metadata — the pure half.
 *
 * Lives in the schema package rather than the engine because the BibTeX parser
 * next door needs it: `deTex` must NOT strip braces inside a maths span, or
 * `$10^{-9}$` arrives as `$10^-9$` and renders as 10⁻9. That was a real bug,
 * found by running a .bib entry end to end rather than by reading the code.
 *
 * React lives in `src/lib/tex.tsx`, which re-exports all of this and adds the
 * <Tex> component. Everything here is framework-free and directly testable.
 */

/** `\alpha` and friends. Ordered longest-first when matching (see SYMBOL_RE). */
const SYMBOLS: Record<string, string> = {
  // lower-case Greek
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
  lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", varrho: "ϱ",
  sigma: "σ", varsigma: "ς", tau: "τ", upsilon: "υ", phi: "φ", varphi: "ϕ",
  chi: "χ", psi: "ψ", omega: "ω",
  // upper-case Greek
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  // relations and operators that turn up in titles
  times: "×", cdot: "·", pm: "±", mp: "∓", approx: "≈", sim: "∼", simeq: "≃",
  neq: "≠", ne: "≠", leq: "≤", le: "≤", geq: "≥", ge: "≥", ll: "≪", gg: "≫",
  propto: "∝", equiv: "≡", infty: "∞", partial: "∂", nabla: "∇",
  rightarrow: "→", to: "→", leftarrow: "←", leftrightarrow: "↔",
  Rightarrow: "⇒", Leftarrow: "⇐", degree: "°", circ: "∘", prime: "′",
  angstrom: "Å", AA: "Å", micro: "μ", ohm: "Ω", hbar: "ℏ", ell: "ℓ",
  in: "∈", subset: "⊂", cup: "∪", cap: "∩", forall: "∀", exists: "∃",
  sum: "∑", prod: "∏", int: "∫", sqrt: "√", perp: "⊥", parallel: "∥",
  ldots: "…", dots: "…", cdots: "⋯",
};

const SYMBOL_RE = new RegExp(
  `\\\\(${Object.keys(SYMBOLS).sort((a, b) => b.length - a.length).join("|")})`,
  "g",
);

export type TexToken =
  | { kind: "text"; value: string }
  | { kind: "sub"; value: string }
  | { kind: "sup"; value: string };

/**
 * Tokenise one maths span (the inside of `$…$`) into text/sub/sup runs.
 *
 * Exported so it can be tested without rendering — the rules here are where the
 * bugs would live.
 */
export function tokenizeMath(src: string): TexToken[] {
  const s = src.replace(SYMBOL_RE, (_, name: string) => SYMBOLS[name] ?? _);
  const out: TexToken[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ kind: "text", value: text });
    text = "";
  };

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== "_" && c !== "^") {
      // TeX spacing macros. `\,` is a THIN space (U+2009) and `\;` a slightly
      // wider one; both are narrower than a word space, which is the whole point
      // of writing them — "5\,\mu m" should not read as "5 μ m". `\ ` is an
      // ordinary forced space. Getting this wrong is invisible in a diff and
      // visible on the page.
      if (c === "\\" && (s[i + 1] === "," || s[i + 1] === ";")) {
        text += "\u2009";
        i++;
        continue;
      }
      if (c === "\\" && s[i + 1] === " ") {
        text += " ";
        i++;
        continue;
      }
      if (c === "{" || c === "}") continue;
      text += c;
      continue;
    }
    // A script: `_x`, `^2`, `_{max}`, `^{-9}`.
    const kind = c === "_" ? "sub" : "sup";
    let j = i + 1;
    let value = "";
    if (s[j] === "{") {
      let depth = 0;
      for (; j < s.length; j++) {
        if (s[j] === "{") depth++;
        else if (s[j] === "}") {
          depth--;
          if (depth === 0) break;
        } else if (depth > 0) value += s[j];
      }
    } else {
      value = s[j] ?? "";
    }
    if (value === "") {
      // A lone `_` or `^` with nothing after it — keep it literally rather than
      // dropping a character the author typed.
      text += c;
      continue;
    }
    flush();
    out.push({ kind, value });
    i = j;
  }
  flush();
  return out;
}

/**
 * Split a string into plain runs and maths spans.
 *
 * `$` is escapable as `\$`, because a title mentioning a currency is not
 * hypothetical. An unclosed `$` is treated as literal text: a dangling delimiter
 * should not swallow the rest of a title.
 */
export function splitTex(src: string): { math: boolean; value: string }[] {
  const parts: { math: boolean; value: string }[] = [];
  let buf = "";
  let i = 0;
  while (i < src.length) {
    if (src[i] === "\\" && src[i + 1] === "$") {
      buf += "$";
      i += 2;
      continue;
    }
    if (src[i] === "$") {
      const close = src.indexOf("$", i + 1);
      if (close === -1) {
        buf += src.slice(i);
        break;
      }
      if (buf) parts.push({ math: false, value: buf });
      buf = "";
      parts.push({ math: true, value: src.slice(i + 1, close) });
      i = close + 1;
      continue;
    }
    buf += src[i];
    i++;
  }
  if (buf) parts.push({ math: false, value: buf });
  return parts;
}

/** True when a string contains anything this renderer would change. */
export function hasTex(src: string): boolean {
  return /\$[^$]+\$/.test(src);
}

/**
 * The same conversion, flattened to a plain string.
 *
 * For places that cannot take React nodes — a `<title>`, an `alt`, a meta
 * description, a BibTeX export. Scripts become Unicode where an unambiguous
 * character exists and are otherwise left readable, because `Fe3O4` is a better
 * page title than `Fe$_3$O$_4$`.
 */
const SUB_DIGITS = "₀₁₂₃₄₅₆₇₈₉";
const SUP_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const SUP_OTHER: Record<string, string> = { "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ" };
const SUB_OTHER: Record<string, string> = { "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎" };

export function texToPlain(src: string): string {
  if (!hasTex(src)) return src;
  return splitTex(src)
    .map((part) => {
      if (!part.math) return part.value;
      return tokenizeMath(part.value)
        .map((tok) => {
          if (tok.kind === "text") return tok.value;
          const map = tok.kind === "sub" ? SUB_DIGITS : SUP_DIGITS;
          const other = tok.kind === "sub" ? SUB_OTHER : SUP_OTHER;
          const converted = [...tok.value]
            .map((ch) => (/\d/.test(ch) ? map[Number(ch)] : (other[ch] ?? null)))
            .join("");
          // All-or-nothing: a half-converted script reads worse than a plain one.
          return converted.length === tok.value.length && !converted.includes("null")
            ? converted
            : tok.value;
        })
        .join("");
    })
    .join("");
}
