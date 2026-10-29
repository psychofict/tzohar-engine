/**
 * A preview build is a site shown to its owner by link before launch: built with
 * TZOHAR_PREVIEW=1, it asks every crawler to stay away (robots.txt, the robots
 * meta tag and an X-Robots-Tag header in next.config.ts). Read at build time on
 * the server; a launched site is built without it.
 */
export const isPreviewBuild = process.env.TZOHAR_PREVIEW === "1";
