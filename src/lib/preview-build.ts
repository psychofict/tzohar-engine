/**
 * A preview build is a site shown to its owner by link before launch: built with
 * TZOHAR_PREVIEW=1, it asks every crawler to stay away (robots.txt, the robots
 * meta tag and an X-Robots-Tag header in next.config.ts), and its contact form
 * is closed: the contact page shows the site's email address instead and
 * /api/contact refuses every message, so nothing a visitor writes in the contact
 * form of a preview is mailed. The footer newsletter and the join page still take
 * sign-ups on a preview (EBE-7062). Read at build time; next.config.ts's `env` copies the
 * flag into the browser code as well. A launched site is built without it.
 */
export const isPreviewBuild = process.env.TZOHAR_PREVIEW === "1";
