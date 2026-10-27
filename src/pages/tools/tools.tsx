import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../shared/site.css";
import "./tools.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { t } from "../../i18n/index";
import { usePageLocale } from "../../shared/page-locale";
import { usePointerAurora, useScrollReveal } from "../../shared/motion";

// Tabler "angle" (MIT)
function RotationIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 19h-18l9 -15" />
      <path d="M20.615 15.171h.015" />
      <path d="M19.515 11.771h.015" />
      <path d="M17.715 8.671h.015" />
      <path d="M15.415 5.971h.015" />
    </svg>
  );
}

// Tabler "gauge" (MIT)
function PollingIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M11 12a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M13.41 10.59l2.59 -2.59" />
      <path d="M7 12a5 5 0 0 1 5 -5" />
    </svg>
  );
}

function ToolsApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const aurora = usePointerAurora();
  useScrollReveal();

  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />

      <main className="land-page">
        <header className="land-page-head land-aurora" ref={(node) => { aurora.current = node; }} data-reveal>
          <h1 className="land-page-title">{t(locale, "tools.title")}</h1>
          <p className="land-page-lead">{t(locale, "tools.lead")}</p>
        </header>

        <section className="land-section land-grid land-grid--two tools-cards" aria-label={t(locale, "tools.title")}>
          <a className="land-card tools-card" href="/tools/mouse-rotation" data-reveal>
            <span className="land-card-icon"><RotationIcon /></span>
            <h2>{t(locale, "tools.rotation.title")}</h2>
            <p>{t(locale, "tools.rotation.blurb")}</p>
            <span className="tools-link">{t(locale, "tools.open")} <span aria-hidden="true">→</span></span>
          </a>

          <a className="land-card tools-card" href="/tools/polling-rate" data-reveal>
            <span className="land-card-icon"><PollingIcon /></span>
            <h2>{t(locale, "tools.polling.title")}</h2>
            <p>{t(locale, "tools.polling.blurb")}</p>
            <span className="tools-link">{t(locale, "tools.open")} <span aria-hidden="true">→</span></span>
          </a>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("OpenMouse could not find the tools page root.");
createRoot(root).render(<ToolsApp />);

registerServiceWorker();
mountOfflineBanner();
