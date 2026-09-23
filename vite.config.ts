import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import { pwa } from "./build/pwa-vite-plugin";
import { sites } from "./build/sites-vite-plugin";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

const packageVersion = JSON.parse(
  readFileSync(resolve(rootDir, "package.json"), "utf8"),
) as { version: string };
const buildChannel = process.env.OPENMOUSE_BUILD_CHANNEL ?? "beta";

// This repo builds only the standalone marketing site (openmouse.app). The
// gated control app (control.openmouse.app) lives in the separate openmouse
// repo (control-panel branch) — see build/sites-vite-plugin.ts for the
// _redirects file that routes the root request to landing.html.
export default defineConfig({
  plugins: [sites(), pwa(packageVersion.version)],
  resolve: {
    // Prefix aliases, so react-dom/client and react/jsx-runtime follow too.
    alias: {
      react: "preact/compat",
      "react-dom": "preact/compat",
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageVersion.version),
    __BUILD_CHANNEL__: JSON.stringify(buildChannel),
  },
  build: {
    rollupOptions: {
      input: {
        // These three are public support/info pages that belong on the
        // marketing domain (openmouse.app). contribute.html was retired in
        // favor of docs.openmouse.app (see sites-vite-plugin.ts for the
        // redirect).
        landing: resolve(__dirname, "landing.html"),
        faq: resolve(__dirname, "faq.html"),
        check: resolve(__dirname, "check.html"),
        supported: resolve(__dirname, "supported.html"),
        donate: resolve(__dirname, "donate.html"),
        blog: resolve(__dirname, "blog.html"),
        "blog-razer-windows-chrome-153": resolve(__dirname, "blog-razer-windows-chrome-153.html"),
        download: resolve(__dirname, "download.html"),
        "blog-openmouse-bridge": resolve(__dirname, "blog-openmouse-bridge.html"),
        "blog-bridge-setup-guide": resolve(__dirname, "blog-bridge-setup-guide.html"),
        privacy: resolve(__dirname, "privacy.html"),
        terms: resolve(__dirname, "terms.html"),
      },
    },
  },
});
