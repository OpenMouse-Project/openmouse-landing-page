import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { BYPASS, pageUrl, precachePages } from "../build/pwa-vite-plugin.ts";

test("every page in the repo is precached", () => {
  const bypassed = (path: string): boolean => BYPASS.some((pattern) => pattern.test(path));
  const pages = readdirSync(".")
    .filter((name) => name.endsWith(".html") && !bypassed(`/${name}`))
    .sort();

  assert.deepEqual(precachePages().slice().sort(), pages);
});

test("the root page is served from /", () => {
  assert.equal(pageUrl("landing.html"), "/");
});

test("every other page keeps its own path", () => {
  assert.equal(pageUrl("check.html"), "/check.html");
  assert.equal(pageUrl("faq.html"), "/faq.html");
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
