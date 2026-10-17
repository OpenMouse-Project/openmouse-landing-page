import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { mountOfflineBanner } from "../platform/offline-banner";
import { registerServiceWorker } from "../platform/register-sw";

export function readPageData<T>(): T {
  return JSON.parse(document.getElementById("page-data")?.textContent ?? "{}") as T;
}

export function mountPage<P extends object>(Page: ComponentType<P>, props: P): void {
  if (typeof document === "undefined") return;
  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) throw new Error("OpenMouse could not find the page root #app.");
  createRoot(root).render(<Page {...props} />);
  registerServiceWorker();
  mountOfflineBanner();
}
