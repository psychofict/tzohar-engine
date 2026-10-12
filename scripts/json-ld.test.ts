/**
 * JSON-LD escaping (src/lib/json-ld.ts, EBE-515). Site owners write the text that
 * ends up in these blocks, so "</script>" in a page title must not close the
 * element. Run: npx --yes tsx scripts/json-ld.test.ts
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JsonLd from "../src/components/JsonLd";
import { serializeJsonLd } from "../src/lib/json-ld";

let fails = 0;
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) fails++;
  console.log(`  ${ok ? "✓" : "✗"} ${label}${ok || !detail ? "" : `\n      ${detail}`}`);
};

const hostile = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Owner</script><script>alert(document.cookie)</script>",
  description: "a < b, <!-- not a comment --> &   line separator",
};

const html = renderToStaticMarkup(createElement(JsonLd, { data: hostile }));
const open = '<script type="application/ld+json">';
const inner = html.slice(open.length, html.lastIndexOf("</script>"));

check("the component renders one script element", html.startsWith(open) && html.endsWith("</script>"), html);
check('no "<" survives inside it', !inner.includes("<"), inner);
check("an HTML parser would end the element only at the real close tag",
  html.toLowerCase().indexOf("</script") === html.length - "</script>".length);
check("JSON.parse gives back exactly what went in", JSON.stringify(JSON.parse(inner)) === JSON.stringify(hostile));
check("the escape is \\u003c", serializeJsonLd({ a: "<" }) === '{"a":"\\u003c"}', serializeJsonLd({ a: "<" }));
check("plain data is unchanged", serializeJsonLd({ name: "Ebstar", url: "https://ebstar.co" }) === JSON.stringify({ name: "Ebstar", url: "https://ebstar.co" }));

// The control: what 14c42ef rendered for the same data.
const before = `${open}${JSON.stringify(hostile)}</script>`;
check("the old output did break out (control)", before.indexOf("</script") < before.length - "</script>".length);

console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
