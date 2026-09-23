import { useEffect, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./landing.css";
import "./download.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { APP_URL, SiteFooter, SiteNav } from "./app/site-chrome";
import { DISCORD_URL } from "./app/social-links";
import { AppleIcon, LinuxIcon, WindowsIcon } from "./app/platform-icons";
import { usePageLocale } from "./app/page-locale";

// "latest" always resolves to the newest stable Bridge release, so these
// links never need updating when Bridge ships a new version.
const BRIDGE_RELEASES_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest";
const BRIDGE_WINDOWS_URL = `${BRIDGE_RELEASES_URL}/download/openmouse-bridge-windows-x64.zip`;
const BRIDGE_MAC_URL = `${BRIDGE_RELEASES_URL}/download/openmouse-bridge-macos-universal.zip`;
const BRIDGE_POST_URL = "/blog-bridge-setup-guide.html";

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

function Downloads(): ReactNode {
  const bridgeLaunched = useLaunched(BRIDGE_LAUNCH);
  const bridgeDownloads = useBridgeDownloads(bridgeLaunched);
  return (
    <section className="dl-page">
      <header className="dl-head">
        <h1>Download OpenMouse</h1>
        <p>
          OpenMouse runs in your browser, no install needed. Bridge is an optional helper for the things a
          browser can't do on its own.
        </p>
      </header>

      <div className="dl-grid">
        <article className="dl-card">
          <div className="dl-shot dl-shot-web" aria-hidden="true">
            <img src="/screenshot-app.png" alt="" width={1572} height={811} loading="lazy" />
          </div>
          <p className="dl-kicker">Web app</p>
          <h2>OpenMouse</h2>
          <p className="dl-desc">
            The full configurator, right in your browser. Every setting for every supported mouse.
          </p>
          <ul className="dl-meta">
            <li>Chrome, Edge, and other Chromium browsers</li>
            <li>Nothing to install</li>
          </ul>
          <div className="dl-actions">
            <a className="dl-btn dl-btn-primary" href={APP_URL}>Open the app</a>
          </div>
        </article>

        <article className="dl-card dl-card-featured">
          <div className="dl-shot dl-shot-bridge">
            <img
              src="/bridge-panel.png"
              alt="The OpenMouse Bridge tray panel: Ready, PRO X SUPERLIGHT 2c, default profile, 41% battery, and an Open control panel button"
              width={320}
              height={306}
              loading="lazy"
            />
          </div>
          <p className="dl-kicker">
            Helper app <span className="dl-badge">Beta</span>
          </p>
          <h2>OpenMouse Bridge</h2>
          <p className="dl-desc">
            Runs in your system tray. Gets Razer mice working on Windows again, lets OpenMouse run in Firefox,
            and switches settings automatically when a game launches.
          </p>
          <ul className="dl-meta">
            <li>Windows (64-bit), macOS (Intel and Apple silicon), Linux in the works</li>
            {bridgeDownloads !== null && (
              <li className="dl-count">
                {bridgeDownloads.toLocaleString()} {bridgeDownloads === 1 ? "download" : "downloads"}
              </li>
            )}
          </ul>
          {bridgeLaunched ? (
            <>
              <div className="dl-actions">
                <a className="dl-btn dl-btn-primary" href={BRIDGE_WINDOWS_URL}>
                  <WindowsIcon /> Windows
                </a>
                <a className="dl-btn" href={BRIDGE_MAC_URL}>
                  <AppleIcon /> macOS
                </a>
                <span className="dl-btn dl-btn-disabled dl-btn-wide" aria-disabled="true">
                  <LinuxIcon /> Linux <span className="dl-soon">Soon</span>
                </span>
              </div>
              <p className="dl-foot">
                <a href={BRIDGE_POST_URL}>Install guide</a>
                <span aria-hidden="true">·</span>
                <a href={BRIDGE_RELEASES_URL} target="_blank" rel="noreferrer">Release notes</a>
              </p>
            </>
          ) : (
            <div className="dl-actions">
              <span className="dl-btn dl-btn-disabled" aria-disabled="true">
                Available {formatLaunch(BRIDGE_LAUNCH)}
              </span>
            </div>
          )}
        </article>

        <article className="dl-card dl-card-soon">
          <div className="dl-shot dl-shot-desktop" aria-hidden="true">
            <img src="/logo.png" alt="" width={44} height={64} />
            <span>Coming soon</span>
          </div>
          <p className="dl-kicker">Desktop app</p>
          <h2>OpenMouse Desktop</h2>
          <p className="dl-desc">
            OpenMouse as a standalone app, no browser required. We'll announce it on Discord first.
          </p>
          <div className="dl-actions">
            <span className="dl-btn dl-btn-disabled" aria-disabled="true">Coming soon</span>
            <a className="dl-btn" href={DISCORD_URL} target="_blank" rel="noreferrer">Get notified</a>
          </div>
        </article>
      </div>

      {bridgeLaunched && (
        <p className="dl-note">
          Bridge isn't code-signed yet, so Windows and macOS will warn you the first time you open it.{" "}
          <a href={BRIDGE_POST_URL}>Here's how to get past that.</a>
        </p>
      )}
    </section>
  );
}

function DownloadPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Downloads />
      <SiteFooter locale={locale} />
    </div>
  );
}

const downloadApp = document.querySelector<HTMLDivElement>("#download-app");

if (!downloadApp) {
  throw new Error("OpenMouse could not find the download page root.");
}

createRoot(downloadApp).render(<DownloadPage />);

registerServiceWorker();
mountOfflineBanner();
