import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "../../shared/site.css";
import "./download.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { APP_URL, SiteFooter, SiteNav } from "../../shared/site-chrome";
import { DISCORD_URL } from "../../shared/social-links";
import { AppleIcon, LinuxIcon, WindowsIcon } from "../../shared/platform-icons";
import { usePageLocale } from "../../shared/page-locale";
import { useScrollReveal } from "../../shared/motion";

import { AsciiField } from "../home/ascii-field";
import { AsciiLine } from "./ascii-line";

const BRIDGE_RELEASES_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest";
const BRIDGE_WINDOWS_URL = `${BRIDGE_RELEASES_URL}/download/openmouse-bridge-windows-x64.zip`;
const BRIDGE_MAC_URL = `${BRIDGE_RELEASES_URL}/download/OpenMouse-Bridge-macos-universal.dmg`;
const BRIDGE_POST_URL = "/blog/openmouse-bridge#install";

type DesktopOs = "windows" | "mac" | "linux" | null;

/** The visitor's desktop OS, or null on phones, tablets and anything unrecognised. */
function detectOs(): DesktopOs {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean } };
  if (nav.userAgentData?.mobile) return null;
  const hint = `${nav.userAgentData?.platform ?? ""} ${nav.platform} ${nav.userAgent}`.toLowerCase();
  if (/android|iphone|ipad|ipod|cros/.test(hint)) return null;
  if (/win/.test(hint)) return "windows";
  if (/mac/.test(hint)) return "mac";
  if (/linux|x11/.test(hint)) return "linux";
  return null;
}

// Bridge's public launch: 11:00 AM Mountain (MDT) on Sep 23, 2026. Until
// then the card shows the moment in the visitor's own time zone, and flips
// to the download buttons on its own when it passes. The launch post (the
// install guide) goes live at the same time.
const BRIDGE_LAUNCH = new Date("2026-09-23T17:00:00Z");

function useLaunched(at: Date): boolean {
  const [launched, setLaunched] = useState(() => Date.now() >= at.getTime());
  useEffect(() => {
    if (launched) return;
    const timer = window.setTimeout(() => setLaunched(true), at.getTime() - Date.now());
    return () => window.clearTimeout(timer);
  }, [at, launched]);
  return launched;
}

const BRIDGE_RELEASES_API = "https://api.github.com/repos/OpenMouse-Project/OpenMouse-Bridge/releases?per_page=100";

interface ReleaseAsset { name: string; download_count: number }
interface Release { prerelease: boolean; assets: ReleaseAsset[] }

/**
 * Total Bridge downloads across every stable release, from GitHub's public
 * per-asset counters. Only the .zip archives count (not their .sha256
 * files), and the rolling dev-build prerelease is skipped. Bridge's own
 * auto-updater downloads the same zips, so updates count too.
 */
