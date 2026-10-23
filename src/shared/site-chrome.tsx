import type { ReactNode } from "react";
import {
  DISCORD_URL,
  DiscordIcon,
  formatCount,
  GITHUB_URL,
  GitHubIcon,
  GitHubLink,
  StarIcon,
  TWITTER_URL,
  TwitterIcon,
  useGitHubStars,
} from "./social-links";
import { t, tp } from "../i18n/index";
import type { InterfaceLocale } from "./interface-preferences";
import { PageLocaleToggle } from "./page-locale";
import { DitherWordmark } from "./dither-wordmark";

export const APP_URL = "https://control.openmouse.app/";

const LICENSE_URL = "https://github.com/OpenMouse-Project/openmouse-landing-page/blob/main/LICENSE";

export function SiteNav({ locale, onLocale }: { locale: InterfaceLocale; onLocale: (next: InterfaceLocale) => void }): ReactNode {
  return (
    <header className="land-nav" dir="ltr">
      <div className="land-nav-inner">
        <a className="land-brand" href="/">
          <img src="/favicon-dark.svg" alt="" width={22} height={22} />
          <span className="land-brand-name">OpenMouse</span>
        </a>
        <nav className="land-nav-links">
          <a href="/supported">{t(locale, "land.supported")}</a>
          <a href="/blog">Blog</a>
          <a href="/faq">FAQ</a>
          <a href="/download">{t(locale, "land.download")}</a>
          <a href="/donate">{t(locale, "land.donate")}</a>
          <GitHubLink locale={locale} />
        </nav>
        <PageLocaleToggle locale={locale} onChange={onLocale} />
        <a className="land-nav-cta" href={APP_URL}>{t(locale, "land.openApp")}</a>
      </div>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: InterfaceLocale }): ReactNode {
  const stars = useGitHubStars();
  return (
    <footer className="land-footer">
      <div className="land-footer-inner">
        <div className="land-footer-top">
          <a className="land-footer-mark" href="/" aria-label={t(locale, "don.home")}>
            <img src="/favicon-dark.svg" alt="" width={26} height={26} />
          </a>

          <nav className="land-footer-col" aria-label={t(locale, "foot.explore")}>
            <h3>{t(locale, "foot.explore")}</h3>
            <a href="/">{t(locale, "don.home")}</a>
            <a href="/supported">{t(locale, "land.supported")}</a>
            <a href="/check">{t(locale, "don.check")}</a>
            <a href="/blog">Blog</a>
          </nav>

          <nav className="land-footer-col" aria-label={t(locale, "foot.product")}>
            <h3>{t(locale, "foot.product")}</h3>
            <a href={APP_URL}>{t(locale, "land.openApp")}</a>
            <a href="/download">{t(locale, "land.download")}<span className="land-footer-tag">{"Bridge"}</span></a>
            <a href="/donate">{t(locale, "land.donate")}</a>
            <a href="https://docs.openmouse.app">{t(locale, "don.contribute")}</a>
          </nav>

          <nav className="land-footer-col" aria-label={t(locale, "foot.support")}>
            <h3>{t(locale, "foot.support")}</h3>
            <a href="/faq">FAQ</a>
            <a href="/contact">{t(locale, "foot.contact")}</a>
            <a href="https://github.com/OpenMouse-Project/openmouse/issues" target="_blank" rel="noreferrer">{t(locale, "don.reportIssue")}</a>
            <a href="https://github.com/OpenMouse-Project/openmouse/discussions" target="_blank" rel="noreferrer">{t(locale, "don.discussions")}</a>
            <a href="/privacy">{t(locale, "don.privacy")}</a>
            <a href="/terms">{t(locale, "don.terms")}</a>
          </nav>

          <div className="land-footer-col">
            <h3>{t(locale, "don.community")}</h3>
            <a className="land-footer-discord" href={DISCORD_URL} target="_blank" rel="noreferrer">
              <DiscordIcon />
              {t(locale, "foot.joinDiscord")}
            </a>
            <div className="land-footer-socials">
              <a href={DISCORD_URL} target="_blank" rel="noreferrer" aria-label="Discord" title="Discord"><DiscordIcon /></a>
              <a href={TWITTER_URL} target="_blank" rel="noreferrer" aria-label="X / Twitter" title="X / Twitter"><TwitterIcon /></a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub"><GitHubIcon /></a>
              {stars === null ? null : (
                <a className="land-footer-stars" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label={tp(locale, "don.stars", { n: formatCount(stars) })}>
                  <StarIcon />
                  {formatCount(stars)}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="land-footer-word"><DitherWordmark /></div>

        <div className="land-footer-bottom">
          <p>{tp(locale, "don.rights", { year: new Date().getFullYear() })} {t(locale, "don.tagline")}</p>
          <p className="land-footer-legal">
            <a href={LICENSE_URL} target="_blank" rel="noreferrer" title="LICENSE" aria-label="GNU Affero General Public License v3.0">
              AGPL-3.0
            </a>
            <a href="/terms">{t(locale, "don.terms")}</a>
            <a href="/privacy">{t(locale, "don.privacy")}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
