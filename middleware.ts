import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

/*
 * `admin` is excluded alongside `api`/`_next`: the CRM is a single-locale
 * operator surface, and letting next-intl rewrite it would send /admin to
 * /en/admin — a route that does not exist — so every CRM URL 404'd.
 */
export const config = {
  matcher: [
    "/((?!api|admin|_next|_vercel|images|video|fonts|data|favicon\\.ico|icon-.*\\.png|apple-touch-icon\\.png|manifest\\.json|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};
