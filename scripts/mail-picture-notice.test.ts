/**
 * The engine's privacy notice says what the mail picture host logs (EBE-10593, from EBE-10567 and the CAO's
 * decision EBE-10558): block B, word for word, in "What this site collects". The prose never names the provider.
 * Reads one page only, so it runs in every client repo and the public mirror.
 * Run: npx --yes tsx scripts/mail-picture-notice.test.ts
 */
import { readFileSync } from "node:fs";

let fails = 0;
const check = (name: string, ok: boolean) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
  if (!ok) fails += 1;
};

const source = readFileSync(new URL("../src/app/[locale]/privacy/page.tsx", import.meta.url), "utf8");
const text = source
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, " ")
  .replace(/&rsquo;/g, "'")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");

const B =
  "Pictures in our emails: when you open one of our emails with pictures shown, your mail app fetches them from our mail picture host, which logs the requesting IP address (your mail service's, if it fetches pictures for you), your mail app's user agent, the picture and the time. We use the log only to keep the host working and secure, never to find out whether you opened an email. It is kept in the United States and deleted after 35 days. To stop it, set your mail app not to load pictures; our emails still read in full.";
check("B, word for word", text.replace(/\s+([:;,.])/g, "$1").includes(B));
const collect = source.slice(source.indexOf("What this site collects"), source.indexOf("Why we process it"));
check("B sits in 'What this site collects'", collect.includes("Pictures in our emails"));
check("the prose never names the provider", !/cloudfront/i.test(text));

console.log(fails ? `\n${fails} failed` : "\nall passed");
process.exit(fails ? 1 : 0);
