/**
 * JSON-LD for a <script type="application/ld+json"> element.
 *
 * JSON.stringify leaves "<" alone, and an HTML parser ends a script element at the
 * first "</script" whatever the script's type. Site owners write the text that goes
 * into these blocks (names, page titles, FAQ answers), so an owner's "</script>"
 * would close the block and run whatever followed on the public site (EBE-515).
 * "<" is the same character to a JSON parser and invisible to the HTML one.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
