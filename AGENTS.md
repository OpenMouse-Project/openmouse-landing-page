# AGENTS.md

Guidance for human contributors and AI agents working in this repository: the public site at
[openmouse.app](https://openmouse.app). The control app lives in the
[openmouse](https://github.com/OpenMouse-Project/openmouse) repo.

## Design

The site uses the control app's design: the same tokens (`src/shared/site-chrome.css`), DM Sans,
JetBrains Mono for figures, one accent, lit translucent surfaces. Read the control app's
`DESIGN.md` before changing the look.

- Colours come from the tokens in `src/shared/site-chrome.css`. No new hex in page CSS.
- Sentence case. No uppercase micro labels, no em dashes in copy.
- Real data only: counts and lists come from `src/data/supported-mice.ts`, never typed in.
- Every page uses `SiteNav` and `SiteFooter` from `src/shared/site-chrome.tsx`. Don't build a
  page-specific header or footer.
- Never remove a link, page section or string as a side effect of a redesign.

## Pages and URLs

There are no hand-written `.html` files. Pages are listed in `build/pages.ts` (path, entry,
title, description, share text, sitemap entry); `build/site-vite-plugin.ts` generates each
page's HTML, `sitemap.xml` and `_redirects`. URLs have no `.html`: `/supported`, `/download`.

To add a page: create `src/pages/<name>/<name>.tsx` (render into `#app`), add an entry to
`PAGES` in `build/pages.ts`, link it from `SiteNav`/`SiteFooter` if it belongs there. To retire
a URL, add it to `REDIRECTS` in the same file.

## Blog

Posts are Markdown in `content/blog/<slug>.md`, published at `/blog/<slug>`. Front matter and
the `:::` blocks (`tldr`, `finding`, `warn`, `glance`, `checks`, `downloads`, `note`) are
documented in `docs/blog.md` and rendered by `build/blog.ts`. Posts are pre-rendered at build time.

## Strings

User-facing strings live in `src/i18n/index.ts` (English) with one file per language in
`src/i18n/locales/`. Add a new key to every locale in the same change. Blog posts and the legal
pages are English only.

## Commands

```bash
npm run dev      # dev server; clean URLs work locally too
npm run build    # tsc --noEmit && vite build
npm test         # node --test (src and test)
npm run check    # build + tests
```

Run `npm run check` before finishing.

## Layout

| Path | What lives there |
| --- | --- |
| `src/pages/<page>/` | One folder per page: component, stylesheet, page-only helpers |
| `src/shared/` | Nav and footer, shared page styles (`site.css`), page mounting, locale, icons |
| `src/data/` | Supported-mice table and its protocol registry check |
| `src/i18n/` | `index.ts` (English + API), `locales/<code>.ts` |
| `src/platform/` | Service worker registration, offline banner |
| `content/blog/` | Blog posts |
| `build/` | Page list, page generation, Markdown rendering, PWA service worker |
| `test/` | Tests for the build |
| `functions/` | Cloudflare Pages Functions (blog comments API) |

`src/data/supported-mice.ts` is also mirrored into the control app
(`scripts/sync-supported-devices.mjs` there); run that sync after changing the table.
