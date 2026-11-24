import { Link } from "@/i18n/navigation";
import Container from "@/components/ui/Container";
import { site, hasModule } from "@/config/site";
import { analyticsTools, joinWithAnd } from "@/lib/analytics";
import {
  BUILDER,
  HOST,
  operator,
  operatorCountry,
  privacyEmail,
  takesNewsletter,
  takesFreeSignups,
  takesMessages,
  sendsEmail,
  offersThemeChoice,
  offersLanguageChoice,
  usesCloudinary,
} from "@/lib/privacy-facts";

// Single-language legal page (matches the hub's legal pages, which are English-only).
const HUB = (process.env.NEXT_PUBLIC_ACCOUNTS_URL || "https://accounts.ebenworks.co").replace(/\/+$/, "");
const SITE_HOST = new URL(site.url).host;

// Headings in the site's display face, as on every other page (they were bold body type).
const H2 = "type-display text-ink text-[calc(1.25rem*var(--display-scale))] leading-snug";

/**
 * The site's privacy notice. The site's operator (the client) is the one responsible for the data;
 * Ebenworks builds and hosts the site for them. Each item below appears only when the site has the
 * thing it describes (src/lib/privacy-facts.ts), and the analytics come from the one list in
 * src/lib/analytics.ts.
 */
export default function PrivacyPage() {
  const membership = hasModule("membership");
  // Exactly the analytics this site loads (src/lib/analytics.ts, decision EBE-7056).
  const analytics = analyticsTools();
  const signups = takesNewsletter || takesFreeSignups;
  const signupName =
    takesNewsletter && takesFreeSignups ? "Newsletter and free sign-ups" : takesNewsletter ? "Newsletter sign-ups" : "Free sign-ups";
  const browserChoices = [
    offersThemeChoice ? "Your light or dark choice is kept in your browser." : "",
    offersLanguageChoice ? "Your language choice is part of the page address, and nothing is stored for it." : "",
  ].filter(Boolean);

  return (
    <main id="main-content" className="min-h-screen bg-bg text-ink">
      <Container size="sm" className="pt-28 sm:pt-32 pb-20">
        <h1 className="type-display text-ink text-balance leading-[1.08] text-[calc(clamp(1.9rem,4vw,2.75rem)*var(--display-scale))]">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-ink-3">Last updated: 24 November 2026</p>

        <div className="mt-8 flex flex-col gap-6 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-4 [&_a]:text-ocean-strong [&_a:hover]:underline [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
          <p>
            This notice covers the personal data that <strong>{SITE_HOST}</strong>, the {site.name} website,
            collects directly. The site is run by <strong>{operator}</strong>
            {operatorCountry ? ` (${operatorCountry})` : ""}, who is responsible for that data. {BUILDER} builds
            the site and hosts it for {operator} through Tzohar Sites, and handles the data only on{" "}
            {operator}&rsquo;s instructions. In this notice, &ldquo;we&rdquo; means {operator}.
            {membership && (
              <>
                {" "}Your account, sign-in and billing data is handled by{" "}
                <strong>Ebenworks Accounts</strong> under its own{" "}
                <a href={`${HUB}/privacy`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>; this
                notice covers what this site does on top of that.
              </>
            )}
          </p>

          <section>
            <h2 className={H2}>What this site collects</h2>
            <ul>
              {signups && (
                <li>
                  <strong>{signupName}</strong>: your email address. We ask you to confirm it by email, then use it
                  to send news and updates from {site.name}. You can unsubscribe from any email at any time.
                </li>
              )}
              {takesMessages && (
                <li>
                  <strong>Contact form</strong>: your name, your email address and your message, used only to reply
                  to you.
                </li>
              )}
              {membership && (
                <>
                  <li>
                    <strong>Membership</strong>: when you subscribe, sign-in and payment run through Ebenworks
                    Accounts, with <strong>Paynow</strong> as the payment processor and {BUILDER} as the merchant of
                    record. Charges are in US dollars. This site only ever sees whether you are signed in, your
                    display name and your plan status.
                  </li>
                  <li>
                    <strong>Your profile</strong>: a display name and notification preferences you set on
                    your <Link href="/account">account</Link>, stored with your Ebenworks account.
                  </li>
                </>
              )}
              <li>
                <strong>Analytics</strong>: we use {joinWithAnd(analytics.map((a) => a.name))} to understand
                traffic (pages viewed, device, approximate location). We do <strong>not</strong> sell your data or
                use it for third-party advertising.{browserChoices.length > 0 ? ` ${browserChoices.join(" ")}` : ""}
              </li>
              {sendsEmail && (
              <li>
                <strong>Pictures in our emails:</strong> when you open one of our emails with pictures shown, your mail app
                fetches them from our mail picture host, which logs the requesting IP address (your mail service&rsquo;s, if
                it fetches pictures for you), your mail app&rsquo;s user agent, the picture and the time. We use the log
                only to keep the host working and secure, never to find out whether you opened an email. It is kept in the
                United States and deleted after 35 days. To stop it, set your mail app not to load pictures; our emails
                still read in full.
              </li>
              )}
            </ul>
          </section>

          <section>
            <h2 className={H2}>Why we process it</h2>
            <ul>
              {signups && <li>To send the updates you asked for (your consent, which you can withdraw at any time).</li>}
              {takesMessages && <li>To reply to your messages (our legitimate interest).</li>}
              <li>To run, secure and improve the site (our legitimate interest).</li>
              {membership && (
                <li>To provide membership, through Ebenworks Accounts with Paynow as the payment processor.</li>
              )}
            </ul>
          </section>

          <section>
            <h2 className={H2}>Who handles it for us</h2>
            <ul>
              <li><strong>{BUILDER}</strong>: builds, hosts and maintains the site for {operator}.</li>
              <li><strong>{HOST}</strong>: runs the servers that deliver the site&rsquo;s pages.</li>
              {sendsEmail && (
                <li>
                  <strong>Amazon Web Services</strong> (Amazon SES, Seoul, South Korea): delivers the site&rsquo;s
                  emails, sent through the Ebenworks mail service in Seoul.
                </li>
              )}
              {usesCloudinary && <li><strong>Cloudinary</strong>: stores the site&rsquo;s pictures and delivers them.</li>}
              {membership && <li><strong>Ebenworks Accounts</strong> and <strong>Paynow</strong>: account and billing.</li>}
              <li><strong>{analytics.map((a) => a.company).join(", ")}</strong>: analytics.</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </section>

          <section>
            <h2 className={H2}>Your rights and how to reach us</h2>
            <p>
              You can ask to see, correct, delete or export your data, or withdraw your consent, by writing to{" "}
              <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>.
              {membership && " Requests about your account, identity or billing are handled through Ebenworks Accounts."}
            </p>
          </section>

          <section>
            <h2 className={H2}>Changes</h2>
            <p>We will update this page and the date above when this notice changes.</p>
          </section>

          {membership && (
            <p className="text-sm text-ink-3">
              For account, identity and billing, see the{" "}
              <a href={`${HUB}/privacy`} target="_blank" rel="noopener noreferrer">Ebenworks Accounts Privacy Policy</a>,{" "}
              <a href={`${HUB}/terms`} target="_blank" rel="noopener noreferrer">Terms</a> and{" "}
              <a href={`${HUB}/refunds`} target="_blank" rel="noopener noreferrer">Refund Policy</a>.
            </p>
          )}
        </div>
      </Container>
    </main>
  );
}
