import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./landing.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { LegalPage, LegalSection } from "./app/legal";
import { SiteFooter, SiteNav } from "./app/site-chrome";
import { DISCORD_URL } from "./app/social-links";
import { usePageLocale } from "./app/page-locale";

const APP_REPO = "https://github.com/OpenMouse-Project/openmouse";

function Privacy(): ReactNode {
  return (
    <LegalPage
      kicker="Privacy Policy"
      title="Privacy Policy"
      updated="September 19, 2026"
    >
      <p className="land-legal-intro">
        This policy explains how the OpenMouse website at{" "}
        <a href="/">openmouse.app</a> and its pages (the "Site") handle data.
        The Site is provided by the OpenMouse Project, a community of volunteer
        contributors — it is not a company. The Site has no accounts and does
        not collect personal data for the purpose of identifying you.
      </p>

      <LegalSection heading="Scope">
        <p>
          This policy covers the marketing and support website only. The
          device-configuration application is a separate project developed in
          the{" "}<a href={APP_REPO}>openmouse repository</a>, and is outside the
          scope of this policy.
        </p>
      </LegalSection>

      <LegalSection heading="Data stored only on your device">
        <p>
          The Site stores small amounts of data in your browser's local
          storage to remember your preferences. This data never leaves your
          device and is never transmitted to the Site's servers:
        </p>
        <ul>
          <li>
            interface preferences such as language, color theme, and color
            mode (<code>openmouse-interface-settings-v1</code>);
          </li>
          <li>
            a randomly generated, pseudonymous identifier used to make sure
            the supported-devices voting feature counts one voice per device (
            <code>openmouse.support-request-voter</code>);
          </li>
          <li>
            a cached snapshot of public GitHub contributor data shown on the
            donate page (<code>openmouse-donate-contributors-v1</code>) and
            expand/collapse state on the supported-devices page;
          </li>
          <li>
            a service worker that caches site pages, styles, fonts, and images
            locally so the Site can load offline. This speeds up loading and
            does not collect or transmit anything.
          </li>
        </ul>
        <p>Deleting your browser's local storage for this site removes this data.</p>
      </LegalSection>

      <LegalSection heading="Data processed to run the Site">
        <p>
          The Site is hosted on{" "}
          <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare Pages</a>.
          To deliver pages and API responses, Cloudflare and the Site's
          functions process standard request data — your IP address, the time
          of requests, the pages and endpoints requested, and standard browser
          headers. Cloudflare's privacy policy applies to this
          infrastructure-level processing.
        </p>
      </LegalSection>

      <LegalSection heading="Abuse protection and rate limiting">
        <p>
          A security layer (<code>functions/_middleware.js</code>) runs before
          every page and API route. It uses your IP address to count requests
          (the Site currently allows 240 reads and 30 writes per minute), to
          detect exploit attempts, and to temporarily or permanently block
          abusive traffic. Abuse "strikes" expire after about seven days;
          permanent blocks stay until a maintainer clears them. This
          processing is necessary to protect the Site and its visitors.
        </p>
      </LegalSection>

      <LegalSection heading="The supported-devices request and voting feature">
        <p>
          On the supported-devices page you can request support for a mouse and
          vote on existing requests. Submitting a request or a vote requires
          completing a{" "}
          <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare Turnstile</a>{" "}
          anti-spam check. If you submit or vote, the Site records:
        </p>
        <ul>
          <li>
            the request data you enter — manufacturer, model, and connection
            type — which is displayed publicly in the supported-devices
            catalog; and
          </li>
          <li>
            a one-way hash of your IP address (keyed HMAC-SHA-256), used only
            to enforce one vote per device per request. Raw IP addresses are
            not stored with requests or votes, and the hash cannot be reversed
            to recover your IP address.
          </li>
        </ul>
        <p>
          Request and vote data is stored in a Postgres database (Supabase)
          behind the Site's API functions. The maintainers can pause request
          and vote submission at any time (the site ships with an emergency
          write kill-switch).
        </p>
      </LegalSection>

      <LegalSection heading="Blog comments">
        <p>
          When you post a comment on the blog, the comment text and the name
          you choose — which may be a pseudonym, and comments can be posted
          anonymously — are stored in Cloudflare's key-value store and shown
          publicly. No email address, account, or IP address is collected with
          your comment. There is no approval queue.
        </p>
      </LegalSection>

      <LegalSection heading="Third-party services">
        <p>
          Some page content loads from external services, each of which
          processes standard request data (including your IP address) under
          its own privacy policy:
        </p>
        <ul>
          <li>
            GitHub — the <code>api.github.com</code> endpoint is queried to
            show the project's star count and contributor data on the landing
            and donate pages;
          </li>
          <li>
            Google Fonts — fonts load from{" "}
            <code>fonts.googleapis.com</code> and <code>fonts.gstatic.com</code>{" "}
            for page rendering;
          </li>
          <li>
            Cloudflare Turnstile — an anti-spam challenge rendered on the
            supported-devices page and verified by the Site's functions.
          </li>
        </ul>
        <p>
          Links to external communities (Discord, X, GitHub) lead to services
          with their own privacy policies.
        </p>
      </LegalSection>

      <LegalSection heading="No advertising, no cookies of our own, no analytics">
        <p>
          The Site sets no cookies of its own, shows no advertising, and runs
          no third-party analytics or tracking scripts. The third-party
          services listed above may place cookies or process browsing data on
          their own; their policies apply to that processing.
        </p>
      </LegalSection>

      <LegalSection heading="How data is shared">
        <p>
          The Site does not sell or rent personal data. Data is shared only
          with the service providers that operate the Site — the hosting and
          database infrastructure (Cloudflare and Supabase) and the providers
          listed under third-party services — as needed to deliver it. Content
          you publish (support requests, votes, and blog comments) is public
          and visible to anyone, as is the supported-devices catalog itself.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices and rights">
        <ul>
          <li>
            Clear your browser's site data or local storage for openmouse.app
            to delete the device-local preferences and identifier described
            above.
          </li>
          <li>
            If you want a published support request or comment removed — for
            example because it contains personal information — reach out on
            the <a href={DISCORD_URL}>Discord server</a> and the maintainers
            will review it.
          </li>
          <li>
            Where data-protection law applies to you, you can ask for access
            to, correction of, or deletion of data held about you. The
            maintainers will address reasonable requests through the same
            channels.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          This policy may be updated when the Site's practices change. The
          effective date above will be revised on each update.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy can be raised on the OpenMouse{" "}
          <a href={DISCORD_URL}>Discord server</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function PrivacyPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Privacy />
      <SiteFooter locale={locale} />
    </div>
  );
}

const privacyApp = document.querySelector<HTMLDivElement>("#privacy-app");

if (!privacyApp) {
  throw new Error("OpenMouse could not find the privacy page root.");
}

createRoot(privacyApp).render(<PrivacyPage />);

registerServiceWorker();
mountOfflineBanner();