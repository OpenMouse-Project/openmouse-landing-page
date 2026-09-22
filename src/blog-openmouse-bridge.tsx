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

const POST_SLUG = "openmouse-bridge";
const RELEASES_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest";
const WINDOWS_ZIP_URL = `${RELEASES_URL}/download/openmouse-bridge-windows-x64.zip`;
const MAC_ZIP_URL = `${RELEASES_URL}/download/openmouse-bridge-macos-universal.zip`;
const SOURCE_URL = "https://github.com/OpenMouse-Project/OpenMouse-Bridge";
const CONTROL_URL = "https://control.openmouse.app";

function Post(): ReactNode {
  return (
    <article className="blog-article">
      <div className="blog-kicker">Release · Bridge 1.0 beta</div>
      <h1>OpenMouse Bridge is here, and Razer mice work on Windows again</h1>
      <p className="blog-dek">
        A small helper app that runs next to your browser and talks to your mouse directly, so a browser
        update can't lock it out again.
      </p>
      <p className="blog-byline">OpenMouse Project, September 23, 2026</p>

      <dl className="blog-glance">
        <div>
          <dt>Version</dt>
          <dd>1.0.0-beta.1</dd>
        </div>
        <div>
          <dt>Platforms</dt>
          <dd>Windows (x64), macOS (Intel and Apple silicon)</dd>
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
          <li>It also adds per-game profiles and low-battery alerts.</li>
        </ul>
      </div>

      <p>
        Earlier this month we wrote about <a href="/blog-razer-windows-chrome-153.html">why every Razer mouse stopped
        connecting on Windows</a>. Short version: Chrome 153 fixed an old bug that had been letting websites reach a
        part of the mouse they were never supposed to reach. Chrome was right to fix it. But it meant that no
        website, including OpenMouse, could change a Razer mouse's settings on Windows anymore.
      </p>
      <p>
        We said the real fix was a small local helper. This is it.
      </p>

      <h2>What Bridge is</h2>
      <p>
        Bridge is a small program that sits in your system tray. When you open OpenMouse, the page checks whether
        Bridge is running. If it is, OpenMouse talks to your mouse through Bridge instead of through the browser.
        Bridge talks to the mouse the same way any normal desktop app would, so the browser's rules about which
        devices a web page can touch don't apply to it.
      </p>
      <p>
        The settings you see don't change, and the drivers don't change. The same code that runs in Chrome runs
        through Bridge, it just takes a different road to the mouse.
      </p>

      <h2>Install it</h2>
      <ol className="blog-steps">
        <li>
          Download the zip for your computer:{" "}
          <a href={WINDOWS_ZIP_URL}>Windows</a> or <a href={MAC_ZIP_URL}>macOS</a>. Both come straight from our{" "}
          <a href={RELEASES_URL} target="_blank" rel="noreferrer">GitHub releases page</a>, next to a checksum
          file if you want to verify the download.
        </li>
        <li>Unzip it somewhere you'll keep it, like your Documents folder. Keep the <code>native-hid</code> folder next to the app.</li>
        <li>
          Run <code>openmouse-bridge</code>. An OpenMouse icon shows up in your system tray (Windows) or menu bar
          (macOS).
        </li>
        <li>
          Open <a href={CONTROL_URL} target="_blank" rel="noreferrer">control.openmouse.app</a> like you normally
          would. It connects through Bridge automatically.
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

      <p>
        Bridge can start itself when you log in, and can update itself when a new version comes out. Both are
        switches in its tray panel. Automatic updates are off unless you turn them on.
      </p>

      <h2>What else it does</h2>
      <p>
        Since Bridge is running in the background anyway, it picks up a couple of things a web page can't do on its
        own:
      </p>
      <ul>
        <li>
          <strong>Game profiles.</strong> Give a game its own DPI, polling rate, buttons and so on. Bridge notices
          when the game launches, applies them, and puts your normal settings back when you close it. You set these
          up in the Games page in OpenMouse.
        </li>
        <li>
          <strong>Low-battery alerts.</strong> Bridge checks your wireless mouse's battery every few minutes and
          sends a desktop notification when it gets low, even when OpenMouse isn't open. You pick the threshold.
        </li>
        <li>
          <strong>Firefox.</strong> Firefox has never supported WebHID, so OpenMouse never worked there. With Bridge
          running, it does.
        </li>
      </ul>

      <h2>What it can and can't touch</h2>
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

      <h2>It's a beta</h2>
      <p>
        It works on our machines and on our testers' machines, but there are a lot more mice out there than we
        have on our desks. Safari and Linux aren't supported yet. If something doesn't connect, or connects and
        then acts strangely, tell us which mouse and which browser, and attach Bridge's log file if you can. On
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
