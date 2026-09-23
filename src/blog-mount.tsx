import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { mountOfflineBanner } from "./offline-banner";
import { registerServiceWorker } from "./register-sw";

/**
 * Mounts a blog page into its root. The build pre-renders every blog page
 * into its HTML (see build/blog-prerender.ts), so there is already markup
 * in the root here: Preact adopts those nodes rather than starting from
 * blank. At build time there is no DOM, so this does nothing and the
 * module can be imported just for its default-exported page component.
 */
export function mountBlogPage(Page: ComponentType, rootSelector: string): void {
  if (typeof document === "undefined") return;
  const root = document.querySelector<HTMLDivElement>(rootSelector);
  if (!root) {
    throw new Error(`OpenMouse could not find the blog root ${rootSelector}.`);
  }
  createRoot(root).render(<Page />);
  registerServiceWorker();
  mountOfflineBanner();
}
