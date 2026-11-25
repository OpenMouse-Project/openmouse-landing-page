import { useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../shared/site.css";
import "./check.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { t, tp, type I18nKey } from "../../i18n/index";
import type { InterfaceLocale } from "../../shared/interface-preferences";
import { usePageLocale } from "../../shared/page-locale";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import {
  SCAN_FILTERS,
  buildDiscordSummary,
  hex,
  reportSummary,
  scanDevices,
  usagePageLabel,
  type DeviceResult,
} from "./check-scan";

const VERDICT_KEYS: Record<DeviceResult["verdict"], I18nKey> = {
  full: "chk.verdict.full",
  partial: "chk.verdict.partial",
  limited: "chk.verdict.limited",
  blocked: "chk.verdict.blocked",
  unknown: "chk.verdict.unknown",
};

function DeviceCard({ result, locale }: { result: DeviceResult; locale: InterfaceLocale }): ReactNode {
  const name = result.device.productName || tp(locale, "chk.mouseFallback", { brand: result.brand });
  return (
    <div className="device-card">
      <div className="device-card-head">
        <div className="device-card-identity">
          <strong>{name}</strong>
          <small>{result.brand} · VID_{hex(result.vendorId)} · PID_{hex(result.productId)}</small>
        </div>
        <div className="device-card-badges">
          {result.openmouseSupported ? (
            <span className="verdict-badge verdict-full">{"OpenMouse"}</span>
          ) : null}
          <span className={`verdict-badge verdict-${result.verdict}`}>{t(locale, VERDICT_KEYS[result.verdict])}</span>
        </div>
      </div>

      {result.device.collections.length > 0 ? (
        <div className="iface-section">
          <div className="iface-label">{t(locale, "chk.collections")}</div>
          {result.device.collections.map((col, index) => (
            <div className="iface-row" key={index}>
              <span className="iface-page">{usagePageLabel(col.usagePage)}</span>
              <span className="iface-type">Usage 0x{hex(col.usage, 2)}</span>
              <span className="iface-reports">{reportSummary(col)}</span>
            </div>
          ))}
        </div>
      ) : null}

      {result.txResults.length > 0 ? (
        <div className="tx-section">
          <div className="tx-label">{t(locale, "chk.txTest")}</div>
          {result.txResults.map((tx) => (
            <div className="tx-row" key={tx.txId}>
              <span className="tx-id">TX 0x{hex(tx.txId, 2)}</span>
              <span className={tx.ok ? "tx-ok" : "tx-fail"}>{tx.ok ? t(locale, "chk.responded") : t(locale, "chk.noResponse")}</span>
              {tx.firmware ? <span className="tx-fw">FW {tx.firmware}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      {result.opened ? (
        <div className="open-result ok"><span className="open-dot" />{t(locale, "chk.openedOk")}</div>
      ) : (
        <div className="open-result err">
          <span className="open-dot" />{result.openError ?? t(locale, "chk.couldNotOpen")}
        </div>
      )}

      <p className="device-card-note">{result.verdictNote}</p>
    </div>
  );
}

function CopyButton({ summary, locale }: { summary: string; locale: InterfaceLocale }): ReactNode {
  const [copied, setCopied] = useState(false);
  return (
    <button
      id="copy-btn"
      className={`land-cta-secondary copy-button${copied ? " copied" : ""}`}
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(summary).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? t(locale, "chk.copied") : t(locale, "chk.copyDiscord")}
    </button>
  );
}

type ScanState =
  | { kind: "idle" }
  | { kind: "busy"; message: string }
  | { kind: "empty"; message: string }
  | { kind: "done"; results: DeviceResult[] };

function CheckApp(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const supportsWebHid = "hid" in navigator;
  const [state, setState] = useState<ScanState>({ kind: "idle" });
  const [scanned, setScanned] = useState(false);

  async function runScan(): Promise<void> {
    if (!navigator.hid) return;
    setState({ kind: "busy", message: t(locale, "chk.waitPrompt") });

    let devices: HIDDevice[];
    try {
      devices = await navigator.hid.requestDevice({ filters: SCAN_FILTERS });
    } catch {
      setState({ kind: "empty", message: t(locale, "chk.cancelled") });
      setScanned(true);
      return;
    }
    if (devices.length === 0) {
      setState({ kind: "empty", message: t(locale, "chk.noMatch") });
      setScanned(true);
      return;
    }

    setState({ kind: "busy", message: tp(locale, "chk.testing", { n: devices.length, s: devices.length !== 1 ? "s" : "" }) });
    try {
      setState({ kind: "done", results: await scanDevices(devices, locale) });
    } catch (err) {
      setState({
        kind: "empty",
        message: tp(locale, "chk.scanError", { msg: err instanceof Error ? err.message : String(err) }),
      });
    }
    setScanned(true);
  }

  return (
    <div className="land-shell chk">
      <SiteNav locale={locale} onLocale={setLocale} />
      <main className="chk-main">
        <section className="check-hero">
          <p className="land-kicker">{t(locale, "chk.overline")}</p>
          <h1>{t(locale, "nav.mouseCheck")}</h1>
          <p>{t(locale, "chk.heroBody")}</p>
        </section>

        <div className="check-panel">
          <div id="compat-banner" className={`compat-banner ${supportsWebHid ? "ok" : "warn"}`}>
            <span className="compat-banner-dot" />
            {supportsWebHid ? t(locale, "chk.webhidOk") : t(locale, "chk.webhidMissing")}
          </div>
          <div className="scan-row">
            <button
              id="scan-btn"
              className="land-cta scan-button"
              type="button"
              disabled={!supportsWebHid || state.kind === "busy"}
              onClick={() => void runScan()}
            >
              {state.kind === "busy" ? t(locale, "chk.scanning") : scanned ? t(locale, "chk.scanAgain") : t(locale, "chk.scanBtn")}
            </button>
            <span className="scan-note">{t(locale, "chk.scanNote")}</span>
          </div>
        </div>

        <div id="results-area">
          {state.kind === "busy" ? <div className="scanning-state">{state.message}</div> : null}
          {state.kind === "empty" ? <div className="check-empty">{state.message}</div> : null}
          {state.kind === "done" ? (
            <>
              <h2 className="results-heading">
                {state.results.length !== 1 ? tp(locale, "chk.resultsMany", { n: state.results.length }) : tp(locale, "chk.resultsOne", { n: state.results.length })}
              </h2>
              <div className="results-list">
                {state.results.map((result, index) => <DeviceCard key={index} result={result} locale={locale} />)}
              </div>
              <div className="copy-section">
                <p>{t(locale, "chk.shareDiscord")}</p>
                <CopyButton summary={buildDiscordSummary(state.results)} locale={locale} />
              </div>
            </>
          ) : null}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("check-app root not found");
createRoot(root).render(<CheckApp />);

registerServiceWorker();
mountOfflineBanner();
