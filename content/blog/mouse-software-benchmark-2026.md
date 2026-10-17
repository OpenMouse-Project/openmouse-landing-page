---
title: How much does mouse software use? Four Windows apps measured
description: We measured startup, memory, active CPU, and install size for OpenMouse Desktop, SteelSeries GG, Logitech G HUB, and Razer Synapse on one Windows PC.
summary: A measured comparison of four mouse apps on one Windows PC, with the process counting method and limits behind the numbers.
date: 2026-10-17
author: snekxs
category: Announcements
kicker: Benchmark · Windows
coverLabel: Benchmark
coverCaption: Four apps · One Windows PC
socialImage: /benchmark-startup.jpg
socialImageAlt: Startup time comparison for OpenMouse Desktop, Logitech G HUB, Razer Synapse, and SteelSeries GG
toc: true
outro: Have a different result on your PC? Tell us what you measured and how.
---

:::tldr The short version
- On our test PC, OpenMouse Desktop reached its first responsive window in **0.26 seconds** and occupied **67.1 MB** in its program folder.
- After three minutes minimized, its process family averaged **94 MB of summed working set**. During a minute of page navigation, it averaged **0.18% of this PC's 12 logical core CPU capacity**.
- These are measurements from one Windows setup, not a promise that every PC will show the same numbers. The memory figure adds the working sets of an app's helpers and services, so it is not unique physical RAM use.
:::

We ran the same benchmark against SteelSeries GG, Logitech G HUB, Razer Synapse, and OpenMouse Desktop. The four cards below show the headline results. We also want to make the counting method clear, especially for memory: someone looking at one process in Task Manager can reasonably see a much smaller number.

:::finding Results vary from PC to PC
Yes, your numbers can be different. CPU model and core count, Windows version, installed devices, app version, optional modules, background services, cached memory, and the exact pages you open all affect a run. This is one PC measured with one defined method. Compare the method and process scope before comparing the figures.
:::

## Test machine and scope

The measurements were taken on **October 16, 2026** on a Windows 11 Home PC with an **AMD Ryzen 5 5600X** (6 physical cores, 12 logical processors) and about **32 GiB of installed memory**. CPU percentages below are shares of all 12 logical processors. On this scale, one logical processor held fully busy for a whole sample would be about **8.33%**, not 100%.

| Software | Version measured | What the version identifies |
| --- | --- | --- |
| OpenMouse Desktop | 0.0.29 | Desktop app |
| SteelSeries GG | 121.0.0 | GG app |
| Logitech G HUB | 2026.6.981214 | G HUB app, as shown on its Updates page |
| Razer Synapse | 4.0.86.2610120714 | Synapse app, as shown on its About page |

The Synapse app version differs from its `app-4.0.827` engine folder name. G HUB was still on **2026.6.981214** after a reinstall on this PC, so the G HUB result does not describe a later release. Installed devices, optional modules, and background services were left in their normal state. We did not force every app into an identical feature set, and did not reboot Windows between apps.

## The results

| App | First responsive window | Idle working set | Active working set | Active CPU | Program files |
| --- | ---: | ---: | ---: | ---: | ---: |
| OpenMouse Desktop | 0.26 s | 94 MB | 155 MB | 0.18% | 67.1 MB |
| Logitech G HUB | 0.77 s | 866 MB | 971 MB | 1.56% | 628 MB |
| Razer Synapse | 2.03 s | 1,582 MB | 2,132 MB | 3.15% | 718 MB |
| SteelSeries GG | 2.07 s | 1,215 MB | 1,456 MB | 1.25% | 1,300 MB |

Memory and disk figures in this table use decimal MB to match the cards. The [sample data](/benchmarks/peripheral-apps-2026-10-16.json) retains the measured memory values in MiB, CPU readings to three decimal places, and a separate process breakdown from the saved startup trials. **1 MiB is 1,048,576 bytes; 1 MB is 1,000,000 bytes.** That is why the memory card's 94 MB for OpenMouse corresponds to 89.6 MiB in the raw result.

