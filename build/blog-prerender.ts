import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { h, type ComponentType } from "preact";
import { renderToString } from "preact-render-to-string";
import { createServer, type Plugin, type ViteDevServer } from "vite";

const BLOG_PAGE = /\/blog[^/]*\.html$/;
const ENTRY = /<script type="module"[^>]*src="([^"]+)"/;
const ROOT = /(<div id="[^"]+">)(<\/div>)/;

/**
 * For every blog*.html page:
 *
 * - Pre-renders the page's Preact component into its root <div>, so the
 *   content is in the HTML itself (first paint, search engines) instead of
 *   appearing only once the script runs. src/blog-mount.tsx then adopts
 *   this markup.
 * - Injects build/blog-head.html into the head.
 *
 * Each blog entry must `export default` its page component; see
 * src/blog-mount.tsx. Build only: the dev server renders client-side.
 */
export function blogPrerender(): Plugin {
  let root = process.cwd();
  // A promise, not the server itself: the blog pages are transformed in
  // parallel, and each must share the one server rather than start its own
  // (an unclosed extra server keeps the build process from exiting).
  let server: Promise<ViteDevServer> | undefined;
  let headSnippet = "";

  function ssr(): Promise<ViteDevServer> {
    server ??= createServer({
      root,
      logLevel: "error",
      appType: "custom",
      server: { middlewareMode: true, hmr: false, ws: false },
    });
    return server;
  }

  return {
    name: "openmouse-blog-prerender",
    apply: "build",
    configResolved(config) {
      root = config.root;
      headSnippet = readFileSync(resolve(root, "build/blog-head.html"), "utf8");
    },
    transformIndexHtml: {
      order: "pre",
      async handler(html, ctx) {
        if (!BLOG_PAGE.test(ctx.filename)) return html;
        const entry = ENTRY.exec(html)?.[1];
        if (!entry) throw new Error(`${ctx.filename}: no module entry script to pre-render`);
        const mod = (await (await ssr()).ssrLoadModule(entry)) as { default?: ComponentType };
        if (!mod.default) throw new Error(`${entry} must export default its page component`);
        const markup = renderToString(h(mod.default, null));
        if (!ROOT.test(html)) throw new Error(`${ctx.filename}: no empty root <div> to pre-render into`);
        return html
          .replace(ROOT, (_, open: string, close: string) => `${open}${markup}${close}`)
          .replace("</head>", `${headSnippet}</head>`);
      },
    },
    async closeBundle() {
      const running = server;
      server = undefined;
      await (await running)?.close();
    },
  };
}
