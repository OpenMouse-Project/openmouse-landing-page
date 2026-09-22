import type { ReactNode } from "react";
import {
  DISCORD_URL,
  GITHUB_URL,
  TWITTER_URL,
} from "./social-links";
import { t, tp } from "../i18n";
import type { InterfaceLocale } from "../interface-preferences";
import { PageLocaleToggle } from "./page-locale";

// The control app lives on its own subdomain — dev.openmouse.app is
// retired, openmouse.app is this marketing page, control.openmouse.app is
// the actual configurator.
export const APP_URL = "https://control.openmouse.app/";

// License facts come from the repository itself (GitHub API: AGPL-3.0, i.e.
// the GNU Affero General Public License v3.0, LICENSE file at the repo root).
const LICENSE_URL = "https://github.com/OpenMouse-Project/openmouse-landing-page/blob/main/LICENSE";

// Shared header/footer for the marketing pages (openmouse.app) — landing.tsx
// and faq.tsx both render these so the two pages look coherent.
export function SiteNav({ locale, onLocale }: { locale: InterfaceLocale; onLocale: (next: InterfaceLocale) => void }): ReactNode {
  return (
    <header className="land-nav">
      <a className="land-brand" href="/">
        <img src="/logo.png" alt="" width={22} height={32} />
        <span className="land-brand-name">OpenMouse</span>
      </a>
      <nav className="land-nav-links">
        <a href="/supported.html">{t(locale, "land.supported")}</a>
        <a href="/blog.html">Blog</a>
        <a href="/faq.html">FAQ</a>
        <a href="https://docs.openmouse.app">{t(locale, "land.contribute")}</a>
        <a href="/donate.html">{t(locale, "land.donate")}</a>
        <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
      </nav>
      <PageLocaleToggle locale={locale} onChange={onLocale} />
      <a className="land-nav-cta" href={APP_URL}>{t(locale, "land.openApp")}</a>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <footer className="land-footer">
      <div className="land-footer-grid">
        <div className="land-footer-brand">
          <a className="land-fwordmark" href="/">
            <img src="/logo.png" alt="" width={22} height={32} />
            OpenMouse
          </a>
          <p className="land-footer-tagline">{t(locale, "don.tagline")}</p>
        </div>

        <nav className="land-footer-col" aria-label={t(locale, "don.pages")}>
          <h3>{t(locale, "don.pages")}</h3>
          <a href="/">{t(locale, "don.home")}</a>
          <a href="/supported.html">{t(locale, "land.supported")}</a>
          <a href="/blog.html">Blog</a>
          <a href="/faq.html">FAQ</a>
          <a href="/check.html">{t(locale, "don.check")}</a>
          <a href="/donate.html">{t(locale, "land.donate")}</a>
        </nav>

        <nav className="land-footer-col" aria-label={t(locale, "don.contributeCol")}>
          <h3>{t(locale, "don.contributeCol")}</h3>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/OpenMouse-Project/openmouse/issues" target="_blank" rel="noreferrer">
            {t(locale, "don.reportIssue")}
          </a>
          <a href="https://github.com/OpenMouse-Project/openmouse/discussions" target="_blank" rel="noreferrer">
            {t(locale, "don.discussions")}
          </a>
          <a href="https://docs.openmouse.app">{t(locale, "don.contribute")}</a>
        </nav>

        <nav className="land-footer-col" aria-label={t(locale, "don.community")}>
          <h3>{t(locale, "don.community")}</h3>
          <a href={DISCORD_URL} target="_blank" rel="noreferrer" aria-label={t(locale, "don.community")}>
            Discord
          </a>
          <a href={TWITTER_URL} target="_blank" rel="noreferrer" aria-label={t(locale, "don.community")}>
            X / Twitter
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label={t(locale, "don.community")}>
            GitHub
          </a>
        </nav>
      </div>

      <div className="land-footer-bottom">
        <p>{tp(locale, "don.rights", { year: new Date().getFullYear() })}</p>
        <p className="land-footer-legal">
          <a
            href={LICENSE_URL}
            target="_blank"
            rel="noreferrer"
            title="LICENSE"
            aria-label="GNU Affero General Public License v3.0"
          >
            GNU Affero General Public License v3.0 (AGPL-3.0)
          </a>
          <a href="/privacy.html">{t(locale, "don.privacy")}</a>
          <a href="/terms.html">{t(locale, "don.terms")}</a>
        </p>
      </div>
    </footer>
  );
}
