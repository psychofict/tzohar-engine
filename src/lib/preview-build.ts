/**
 * A preview build is a site shown to its owner by link before launch: built with
 * TZOHAR_PREVIEW=1, it asks every crawler to stay away (robots.txt, the robots
 * meta tag and an X-Robots-Tag header in next.config.ts), and its contact form
 * is closed: the contact page shows the site's email address instead and
 * /api/contact refuses every message, so nothing a visitor writes in the contact
 * form of a preview is mailed (EBE-7044). It takes no sign-ups either: the footer
 * drops its newsletter form, the join page shows a note in place of its free sign-up,
 * and /api/newsletter and /api/superfan answer 404, so no confirm mail goes to an
 * address a visitor types (EBE-7062). It sells nothing: the join page shows the same note in
 * place of the paid plans' checkout buttons and /api/checkout answers 404 before any call to the
 * hub, since no licence or payout terms are in place before launch (EBE-7066). Read at build time; next.config.ts's `env` copies
 * the flag into the browser code as well. A launched site is built without it.
 */
export const isPreviewBuild = process.env.TZOHAR_PREVIEW === "1";
