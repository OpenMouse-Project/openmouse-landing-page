export const SITE_URL = "https://openmouse.app";

export interface PageSpec {
  file: string;
  path: string;
  entry: string;
  title: string;
  description: string;
  socialTitle?: string;
  socialDescription?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
  prerender?: boolean;
  data?: unknown;
  sitemap?: { priority: number; changefreq: "weekly" | "monthly" | "yearly"; lastmod?: string };
}

const WEB_APP = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires WebHID. Chromium-based browser over HTTPS.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export const PAGES: readonly PageSpec[] = [
  {
    file: "index.html",
    path: "/",
    entry: "/src/pages/home/home.tsx",
    title: "OpenMouse — Free, open source mouse configurator",
    description:
      "OpenMouse is a free, open source mouse configurator that runs entirely in your browser — no vendor software, no accounts, no telemetry. Configure DPI, polling rate, buttons, and RGB across dozens of gaming mice.",
    socialDescription:
      "OpenMouse is a free, open source mouse configurator that runs entirely in your browser. Configure DPI, polling rate, buttons, and RGB across dozens of gaming mice.",
    sitemap: { priority: 1, changefreq: "weekly" },
  },
  {
    file: "supported.html",
    path: "/supported",
    entry: "/src/pages/supported/supported.tsx",
    title: "Supported Devices — OpenMouse",
    description:
      "Every gaming mouse OpenMouse supports in the browser, with the DPI, polling rate, and battery features confirmed working on each one.",
    jsonLd: { ...WEB_APP, name: "OpenMouse", url: `${SITE_URL}/` },
    sitemap: { priority: 1, changefreq: "weekly" },
  },
  {
    file: "download.html",
    path: "/download",
    entry: "/src/pages/download/download.tsx",
    title: "Download — OpenMouse",
    description: "Open the OpenMouse web app, or download OpenMouse Bridge for Windows and macOS.",
    socialTitle: "Download OpenMouse",
    sitemap: { priority: 0.9, changefreq: "monthly" },
  },
  {
    file: "check.html",
    path: "/check",
    entry: "/src/pages/check/check.tsx",
    title: "Mouse Check — OpenMouse HID Diagnostics",
    description: "Check if your gaming mouse works with WebHID in the browser, or if it requires a native driver.",
    jsonLd: {
      ...WEB_APP,
      name: "Mouse Check",
      url: `${SITE_URL}/check`,
      isPartOf: { "@type": "WebSite", name: "OpenMouse", url: `${SITE_URL}/` },
    },
    sitemap: { priority: 0.8, changefreq: "monthly" },
  },
  {
    file: "faq.html",
    path: "/faq",
    entry: "/src/pages/faq/faq.tsx",
    title: "FAQ — OpenMouse",
    description:
      "Frequently asked questions about OpenMouse — the free, open source mouse configurator that runs entirely in your browser over WebHID.",
    sitemap: { priority: 0.7, changefreq: "monthly" },
  },
  {
    file: "donate.html",
    path: "/donate",
    entry: "/src/pages/donate/donate.tsx",
    title: "Support OpenMouse — Donate",
    description:
      "Support the OpenMouse project — free, open source, community-built. Your donation helps us test mice, write drivers, and keep the project free of vendor bloat.",
    sitemap: { priority: 0.5, changefreq: "monthly" },
  },
  {
    file: "privacy.html",
    path: "/privacy",
    entry: "/src/pages/legal/privacy.tsx",
    title: "Privacy Policy — OpenMouse",
    description:
      "How the OpenMouse website handles your data — what stays on your device, what the site's protection layer processes, and which third-party services it uses.",
    sitemap: { priority: 0.3, changefreq: "yearly" },
  },
  {
    file: "terms.html",
    path: "/terms",
    entry: "/src/pages/legal/terms.tsx",
    title: "Terms of Service — OpenMouse",
    description:
      "The terms that govern your use of the OpenMouse website — the open-source license, as-is software, acceptable use, user content, and donations.",
    sitemap: { priority: 0.3, changefreq: "yearly" },
  },
];

export const REDIRECTS: readonly [from: string, to: string, status: number][] = [
  ["/landing", "/", 301],
  ["/landing.html", "/", 301],
  ["/blog-openmouse-bridge", "/blog/openmouse-bridge", 301],
  ["/blog-openmouse-bridge.html", "/blog/openmouse-bridge", 301],
  ["/blog-razer-windows-chrome-153", "/blog/razer-windows-chrome-153", 301],
  ["/blog-razer-windows-chrome-153.html", "/blog/razer-windows-chrome-153", 301],
  ["/contribute.html", "https://docs.openmouse.app", 301],
  ["/contribute", "https://docs.openmouse.app", 301],
  [
    "/bridge/download/install-linux.sh",
    "https://raw.githubusercontent.com/OpenMouse-Project/OpenMouse-Bridge/main/install-linux.sh",
    302,
  ],
  ["/install-linux.sh", "https://raw.githubusercontent.com/OpenMouse-Project/OpenMouse-Bridge/main/install-linux.sh", 302],
];

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const FONTS =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=JetBrains+Mono:wght@400;500;600&display=swap";

export function renderShell(page: PageSpec, body = ""): string {
  const url = `${SITE_URL}${page.path}`;
  const lines = [
    `<meta charset="UTF-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    `<meta name="theme-color" content="#09090b" />`,
    `<meta name="robots" content="index, follow" />`,
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<link rel="icon" href="/favicon.ico" sizes="32x32" />`,
    `<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`,
    `<link rel="manifest" href="/manifest.webmanifest" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="${page.type ?? "website"}" />`,
    `<meta property="og:site_name" content="OpenMouse" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${escapeHtml(page.socialTitle ?? page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.socialDescription ?? page.description)}" />`,
    `<meta property="og:image" content="${SITE_URL}/og-image.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<link rel="preconnect" href="https://fonts.googleapis.com" />`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,
    `<link href="${FONTS}" rel="stylesheet" />`,
  ];
  if (page.jsonLd) lines.push(`<script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>`);
  const data =
    page.data === undefined
      ? ""
      : `<script type="application/json" id="page-data">${JSON.stringify(page.data).replace(/</g, "\\u003c")}</script>\n    `;
  return `<!doctype html>
<html lang="en" style="background: #08090b">
  <head>
    ${lines.join("\n    ")}
  </head>
  <body>
    <div id="app">${body}</div>
    ${data}<script type="module" src="${page.entry}"></script>
  </body>
</html>
`;
}

export function renderSitemap(pages: readonly PageSpec[]): string {
  const urls = pages
    .filter((page) => page.sitemap)
    .map((page) => {
      const { priority, changefreq, lastmod } = page.sitemap!;
      return [
        "  <url>",
        `    <loc>${SITE_URL}${page.path}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority.toFixed(1)}</priority>`,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function renderRedirects(): string {
  return REDIRECTS.map(([from, to, status]) => `${from}    ${to}    ${status}`).join("\n") + "\n";
}
