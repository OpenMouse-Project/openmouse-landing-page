---
title: OpenMouse Bridge is here, and Razer mice work on Windows again
description: A small helper app that runs next to your browser and talks to your mouse directly, so a browser update can't lock it out again.
summary: OpenMouse Bridge is a small, free helper app that lets OpenMouse reach your mouse directly. It gets Razer mice working on Windows again after Chrome 153.
date: 2026-09-23
author: snekxs
category: Announcements
kicker: Release · Bridge
cover: /bridge-panel.png
coverLabel: Bridge
coverCaption: Windows · macOS · Linux
hero: /bridge-panel.png
heroAlt: "The OpenMouse Bridge tray panel: Ready, PRO X SUPERLIGHT 2c, default profile, 41% battery, and an Open control panel button"
toc: true
outro: Tried it? Tell us how it went, good or bad.
---

:::glance
Platforms: Windows (x64), macOS (Intel and Apple silicon), Linux (x86-64)
Price: Free and open source (MIT)
Needs admin?: No (on Linux, it asks once to reach your mouse)
:::

:::tldr TL;DR
- If your Razer mouse stopped connecting on Windows after Chrome 153, install Bridge and it works again.
- Download it, install it, run it. OpenMouse finds it on its own. Nothing else changes.
- You can stop using the older-Chromium workaround from our last post.
- It also adds game profiles that switch on their own, and low-battery alerts.
:::

## Why Bridge exists {#why}

Earlier this month we wrote about [why every Razer mouse stopped connecting on Windows](/blog/razer-windows-chrome-153). Short version: Chrome 153 fixed an old bug that had been letting websites reach a part of the mouse they were never supposed to reach. Chrome was right to fix it. But it meant that no website, including OpenMouse, could change a Razer mouse's settings on Windows anymore.

We said the real fix was a small local helper. This is it.

## What Bridge is {#what}

Bridge is a small program that sits in your system tray. When you open OpenMouse, the page checks whether Bridge is running. If it is, OpenMouse talks to your mouse through Bridge instead of through the browser. Bridge talks to the mouse the same way any normal desktop app would, so the browser's rules about which devices a web page can touch don't apply to it.

The settings you see don't change, and the drivers don't change. The same code that runs in Chrome runs through Bridge, it just takes a different road to the mouse. That also means OpenMouse works in **Firefox** now, which has never supported WebHID.

## Install it {#install}

We've opened the steps for your system. Pick another one if you're installing Bridge somewhere else.

:::platforms
:::windows
1. Download the installer:

   :::downloads
   windows: https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest/download/OpenMouse-Bridge-windows-x64-setup.exe
   :::

   :::note
   Straight from our [GitHub releases](https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest), with a checksum if you want to verify it. The newest version is always on our [download page](/download).
   :::
2. Run it and follow the prompts. It installs Bridge for your account only, so it doesn't need administrator access, and adds it to the Start menu.
3. Open OpenMouse Bridge from the Start menu. An OpenMouse icon shows up in your system tray (it may be tucked behind the **^** arrow). Click it to open Bridge's panel.

:::warn Windows will probably warn you
Bridge isn't code-signed yet, so the first time you open it, Windows shows a blue "Windows protected your PC" screen. Click **More info**, then **Run anyway**. You only have to do this once.
:::
:::
:::macos
1. Download the disk image. It runs on Intel and Apple silicon Macs:

   :::downloads
   macos: https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest/download/OpenMouse-Bridge-macos-universal.dmg
   :::

   :::note
   Straight from our [GitHub releases](https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest), with a checksum if you want to verify it. The newest version is always on our [download page](/download).
   :::
2. Open the disk image and drag OpenMouse Bridge into Applications.
3. Launch OpenMouse Bridge from Applications. An OpenMouse icon shows up in your menu bar. Click it to open Bridge's panel.

:::warn macOS will probably warn you
Bridge isn't code-signed yet, so macOS won't open it with a double-click the first time. Right-click OpenMouse Bridge in Applications and choose **Open**, then confirm. You only have to do this once.
:::
:::
:::linux
1. The easiest way is one line in a terminal:

   ```sh
   curl -fsSL https://openmouse.app/bridge/download/install-linux.sh | bash
   ```

   It installs any system libraries Bridge is missing (asking for your password), lets your account reach your mouse, starts Bridge when you sign in, and adds it to your app launcher.
