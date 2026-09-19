import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./landing.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { APP_URL, SiteFooter, SiteNav } from "./app/site-chrome";
import { t } from "./i18n";
import type { InterfaceLocale } from "./interface-preferences";
import { usePageLocale } from "./app/page-locale";

function Hero({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="land-hero">
      <h1>{t(locale, "land.hero")}</h1>
      <p className="land-lead">{t(locale, "land.lead")}</p>
      <div className="land-hero-actions">
        <a className="land-cta" href={APP_URL}>{t(locale, "land.openApp")}</a>
        <a className="land-cta-secondary" href="/supported.html">{t(locale, "land.checkMouse")}</a>
      </div>
    </section>
  );
}

function Screenshot(): ReactNode {
  return (
    <section className="land-screenshot">
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
    </section>
  );
}

function Contribute({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="land-contribute">
      <p className="land-contribute-kicker">GET INVOLVED</p>
      <h2>{t(locale, "land.contribTitle")}</h2>
      <p>{t(locale, "land.contribBody")}</p>
      <a className="land-cta-secondary" href="https://docs.openmouse.app">{t(locale, "land.contribCta")}</a>
    </section>
  );
}

function Landing(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Hero locale={locale} />
      <Screenshot />
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