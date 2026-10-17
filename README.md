# OpenMouse landing page

The standalone marketing/support site for OpenMouse, deployed at
[openmouse.app](https://openmouse.app). This is a separate Cloudflare Pages
project from the gated control app (control.openmouse.app), which lives in
the [openmouse](https://github.com/OpenMouse-Project/openmouse) repo's
`control-panel` branch.

## Pages

| URL | Source |
| --- | --- |
| `/` | `src/pages/home/` |
| `/supported` | `src/pages/supported/` |
| `/download` | `src/pages/download/` |
| `/check` | `src/pages/check/` (WebHID compatibility checker) |
| `/faq` | `src/pages/faq/` |
| `/donate` | `src/pages/donate/` |
| `/privacy`, `/terms` | `src/pages/legal/` |
| `/blog`, `/blog/<post>` | `src/pages/blog/` renders `content/blog/*.md` |

There are no hand-written `.html` files. Each page's title, description and
share-preview details are in `build/pages.ts`; the build generates the HTML,
`sitemap.xml` and `_redirects` from that list and from the blog posts.

## Layout

| Folder | What lives there |
| --- | --- |
| `src/pages/<page>/` | One folder per page: its component, stylesheet and page-only helpers |
| `src/shared/` | Site nav and footer, shared page styles (`site.css`), page mounting, locale and preferences, icons |
| `src/data/` | The supported-mice table and the protocol registry check (also mirrored by the control app) |
| `src/i18n/` | Strings: `index.ts` is English and the API, `locales/` has one file per language |
| `src/platform/` | Service worker registration and the offline banner |
| `src/types/` | Global type declarations |
| `content/blog/` | Blog posts in Markdown |
| `build/` | Vite plugins: page generation, Markdown rendering, the PWA service worker |
| `test/` | Tests for the build: page list, blog rendering, precache |
| `functions/` | Cloudflare Pages Functions (blog comments API) |

## Writing a blog post

Add `content/blog/<slug>.md`; it is published at `/blog/<slug>`. The full guide, with every
front matter field and block, is [docs/blog.md](docs/blog.md).

```md
---
title: Post title
description: One line for the blog index card.
date: 2026-10-17
author: snekxs
category: Announcements
kicker: Release · Bridge
---

## A section

Regular Markdown.
```

## Stack

Vite + Preact + TypeScript, no build-time server framework. `functions/api/*`
are Cloudflare Pages Functions (currently the blog comments endpoint).

## Developing

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check + production build
npm test         # unit tests
```

## Scope

This repo intentionally contains only the public marketing/support pages and
their dependencies. The gated control app, its device drivers, and the admin
dashboard are out of scope here — see the `openmouse` repo instead.