2. Or download the AppImage, make it executable (`chmod +x OpenMouse-Bridge-linux-x86_64.AppImage`) and open it. If Bridge can't reach your mouse, its panel shows a **Fix permissions** button that sets up access after asking for your password.

   :::downloads
   linux: https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest/download/OpenMouse-Bridge-linux-x86_64.AppImage
   :::

   :::note
   Straight from our [GitHub releases](https://github.com/OpenMouse-Project/OpenMouse-Bridge/releases/latest), with a checksum if you want to verify it.
   :::
3. An OpenMouse icon shows up in your system tray on KDE Plasma and other desktops with tray icons. Click it to open Bridge's panel. GNOME needs a tray extension such as AppIndicator to show the icon; without one, Bridge's panel stays open as a regular window.
:::
:::

## Connect your mouse {#connect}

Click **Open control panel** in Bridge's panel, or go to [control.openmouse.app](https://control.openmouse.app) like you normally would. OpenMouse notices Bridge on its own and uses it to reach your mouse. There's nothing to pair.

You'll know it worked when a **Games** page shows up in the sidebar. It's only there while Bridge is running.

## Set up a game profile {#game-profiles}

A game profile is a set of mouse settings (DPI, polling rate, buttons, whatever your mouse supports) that Bridge applies when that game is running, and takes back off when it closes.

1. In the control panel, open **Games** from the sidebar and click the game you want.
2. Under **Target device**, click **Select** next to the mouse this profile is for.
3. Change the settings you want in the **Settings** section below. These only go into this game's profile; your mouse keeps its current settings until the game launches. The card at the top counts how many settings you've customized.
4. Turn on **Apply automatically**. Back on the Games page, that game's tile now has an **Auto** badge.
5. Launch the game. Bridge applies the profile and shows a small notice with the game's name and what changed, like "1600 DPI · 1000 Hz". When you close the game, your normal settings come back.

You don't need the control panel open for any of this. Once a profile is saved, Bridge handles it in the background. To start over, open the game and click **Clear**.

:::finding Game not in the list?
Bridge recognizes games from a shared list that's updated on its own. If yours is missing, tell us on Discord or GitHub, or add it to the [games list](https://github.com/OpenMouse-Project/Desktop/blob/main/public/games.json) yourself.
:::

## Low-battery alerts {#battery}

For wireless mice, Bridge checks the battery every five minutes and sends a desktop notification when it drops below your threshold, even when OpenMouse isn't open. It checks the mouse you last used in OpenMouse and any mouse you've made a game profile for.

Change the threshold under **Low battery alert** in Bridge's **Settings**. It's 20% to start with, and you won't get the same alert more than once every few hours.

## Start at login and updates {#settings}

- **Launch at login**, in Bridge's **Settings**, starts Bridge when you sign in, so game profiles and alerts work without you opening it first.
- Under **Updates**, Bridge can check for a new version and install it. Turn on **Automatic updates** if you want that to happen on its own. It's off by default. Every update is checked against a published checksum before it's installed.

## What it can and can't touch {#privacy}

Anything that runs on your computer and talks to hardware should be clear about what it does, so here it is:

- It only listens on your own computer (`127.0.0.1`). Nothing on your network or the internet can connect to it.
- It only accepts requests from the OpenMouse site. Other websites get turned away.
- It only looks at mice from brands OpenMouse supports. It doesn't go through your other devices.
- It runs as you, not as an administrator, and doesn't install a system service or driver.
- Its logs record which commands ran and how long they took, never what was sent to the mouse, and never full serial numbers.
- All of it is open source. You can [read the code](https://github.com/OpenMouse-Project/OpenMouse-Bridge) or build it yourself.

## Troubleshooting {#troubleshooting}

:::checks
- **There's no Games page in the sidebar.** Bridge isn't running, or the page opened before it did. Start Bridge, then reload the control panel.
- **"Could not reach OpenMouse Bridge."** Bridge was closed while you were editing a profile. Start it again and retry.
- **The profile didn't apply when the game started.** Check the game's tile has the Auto badge and that the right mouse is selected under Target device.
- **It doesn't work in Safari.** Safari isn't supported yet. Use Chrome, Edge, or Firefox.
:::

## Something not working? {#feedback}

There are a lot more mice out there than we have on our desks. If something doesn't connect, or connects and then acts strangely, tell us which mouse and which browser, and attach Bridge's log file if you can. On Windows it's in `%APPDATA%\OpenMouse\OpenMouse Bridge\config\logs`.
