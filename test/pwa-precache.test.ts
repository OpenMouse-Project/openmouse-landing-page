import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { BYPASS } from "../build/pwa-vite-plugin.ts";
import { pageUrl, sitePages } from "../build/site.ts";

test("every page has one file and one path, and none is bypassed by the cache", () => {
  const bypassed = (path: string): boolean => BYPASS.some((pattern) => pattern.test(path));
  const pages = sitePages(".");
  assert.equal(new Set(pages.map((page) => page.file)).size, pages.length);
  assert.equal(new Set(pages.map((page) => page.path)).size, pages.length);
  for (const page of pages) {
    assert.equal(pageUrl(page.file), page.path);
    assert.equal(bypassed(page.path), false);
  }
});

test("every markdown post becomes a page", () => {
  const paths = new Set(sitePages(".").map((page) => page.path));
  for (const name of readdirSync("content/blog").filter((file) => file.endsWith(".md"))) {
    assert.ok(paths.has(`/blog/${name.slice(0, -3)}`), name);
  }
});

test("the root page is served from /", () => {
  assert.equal(pageUrl("index.html"), "/");
});

test("every other page is served from its clean path", () => {
  assert.equal(pageUrl("check.html"), "/check");
  assert.equal(pageUrl("blog/openmouse-bridge.html"), "/blog/openmouse-bridge");
});

const bypassed = (path: string): boolean => BYPASS.some((pattern) => pattern.test(path));

test("API endpoints bypass the cache", () => {
  assert.equal(bypassed("/api/comments"), true);
});

// The gated control app and admin dashboard live in the separate openmouse
// repo and are never emitted here — this pattern is kept defensively.
test("control app and admin paths would bypass the cache if ever proxied here", () => {
  assert.equal(bypassed("/control"), true);
  assert.equal(bypassed("/admin"), true);
});
