/* eslint-disable */
// ─────────────────────────────────────────────────────────────────────────────
// GENERATED FILE — DO NOT EDIT.
//
// The fleet crawler policy. Answer and search engines are allowed by name,
// including the AI ones: being cited in an answer is distribution. Training
// crawlers are denied by name, and that deny entry IS the licence statement —
// no permission is granted to reproduce these sites in a training corpus, and
// ignoring robots.txt does not create one.
//
//   source: infra/docs/ai-crawlers.json
//   sync:   infra/scripts/sync-ai-crawlers.py
//   check:  infra/scripts/sync-ai-crawlers.py --check
// ─────────────────────────────────────────────────────────────────────────────

export const AI_CRAWLER_POLICY_VERSION = "1.0";
export const AI_CRAWLER_POLICY_UPDATED = "2026-08-19";

// Denied. Each entry is a refusal of permission, not a request.
export const TRAINING_CRAWLERS: string[] = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "FacebookBot",
  "Bytespider",
  "Amazonbot",
  "AI2Bot",
  "Diffbot",
  "omgili",
  "omgilibot",
  "ImagesiftBot",
  "PanguBot",
  "Timpibot",
  "Kangaroo Bot",
  "cohere-ai",
  "Scrapy",
];

// Allowed. Search and answer engines, including the AI ones — do not move one of these into the deny list.
export const ANSWER_CRAWLERS: string[] = [
  "Googlebot",
  "Googlebot-Image",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
  "Yeti",
  "SeznamBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-User",
  "Claude-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
];
