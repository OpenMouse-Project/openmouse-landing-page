import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../shared/site.css";
import "./contact.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { t } from "../../i18n/index";
import { usePageLocale } from "../../shared/page-locale";
import { usePointerAurora, useScrollReveal } from "../../shared/motion";

const ISSUES_URL = "https://github.com/OpenMouse-Project/openmouse/issues";
const CONTACT_EMAIL = "Contact@openmouse.app";

function BugIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 9a4 4 0 0 1 8 0v6a4 4 0 0 1-8 0V9Z" />
      <path d="M9 5 7.5 3M15 5l1.5-2M4 10h4M16 10h4M4 15h4M16 15h4M12 10v8" />
    </svg>
  );
}

function MailIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </svg>
  );
}

function ContactApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const aurora = usePointerAurora();
  useScrollReveal();

  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />

      <main className="land-page">
        <header className="land-page-head land-aurora" ref={(node) => { aurora.current = node; }} data-reveal>
          <p className="land-kicker">{t(locale, "foot.support")}</p>
          <h1 className="land-page-title">{t(locale, "contact.title")}</h1>
          <p className="land-page-lead">{t(locale, "contact.lead")}</p>
        </header>

        <section className="land-section land-grid land-grid--two contact-cards" aria-label={t(locale, "contact.title")}>
          <article className="land-card contact-card" data-reveal>
            <span className="land-card-icon"><BugIcon /></span>
            <h2>{t(locale, "contact.bugTitle")}</h2>
            <p>{t(locale, "contact.bugBody")}</p>
            <a className="contact-link" href={ISSUES_URL} target="_blank" rel="noreferrer">
              {t(locale, "contact.bugCta")} <span aria-hidden="true">→</span>
            </a>
          </article>

          <article className="land-card contact-card" data-reveal>
            <span className="land-card-icon"><MailIcon /></span>
            <h2>{t(locale, "contact.mailTitle")}</h2>
            <p>{t(locale, "contact.mailBody")}</p>
            <a className="contact-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL} <span aria-hidden="true">→</span>
            </a>
          </article>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("OpenMouse could not find the contact page root.");
createRoot(root).render(<ContactApp />);

registerServiceWorker();
mountOfflineBanner();
