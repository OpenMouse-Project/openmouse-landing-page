import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./landing.css";
import "./blog.css";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";
import { SiteFooter, SiteNav } from "./app/site-chrome";
import { usePageLocale } from "./app/page-locale";
import { BlogComments } from "./blog-comments";
import { BlogOutro } from "./blog-outro";

const POST_SLUG = "bridge-setup-guide";
const CONTROL_URL = "https://control.openmouse.app";
const GAMES_CATALOG_URL = "https://github.com/OpenMouse-Project/Desktop/blob/main/public/games.json";

function Post(): ReactNode {
  return (
    <article className="blog-article">
      <div className="blog-kicker">Guide · Bridge</div>
      <h1>Setting up OpenMouse Bridge: install, game profiles, and battery alerts</h1>
      <p className="blog-dek">
        Everything from first launch to having your mouse switch settings on its own when a game starts.
      </p>
      <p className="blog-byline">snekxs, September 23, 2026</p>

      <nav className="blog-toc" aria-label="In this guide">
        <p>In this guide</p>
        <ol>
          <li><a href="#install">Install Bridge</a></li>
          <li><a href="#connect">Connect your mouse</a></li>
          <li><a href="#game-profiles">Set up a game profile</a></li>
          <li><a href="#battery">Low-battery alerts</a></li>
          <li><a href="#settings">Start at login and updates</a></li>
          <li><a href="#troubleshooting">Troubleshooting</a></li>
        </ol>
      </nav>

      <h2 id="install">1. Install Bridge</h2>
      <ol className="blog-steps">
        <li>
          Go to the <a href="/download.html">download page</a> and pick <strong>Windows</strong> or{" "}
          <strong>macOS</strong>.
        </li>
        <li>
          Unzip it somewhere you'll keep it, like your Documents folder. Keep the <code>native-hid</code> folder
          next to the app; Bridge needs it.
        </li>
        <li>
          Open <code>openmouse-bridge</code>. The first time, Windows shows "Windows protected your PC": click{" "}
          <strong>More info</strong>, then <strong>Run anyway</strong>. On macOS, if it won't open, go to{" "}
          <strong>System Settings → Privacy &amp; Security</strong> and click <strong>Open Anyway</strong>.
        </li>
        <li>
          An OpenMouse icon appears in your system tray (Windows) or menu bar (macOS). Click it to open Bridge's
          panel.
        </li>
      </ol>

      <figure className="blog-hero-shot">
        <img
          src="/bridge-panel.png"
          alt="The OpenMouse Bridge tray panel: Ready, PRO X SUPERLIGHT 2c, default profile, 41% battery, and an Open control panel button"
          width={320}
          height={306}
          loading="lazy"
        />
      </figure>

      <h2 id="connect">2. Connect your mouse</h2>
      <p>
        Click <strong>Open control panel</strong> in Bridge's panel, or go to{" "}
        <a href={CONTROL_URL} target="_blank" rel="noreferrer">control.openmouse.app</a> yourself. OpenMouse
        notices Bridge on its own and uses it to reach your mouse. There's nothing to pair.
      </p>
      <p>
        You'll know it worked when a <strong>Games</strong> page shows up in the sidebar. It's only there while
        Bridge is running.
      </p>

      <h2 id="game-profiles">3. Set up a game profile</h2>
      <p>
        A game profile is a set of mouse settings (DPI, polling rate, buttons, whatever your mouse supports) that
        Bridge applies when that game is running, and takes back off when it closes.
      </p>
      <ol className="blog-steps">
        <li>In the control panel, open <strong>Games</strong> from the sidebar and click the game you want.</li>
        <li>
          Under <strong>Target device</strong>, click <strong>Select</strong> next to the mouse this profile is
          for.
        </li>
        <li>
          Change the settings you want in the <strong>Settings</strong> section below. These only go into this
          game's profile; your mouse keeps its current settings until the game launches. The card at the top
          counts how many settings you've customized.
        </li>
        <li>
          Turn on <strong>Apply automatically</strong>. Back on the Games page, that game's tile now has an{" "}
          <strong>Auto</strong> badge.
        </li>
        <li>
          Launch the game. Bridge applies the profile and shows a small notice with the game's name and what
          changed, like "1600 DPI · 1000 Hz". When you close the game, your normal settings come back.
        </li>
      </ol>
      <p>
        You don't need the control panel open for any of this. Once a profile is saved, Bridge handles it in the
        background. To start over, open the game and click <strong>Clear</strong>.
      </p>
      <div className="blog-finding">
        <h3>Game not in the list?</h3>
        <p>
          Bridge recognizes games from a shared list that's updated on its own. If yours is missing, tell us on
          Discord or GitHub, or add it to the{" "}
          <a href={GAMES_CATALOG_URL} target="_blank" rel="noreferrer">games list</a> yourself.
        </p>
      </div>

      <h2 id="battery">4. Low-battery alerts</h2>
      <p>
        For wireless mice, Bridge checks the battery every five minutes and sends a desktop notification when it
        drops below your threshold, even when OpenMouse isn't open. It checks the mouse you last used in OpenMouse
        and any mouse you've made a game profile for.
      </p>
      <p>
        Change the threshold under <strong>Low battery alert</strong> in Bridge's <strong>Settings</strong>. It's 20% to
        start with, and you won't get the same alert more than once every few hours.
      </p>

      <h2 id="settings">5. Start at login and updates</h2>
      <ul>
        <li>
          <strong>Launch at login</strong>, in Bridge's <strong>Settings</strong>, starts Bridge when you sign
          in, so game profiles and alerts work without you opening it first.
        </li>
        <li>
          Under <strong>Updates</strong>, Bridge can check for a new version and install it. Turn on{" "}
          <strong>Automatic updates</strong> if you want that to happen on its own. It's off by default. Every
          update is checked against a published checksum before it's installed.
        </li>
      </ul>

      <h2 id="troubleshooting">6. Troubleshooting</h2>
      <ul className="blog-ruled-out">
        <li>
          <b>There's no Games page in the sidebar.</b>{" "}
          <span>Bridge isn't running, or the page opened before it did. Start Bridge, then reload the control panel.</span>
        </li>
        <li>
          <b>"Could not reach OpenMouse Bridge."</b>{" "}
          <span>Bridge was closed while you were editing a profile. Start it again and retry.</span>
        </li>
        <li>
          <b>The profile didn't apply when the game started.</b>{" "}
          <span>Check the game's tile has the Auto badge and that the right mouse is selected under Target device.</span>
        </li>
        <li>
          <b>It doesn't work in Safari.</b>{" "}
          <span>Safari isn't supported yet. Use Chrome, Edge, or Firefox.</span>
        </li>
        <li>
          <b>Something else.</b>{" "}
          <span>
            Send us Bridge's log. On Windows it's in <code>%APPDATA%\OpenMouse\OpenMouse Bridge\config\logs</code>.
            It never includes what's sent to your mouse or full serial numbers.
          </span>
        </li>
      </ul>

      <BlogOutro>Stuck, or have a game you want added? We're around.</BlogOutro>
    </article>
  );
}

function BlogPostPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      <Post />
      <div className="blog-comments-wrap">
        <BlogComments slug={POST_SLUG} />
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}

const postApp = document.querySelector<HTMLDivElement>("#blog-post-app");

if (!postApp) {
  throw new Error("OpenMouse could not find the blog post root.");
}

createRoot(postApp).render(<BlogPostPage />);

registerServiceWorker();
mountOfflineBanner();
