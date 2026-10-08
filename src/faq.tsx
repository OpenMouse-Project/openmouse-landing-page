import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
// The FAQ page shares the landing chrome and page primitives from landing.css
// and keeps its own presentation in faq.css - see src/app/site-chrome.tsx for
// the shared header/footer.
import "./landing.css";
import "./faq.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { APP_URL, SiteFooter, SiteNav } from "./app/site-chrome";
import { DISCORD_URL, GitHubLink } from "./app/social-links";
import { t } from "./i18n";
import type { InterfaceLocale } from "./interface-preferences";
import { usePageLocale } from "./app/page-locale";
import { usePointerAurora, useScrollReveal } from "./app/motion";

interface FaqEntry {
  question: string;
  answer: ReactNode;
}

function faqs(locale: InterfaceLocale): FaqEntry[] {
  return [
    { question: t(locale, "faq.q1"), answer: t(locale, "faq.a1") },
    { question: t(locale, "faq.q2"), answer: t(locale, "faq.a2") },
    {
      question: t(locale, "faq.q3"),
      answer: (
        <>
          {t(locale, "faq.a3a")}{" "}
          <a href="/supported.html">{t(locale, "faq.a3b")}</a> {t(locale, "faq.a3c")}
        </>
      ),
    },
    { question: t(locale, "faq.q4"), answer: t(locale, "faq.a4") },
    {
      question: t(locale, "faq.q5"),
      answer: (
        <>
          {t(locale, "faq.a5a")}{" "}
          <a href="https://docs.openmouse.app">{t(locale, "faq.a5b")}</a>{" "}
          {t(locale, "faq.a5c")}
        </>
      ),
    },
    { question: t(locale, "faq.q6"), answer: t(locale, "faq.a6") },
    { question: t(locale, "faq.q7"), answer: t(locale, "faq.a7") },
    {
      question: t(locale, "faq.q8"),
      answer: (
        <>
          {t(locale, "faq.a8a")} <GitHubLink locale={locale} />,{" "}
          {t(locale, "faq.a8b")}{" "}
          <a href={DISCORD_URL} target="_blank" rel="noreferrer">Discord</a>,{" "}
          <a href="/donate.html">{t(locale, "land.donate")}</a> {t(locale, "faq.a8c")}
        </>
      ),
    },
  ];
}

/* The head is the aurora element itself, so the pointer spotlight tracks the
   page title the same way it tracks the landing hero. */
function Faq({ locale }: { locale: InterfaceLocale }): ReactNode {
  const aurora = usePointerAurora();
  return (
    <main className="land-page">
      <header
        className="land-page-head land-aurora"
        ref={(node) => {
          aurora.current = node;
        }}
        data-reveal
      >
        <p className="land-kicker">{t(locale, "land.eyebrow")}</p>
        <h1 className="land-page-title">{t(locale, "faq.title")}</h1>
      </header>

      <section className="land-section">
        <dl className="land-faq-list">
          {faqs(locale).map(({ question, answer }) => (
            <div className="land-faq-item" data-reveal key={question}>
              <dt>{question}</dt>
              <dd>{answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="land-section land-panel land-panel--center land-faq-cta" data-reveal>
        <p className="land-kicker">{t(locale, "land.contribute")}</p>
        <h2>{t(locale, "land.contribTitle")}</h2>
        <p className="land-body">{t(locale, "land.contribBody")}</p>
        <div className="land-page-actions">
          <a className="land-cta" href={APP_URL}>{t(locale, "land.openApp")}</a>
          <a className="land-cta-secondary" href="https://docs.openmouse.app">{t(locale, "land.contribCta")}</a>
        </div>
      </section>
    </main>
  );
}

function FaqPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Faq locale={locale} />
      <SiteFooter locale={locale} />
    </div>
  );
}

const faqApp = document.querySelector<HTMLDivElement>("#faq-app");

if (!faqApp) {
  throw new Error("OpenMouse could not find the FAQ page root.");
}

createRoot(faqApp).render(<FaqPage />);

registerServiceWorker();
mountOfflineBanner();
