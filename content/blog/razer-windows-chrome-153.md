---
title: Every Razer mouse stopped connecting on Windows this week
description: Not a Windows driver, not Razer Synapse, not anything in OpenMouse. A years-old bug in Chrome itself, and the fix for it, landing in Chrome 153.
summary: Why every Razer mouse stopped connecting on Windows around September 8, and why it's a Chrome bug fix, not a driver problem.
dek: Not a Windows driver. Not Razer Synapse. Not anything in OpenMouse. A years-old bug in Chrome itself, and the fix for it, landing in Chrome 153.
date: 2026-09-12
updated: true
author: snekxs
category: Incident reports
kicker: Incident report · WebHID
coverLabel: "153"
coverCaption: Chrome · Windows · WebHID
outro: Questions, or want to hear about the fix as soon as it ships? Come find us.
---

:::finding
**Update, September 23:** the fix is out. [Install OpenMouse Bridge](/blog/openmouse-bridge) and Razer mice connect on Windows again. The workaround below is no longer needed.
:::

:::glance
Status: Confirmed, upstream {.status}
Affects: Razer mice on Windows, Chrome/Chromium 153+
Root cause: A Chromium bug fix, landed between the 152 and 153 branch cuts
Workaround: A pre-153 Chromium build, for now
:::

:::tldr TL;DR
- Your mouse is fine. Your PC is fine. You did nothing wrong.
- A regular Chrome update (version 153) accidentally closed a door it had left open by mistake for years, and Razer mice happened to be using that door to talk to OpenMouse.
- It hit every Razer mouse, on every Windows PC, at the same time, which is how we know it isn't something specific to your setup.
- We're building a small helper app so this goes back to working like before. It's coming in the next few days.
- Until then, there's a temporary workaround below if you don't want to wait.
:::

If a Razer mouse was working fine in OpenMouse a few days ago and now refuses to connect on Windows (DeathAdder, Viper, Basilisk, doesn't matter which), this is that bug. Here's what we ruled out, in the order we ruled it out, and what actually happened. If you just want the short version, the box above has it.

## What we checked first

The symptom looked exactly like a Windows-side conflict: `chrome://device-log` showed `Access is denied (0x5)` the moment the mouse was plugged in, before any app code ran. That pattern usually means something else has an exclusive handle on the device, so that's where the investigation went first.

:::checks
- **A Windows Update-reinstalled legacy Razer driver.** Found and removed via pnputil. Didn't change anything.
- **Razer Synapse or Razer Central running in the background.** No such process or service was running.
- **Another driver or app holding the device open.** Checked with Process Explorer's handle search. Nothing had it locked.
- **A permissions/sandbox restriction in Chrome.** Running Chrome elevated, and with --no-sandbox, changed nothing.
- **A regression in OpenMouse or mouse-protocol.** Full history of both repos for the prior week showed no change touching this device's shape, before or after.
:::

## The test that actually isolated it

With every app- and OS-level theory eliminated, the last variable left was the browser build itself. A portable Chromium pinned to **152.0.7977.83** connected the same mouse on the same Windows install without any changes: same drivers, same everything else. The regular Chrome install, on **153**, still failed.

:::finding The actual Chromium commit
Chrome's own engineers titled the fix `Fix IsAlwaysProtected bypass on Windows`, and it landed in the source tree right between the two builds tested above. You can read their own writeup of it here: [Chromium's public bug tracker](https://issues.chromium.org/issues/536063911).

*In plain terms: a small labeling mistake inside Chrome, on Windows only, has been quietly letting apps like OpenMouse talk to your mouse for years, when the rule was always supposed to say no. Chrome 153 is that mistake finally getting corrected.*

> On Windows, HidServiceWin synthesizes HidCollectionInfo because the raw report descriptor is unavailable. However, it was not assigning a collection_type, which defaulted to `kHIDCollectionTypePhysical` instead of `kHIDCollectionTypeApplication`.
>
> This caused `HasReportInAlwaysProtectedCollection` to return false for all reports on Windows, bypassing the `IsAlwaysProtected` checks…
:::

## What that means in plain terms

WebHID has a standing rule, on every platform: pages can never read or write reports on a collection the browser recognizes as a plain mouse or keyboard, because that's the exact hook a keylogger would use. macOS and Linux can check this directly, because Chrome reads the device's real report descriptor there. Windows doesn't hand over the raw descriptor the same way, so Chrome fabricates a stand-in, and the code doing that fabrication forgot to mark the collection type correctly. The protection check quietly evaluated false for every device, on Windows only, for years.

Razer's control channel, on the models affected here, genuinely sits on that exact protected collection shape. It was never actually supposed to be reachable from a browser on Windows. It worked by accident, because of this bug. Chrome 153 is Google correctly closing it.

| Build | Bypass present | Razer connects |
| --- | --- | --- |
| 152.0.7977.83 | Yes | Yes |
| 153.0.8010.37 | No | No |

## Workaround, for now

Don't want to wait? Here's a way to get your Razer mouse working again today, no technical background needed: download an older version of the browser and use it just for OpenMouse.

This is temporary, and it works because that older version still has the very bug that just got fixed, so treat it as a stopgap, not something to keep using forever.

1. Download this file: [chrome-win.zip](https://commondatastorage.googleapis.com/chromium-browser-snapshots/Win_x64/1669035/chrome-win.zip). It's hosted on `commondatastorage.googleapis.com`, Google's own storage for archived Chromium build snapshots &mdash; not a third-party mirror, and not something we host ourselves. You can check the link before clicking it: it points at an official Chromium build (revision 1669035), the same kind of build that later becomes a public Chrome release.
2. Right-click it and choose "Extract All", to a folder you'll remember (like your Desktop).
3. Open that folder and double-click `chrome.exe` inside it. Use OpenMouse from that window.

It won't install anything or touch your regular Chrome. It's just a separate copy you open when you need it.

:::warn What actually fixes this long-term
Not a WebHID trick: the protected-collection rule is correct and Chrome is right to enforce it everywhere. The real fix for any Razer model confirmed on this exact collection shape is a native path, the same way OpenMouse already reaches an Attack Shark mouse when WebHID can't: **OpenMouse Bridge**, a small local helper the browser talks to instead of the device directly. We're releasing a lightweight version of this service in the coming days so Razer users can keep using OpenMouse exactly like before, no workaround needed.
:::
