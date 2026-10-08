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
import { usePointerAurora, useScrollReveal } from "./app/motion";

// "latest" always resolves to the newest stable Bridge release, so these
// links never need updating when Bridge ships a new version.
const BRIDGE_RELEASES_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest";
const BRIDGE_WINDOWS_URL = `${BRIDGE_RELEASES_URL}/download/openmouse-bridge-windows-x64.zip`;
const BRIDGE_MAC_URL = `${BRIDGE_RELEASES_URL}/download/openmouse-bridge-macos-universal.zip`;
const BRIDGE_POST_URL = "/blog-openmouse-bridge.html#install";

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

/* Card marks are single 24x24 stroke paths; landing.css sizes and colors
   them through .land-card-icon. */
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

/** The card that actually downloads something: Bridge, its two platform
    builds, and the live download total. */
function BridgeCard({ launched, downloads }: { launched: boolean; downloads: number | null }): ReactNode {
  return (
    <article className="land-card dl-card-featured" data-reveal>
      <CardIcon path={ICON_BRIDGE} />
      <p className="land-kicker dl-kicker">
        Helper app <span className="dl-badge">Beta</span>
      </p>
      <h2>OpenMouse Bridge</h2>
      <p>
        Runs in your system tray. Gets Razer mice working on Windows again, lets OpenMouse run in Firefox, and
        switches settings automatically when a game launches.
      </p>
      <ul className="dl-meta">
        <li>Windows (64-bit), macOS (Intel and Apple silicon), Linux in the works</li>
      </ul>
      {downloads !== null && (
        <ul className="land-stats">
          <li className="land-stat">
            <span className="land-stat-value">{downloads.toLocaleString()}</span>
            <span className="land-stat-label">{downloads === 1 ? "download" : "downloads"}</span>
          </li>
        </ul>
      )}
      {launched ? (
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
  );
}

function Downloads(): ReactNode {
  const bridgeLaunched = useLaunched(BRIDGE_LAUNCH);
  const bridgeDownloads = useBridgeDownloads(bridgeLaunched);
  const aurora = usePointerAurora();
  return (
    <section className="land-page">
      <header
        className="land-page-head land-aurora"
        ref={(node) => {
          aurora.current = node;
        }}
        data-reveal
      >
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

      {/* One card per way to run OpenMouse: the browser, the tray helper, and
          the desktop app that's still on the way. */}
      <section className="land-section land-grid dl-options">
        <article className="land-card" data-reveal>
          <CardIcon path={ICON_BROWSER} />
          <p className="land-kicker">Web app</p>
          <h2>OpenMouse</h2>
          <p>The full configurator, right in your browser. Every setting for every supported mouse.</p>
          <ul className="dl-meta">
            <li>Chrome, Edge, and other Chromium browsers</li>
            <li>Nothing to install</li>
          </ul>
          <div className="dl-actions">
            <a className="dl-btn dl-btn-primary" href={APP_URL}>Open the app</a>
          </div>
        </article>

        <BridgeCard launched={bridgeLaunched} downloads={bridgeDownloads} />

        <article className="land-card dl-card-soon" data-reveal>
          <CardIcon path={ICON_DESKTOP} />
          <p className="land-kicker">Desktop app</p>
          <h2>OpenMouse Desktop</h2>
          <p>OpenMouse as a standalone app, no browser required. We'll announce it on Discord first.</p>
          <div className="dl-actions">
            <span className="dl-btn dl-btn-disabled" aria-disabled="true">Coming soon</span>
            <a className="dl-btn" href={DISCORD_URL} target="_blank" rel="noreferrer">Get notified</a>
          </div>
        </article>
      </section>

      {bridgeLaunched && (
        <section className="land-section dl-install">
          <div className="land-section-head">
            <h2>Installing Bridge</h2>
            <p>
              Bridge is a folder you unzip and run. OpenMouse notices it on its own, so there's nothing to pair
              and nothing to configure.
            </p>
          </div>
          {/* The panel that appears once Bridge is running, in the same framed
              shot the landing page's bridge section uses. */}
          <div className="dl-install-body">
            <div className="dl-shot" data-reveal>
              <img
                src="/bridge-panel.png"
                alt="The OpenMouse Bridge tray panel: Ready, PRO X SUPERLIGHT 2c, default profile, 41% battery, and an Open control panel button"
                width={320}
                height={306}
                loading="lazy"
              />
            </div>
            <ol className="land-steps">
              <li className="land-step" data-reveal>
                <div>
                  <h3>Download it for your computer</h3>
                  <p>
                    Grab the Windows or macOS zip from the card above. Every release ships a checksum if you want
                    to check the download first.
                  </p>
                </div>
              </li>
              <li className="land-step" data-reveal>
                <div>
                  <h3>Unzip it somewhere you'll keep it</h3>
                  <p>
                    Your Documents folder works. Keep the <code>native-hid</code> folder next to the app, because
                    Bridge needs it.
                  </p>
                </div>
              </li>
              <li className="land-step" data-reveal>
                <div>
                  <h3>Open it once</h3>
                  <p>
                    An OpenMouse icon shows up in your system tray on Windows, or your menu bar on macOS. Click it
                    to open Bridge's panel.
                  </p>
                </div>
              </li>
            </ol>
          </div>
          <p className="land-note">
            Bridge isn't code-signed yet, so Windows and macOS will warn you the first time you open it.{" "}
            <a href={BRIDGE_POST_URL}>Here's how to get past that.</a>
          </p>
        </section>
      )}
    </section>
  );
}

function DownloadPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  useScrollReveal();
  return (
    <div className="land-shell land-shell--marketing">
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
