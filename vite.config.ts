import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import { pwa } from "./build/pwa-vite-plugin";
import { site } from "./build/site-vite-plugin";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

const packageVersion = JSON.parse(
  readFileSync(resolve(rootDir, "package.json"), "utf8"),
) as { version: string };
const buildChannel = process.env.OPENMOUSE_BUILD_CHANNEL ?? "beta";
const pages = site();

export default defineConfig({
  plugins: [pages, pwa(packageVersion.version, pages.pages)],
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
});
