/**
 * A message key that a site's messages file may not have.
 *
 * `messages/<locale>.json` is client-owned, so a key the engine adds in a release is missing from
 * every existing client site until somebody edits that file, and next-intl throws on a missing key.
 * Every key added after a site was made is therefore read through here: the site's own text when
 * the file has it and it is not blank, the fallback otherwise.
 *
 * The key reaches `t` as a variable, so scripts/check-messages.mjs counts it as unverified rather
 * than demanding it from every site's messages file, which is the point.
 */
export interface OptionalTranslator {
  (key: string): string;
  has(key: string): boolean;
}

export function optionalMessage(t: OptionalTranslator, key: string, fallback: string): string {
  if (!t.has(key)) return fallback;
  const value = t(key);
  return value.trim() ? value : fallback;
}

/** The same, for a key whose absence means "print nothing" (an empty string comes back). */
export function optionalMessageOrEmpty(t: OptionalTranslator, key: string): string {
  return optionalMessage(t, key, "");
}
