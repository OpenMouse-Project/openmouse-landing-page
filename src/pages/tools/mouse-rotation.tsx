import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../shared/site.css";
import "./tools.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { t, tp } from "../../i18n/index";
import { usePageLocale } from "../../shared/page-locale";
import { usePointerAurora, useScrollReveal } from "../../shared/motion";
import { analyzeSwipes, countSwipes, MIN_SWIPES, RECOMMENDED_SWIPES, type RotationResult, type RotationSample } from "./rotation-math";

type Phase = "idle" | "measuring" | "done";

function RotationApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const aurora = usePointerAurora();
  useScrollReveal();

  const [phase, setPhase] = useState<Phase>("idle");
  const [swipes, setSwipes] = useState(0);
  const [result, setResult] = useState<RotationResult | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const samples = useRef<RotationSample[]>([]);
  // Offsets from the centre of the pad, in device pixels, so the trail does not depend on
  // when the pad is resized (it goes fullscreen as the measurement starts).
  const cursor = useRef({ x: 0, y: 0 });
  const trail = useRef<{ x: number; y: number }[]>([]);
  const phaseRef = useRef<Phase>("idle");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const style = getComputedStyle(canvas);
    ctx.strokeStyle = style.getPropertyValue("--accent").trim() || style.color;
    ctx.lineWidth = 2 * window.devicePixelRatio;
    ctx.lineJoin = "round";
    ctx.beginPath();
    const cx = width / 2;
    const cy = height / 2;
    trail.current.forEach((point, index) => (index === 0 ? ctx.moveTo(cx + point.x, cy + point.y) : ctx.lineTo(cx + point.x, cy + point.y)));
    ctx.stroke();
  }, []);

  const finish = useCallback(() => {
    if (phaseRef.current !== "measuring") return;
    phaseRef.current = "done";
    setPhase("done");
    setResult(analyzeSwipes(samples.current));
    if (document.pointerLockElement) document.exitPointerLock();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  }, []);

  const start = (): void => {
    const pad = padRef.current;
    const canvas = canvasRef.current;
    if (!pad || !canvas) return;
    samples.current = [];
    trail.current = [{ x: 0, y: 0 }];
    cursor.current = { x: 0, y: 0 };
    phaseRef.current = "measuring";
    setSwipes(0);
    setResult(null);
    setPhase("measuring");
    // Pointer lock keeps the cursor inside the pad and reports raw deltas; it may be
    // refused, in which case the deltas still arrive while over the pad.
    const lock = (): void => {
      if (phaseRef.current !== "measuring") return;
      try {
        const request = pad.requestPointerLock({ unadjustedMovement: true } as PointerLockOptions) as Promise<void> | void;
        if (request) request.catch(() => pad.requestPointerLock());
      } catch {
        /* movement events still work without the lock */
      }
    };
    // The pad goes fullscreen first, so there is room for long swipes at high DPI, and the
    // lock is taken once that settles. If fullscreen is refused the pad stays a box.
    if (pad.requestFullscreen) pad.requestFullscreen().then(lock, lock);
    else lock();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = (): void => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * window.devicePixelRatio);
      canvas.height = Math.round(rect.height * window.devicePixelRatio);
      draw();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(() => {
    const onMove = (event: MouseEvent): void => {
      if (phaseRef.current !== "measuring") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      samples.current.push({ dx: event.movementX, dy: event.movementY });
      const scale = window.devicePixelRatio;
      cursor.current = {
        x: Math.min(canvas.width / 2, Math.max(-canvas.width / 2, cursor.current.x + event.movementX * scale)),
        y: Math.min(canvas.height / 2, Math.max(-canvas.height / 2, cursor.current.y + event.movementY * scale)),
      };
      trail.current.push({ ...cursor.current });
      if (trail.current.length > 600) trail.current.shift();
      setSwipes(countSwipes(samples.current));
      draw();
    };
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") finish();
    };
    const onDown = (event: MouseEvent): void => {
      if (phaseRef.current !== "measuring") return;
      // Under pointer lock the right click is delivered to the document, not the pad.
      if (event.button === 2 || (event.button === 0 && event.ctrlKey)) {
        event.preventDefault();
        finish();
      }
    };
    const onMenu = (event: MouseEvent): void => {
      if (event.target instanceof Node && padRef.current?.contains(event.target)) event.preventDefault();
    };
    const onLockChange = (): void => {
      if (!document.pointerLockElement) finish();
    };
    const onFullscreenChange = (): void => {
      if (!document.fullscreenElement) finish();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("contextmenu", onMenu);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mousedown", onDown);
    document.removeEventListener("contextmenu", onMenu);
    document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerlockchange", onLockChange);
    };
  }, [draw, finish]);

  const enough = result !== null && result.swipes >= MIN_SWIPES;
  const status =
    phase === "idle"
      ? t(locale, "rot.idle")
      : phase === "measuring"
        ? tp(locale, "rot.measuring", { n: swipes })
        : t(locale, "rot.restart");

  return (
    <div className="land-shell land-shell--marketing">
      <SiteNav locale={locale} onLocale={setLocale} />

      <main className="land-page">
        <header className="land-page-head land-aurora" ref={(node) => { aurora.current = node; }} data-reveal>
          <p className="land-kicker"><a href="/tools">{t(locale, "tools.nav")}</a></p>
          <h1 className="land-page-title">{t(locale, "tools.rotation.title")}</h1>
          <p className="land-page-lead">{t(locale, "rot.lead")}</p>
        </header>

        <section className="land-section rot-layout" data-reveal>
          <ol className="rot-steps">
            <li>{t(locale, "rot.step1")}</li>
            <li>{tp(locale, "rot.step2", { n: RECOMMENDED_SWIPES })}</li>
            <li>{t(locale, "rot.step3")}</li>
          </ol>

          <div
            ref={padRef}
            className={`rot-pad rot-pad--${phase}`}
            role="button"
            tabIndex={0}
            aria-label={status}
            onClick={() => { if (phase !== "measuring") start(); }}
            onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && phase !== "measuring") start(); }}
          >
            <canvas ref={canvasRef} className="rot-canvas" aria-hidden="true" />
            <span className="rot-status">{status}</span>
            {phase === "measuring" ? <span className="rot-stop">{t(locale, "rot.step3")}</span> : null}
          </div>

          <div className="rot-result" aria-live="polite">
            <span className="rot-result-label">{t(locale, "rot.result")}</span>
            <strong className="rot-result-value">{enough ? `${result.correction.toFixed(1)}°` : "0°"}</strong>
            {phase === "done" && enough ? (
              <p className="rot-margin">{tp(locale, "rot.margin", { n: result.margin.toFixed(1), swipes: result.swipes })}</p>
            ) : null}
            {phase === "done" && !enough ? (
              <p className="rot-hint">{tp(locale, "rot.few", { n: result?.swipes ?? 0, min: MIN_SWIPES })}</p>
            ) : null}
          </div>

          <p className="rot-note">{t(locale, "rot.note")}</p>

          <section className="rot-how" aria-labelledby="rot-how-title">
            <h2 id="rot-how-title">{t(locale, "rot.how.title")}</h2>
            <p>{t(locale, "rot.how.p1")}</p>
            <code className="rot-formula" dir="ltr">θ = ½ · atan2(2 · Σ dx·dy, Σ dx² − Σ dy²)</code>
            <p>{t(locale, "rot.how.p2")}</p>
            <p>{t(locale, "rot.how.p3")}</p>
          </section>
        </section>
      </main>

      <SiteFooter locale={locale} />
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("OpenMouse could not find the mouse rotation page root.");
createRoot(root).render(<RotationApp />);

registerServiceWorker();
mountOfflineBanner();