The figures answer different questions. **Startup** is time to a responsive window. **Memory** is the summed working set of the app's processes, not unique RAM ownership. **CPU** is time consumed by those processes while we used the interface. **Program files** are installed bytes on disk, not download size. Treat the rows as observations from this setup rather than hardware requirements or guaranteed results on another PC.

## Startup time

![Startup time card comparing OpenMouse at 0.26 seconds, G HUB at 0.77, Synapse at 2.03, and SteelSeries GG at 2.07](/benchmark-startup.jpg)

*Time from launching the app to its first responsive main window.*

We started a stopwatch immediately before launching the app executable. About every **100 milliseconds**, the script checked the matching main process for a nonzero window handle and a responsive Windows window. The time at the first successful check is the startup result. It does **not** mean that online content, device scans, or every page image had finished loading.

OpenMouse, G HUB, and Synapse use the median of three launch trials. Their measured ranges were **0.260–0.273 s**, **0.725–0.787 s**, and **1.964–2.210 s**, respectively. SteelSeries GG has one measured launch at **2.074 s**. Before each trial, the script tried to stop the matching app processes and waited two seconds. G HUB and Synapse kept some background services resident between UI launches. The numbers therefore describe opening the main window under these conditions, not a reboot-level cold start of every service.

## Memory after settling and during use

![Memory card comparing minimized idle and active working sets for all four apps](/benchmark-memory.jpg)

*The light bar is the mean after three minutes minimized; the dark bar is the mean during 60 seconds of navigation.*

For each app, we minimized the main window, confirmed it was minimized, waited **180 seconds**, then took **120 one-second samples**. We restored the window and took **60 one-second samples** while clicking through its pages and settings. The card converts the measured MiB to decimal MB. For example, OpenMouse's idle mean was **89.6 MiB**, which is about **94 MB**.

The full precision figures, before conversion for the card, were:

| App | Idle mean | Idle peak | Active mean | Active peak |
| --- | ---: | ---: | ---: | ---: |
| OpenMouse Desktop | 89.6 MiB | 90.0 MiB | 147.7 MiB | 205.4 MiB |
| SteelSeries GG | 1,158.9 MiB | 1,163.6 MiB | 1,388.3 MiB | 1,583.9 MiB |
| Logitech G HUB | 825.6 MiB | 829.0 MiB | 926.2 MiB | 1,178.2 MiB |
| Razer Synapse | 1,508.9 MiB | 1,510.9 MiB | 2,033.7 MiB | 2,378.4 MiB |

Each mean is the arithmetic average of the 120 idle or 60 active samples. Each peak is the largest single sample in that window. We read each process's Windows `WorkingSet64` value and added every matched instance in the app family. This includes renderers, helpers, tray processes, and related services. It is more complete than reading one main process, but shared pages may be counted in more than one process. The sum is **not** the amount of unique RAM that would be freed by closing the app, and it is not the app's private memory figure.

The saved startup snapshots help explain the larger totals. These are separate snapshots taken about 15 seconds after launch, **not** the three-minute settled averages:

| App | Matched processes | Largest groups in the startup snapshot |
| --- | ---: | --- |
| OpenMouse Desktop | 1 | `openmouse-gpui`: 85.6 MiB |
| SteelSeries GG | 13 | 8 `SteelSeriesGGClient` processes: 880.2 MiB; launcher: 182.8 MiB; Engine: 84.5 MiB; GG, Moments, and Prism: 120.3 MiB |
| G HUB | 10 | 6 `lghub` processes: 679.1 MiB; agent: 109.4 MiB; tray: 91.0 MiB; updater and lighting service: 49.6 MiB |
| Synapse | 15 | 12 `RazerAppEngine` processes: 1,872.7 MiB; Game Manager: 140.0 MiB; elevation and monitor services: 25.6 MiB |

A reader comparing only the main `RazerAppEngine` process, for example, will not get our family total. A different PC may also launch fewer renderer processes or have different cached pages, devices, or modules. Summed working set is a defined comparison metric here, not a claim that Synapse uniquely reserved 1.5 GiB of physical RAM at idle.

## CPU while navigating

