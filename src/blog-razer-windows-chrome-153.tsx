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

const POST_SLUG = "razer-windows-chrome-153";
const CHROMIUM_BUG_URL = "https://issues.chromium.org/issues/536063911";
const WORKAROUND_ZIP_URL = "https://commondatastorage.googleapis.com/chromium-browser-snapshots/Win_x64/1669035/chrome-win.zip";

function RuledOutItem({ what, note }: { what: string; note: string }): ReactNode {
  return (
    <li>
      <b>{what}</b> <span>{note}</span>
    </li>
  );
}

function Post(): ReactNode {
  return (
    <article className="blog-article">
      <div className="blog-kicker">Incident report · WebHID</div>
      <h1>Every Razer mouse stopped connecting on Windows this week</h1>
      <p className="blog-dek">
        Not a Windows driver. Not Razer Synapse. Not anything in OpenMouse. A years-old bug in Chrome itself,
        and the fix for it, landing in Chrome 153.
      </p>
      <p className="blog-byline">OpenMouse Project, updated September 12, 2026</p>

      <dl className="blog-glance">
        <div>
          <dt>Status</dt>
          <dd className="blog-status-tag">Confirmed, upstream</dd>
        </div>
        <div>
          <dt>Affects</dt>
          <dd>Razer mice on Windows, Chrome/Chromium 153+</dd>
        </div>
        <div>
          <dt>Root cause</dt>
          <dd>A Chromium bug fix, landed between the 152 and 153 branch cuts</dd>
        </div>
        <div>
          <dt>Workaround</dt>
          <dd>A pre-153 Chromium build, for now</dd>
        </div>
      </dl>

      <div className="blog-tldr">
        <h3>TL;DR</h3>
        <ul>
          <li>Your mouse is fine. Your PC is fine. You did nothing wrong.</li>
          <li>
            A regular Chrome update (version 153) accidentally closed a door it had left open by mistake for
            years, and Razer mice happened to be using that door to talk to OpenMouse.
          </li>
          <li>It hit every Razer mouse, on every Windows PC, at the same time, which is how we know it isn't something specific to your setup.</li>
          <li>We're building a small helper app so this goes back to working like before. It's coming in the next few days.</li>
          <li>Until then, there's a temporary workaround below if you don't want to wait.</li>
        </ul>
      </div>

      <p>
        If a Razer mouse was working fine in OpenMouse a few days ago and now refuses to connect on Windows
        (DeathAdder, Viper, Basilisk, doesn't matter which), this is that bug. Here's what we ruled out, in the
        order we ruled it out, and what actually happened. If you just want the short version, the box above has it.
      </p>

      <h2>What we checked first</h2>
      <p>
        The symptom looked exactly like a Windows-side conflict: <code>chrome://device-log</code> showed{" "}
        <code>Access is denied (0x5)</code> the moment the mouse was plugged in, before any app code ran. That
        pattern usually means something else has an exclusive handle on the device, so that's where the
        investigation went first.
      </p>
      <ul className="blog-ruled-out">
        <RuledOutItem
          what="A Windows Update-reinstalled legacy Razer driver."
          note="Found and removed via pnputil. Didn't change anything."
        />
        <RuledOutItem
          what="Razer Synapse or Razer Central running in the background."
          note="No such process or service was running."
        />
        <RuledOutItem
          what="Another driver or app holding the device open."
          note="Checked with Process Explorer's handle search. Nothing had it locked."
        />
        <RuledOutItem
          what="A permissions/sandbox restriction in Chrome."
          note="Running Chrome elevated, and with --no-sandbox, changed nothing."
        />
        <RuledOutItem
          what="A regression in OpenMouse or mouse-protocol."
          note="Full history of both repos for the prior week showed no change touching this device's shape, before or after."
        />
      </ul>

      <h2>The test that actually isolated it</h2>
      <p>
        With every app- and OS-level theory eliminated, the last variable left was the browser build itself. A
        portable Chromium pinned to <strong>152.0.7977.83</strong> connected the same mouse on the same Windows
        install without any changes: same drivers, same everything else. The regular Chrome install, on{" "}
        <strong>153</strong>, still failed.
      </p>

      <div className="blog-finding">
        <h3>The actual Chromium commit</h3>
        <p>
          Chrome's own engineers titled the fix <code>Fix IsAlwaysProtected bypass on Windows</code>, and it
          landed in the source tree right between the two builds tested above. You can read their own writeup of
          it here: <a href={CHROMIUM_BUG_URL} target="_blank" rel="noreferrer">Chromium's public bug tracker</a>.
        </p>
        <p>
          <em>
            In plain terms: a small labeling mistake inside Chrome, on Windows only, has been quietly letting
            apps like OpenMouse talk to your mouse for years, when the rule was always supposed to say no.
            Chrome 153 is that mistake finally getting corrected.
          </em>
        </p>
        <blockquote>
          <p>
            On Windows, HidServiceWin synthesizes HidCollectionInfo because the raw report descriptor is
            unavailable. However, it was not assigning a collection_type, which defaulted to{" "}
            <code>kHIDCollectionTypePhysical</code> instead of <code>kHIDCollectionTypeApplication</code>.
          </p>
          <p>
            This caused <code>HasReportInAlwaysProtectedCollection</code> to return false for all reports on
            Windows, bypassing the <code>IsAlwaysProtected</code> checks…
          </p>
        </blockquote>
      </div>

      <h2>What that means in plain terms</h2>
      <p>
        WebHID has a standing rule, on every platform: pages can never read or write reports on a collection the
        browser recognizes as a plain mouse or keyboard, because that's the exact hook a keylogger would use.
        macOS and Linux can check this directly, because Chrome reads the device's real report descriptor there.
        Windows doesn't hand over the raw descriptor the same way, so Chrome fabricates a stand-in, and the code
        doing that fabrication forgot to mark the collection type correctly. The protection check quietly
        evaluated false for every device, on Windows only, for years.
      </p>
      <p>
        Razer's control channel, on the models affected here, genuinely sits on that exact protected collection
        shape. It was never actually supposed to be reachable from a browser on Windows. It worked by accident,
        because of this bug. Chrome 153 is Google correctly closing it.
      </p>

      <div className="blog-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Build</th>
              <th>Bypass present</th>
              <th>Razer connects</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>152.0.7977.83</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>153.0.8010.37</td>
              <td>No</td>
              <td>No</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Workaround, for now</h2>
      <p>
        Don't want to wait? Here's a way to get your Razer mouse working again today, no technical background
        needed: download an older version of the browser and use it just for OpenMouse.
      </p>
      <p>
        This is temporary, and it works because that older version still has the very bug that just got fixed,
        so treat it as a stopgap, not something to keep using forever.
      </p>
      <ol className="blog-steps">
        <li>
          Download this file:{" "}
          <a href={WORKAROUND_ZIP_URL} target="_blank" rel="noreferrer">chrome-win.zip</a>
          . It's hosted on <code>commondatastorage.googleapis.com</code>, Google's own storage for archived
          Chromium build snapshots &mdash; not a third-party mirror, and not something we host ourselves. You
          can check the link before clicking it: it points at an official Chromium build (revision 1669035),
          the same kind of build that later becomes a public Chrome release.
        </li>
        <li>Right-click it and choose "Extract All", to a folder you'll remember (like your Desktop).</li>
        <li>Open that folder and double-click <code>chrome.exe</code> inside it. Use OpenMouse from that window.</li>
      </ol>
      <p>It won't install anything or touch your regular Chrome. It's just a separate copy you open when you need it.</p>

      <div className="blog-warn">
        <h3>What actually fixes this long-term</h3>
        <p>
          Not a WebHID trick: the protected-collection rule is correct and Chrome is right to enforce it
          everywhere. The real fix for any Razer model confirmed on this exact collection shape is a native
          path, the same way OpenMouse already reaches an Attack Shark mouse when WebHID can't:{" "}
          <strong>OpenMouse Bridge</strong>, a small local helper the browser talks to instead of the device
          directly. We're releasing a lightweight version of this service in the coming days so Razer users can
          keep using OpenMouse exactly like before, no workaround needed.
        </p>
      </div>

      <BlogOutro>Questions, or want to hear about the fix as soon as it ships? Come find us.</BlogOutro>
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
