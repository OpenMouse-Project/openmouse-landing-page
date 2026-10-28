import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Code2, Cpu, Download, Globe2 } from "lucide-preact";
import "../../shared/site.css";
import "./home.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { APP_URL, SiteFooter, SiteNav } from "../../shared/site-chrome";
import { ChromeLogo, EdgeLogo } from "../../shared/browser-logos";
import { t, tp } from "../../i18n/index";
import type { InterfaceLocale } from "../../shared/interface-preferences";
import { usePageLocale } from "../../shared/page-locale";
import { useScrollReveal } from "../../shared/motion";
import type { LandingData } from "./landing-data";
import { AsciiField, AsciiWave } from "./ascii-field";

let dataRequest: Promise<LandingData> | null = null;
function requestData(): Promise<LandingData> {
  dataRequest ??= import("./landing-data").then((module) => module.loadLandingData());
  return dataRequest;
}

function useLandingData(): LandingData | null {
  const [data, setData] = useState<LandingData | null>(null);
  useEffect(() => {
    let live = true;
    void requestData().then((value) => { if (live) setData(value); });
    return () => { live = false; };
  }, []);
  return data;
}


const IMAGE_BASE = "https://img.openmouse.app/";
const LINEUP: ReadonlyArray<{ name: string; image: string }> = [
  { name: "Razer Viper V3 Pro", image: "razer-viper-v3-pro.png" },
  { name: "Logitech G502 X PLUS", image: "logitech-g502-x-plus.png" },
  { name: "WLMouse Beast Max", image: "wlmouse-beast-max.png" },
  { name: "Zaunkoenig M3K", image: "zaunkoenig-m3k.png" },
  { name: "Attack Shark R5 Ultra", image: "attackshark-r5-ultra.png" },
  { name: "Endgame Gear OP1 8K", image: "endgame-gear-op1-8k.png" },
  { name: "Finalmouse ULX", image: "finalmouse-ulx.png" },
  { name: "Lamzu Maya X", image: "lamzu-maya-x.png" },
];
const TURN_MS = 2800;

function wheelSlot(at: number, front: number): number {
  const n = LINEUP.length;
  let d = (at - front + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

function Lineup(): ReactNode {
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setFront((value) => (value + 1) % LINEUP.length);
    }, TURN_MS);
    return () => window.clearInterval(id);
  }, [paused]);
  return (
    <div className="lp-lineup" aria-hidden="true" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {LINEUP.map((item, at) => {
        const d = wheelSlot(at, front);
        return (
          <img
            key={item.image}
            src={IMAGE_BASE + item.image}
            alt=""
            draggable={false}
            className="lp-lineup-item"
            data-slot={Math.abs(d) <= 3 ? d : "off"}
            title={item.name}
          />
        );
      })}
    </div>
  );
}

function Hero({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="lp-hero">
      <div className="lp-hero-copy" data-reveal>
        <p className="lp-pill"><span className="lp-dot" aria-hidden="true" />{t(locale, "land.eyebrow")}</p>
        <h1>{t(locale, "land.hero")}</h1>
        <p className="lp-lead">{t(locale, "land.lead")}</p>
        <div className="lp-actions">
          <a className="lp-btn is-primary is-lg" href={APP_URL}>
            {t(locale, "land.openApp")}
            <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </a>
          <a className="lp-btn is-lg" href="/supported">{t(locale, "land.checkMouse")}</a>
        </div>
        <p className="lp-req"><span className="lp-req-logos"><ChromeLogo /><EdgeLogo /></span>{t(locale, "lp.req")}</p>
      </div>
      <Lineup />
    </section>
  );
}

function Brands({ locale, data }: { locale: InterfaceLocale; data: LandingData | null }): ReactNode {
  if (!data) return <div className="lp-brands is-loading" aria-hidden="true" />;
  const brands = data.supportedBrands;
  const [before, middle, after] = splitCoverage(
    t(locale, "lp.coverage"),
    data.supportedModels.toLocaleString(locale),
    brands.length.toLocaleString(locale),
  );
  return (
    <section className="lp-brands" aria-label={t(locale, "lp.brandsTitle")}>
      <p className="lp-coverage">
        {before}<a href="/supported">{middle[0]}</a>{middle[1]}<a href="/supported">{middle[2]}</a>{after}
      </p>
      <div className="lp-marquee">
        <ul className="lp-marquee-track">
          {brands.map((brand) => <li key={brand}>{brand}</li>)}
        </ul>
        <ul className="lp-marquee-track" aria-hidden="true">
          {brands.map((brand) => <li key={brand}>{brand}</li>)}
        </ul>
      </div>
    </section>
  );
}

function splitCoverage(template: string, models: string, brands: string): [string, [string, string, string], string] {
  const first = template.indexOf("{models}") < template.indexOf("{brands}") ? "models" : "brands";
  const second = first === "models" ? "brands" : "models";
  const values = { models, brands };
  const [head, rest] = template.split(`{${first}}`);
  const [mid, tail] = (rest ?? "").split(`{${second}}`);
  return [head ?? "", [values[first], mid ?? "", values[second]], tail ?? ""];
}

