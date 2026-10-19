import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { h, type ComponentType } from "preact";
import { renderToString } from "preact-render-to-string";
import { createServer, normalizePath, type Plugin, type ViteDevServer } from "vite";
import { REDIRECTS, renderRedirects, renderShell, renderSitemap } from "./pages.ts";
import { BLOG_DIR, sitePages, type SitePage } from "./site.ts";

type ModuleLoader = (url: string) => Promise<Record<string, unknown>>;

async function renderPage(page: SitePage, load: ModuleLoader): Promise<string> {
  if (!page.prerender) return renderShell(page);
  const mod = (await load(page.entry)) as { default?: ComponentType<Record<string, unknown>> };
  if (!mod.default) throw new Error(`${page.entry} must export default its page component`);
  const props = { ...(page.data as Record<string, unknown> | undefined), html: page.html };
  return renderShell(page, renderToString(h(mod.default, props)));
}

function pageForPath(pages: readonly SitePage[], pathname: string): SitePage | undefined {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return pages.find((page) => page.path === clean);
}

export function site(): Plugin & { pages: () => readonly SitePage[] } {
  let root = process.cwd();
  let outDir = "dist";
  let pages: SitePage[] = [];
  let ssr: Promise<ViteDevServer> | undefined;
  const ids = new Map<string, SitePage>();

  const index = (): void => {
    ids.clear();
    for (const page of pages) ids.set(normalizePath(resolve(root, page.file)), page);
  };
  const buildLoader: ModuleLoader = async (url) => {
    ssr ??= createServer({
      root,
      configFile: false,
      logLevel: "error",
      appType: "custom",
      resolve: { alias: { react: "preact/compat", "react-dom": "preact/compat" } },
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    return (await ssr).ssrLoadModule(url);
  };

  return {
    pages: () => pages,
    name: "openmouse-site",
    enforce: "pre",
    config(config) {
      root = resolve(config.root ?? process.cwd());
      pages = sitePages(root);
      index();
      const input = Object.fromEntries(pages.map((page) => [page.file.replace(/\.html$/, ""), resolve(root, page.file)]));
      return { build: { rollupOptions: { input } } };
    },
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    resolveId(id) {
      return ids.has(normalizePath(id.split("?")[0])) ? normalizePath(id.split("?")[0]) : null;
    },
    load(id) {
      const page = ids.get(normalizePath(id.split("?")[0]));
      return page ? renderPage(page, buildLoader) : null;
    },
    configureServer(server) {
      const content = normalizePath(resolve(root, BLOG_DIR));
      server.watcher.add(content);
      server.watcher.on("all", (_event, file) => {
        if (!normalizePath(file).startsWith(content)) return;
        pages = sitePages(root);
        index();
        server.ws.send({ type: "full-reload" });
      });
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" && req.method !== "HEAD") return next();
        const url = new URL(req.url ?? "/", "http://localhost");
        const redirect = REDIRECTS.find(([from]) => from === url.pathname);
        if (redirect) {
          res.statusCode = redirect[2];
          res.setHeader("Location", redirect[1] + url.search);
          return res.end();
        }
        const page = pageForPath(pages, url.pathname);
        if (!page) return next();
        try {
          const html = await renderPage(page, (module) => server.ssrLoadModule(module));
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(await server.transformIndexHtml(req.url ?? "/", html));
        } catch (error) {
          next(error);
        }
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: renderSitemap(pages) });
      this.emitFile({ type: "asset", fileName: "_redirects", source: renderRedirects() });
    },
    async closeBundle() {
      const running = ssr;
      ssr = undefined;
      await (await running)?.close();
      const out = resolve(outDir, "server");
      await mkdir(out, { recursive: true });
      await writeFile(
        resolve(out, "index.js"),
        "export default {\n  async fetch(request, env) {\n    return env.ASSETS.fetch(request);\n  },\n};\n",
      );
    },
  };
}