![Active CPU card comparing OpenMouse at 0.18 percent, SteelSeries GG at 1.25, G HUB at 1.56, and Synapse at 3.15](/benchmark-active-cpu.jpg)

*Mean CPU share during 60 seconds of navigation, normalized to the test PC's 12 logical cores.*

The active run included page loads and settings navigation in each app. OpenMouse also rescanned for devices. We sampled the cumulative CPU seconds reported for each matched process and compared consecutive readings for the **same process ID**. We added the positive changes, divided by the actual elapsed time between snapshots and by 12 logical cores, then multiplied by 100. In short: `100 × family CPU seconds ÷ (elapsed seconds × 12)`. A one-second value of **12%** means the matched processes used about 12% of the whole machine's available CPU time during that interval, equivalent to about 1.44 logical processors held fully busy for that second.

The active CPU distribution shows how much short page-load bursts matter:

| App | Mean | Median | 95th percentile | Highest one-second sample |
| --- | ---: | ---: | ---: | ---: |
| OpenMouse Desktop | 0.182% | 0.129% | 0.640% | 2.183% |
| SteelSeries GG | 1.252% | 0.000% | 7.316% | 14.219% |
| Logitech G HUB | 1.557% | 0.000% | 7.609% | 26.300% |
| Razer Synapse | 3.150% | 0.128% | 13.635% | 44.634% |

There were **60 active one-second samples per app**. A low median alongside a higher mean means many seconds were quiet and a few page loads used more CPU. The apps expose different pages and features, so this is a practical click-through on each app rather than an identical task performed by all four. The one-minute means should not be read as a prediction of a full gaming session.

Idle CPU was low for every app after settling: **0.138%** for OpenMouse, **0.016%** for SteelSeries GG, **0.020%** for G HUB, and **0.015%** for Synapse. Their highest idle one-second samples were **1.028%**, **0.515%**, **0.384%**, and **0.259%**, respectively. These are two-minute windows, not a claim of literally zero CPU activity. Individual one-second samples sometimes read zero because CPU time advanced by less than the counter's resolution.

## Install size

![Install size card comparing OpenMouse at 67.1 MB, G HUB at 628 MB, Synapse at 718 MB, and SteelSeries GG at 1,300 MB](/benchmark-install-size.jpg)

*Total files in the installed program folders, in decimal MB. User data and caches are excluded.*

We recursively summed the sizes of files in the installed program folders, then divided by **1,000,000** to display decimal MB. We did not count user profiles, downloaded game data, or caches. The folders were:

| App | Folders counted |
| --- | --- |
| OpenMouse Desktop | `%LOCALAPPDATA%\Programs\OpenMouse Desktop` |
| SteelSeries GG | `C:\Program Files\SteelSeries\GG` |
| Logitech G HUB | `C:\Program Files\LGHUB` |
| Razer Synapse | `C:\Program Files\Razer` and `C:\Program Files (x86)\Razer` |

This is disk space in those folders, not installer download size. The Razer total includes related services and setup files. **The OpenMouse figure covers the Desktop program folder only; the separately downloaded OpenMouse Bridge is not in that 67.1 MB.** Bridge was also only counted in CPU and memory when its process was running. Folder contents can differ by version, installed modules, and updates, so these four program-folder totals are useful snapshots rather than complete vendor-by-vendor disk accounting.

## How we tested

We tested one app at a time on the same Windows PC. The startup trials and disk measurements came first. We later repeated idle and active sampling after the initial idle results raised questions about whether every window had truly settled while minimized. This is the sequence for the reported rerun:

1. Stop the matching processes we could stop and open the app's main window. Some vendor services remained resident. Other apps were closed where possible; the CPU and memory sampler only included processes whose names matched the app being measured.
2. Use Computer Use to click the window's **Minimize** control. Query the window again and verify Windows reports it minimized. This checks the window state instead of assuming a minimized launch option worked.
3. Leave the app untouched for **180 seconds**. Then take **120 snapshots**, about one per second, while the window stays minimized. Record cumulative CPU seconds by process ID and sum `WorkingSet64` across every matching process at each snapshot.
4. Restore the same window. Start a **60-snapshot** active run and click through the app's own pages. Record CPU and memory with the same process filter and formula.
5. Calculate the arithmetic mean of each run, plus its highest one-second reading. The CPU tables also show the median and 95th percentile. We did not subtract a baseline for unrelated Windows activity because unrelated processes were outside each app's filter.

