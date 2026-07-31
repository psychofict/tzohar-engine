import { parseBibtex, toBibtex, deTex, normaliseAuthor } from "../packages/schema/src/bibtex";

const BIB = String.raw`
% a comment line that must be ignored
@string{nat = "Nature"}

@article{lovelace2024dna,
  title   = {The {DNA} of Analytical Engines: a study of {Menabrea}'s notes},
  author  = {Lovelace, Ada and M{\"u}ller, J{\"o}rg and {Institute for Basic Science}},
  journal = {Nature Nanotechnology},
  year    = {2024},
  doi     = {https://doi.org/10.1038/s41565-024-01234-5},
  url     = {https://example.org/paper}
}

@inproceedings{hopper2023compilers,
  title     = "Automatic programming and the {A-0} system",
  author    = "Hopper, Grace M. and Turing, Alan",
  booktitle = "Proceedings of the Symposium on Automatic Programming",
  year      = 2023
}

@phdthesis{johnson2022orbit,
  title  = {Orbital mechanics for crewed re--entry},
  author = {Johnson, Katherine},
  school = {Langley},
  year   = {2022}
}

@misc{broken_no_title,
  author = {Nobody},
  year   = {2020}
}
`;

const r = parseBibtex(BIB);
let fails = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `\n      got:  ${JSON.stringify(got)}\n      want: ${JSON.stringify(want)}`}`);
};

check("entry count (macros + untitled skipped)", r.publications.length, 3);
check("skipped reports the untitled entry", r.skipped, [{ key: "broken_no_title", reason: "no title" }]);

const [p1, p2, p3] = r.publications;
check("nested braces in title survive", p1.title, "The DNA of Analytical Engines: a study of Menabrea's notes");
check("umlauts decoded, corporate author kept whole", p1.authors, ["Ada Lovelace", "Jörg Müller", "Institute for Basic Science"]);
check("doi stripped of its resolver prefix", p1.doi, "10.1038/s41565-024-01234-5");
check("entry type → human label", p1.type, "Journal article");
check("quoted values + bare year", [p2.title, p2.year], ["Automatic programming and the A-0 system", "2023"]);
check("booktitle becomes the venue", p2.journal, "Proceedings of the Symposium on Automatic Programming");
check("conference type", p2.type, "Conference paper");
check("en-dash from --", p3.title, "Orbital mechanics for crewed re–entry");
check("school becomes the venue", p3.journal, "Langley");
check("file order preserved", r.publications.map((p) => p.year), ["2024", "2023", "2022"]);

check("author 'Last, First' flips", normaliseAuthor("Doe, Jane A."), "Jane A. Doe");
check("author already natural is untouched", normaliseAuthor("Jane Doe"), "Jane Doe");
check("de-tex strips casing braces", deTex("The {DNA} of X"), "The DNA of X");

const round = toBibtex(p1);
check("export names the right entry type", round.startsWith("@article{"), true);
check("export joins authors with ' and '", round.includes("author = {Ada Lovelace and Jörg Müller and Institute for Basic Science}"), true);
check("export round-trips through the parser", parseBibtex(round).publications[0].title, p1.title);
check("conference exports as inproceedings with booktitle", toBibtex(p2).includes("@inproceedings{") && toBibtex(p2).includes("booktitle = {"), true);

console.log(fails === 0 ? "\nALL PASS" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
