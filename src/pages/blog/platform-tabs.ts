import { detectOs } from "../../shared/detect-os";

/** detectOs() names the platforms a little differently from the blog's tabs. */
const TAB_FOR_OS = { windows: "windows", mac: "macos", linux: "linux" } as const;

/** Shows one platform in a :::platforms block and hides the rest. */
function select(block: HTMLElement, platform: string, focus = false): void {
  const tabs = block.querySelectorAll<HTMLButtonElement>('[role="tab"]');
  if (![...tabs].some((tab) => tab.dataset.platform === platform)) return;
  for (const tab of tabs) {
    const selected = tab.dataset.platform === platform;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  }
  for (const panel of block.querySelectorAll<HTMLElement>('[role="tabpanel"]')) {
    panel.hidden = panel.dataset.platform !== platform;
  }
}

/**
 * Wires up every :::platforms block under `root`: opens the visitor's own OS,
 * and switches on click or with the arrow, Home and End keys. Picking a
 * platform in one block picks it in every block on the page. Returns a
 * function that removes the listeners.
 */
export function setupPlatformTabs(root: HTMLElement): () => void {
  const blocks = [...root.querySelectorAll<HTMLElement>("[data-platforms]")];
  if (blocks.length === 0) return () => undefined;
  const os = detectOs();
  if (os) for (const block of blocks) select(block, TAB_FOR_OS[os]);

  const onClick = (event: MouseEvent): void => {
    const tab = (event.target as Element).closest<HTMLButtonElement>("[data-platforms] [role='tab']");
    if (!tab?.dataset.platform) return;
    for (const block of blocks) select(block, tab.dataset.platform);
  };
  const onKey = (event: KeyboardEvent): void => {
    const tab = (event.target as Element).closest<HTMLButtonElement>("[data-platforms] [role='tab']");
    const block = tab?.closest<HTMLElement>("[data-platforms]");
    if (!tab || !block) return;
    const tabs = [...block.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const index = tabs.indexOf(tab);
    const next =
      event.key === "ArrowRight" ? tabs[(index + 1) % tabs.length]
      : event.key === "ArrowLeft" ? tabs[(index - 1 + tabs.length) % tabs.length]
      : event.key === "Home" ? tabs[0]
      : event.key === "End" ? tabs[tabs.length - 1]
      : null;
    if (!next?.dataset.platform) return;
    event.preventDefault();
    for (const other of blocks) select(other, next.dataset.platform, other === block);
  };
  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKey);
  };
}
