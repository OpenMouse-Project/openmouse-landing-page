import { type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./landing.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { APP_URL, SiteFooter, SiteNav } from "./app/site-chrome";
import { t } from "./i18n";
import type { InterfaceLocale } from "./interface-preferences";
import { usePageLocale } from "./app/page-locale";
import { usePointerAurora, useScrollReveal } from "./app/motion";

function CardIcon({ path }: { path: string }): ReactNode {
  return (
    <span className="land-card-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={path} />
      </svg>
    </span>
  );
}

/* Window chrome with a cursor — "it runs in the browser, nothing to install". */
const ICON_BROWSER =
  "M3 9.5h18M5.9 6.4h.01M8.6 6.4h.01M6 4.5h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z";

/* Mouse outline with the front plate and wheel — "dozens of mice, one app". */
const ICON_MOUSE =
  "M12 2.8c-3.1 0-5.4 2.4-5.4 5.3v7.8c0 2.9 2.3 5.3 5.4 5.3s5.4-2.4 5.4-5.3V8.1c0-2.9-2.3-5.3-5.4-5.3ZM12 5.9v3.6M6.6 11.4h10.8";

/* Angle brackets — "every driver is public source". */
const ICON_SOURCE = "M9.2 7.4 4.6 12l4.6 4.6M14.8 7.4 19.4 12l-4.6 4.6M12.9 4.6l-1.8 14.8";

function Hero({ locale }: { locale: InterfaceLocale }): ReactNode {
  const hero = usePointerAurora();
  return (
    <section
      className="land-hero land-aurora"
      ref={(node) => {
        hero.current = node;
      }}
    >
      <div className="land-hero-copy" data-reveal>
        <p className="land-eyebrow">{t(locale, "land.eyebrow")}</p>
        <h1>{t(locale, "land.hero")}</h1>
        <p className="land-lead">{t(locale, "land.lead")}</p>
        <div className="land-hero-actions">
          <a className="land-cta" href={APP_URL}>{t(locale, "land.openApp")}</a>
          <a className="land-cta-secondary" href="/supported.html">{t(locale, "land.checkMouse")}</a>
        </div>
      </div>

      <div className="land-browser-wrap" data-reveal>
        <div className="land-browser">
          <div className="land-browser-bar">
            <span className="land-browser-dot land-browser-dot-red" />
            <span className="land-browser-dot land-browser-dot-yellow" />
            <span className="land-browser-dot land-browser-dot-green" />
            <span className="land-browser-url">control.openmouse.app</span>
          </div>
          <div className="land-screenshot-pad">
            <img
              src="/screenshot-app.png"
              alt="The OpenMouse web app showing a connected Logitech PRO X Superlight 2 mouse with battery, polling rate, and wireless status, plus an option to add another mouse"
              width={1572}
              height={811}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features({ locale }: { locale: InterfaceLocale }): ReactNode {
  const items = [
    { icon: ICON_BROWSER, title: t(locale, "land.f1t"), body: t(locale, "land.f1b") },
    { icon: ICON_MOUSE, title: t(locale, "land.f2t"), body: t(locale, "land.f2b") },
    { icon: ICON_SOURCE, title: t(locale, "land.f3t"), body: t(locale, "land.f3b") },
  ];
  return (
    <section className="land-features land-grid">
      {items.map((item) => (
        <article className="land-card" data-reveal key={item.title}>
          <CardIcon path={item.icon} />
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </section>
  );
}

function Bridge({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="land-bridge">
      <div className="land-bridge-shot" data-reveal>
        <img
          src="/bridge-panel.png"
          alt="The OpenMouse Bridge companion panel listing connected mice and their per-device settings status"
          width={320}
          height={306}
          loading="lazy"
        />
      </div>
      <div className="land-bridge-copy" data-reveal>
        <p className="land-kicker">{t(locale, "land.bridgeKicker")}</p>
        <h2>{t(locale, "land.bridgeTitle")}</h2>
        <p className="land-body">{t(locale, "land.bridgeBody")}</p>
        <a className="land-cta-secondary" href="/download.html">{t(locale, "land.bridgeCta")}</a>
      </div>
    </section>
  );
}

function Contribute({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="land-contribute land-panel land-panel--center" data-reveal>
      <p className="land-kicker">{t(locale, "land.contribute")}</p>
      <h2>{t(locale, "land.contribTitle")}</h2>
      <p className="land-body">{t(locale, "land.contribBody")}</p>
      <a className="land-cta-secondary" href="https://docs.openmouse.app">{t(locale, "land.contribCta")}</a>
    </section>
  );
}

function Landing(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Hero locale={locale} />
      <Features locale={locale} />
      <Bridge locale={locale} />
      <Contribute locale={locale} />
      <SiteFooter locale={locale} />
    </div>
  );
}

const landingApp = document.querySelector<HTMLDivElement>("#landing-app");

if (!landingApp) {
  throw new Error("OpenMouse could not find the landing page root.");
}

createRoot(landingApp).render(<Landing />);

registerServiceWorker();
mountOfflineBanner();
