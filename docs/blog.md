# How the blog works

The blog at [openmouse.app/blog](https://openmouse.app/blog) is a folder of Markdown files. Each
file in `content/blog/` is one post. There is no CMS, database or admin page: writing a post means
adding a file and opening a pull request, and publishing means merging it.

## Publishing a post

1. Create `content/blog/<slug>.md`. The file name is the post's address: `bridge-linux.md`
   becomes `openmouse.app/blog/bridge-linux`. Use lowercase letters, digits and hyphens only.
2. Start the file with the front matter (below), then write the post in Markdown.
3. Run `npm run dev` and open `http://127.0.0.1:5173/blog/<slug>`. The dev server reloads the page
   whenever a file in `content/blog/` changes.
4. Run `npm run check`. A post with a missing field, a bad date, a bad category or an unknown
   block stops the build and names the file.
5. Merge. The blog index, the post page, the sitemap and the offline cache all pick it up on the
   next deploy.

## Front matter

The block between the two `---` lines at the top of the file. One `key: value` per line; the value
runs to the end of the line. There are no comments, lists or multi-line values. Wrap a value in
double quotes only when it should be read exactly, e.g. `coverLabel: "153"`. `true` and `false`
are read as on/off.

```md
---
title: OpenMouse Bridge is here, and Razer mice work on Windows again
description: A small helper app that runs next to your browser and talks to your mouse directly.
date: 2026-09-23
author: snekxs
category: Announcements
kicker: Release · Bridge beta
toc: true
---
```

### Required

| Field | What it does |
| --- | --- |
| `title` | The post title: page heading, browser tab, share preview. |
| `description` | The text on the post's card on the blog index. Also the default for `summary` and `dek`. |
| `date` | `YYYY-MM-DD`. Orders the blog (newest first) and shows under the title. |
| `author` | Shown in the byline under the title. |
| `category` | One of `Announcements`, `Guides`, `Incident reports`. Decides the section on the index. |
| `kicker` | The small accent line above the title, e.g. `Incident report · WebHID`. |

### Optional

| Field | What it does |
| --- | --- |
| `summary` | Search engine and share-preview description, when it should differ from the card text. |
| `dek` | The subtitle under the title, when it should differ from the card text. |
| `updated` | `true` writes "updated" before the date in the byline. Change `date` to the update day. |
| `toc` | `true` adds an "On this page" list beside the post, built from its `##` headings. Use it for long posts. |
| `hero` | An image shown under the byline, e.g. `/bridge-panel.png` (files live in `public/`). |
| `heroAlt` | Description of the hero image for screen readers. Required in practice whenever `hero` is set. |
| `cover` | An image for the post's card on the index, shown on a soft backdrop. |
| `coverLabel` | Without `cover`, the card shows generated art with this word or number in large type (default `OpenMouse`). |
| `coverCaption` | A small line under `coverLabel`, e.g. `Chrome · Windows · WebHID`. |
| `outro` | A closing line at the end of the post, followed by Discord, X and GitHub links. |

## Writing the post

Everything after the front matter is regular Markdown: paragraphs, `**bold**`, `*italic*`,
`` `code` ``, links, lists, `>` quotes and tables. Don't repeat the title as a `#` heading; the page
already shows it. Start sections at `##`.

A few things happen automatically:

- **Headings get anchors.** `## Install it` can be linked as `/blog/<slug>#install-it`. To choose
  the anchor yourself, end the heading with `{#name}`: `## Install it {#install}`. Anchors are
  how other pages link into a post, so don't change one that's already linked.
- **Numbered lists become steps**, with accent numbers. Use them for instructions.
- **Links to other sites open in a new tab.** Links to openmouse.app pages open in place. Link to
  site pages by path: `[download page](/download)`, `[the Bridge post](/blog/openmouse-bridge)`.
- **Tables scroll sideways** on narrow screens instead of breaking the layout.

Raw HTML also works, but use the blocks below instead so posts keep a consistent look.

## Blocks

Blocks are the post's special boxes. A block opens with `:::name` (plus an optional title on the
same line) and closes with `:::` on its own line. Inside a numbered list, indent the block to line
up with the step text (three spaces).

### `:::tldr` summary box

```md
:::tldr TL;DR
- Your mouse is fine.
- Install Bridge and it works again.
:::
```

### `:::finding` highlighted note

For updates, key findings and side notes. The title is optional; Markdown works inside, including
quotes.

```md
:::finding Game not in the list?
Tell us on Discord, or add it to the [games list](https://github.com/...) yourself.
:::
```

### `:::warn` warning

For things that can go wrong or surprise the reader.

```md
:::warn Your computer will probably warn you
This beta isn't code-signed yet, so Windows shows a "Windows protected your PC" screen.
:::
```

### `:::glance` fact sheet

A short grid of facts near the top of a post. One `Label: value` per line. End a value with
`{.status}` to colour it with the accent.

```md
:::glance
Status: Confirmed, upstream {.status}
Platforms: Windows (x64), macOS
Needs admin?: No
:::
```

### `:::checks` ruled-out list

A list where each item starts with a bold statement and ends with a quieter explanation. Used for
"what we checked" and troubleshooting.

```md
:::checks
- **Razer Synapse running in the background.** No such process was running.
- **It doesn't work in Safari.** Safari isn't supported yet. Use Chrome, Edge or Firefox.
:::
```

### `:::downloads` download buttons

One `platform: link` per line. Platforms are `windows`, `macos` and `linux`, each with its logo.
The first line is the primary button. `soon` instead of a link shows a disabled button with a
"Soon" badge.

```md
:::downloads
windows: https://github.com/.../openmouse-bridge-windows-x64.zip
macos: https://github.com/.../openmouse-bridge-macos-universal.zip
linux: soon
:::
```

### `:::note` small print

A small line of text, meant for right under download buttons.

```md
:::note
Straight from our [GitHub releases](https://github.com/...), with a checksum.
:::
```

## The blog index

`/blog` lists every post, newest first:

- The newest post is the **featured** post: a large card with its description, a Read post
  button, the date and its cover.
- Every other post sits under its category heading (Announcements, then Guides, then Incident
  reports). Categories with no posts are hidden.

## Comments

Every post has a comment section under it. Comments are stored per post under the post's slug
(the file name). Renaming a post's file therefore starts it with no comments and breaks old links.
If a post has to move, add the old address to `REDIRECTS` in `build/pages.ts` and expect its
comments to stay with the old slug.

## How it's built

Nothing here needs to change to write a post, but for when something breaks:

| Part | File |
| --- | --- |
| Reads `content/blog/*.md`, checks the front matter, renders the Markdown and blocks to HTML | `build/blog.ts` |
| Turns each post into a page (`/blog/<slug>`), builds the index data, sitemap entries | `build/site.ts` |
| Generates the HTML for every page, serves pages in dev, reloads on post changes | `build/site-vite-plugin.ts` |
| The post page: title, byline, hero, contents rail, the rendered post, outro, comments | `src/pages/blog/blog-post.tsx` |
| The blog index | `src/pages/blog/blog-index.tsx` |
| Styles for posts, blocks and the index | `src/pages/blog/blog.css` |
| The comments API | `functions/api/comments.js` |
| Tests for front matter, blocks and anchors | `test/blog-content.test.ts` |

Posts are rendered when the site is built, so each post page arrives as finished HTML: it reads
without JavaScript and search engines see the full text. One small script shared by every post
then makes the contents rail and the comments interactive.

To add a new block, add a case to the `container` renderer in `build/blog.ts`, style it in
`blog.css`, add a test, and document it here.
