import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFrontmatter, parsePost, renderMarkdown } from "../build/blog.ts";

const POST = `---
title: A post
description: Card text
date: 2026-10-01
author: snekxs
category: Guides
kicker: Guide
toc: true
coverLabel: "153"
---

## First part {#first}

Text with a [link](https://example.com) and [a local one](/download).

## Second's part

1. One
2. Two
`;

test("front matter keeps strings, quoted values and booleans", () => {
  const { data, body } = parseFrontmatter(POST);
  assert.equal(data.title, "A post");
  assert.equal(data.coverLabel, "153");
  assert.equal(data.toc, true);
  assert.ok(body.startsWith("\n## First part"));
});

test("a post gets anchors, a contents list and defaults", () => {
  const post = parsePost("a-post", POST);
  assert.deepEqual(post.headings, [
    { id: "first", label: "First part" },
    { id: "seconds-part", label: "Second's part" },
  ]);
  assert.equal(post.summary, "Card text");
  assert.equal(post.dek, "Card text");
  assert.match(post.html, /<h2 id="first">First part<\/h2>/);
  assert.match(post.html, /<a target="_blank" rel="noreferrer" href="https:\/\/example.com">/);
  assert.match(post.html, /<a href="\/download">/);
  assert.match(post.html, /<ol class="blog-steps">/);
});

test("blocks render to the blog's components", () => {
  const { html } = renderMarkdown(`:::tldr TL;DR
- Short
:::

:::glance
Status: Fixed {.status}
Needs admin?: No
:::

:::checks
- **Tried this.** Did nothing.
:::

:::downloads
windows: https://example.com/win.zip
linux: soon
:::
`);
  assert.match(html, /<div class="blog-tldr"><h3>TL;DR<\/h3><ul>/);
  assert.match(html, /<dt>Status<\/dt><dd class="blog-status-tag">Fixed<\/dd>/);
  assert.match(html, /<dt>Needs admin\?<\/dt><dd>No<\/dd>/);
  assert.match(html, /<li><b>Tried this.<\/b> <span>Did nothing.<\/span><\/li>/);
  assert.match(html, /class="blog-download-btn is-primary" href="https:\/\/example.com\/win.zip"/);
  assert.match(html, /blog-download-btn is-disabled[^>]*>.*Linux <span class="blog-download-soon">Soon<\/span>/);
});

test("a post with a bad file name, category or date is rejected", () => {
  assert.throws(() => parsePost("My Post", POST), /file names/);
  assert.throws(() => parsePost("x", POST.replace("Guides", "News")), /category/);
  assert.throws(() => parsePost("x", POST.replace("2026-10-01", "Oct 1")), /date/);
});