The active pages were:

- **OpenMouse:** Games, supported mice, Settings, Overview, and a device rescan.
- **SteelSeries GG:** Engine, Aim Tools, News, Game Detection, and About and Privacy.
- **G HUB:** Games, Community, Profiles, General Settings, Updates, and About.
- **Synapse:** Gamer Room, Devices & Modules, Global Shortcuts, Macro, Linked Games, and settings.

We did not change device settings. A page load or scan that happened during the active minute is included in its CPU and memory average. The same navigation cannot be repeated across all four apps because they have different features. The sampling loop slept for one second between snapshots; process enumeration took some extra time, so the CPU calculation used the actual elapsed time between each pair rather than assuming every interval was exactly one second.

### Processes and services counted

At every sample we looked for these Windows process names. Every matching instance contributed its CPU time and working set, including a helper or service that remained in the background. A name contributed nothing when that component was not running.

- **OpenMouse:** `openmouse-gpui` and `openmouse-bridge`.
- **SteelSeries GG:** every name beginning with `SteelSeries` (including `SteelSeriesGGEZ`, `SteelSeriesGGClient`, `SteelSeriesGG`, `SteelSeriesEngine`, `SteelSeriesMoments`, and `SteelSeriesPrism`), plus `SSOverlay`, `SSHZExecutor`, `AudioSync`, `gamesense-discord-x64`, and `now-playing`.
- **G HUB:** every name beginning with `lghub` (including the main app, `lghub_agent`, `lghub_system_tray`, and `lghub_updater`), plus `logi_crashpad_handler` and `logi_lamparray_service.AMD64`.
- **Synapse:** every `RazerAppEngine` instance, plus `RzEngineMon`, `RzHandle`, `RzPowerTool`, `RzSecurityTool`, `razer_elevation_service`, and `GameManagerService3`.

The memory number is the sum of `WorkingSet64` from those processes. CPU is the sum of their changes in cumulative processor time, divided by elapsed time and the PC's 12 logical cores. A newly seen process contributes its CPU time reported at its first snapshot; a process that exits between snapshots can leave work that this polling method does not capture. Startup and install size came from earlier trials on the same PC; only idle and active CPU and memory were rerun with the confirmed minimized window.

### What the data can and cannot prove

The [downloadable JSON](/benchmarks/peripheral-apps-2026-10-16.json) contains the 120 idle and 60 active CPU samples for every app, their CPU summaries, the mean and peak working-set totals, and the process groups from separate startup snapshots. It does **not** contain every process's RAM value at every second, device settings, or GPU memory. A one-minute active sample captures the specific navigation we performed, including short bursts, and cannot tell you long-session averages or how the apps behave on every supported device.

We did not independently measure power draw, system responsiveness, private working set, committed memory, or how many bytes Windows would reclaim after closing each app. The working-set sums can count shared pages more than once. For startup, resident background services make the result a UI launch with those services present; for disk, the folder totals do not cover every possible companion download. These limits are why we publish the measurement definition alongside the comparison.

## How to compare your PC

These measurements were made on **October 16, 2026**, on one Windows PC with **12 logical CPU cores**. The tested versions were OpenMouse Desktop **0.0.29**, SteelSeries GG **121.0.0**, Logitech G HUB **2026.6.981214**, and Razer Synapse **4.0.86.2610120714**. G HUB was still on 2026.6 on this PC after a reinstall, so its result is not a measurement of a later release.

If your Task Manager number is smaller, check whether you are viewing one process or the whole app family, and whether the column shows working set or private memory. Then compare the same app version and a similarly settled minimized window. Your devices, enabled modules, background services, and cached pages can all change the result. The [sample data](/benchmarks/peripheral-apps-2026-10-16.json) includes the one-second CPU samples and the CPU and working-set summaries behind this post.
