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
import { BlogToc, type TocItem } from "./blog-toc";

const POST_SLUG = "openmouse-bridge";
const RELEASES_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest";
const WINDOWS_ZIP_URL = `${RELEASES_URL}/download/openmouse-bridge-windows-x64.zip`;
const MAC_ZIP_URL = `${RELEASES_URL}/download/openmouse-bridge-macos-universal.zip`;
const SOURCE_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge";
const CONTROL_URL = "https://control.openmouse.app";
const GAMES_CATALOG_URL = "https://github.com/OpenMouse-Project/Desktop/blob/main/public/games.json";

const SECTIONS: readonly TocItem[] = [
  { id: "why", label: "Why Bridge exists" },
  { id: "what", label: "What Bridge is" },
  { id: "install", label: "Install it" },
  { id: "connect", label: "Connect your mouse" },
  { id: "game-profiles", label: "Set up a game profile" },
  { id: "battery", label: "Low-battery alerts" },
  { id: "settings", label: "Start at login and updates" },
  { id: "privacy", label: "What it can and can't touch" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "beta", label: "It's a beta" },
];

function Post(): ReactNode {
  return (
    <article className="blog-article">
      <div className="blog-kicker">Release · Bridge 1.0 beta</div>
      <h1>OpenMouse Bridge is here, and Razer mice work on Windows again</h1>
      <p className="blog-dek">
        A small helper app that runs next to your browser and talks to your mouse directly, so a browser
        update can't lock it out again.
      </p>
      <p className="blog-byline">snekxs, September 23, 2026</p>

      <figure className="blog-hero-shot">
        <img
          src="/bridge-panel.png"
          alt="The OpenMouse Bridge tray panel: Ready, PRO X SUPERLIGHT 2c, default profile, 41% battery, and an Open control panel button"
          width={320}
          height={306}
        />
      </figure>

      <dl className="blog-glance">
        <div>
          <dt>Version</dt>
          <dd>1.0.0-beta.1</dd>
        </div>
        <div>
          <dt>Platforms</dt>
          <dd>Windows (x64), macOS (Intel and Apple silicon). Linux is in the works.</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>Free and open source (MIT)</dd>
        </div>
        <div>
          <dt>Needs admin?</dt>
          <dd>No</dd>
        </div>
      </dl>

      <div className="blog-tldr">
        <h3>TL;DR</h3>
        <ul>
          <li>If your Razer mouse stopped connecting on Windows after Chrome 153, install Bridge and it works again.</li>
          <li>Download it, unzip it, run it. OpenMouse finds it on its own. Nothing else changes.</li>
          <li>You can stop using the older-Chromium workaround from our last post.</li>
          <li>It also adds game profiles that switch on their own, and low-battery alerts.</li>
        </ul>
      </div>

      <h2 id="why">Why Bridge exists</h2>
      <p>
        Earlier this month we wrote about <a href="/blog-razer-windows-chrome-153.html">why every Razer mouse stopped
        connecting on Windows</a>. Short version: Chrome 153 fixed an old bug that had been letting websites reach a
        part of the mouse they were never supposed to reach. Chrome was right to fix it. But it meant that no
        website, including OpenMouse, could change a Razer mouse's settings on Windows anymore.
      </p>
      <p>
        We said the real fix was a small local helper. This is it.
      </p>

      <h2 id="what">What Bridge is</h2>
      <p>
        Bridge is a small program that sits in your system tray. When you open OpenMouse, the page checks whether
        Bridge is running. If it is, OpenMouse talks to your mouse through Bridge instead of through the browser.
        Bridge talks to the mouse the same way any normal desktop app would, so the browser's rules about which
        devices a web page can touch don't apply to it.
      </p>
      <p>
        The settings you see don't change, and the drivers don't change. The same code that runs in Chrome runs
        through Bridge, it just takes a different road to the mouse. That also means OpenMouse works in{" "}
        <strong>Firefox</strong> now, which has never supported WebHID.
      </p>

      <h2 id="install">Install it</h2>
      <ol className="blog-steps">
        <li>
          Download the zip for your computer:{" "}
          <a href={WINDOWS_ZIP_URL}>Windows</a> or <a href={MAC_ZIP_URL}>macOS</a>. Both come straight from our{" "}
          <a href={RELEASES_URL} target="_blank" rel="noreferrer">GitHub releases page</a>, next to a checksum
          file if you want to verify the download. The newest version is always on our{" "}
          <a href="/download.html">download page</a>.
        </li>
        <li>
          Unzip it somewhere you'll keep it, like your Documents folder. Keep the <code>native-hid</code> folder
          next to the app; Bridge needs it.
        </li>
        <li>
          Open <code>openmouse-bridge</code>. An OpenMouse icon shows up in your system tray (Windows) or menu bar
          (macOS). Click it to open Bridge's panel.
        </li>
      </ol>

      <div className="blog-warn">
        <h3>Your computer will probably warn you</h3>
        <p>
          This beta isn't code-signed yet, so the first time you open it, Windows shows a blue "Windows protected
          your PC" screen. Click <strong>More info</strong>, then <strong>Run anyway</strong>. On macOS, if it says
          the app can't be opened, go to <strong>System Settings → Privacy &amp; Security</strong> and click{" "}
          <strong>Open Anyway</strong>. You only have to do this once. Signed builds are on our list.
        </p>
      </div>

      <h2 id="connect">Connect your mouse</h2>
      <p>
        Click <strong>Open control panel</strong> in Bridge's panel, or go to{" "}
        <a href={CONTROL_URL} target="_blank" rel="noreferrer">control.openmouse.app</a> like you normally would.
        OpenMouse notices Bridge on its own and uses it to reach your mouse. There's nothing to pair.
      </p>
      <p>
        You'll know it worked when a <strong>Games</strong> page shows up in the sidebar. It's only there while
        Bridge is running.
      </p>

      <h2 id="game-profiles">Set up a game profile</h2>
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

      <h2 id="battery">Low-battery alerts</h2>
      <p>
        For wireless mice, Bridge checks the battery every five minutes and sends a desktop notification when it
        drops below your threshold, even when OpenMouse isn't open. It checks the mouse you last used in OpenMouse
        and any mouse you've made a game profile for.
      </p>
      <p>
        Change the threshold under <strong>Low battery alert</strong> in Bridge's <strong>Settings</strong>. It's
        20% to start with, and you won't get the same alert more than once every few hours.
      </p>

      <h2 id="settings">Start at login and updates</h2>
      <ul>
        <li>
          <strong>Launch at login</strong>, in Bridge's <strong>Settings</strong>, starts Bridge when you sign in,
          so game profiles and alerts work without you opening it first.
        </li>
        <li>
          Under <strong>Updates</strong>, Bridge can check for a new version and install it. Turn on{" "}
          <strong>Automatic updates</strong> if you want that to happen on its own. It's off by default. Every
          update is checked against a published checksum before it's installed.
        </li>
      </ul>

      <h2 id="privacy">What it can and can't touch</h2>
      <p>
        Anything that runs on your computer and talks to hardware should be clear about what it does, so here it
        is:
      </p>
      <ul>
        <li>
          It only listens on your own computer (<code>127.0.0.1</code>). Nothing on your network or the internet
          can connect to it.
        </li>
        <li>It only accepts requests from the OpenMouse site. Other websites get turned away.</li>
        <li>It only looks at mice from brands OpenMouse supports. It doesn't go through your other devices.</li>
        <li>It runs as you, not as an administrator, and doesn't install a system service or driver.</li>
        <li>
          Its logs record which commands ran and how long they took, never what was sent to the mouse, and never
          full serial numbers.
        </li>
        <li>
          All of it is open source. You can <a href={SOURCE_URL} target="_blank" rel="noreferrer">read the code</a>{" "}
          or build it yourself.
        </li>
      </ul>

      <h2 id="troubleshooting">Troubleshooting</h2>
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
      </ul>

      <h2 id="beta">It's a beta</h2>
      <p>
        It works on our machines and on our testers' machines, but there are a lot more mice out there than we
        have on our desks, and a Linux version is still in the works. If something doesn't connect, or connects
        and then acts strangely, tell us which mouse and which browser, and attach Bridge's log file if you can. On
        Windows it's in <code>%APPDATA%\OpenMouse\OpenMouse Bridge\config\logs</code>.
      </p>

      <BlogOutro>Tried it? Tell us how it went, good or bad.</BlogOutro>
    </article>
  );
}

function BlogPostPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  return (
    <div className="land-shell">
      <SiteNav locale={locale} onLocale={setLocale} />
      <div className="blog-layout">
        <BlogToc items={SECTIONS} />
        <div className="blog-main">
          <Post />
          <div className="blog-comments-wrap">
            <BlogComments slug={POST_SLUG} />
          </div>
        </div>
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
