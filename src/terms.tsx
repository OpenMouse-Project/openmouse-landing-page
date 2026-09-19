import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./landing.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { LegalPage, LegalSection } from "./app/legal";
import { SiteFooter, SiteNav } from "./app/site-chrome";
import { DISCORD_URL } from "./app/social-links";
import { usePageLocale } from "./app/page-locale";

const REPO = "https://github.com/OpenMouse-Project/openmouse-landing-page";
const APP_REPO = "https://github.com/OpenMouse-Project/openmouse";

function Terms(): ReactNode {
  return (
    <LegalPage
      kicker="Terms of Service"
      title="Terms of Service"
      updated="September 19, 2026"
    >
      <p className="land-legal-intro">
        These terms govern your use of the OpenMouse website at{" "}
        <a href="/">openmouse.app</a> and its pages (the "Site"). By using the
        Site you agree to these terms. The OpenMouse Project is a community of
        volunteer contributors, and the Site and the OpenMouse software are
        made available free of charge.
      </p>

      <LegalSection heading="Open-source license">
        <p>
          The OpenMouse software and the source code of this Site are licensed
          under the{" "}
          <a href="https://www.gnu.org/licenses/agpl-3.0.html">
            GNU Affero General Public License version 3 (AGPL-3.0)
          </a>
          , available in the{" "}<a href={`${REPO}/blob/main/LICENSE`}>LICENSE file</a>.{" "}
          Using, modifying, or redistributing the software is governed by that
          license, including its disclaimer of warranties and its limitations
          of liability.
        </p>
      </LegalSection>

      <LegalSection heading="Software provided as-is; use at your own risk">
        <p>
          OpenMouse lets you configure gaming mice in your browser over{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API">
            WebHID
          </a>
          . Support for a given device varies: some devices and features may
          not work, and community-maintained drivers may be limited or
          experimental. It is your responsibility to use the software
          carefully and to test settings on your own equipment. To the maximum
          extent permitted by law and by the AGPL-3.0 license, the project
          makes no warranties about the Site or the software and is not liable
          for any damages arising from your use of them.
        </p>
      </LegalSection>

      <LegalSection heading="Website availability">
        <p>
          The Site is provided on an "as is" and "as available" basis, without
          warranty of any kind. It may be modified, suspended, or discontinued
          at any time without notice, and the project does not commit to any
          level of service or uptime.
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>When using the Site you agree not to:</p>
        <ul>
          <li>
            submit spam, fraudulent, or misleading support requests or votes;
          </li>
          <li>
            post unlawful, harassing, abusive, defamatory, or infringing blog
            comments, or publish other people's personal information without
            their consent;
          </li>
          <li>
            attempt to circumvent rate limits, anti-spam checks, or abuse
            protections;
          </li>
          <li>
            attempt to exploit, probe, or impair the Site, its functions, or
            its infrastructure;
          </li>
          <li>misrepresent yourself or your relationship with the project.</li>
        </ul>
        <p>
          The Site runs automated rate limiting and abuse blocks (described in
          the <a href="/privacy.html">Privacy Policy</a>), and the maintainers
          may remove content or suspend access for repeat abuse.
        </p>
      </LegalSection>

      <LegalSection heading="User-generated content">
        <p>
          When you publish content on the Site — a support request, a vote, or
          a blog comment — you are responsible for what you post, and you
          grant the project the limited right to store and publicly display
          that content in connection with the feature you used. You keep
          ownership of the content you write. Content that violates these
          terms or the law may be removed by the maintainers.
        </p>
      </LegalSection>

      <LegalSection heading="Donations">
        <p>
          The donate page lets you voluntarily support the project. Donations
          are contributions to the project — they are not purchases, and they
          do not entitle you to any goods, services, or equity.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual property">
        <p>
          The OpenMouse name, logo, and mascot are published as part of the
          project's repositories. Third-party names, marks, and trademarks
          referenced on the Site (such as device manufacturers and product
          names) belong to their respective owners and are used for
          identification only.
        </p>
      </LegalSection>

      <LegalSection heading="Privacy">
        <p>
          Your use of the Site is subject to the{" "}
          <a href="/privacy.html">Privacy Policy</a>, including the data
          processed to run and protect the Site.
        </p>
      </LegalSection>

      <LegalSection heading="Governing rules and disputes">
        <p>
          The OpenMouse Project is an open-source community project run by
          volunteer maintainers and is not a corporation; there is no
          registered legal entity associated with it, and no commercial
          arbitration or jurisdiction applies to these terms. Questions and
          disputes are handled through the{" "}<a href={DISCORD_URL}>Discord
          server</a>.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          These terms may be updated when the Site or the project changes. The
          effective date above will be revised on each update.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms can be raised on the OpenMouse{" "}
          <a href={DISCORD_URL}>Discord server</a>. The application itself is
          developed in the{" "}<a href={APP_REPO}>openmouse repository</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}

function TermsPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Terms />
      <SiteFooter locale={locale} />
    </div>
  );
}

const termsApp = document.querySelector<HTMLDivElement>("#terms-app");

if (!termsApp) {
  throw new Error("OpenMouse could not find the terms page root.");
}

createRoot(termsApp).render(<TermsPage />);

registerServiceWorker();
mountOfflineBanner();