function TheApp({ locale }: { locale: InterfaceLocale }): ReactNode {
  const items = [
    { icon: Globe2, title: t(locale, "land.f1t"), body: t(locale, "land.f1b") },
    { icon: Cpu, title: t(locale, "land.f2t"), body: t(locale, "land.f2b") },
    { icon: Code2, title: t(locale, "land.f3t"), body: t(locale, "land.f3b") },
  ];
  return (
    <section className="lp-section lp-app">
      <div className="lp-app-copy" data-reveal>
        <h2>{t(locale, "lp.whyTitle")}</h2>
        <ul className="lp-why">
          {items.map(({ icon: Icon, title, body }) => (
            <li key={title}>
              <span className="lp-glyph" aria-hidden="true"><Icon size={16} strokeWidth={1.9} /></span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <a className="lp-app-shot" href={APP_URL} data-reveal aria-label={t(locale, "land.openApp")}>
        <span className="lp-window-bar" aria-hidden="true">
          <span className="lp-window-dots"><i /><i /><i /></span>
          <span className="lp-window-url">control.openmouse.app</span>
          <span />
        </span>
        <img
          src="/screenshot-control.png"
          alt={t(locale, "land.screenshotAlt")}
          width={2160}
          height={1290}
          loading="lazy"
        />
      </a>
    </section>
  );
}

function Bridge({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="lp-section lp-bridge" data-reveal>
      <img
        className="lp-bridge-img"
        src="/bridge-panel.png"
        alt={t(locale, "land.bridgeAlt")}
        width={320}
        height={306}
        loading="lazy"
      />
      <div className="lp-bridge-copy">
        <p className="lp-badge is-accent">{t(locale, "land.bridgeKicker")}</p>
        <h2>{t(locale, "land.bridgeTitle")}</h2>
        <p>{t(locale, "land.bridgeBody")}</p>
      </div>
      <a className="lp-btn is-lg" href="/download">
        <Download size={16} strokeWidth={2} aria-hidden="true" />
        {t(locale, "land.bridgeCta")}
      </a>
    </section>
  );
}

interface Sponsor {
  name: string;
  href: string;
  logo: string;
  width: number;
  height: number;
  /* Rendered height in px. Logos arrive in very different aspect ratios (a long
     wordmark next to a mark-and-wordmark lockup), so each one sets its own. */
  logoHeight: number;
}

/* Add a row here to list another sponsor; the strip wraps as the list grows. */
const SPONSORS: ReadonlyArray<Sponsor> = [
  { name: "HYPERTUNE", href: "https://hypertune.gg/", logo: "/sponsors/hypertune-logo.svg", width: 1448, height: 150, logoHeight: 26 },
  { name: "HONE", href: "https://hone.gg/", logo: "/sponsors/hone-logo.svg", width: 215, height: 82, logoHeight: 52 },
];

function Sponsors({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="lp-section lp-sponsors" data-reveal>
      <AsciiWave className="lp-ascii--divider" seed={33} cols={300} rows={6} />
      <div className="lp-sponsors-copy">
        <h2>{t(locale, "lp.sponsorsTitle")}</h2>
        <p>{t(locale, "lp.sponsorsBody")}</p>
      </div>
      <ul className="lp-sponsors-list">
        {SPONSORS.map((sponsor) => (
          <li key={sponsor.name}>
            <a
              className="lp-sponsor-logo"
              style={{ "--logo-h": `${sponsor.logoHeight}px` } as CSSProperties}
              href={sponsor.href}
              target="_blank"
              rel="noreferrer"
              aria-label={tp(locale, "lp.sponsorVisit", { name: sponsor.name })}
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                width={sponsor.width}
                height={sponsor.height}
                loading="lazy"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SeeForYourself({ locale }: { locale: InterfaceLocale }): ReactNode {
  return (
    <section className="lp-section lp-final" data-reveal>
      <h2>{t(locale, "lp.finalTitle")}</h2>
      <p>{t(locale, "lp.finalBody")}</p>
      <a className="lp-btn is-primary is-lg" href={APP_URL}>
        {t(locale, "land.openApp")}
        <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
      </a>
    </section>
  );
}

function Landing(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const data = useLandingData();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing lp">
      <SiteNav locale={locale} onLocale={setLocale} />
      <main>
        <div className="lp-fold">
          <AsciiField className="lp-ascii--hero-r" seed={7} cols={104} rows={40} origin={[1.02, -0.04]} reach={0.62} />
          <AsciiField className="lp-ascii--hero-l" seed={21} cols={64} rows={34} origin={[-0.04, 0.5]} reach={0.5} />
          <Hero locale={locale} />
          <Brands locale={locale} data={data} />
        </div>
        <TheApp locale={locale} />
        <Bridge locale={locale} />
        <SeeForYourself locale={locale} />
        <Sponsors locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

const landingApp = document.querySelector<HTMLDivElement>("#app");

if (!landingApp) {
  throw new Error("OpenMouse could not find the landing page root.");
}

createRoot(landingApp).render(<Landing />);

registerServiceWorker();
mountOfflineBanner();
