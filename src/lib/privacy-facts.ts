import { site, hasModule } from "@/config/site";
import { composedPages } from "@/data/pages";
import { allPosts } from "@/data/posts";
import { isPreviewBuild } from "@/lib/preview-build";

/**
 * What the privacy notice (src/app/[locale]/privacy/page.tsx) says about who runs this site and
 * what it collects, worked out from the site's own settings so the notice lists only what the
 * site actually has.
 *
 * The operator is the client (Eben, 24 Nov 2026): the person or business the site belongs to is
 * responsible for its visitors' data, and Ebenworks builds and hosts the site for them. The
 * notice used to name Ebenworks as the operator of every client's site, with Ebenworks' own
 * privacy address, and listed a newsletter and a contact form whether or not the site had them.
 *
 * The analytics tools are not here: src/lib/analytics.ts is the one list of those, and
 * scripts/check-analytics-notice.mjs keeps the notice from naming any itself.
 */

/** The company that builds and hosts every Tzohar Sites site, in its registered form. */
export const BUILDER = "Ebenworks Systems (Private) Limited";

/** Who hosts the site's servers and pages. Every Tzohar Sites deployment runs on it. */
export const HOST = "Vercel";

/** The person or business that runs the site: `legal.operator`, else `legalName`, else `name`. */
export const operator: string = site.legal?.operator ?? site.legalName ?? site.name;

/** Where the operator is established, when the config says. */
export const operatorCountry: string | undefined = site.legal?.country;

/** Where privacy requests go: `legal.privacyEmail`, else the site's contact address. */
export const privacyEmail: string = site.legal?.privacyEmail ?? site.email;

/** The footer's newsletter form, which a preview build and `layout.footerNewsletter: false` drop. */
export const takesNewsletter: boolean = site.layout?.footerNewsletter !== false && !isPreviewBuild;

/** The join page's free sign-up (membership), closed on a preview build. */
export const takesFreeSignups: boolean = hasModule("membership") && !isPreviewBuild;

/** The contact form takes messages; a preview build shows an email address instead. */
export const takesMessages: boolean = !isPreviewBuild;

/** The site sends email to visitors at all: sign-up confirmations or replies to a message. */
export const sendsEmail: boolean = takesNewsletter || takesFreeSignups || takesMessages;

/** The visitor can switch light and dark, and the choice is kept in their browser. */
export const offersThemeChoice: boolean =
  site.appearance?.toggle === true || site.appearance?.mode === "system";

/** The site comes in more than one language. The choice is the page address; nothing is stored. */
export const offersLanguageChoice: boolean = site.locales.enabled.length > 1;

/**
 * The site's pictures are stored on Cloudinary: its config or content names a Cloudinary address
 * (Studio's uploads), or the site has its own Cloudinary account for its CRM's uploads.
 */
export const usesCloudinary: boolean =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim()) ||
  JSON.stringify([site, composedPages, allPosts]).includes("res.cloudinary.com");
