import { configSchema, type SiteConfig } from "./config";

/**
 * Validate a config object and serialize it to the git-as-DB artifact
 * (`src/config/site.values.json`). Tzohar Studio calls this on Publish, then
 * commits the result to the client's repo. Throws on invalid config so Studio
 * can surface the error instead of shipping a broken site.
 */
export function serializeConfig(config: SiteConfig): string {
  const valid = configSchema.parse(config);
  return JSON.stringify(valid, null, 2) + "\n";
}

/** Parse + validate raw JSON (string or object) into a typed config. */
export function parseConfig(raw: unknown): SiteConfig {
  return configSchema.parse(typeof raw === "string" ? JSON.parse(raw) : raw);
}