function useBridgeDownloads(enabled: boolean): number | null {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(BRIDGE_RELEASES_API)
      .then((response) => (response.ok ? (response.json() as Promise<Release[]>) : null))
      .then((releases) => {
        if (cancelled || !Array.isArray(releases)) return;
        const total = releases
          .filter((release) => !release.prerelease)
          .flatMap((release) => release.assets)
          .filter((asset) => asset.name.endsWith(".zip"))
          .reduce((sum, asset) => sum + asset.download_count, 0);
        setCount(total);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return count;
}

/** e.g. "Sep 23, 1:00 PM EDT" in the visitor's locale and time zone. */
function formatLaunch(at: Date): string {
  return at.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function CardIcon({ path }: { path: string }): ReactNode {
  return (
    <span className="land-card-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={path} />
      </svg>
    </span>
  );
}

/* Window chrome with a cursor: the web app needs no install. */
const ICON_BROWSER =
  "M3 9.5h18M5.9 6.4h.01M8.6 6.4h.01M6 4.5h12a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3Z";

/* A monitor on a stand: OpenMouse as a standalone app. */
const ICON_DESKTOP =
  "M3.4 5.2h17.2a1.6 1.6 0 0 1 1.6 1.6v8.4a1.6 1.6 0 0 1-1.6 1.6H3.4a1.6 1.6 0 0 1-1.6-1.6V6.8a1.6 1.6 0 0 1 1.6-1.6ZM8.6 21h6.8M12 16.8V21";

/* A plug with a cord: the helper that reaches the hardware the browser
   can't. */
const ICON_BRIDGE =
  "M9.2 2.6v4.2M14.8 2.6v4.2M6.6 6.8h10.8v4.4a5.4 5.4 0 0 1-10.8 0ZM12 16.6v4.8";

/** A faint one-line ASCII trace that separates two sections. Each seed draws its own line. */
function Divider({ seed }: { seed: number }): ReactNode {
  return (
    <div className="dl-divider" aria-hidden="true">
      <AsciiLine className="dl-wave" seed={seed} cols={200} />
    </div>
  );
}

/** Bridge downloads, platform availability, and the live download total. */
function BridgeSection({ launched, downloads }: { launched: boolean; downloads: number | null }): ReactNode {
  // One button, for the visitor's own OS. On phones and unrecognised systems
  // there is nothing to match, so both builds show.
  const os = useMemo(detectOs, []);
  const windows = (
    <a key="windows" className="dl-btn dl-btn-primary dl-btn-lg" href={BRIDGE_WINDOWS_URL}>
      <WindowsIcon /> Download for Windows
    </a>
  );
  const mac = (
    <a key="mac" className="dl-btn dl-btn-primary dl-btn-lg" href={BRIDGE_MAC_URL}>
      <AppleIcon /> Download for macOS
    </a>
  );
  const linux = (
    <span key="linux" className="dl-btn dl-btn-disabled dl-btn-lg" aria-disabled="true">
      <LinuxIcon /> Linux <span className="dl-soon">Soon</span>
    </span>
  );
  const downloadButtons: ReactNode[] =
    os === "windows" ? [windows] : os === "mac" ? [mac] : os === "linux" ? [linux] : [windows, mac];
  // The other builds stay one click away.
  const otherBuilds: ReactNode[] = [];
  if (os === "windows") otherBuilds.push(<a key="mac" href={BRIDGE_MAC_URL}>macOS</a>);
  if (os === "mac") otherBuilds.push(<a key="windows" href={BRIDGE_WINDOWS_URL}>Windows</a>);
  if (os === "linux") otherBuilds.push(<a key="windows" href={BRIDGE_WINDOWS_URL}>Windows</a>, <a key="mac" href={BRIDGE_MAC_URL}>macOS</a>);
  return (
    <section className="dl-product" aria-labelledby="bridge-title" data-reveal>
      <div className="dl-product-heading">
        <CardIcon path={ICON_BRIDGE} />
        <p className="land-kicker">Helper app</p>
        <h2 id="bridge-title">OpenMouse Bridge</h2>
        {launched && (
          /* The panel that appears once Bridge is running, in the same framed
             shot the landing page's bridge section uses. */
          <div className="dl-shot">
            <img
              src="/bridge-panel.png"
              alt="The OpenMouse Bridge tray panel: Ready, PRO X SUPERLIGHT 2c, default profile, 41% battery, and an Open control panel button"
              width={320}
              height={306}
              loading="lazy"
            />
          </div>
        )}
      </div>
      <div className="dl-product-details">
        <p>
          Runs in your system tray. Gets Razer mice working on Windows again, lets OpenMouse run in Firefox, and
          switches settings automatically when a game launches.
        </p>
        {downloads !== null && (
          <p className="dl-count">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4v10.5M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
            </svg>
            <span className="dl-count-value">{downloads.toLocaleString()}</span>
            <span className="dl-count-label">{downloads === 1 ? "download" : "downloads"}</span>
          </p>
        )}
        {launched ? (
          <>
            <div className="dl-actions">
              {downloadButtons}
            </div>
            <p className="dl-foot">
              {otherBuilds.length > 0 && (
                <>
                  <span>Also for</span>
                  {otherBuilds}
                  <span aria-hidden="true">·</span>
                </>
              )}
              <a href={BRIDGE_POST_URL}>Install guide</a>
              <span aria-hidden="true">·</span>
              <a href={BRIDGE_RELEASES_URL} target="_blank" rel="noreferrer">Release notes</a>
            </p>
            <details className="dl-install">
              <summary>Installing Bridge</summary>
              <div className="dl-install-body">
                <p>
                  Bridge is a small app you install and run. OpenMouse notices it on its own, so there's nothing to
                  pair and nothing to configure.
                </p>
                <ol className="land-steps">
                  <li className="land-step">
                    <div>
                      <h3>Download the installer</h3>
                      <p>
                        Use the button above. Every release ships a checksum if you want to check the download first.
                      </p>
                    </div>
                  </li>
                  <li className="land-step">
                    <div>
                      <h3>Run it</h3>
                      <p>Open the installer and follow the prompts.</p>
                    </div>
                  </li>
                  <li className="land-step">
                    <div>
                      <h3>Open it once</h3>
                      <p>
                        An OpenMouse icon shows up in your system tray on Windows, or your menu bar on macOS. Click it
                        to open Bridge's panel.
                      </p>
                    </div>
                  </li>
                </ol>
                <p className="land-note">
                  Bridge isn't code-signed yet, so Windows and macOS will warn you the first time you open it. On macOS, right-click the app and choose Open.{" "}
                  <a href={BRIDGE_POST_URL}>Here's how to get past that.</a>
                </p>
              </div>
            </details>
          </>
        ) : (
          <div className="dl-actions">
            <span className="dl-btn dl-btn-disabled" aria-disabled="true">
              Available {formatLaunch(BRIDGE_LAUNCH)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function Downloads(): ReactNode {
  const bridgeLaunched = useLaunched(BRIDGE_LAUNCH);
  const bridgeDownloads = useBridgeDownloads(bridgeLaunched);
  return (
    <main className="land-page dl-page">
      <header className="land-page-head dl-hero" data-reveal>
        <p className="land-kicker">Get OpenMouse</p>
        <h1 className="land-page-title">Download OpenMouse</h1>
        <p className="land-page-lead">
          OpenMouse runs in your browser, no install needed. Bridge is an optional helper for the things a
          browser can't do on its own.
        </p>
        <div className="land-page-actions">
          <a className="land-cta" href={APP_URL}>Open the app</a>
          {/* The install guide goes live with Bridge itself, so it only shows
              up once the release is out. */}
          {bridgeLaunched && <a className="land-cta-secondary" href={BRIDGE_POST_URL}>Install guide</a>}
        </div>
      </header>

      <div className="dl-options">
        <Divider seed={33} />
        <section className="dl-product" aria-labelledby="web-title" data-reveal>
          <div className="dl-product-heading">
            <CardIcon path={ICON_BROWSER} />
            <p className="land-kicker">Web app</p>
            <h2 id="web-title">OpenMouse</h2>
          </div>
          <div className="dl-product-details">
            <p>The full configurator, right in your browser. Every setting for every supported mouse.</p>
            <ul className="dl-meta">
              <li>Chrome, Edge, and other Chromium browsers</li>
              <li>Nothing to install</li>
            </ul>
            <div className="dl-actions">
              <a className="dl-btn dl-btn-primary" href={APP_URL}>Open the app</a>
          </div>
          </div>
        </section>

        <Divider seed={12} />
        <BridgeSection launched={bridgeLaunched} downloads={bridgeDownloads} />

        <Divider seed={47} />
        <section className="dl-product" aria-labelledby="desktop-title" data-reveal>
          <div className="dl-product-heading">
            <CardIcon path={ICON_DESKTOP} />
            <p className="land-kicker">Desktop app</p>
            <h2 id="desktop-title">OpenMouse Desktop</h2>
          </div>
          <div className="dl-product-details">
            <p>OpenMouse as a standalone app, no browser required. We'll announce it on Discord first.</p>
            <div className="dl-actions">
              <span className="dl-btn dl-btn-disabled" aria-disabled="true">Coming soon</span>
              <a className="dl-btn" href={DISCORD_URL} target="_blank" rel="noreferrer">Get notified</a>
          </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DownloadPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing dl-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      {/* Anchored to the page, not the centred column, so it stays in the corner at any width. */}
      <AsciiField className="dl-ascii" seed={7} cols={104} rows={40} origin={[1.02, -0.04]} reach={0.62} />
      <Downloads />
      <SiteFooter locale={locale} />
    </div>
  );
}

const downloadApp = document.querySelector<HTMLDivElement>("#app");

if (!downloadApp) {
  throw new Error("OpenMouse could not find the download page root.");
}

createRoot(downloadApp).render(<DownloadPage />);

registerServiceWorker();
mountOfflineBanner();
