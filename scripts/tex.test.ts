import { tokenizeMath, splitTex, hasTex, texToPlain } from "../src/lib/tex";

let fails = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
};

// ── the cases that actually appear in paper titles ──────────────────────────
check("plain title untouched", hasTex("Soft nanomaterials for medicine"), false);
check("chemical subscripts", tokenizeMath("Fe_3O_4"),
  [{kind:"text",value:"Fe"},{kind:"sub",value:"3"},{kind:"text",value:"O"},{kind:"sub",value:"4"}]);
check("braced superscript with sign", tokenizeMath("10^{-9}"),
  [{kind:"text",value:"10"},{kind:"sup",value:"-9"}]);
check("forced space \\  is an ordinary space", tokenizeMath("a\\ b"), [{kind:"text",value:"a b"}]);
check("greek", tokenizeMath("\\alpha-synuclein"),
  [{kind:"text",value:"α-synuclein"}]);
check("multi-letter braced subscript", tokenizeMath("T_{c}"),
  [{kind:"text",value:"T"},{kind:"sub",value:"c"}]);
check("symbols; \\, is a THIN space, not a word space", tokenizeMath("\\Delta T \\approx 5\\,\\mu m"),
  [{kind:"text",value:"Δ T ≈ 5\u2009μ m"}]);

// ── splitting ───────────────────────────────────────────────────────────────
check("splits text and math", splitTex("Fe$_3$O$_4$ nanoparticles"),
  [{math:false,value:"Fe"},{math:true,value:"_3"},{math:false,value:"O"},{math:true,value:"_4"},{math:false,value:" nanoparticles"}]);
check("escaped dollar is literal", splitTex(String.raw`Costs \$5 per unit`),
  [{math:false,value:"Costs $5 per unit"}]);
check("unclosed dollar does not swallow the title", splitTex("A study of $x and more"),
  [{math:false,value:"A study of $x and more"}]);

// ── the safety property: nothing is silently dropped ────────────────────────
check("unknown macro passes through unchanged", tokenizeMath("\\frobnicate{x}"),
  [{kind:"text",value:"\\frobnicatex"}]);
check("lone underscore kept", tokenizeMath("a_"), [{kind:"text",value:"a_"}]);

// ── plain-text flattening, for <title> and BibTeX ───────────────────────────
check("digits become unicode", texToPlain("Fe$_3$O$_4$"), "Fe₃O₄");
check("signed superscript", texToPlain("$10^{-9}$ M"), "10⁻⁹ M");
check("greek in plain text", texToPlain("$\\alpha$-synuclein"), "α-synuclein");
check("unmappable script stays readable, not half-converted",
  texToPlain("$T_{max}$"), "Tmax");
check("plain string is returned as-is", texToPlain("No maths here"), "No maths here");

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
