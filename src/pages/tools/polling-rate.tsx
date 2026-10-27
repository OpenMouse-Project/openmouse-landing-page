import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../shared/site.css";
import "./tools.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { t, tp } from "../../i18n/index";
import { usePageLocale } from "../../shared/page-locale";
import { usePointerAurora, useScrollReveal } from "../../shared/motion";
import { nearestStandardRate, PollingMeter, PAUSE_MS, type PollingSnapshot } from "./polling-math";

const formatHz = (hz: number | undefined): string => (hz ? Math.round(hz).toLocaleString("en-US") : "0");

function PollingApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const aurora = usePointerAurora();
  useScrollReveal();

  const [snap, setSnap] = useState<PollingSnapshot | null>(null);
  const [active, setActive] = useState(false);
  const [rawSupported] = useState(() => typeof window === "undefined" || "onpointerrawupdate" in window);
  const padRef = useRef<HTMLDivElement | null>(null);
  const meter = useRef(new PollingMeter());
  const dirty = useRef(false);

  useEffect(() => {
    const pad = padRef.current;
    if (!pad) return;
    // pointerrawupdate fires per hardware report; pointermove is limited to the frame rate.
    // Chromium only dispatches the raw event reliably to window, so listen there and
    // count it while the cursor is over the box.
    const type = rawSupported ? "pointerrawupdate" : "pointermove";
    const target: Window | HTMLElement = rawSupported ? window : pad;
    // Counting happens while the cursor is captured, or hovering if the lock was refused.
    let hovering = false;
    let locked = false;
    const counting = (): boolean => hovering || locked;
    const onMove = (event: Event): void => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType !== "mouse" || (rawSupported && !counting())) return;
      const coalesced = pointer.getCoalescedEvents?.() ?? [];
      for (const report of coalesced.length > 0 ? coalesced : [pointer]) meter.current.push(report.timeStamp);
      dirty.current = true;
    };
    const sync = (): void => {
      if (!counting()) meter.current.pause();
      setActive(counting());
    };
    const onEnter = (): void => {
      hovering = true;
      sync();
    };
    const onLeave = (): void => {
      hovering = false;
      sync();
    };
    const onLockChange = (): void => {
      locked = document.pointerLockElement === pad;
      sync();
    };
    const onDown = (event: MouseEvent): void => {
      // Under pointer lock the right click is delivered to the document, not the pad.
      if (locked && event.button === 2) document.exitPointerLock();
    };
    const onMenu = (event: MouseEvent): void => {
      if (event.target instanceof Node && pad.contains(event.target)) event.preventDefault();
    };
    target.addEventListener(type, onMove);
    pad.addEventListener("pointerenter", onEnter);
    pad.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("contextmenu", onMenu);
    // Reports arrive at up to 8 kHz, so the readout is refreshed on a timer instead of per event.
    const timer = window.setInterval(() => {
      if (!dirty.current) return;
      dirty.current = false;
      setSnap(meter.current.snapshot());
    }, 100);
    return () => {
      target.removeEventListener(type, onMove);
      pad.removeEventListener("pointerenter", onEnter);
      pad.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("contextmenu", onMenu);
      window.clearInterval(timer);
    };
  }, [rawSupported]);

  const capture = (): void => {
    const pad = padRef.current;
    if (!pad || document.pointerLockElement === pad) return;
    try {
      const request = pad.requestPointerLock({ unadjustedMovement: true } as PointerLockOptions) as Promise<void> | void;
      if (request) request.catch(() => pad.requestPointerLock());
    } catch {
      /* hovering over the box still measures without the lock */
    }
  };

  const reset = (): void => {
    meter.current = new PollingMeter();
    dirty.current = false;
    setSnap(null);
  };

  const nearest = snap ? nearestStandardRate(snap.average) : null;
  const stats: [string, string][] = [
    [t(locale, "poll.current"), formatHz(snap?.current)],
    [t(locale, "poll.average"), formatHz(snap?.average)],
    [t(locale, "poll.peak"), formatHz(snap?.peak)],
  ];

  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />

      <main className="land-page">
        <header className="land-page-head land-aurora" ref={(node) => { aurora.current = node; }} data-reveal>
          <p className="land-kicker"><a href="/tools">{t(locale, "tools.nav")}</a></p>
          <h1 className="land-page-title">{t(locale, "tools.polling.title")}</h1>
          <p className="land-page-lead">{t(locale, "poll.lead")}</p>
        </header>

        <section className="land-section rot-layout" data-reveal>
          {rawSupported ? null : <p className="rot-hint">{t(locale, "poll.raw")}</p>}

          <div
            ref={padRef}
            className={`rot-pad poll-pad${active ? " rot-pad--measuring" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={t(locale, "poll.idle")}
            onClick={capture}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") capture(); }}
          >
            <span className="rot-status">
              {active
                ? `${tp(locale, "poll.reports", { n: (snap?.samples ?? 0).toLocaleString("en-US") })} · ${t(locale, "poll.stop")}`
                : t(locale, "poll.idle")}
            </span>
          </div>

          <div className="poll-readout" aria-live="off">
            {stats.map(([label, value]) => (
              <div className="rot-result poll-stat" key={label}>
                <span className="rot-result-label">{label}</span>
                <strong className="rot-result-value">{value}<small> Hz</small></strong>
              </div>
            ))}
          </div>

          <div className="poll-actions">
            <p className="rot-note">{nearest ? tp(locale, "poll.nearest", { hz: nearest.toLocaleString("en-US") }) : t(locale, "poll.note")}</p>
            <button type="button" className="poll-reset" onClick={reset}>{t(locale, "poll.reset")}</button>
          </div>

          <section className="rot-how" aria-labelledby="poll-how-title">
            <h2 id="poll-how-title">{t(locale, "poll.how.title")}</h2>
            <p>{tp(locale, "poll.how.p1", { ms: PAUSE_MS })}</p>
            <p>{t(locale, "poll.how.p2")}</p>
            <p>{t(locale, "poll.note")}</p>
          </section>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("OpenMouse could not find the polling rate page root.");
createRoot(root).render(<PollingApp />);

registerServiceWorker();
mountOfflineBanner();
