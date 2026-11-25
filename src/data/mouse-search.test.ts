import assert from "node:assert/strict";
import test from "node:test";

import { mouseMatchesQuery } from "./mouse-search.ts";
import type { Mouse } from "./supported-mice.ts";

const row = (brand: string, model: string, note = ""): Mouse => ({ brand, model, status: "likely", req: 0, note });

test("a query can mix brand and model words", () => {
  const mouse = row("ATK", "VXE Dragonfly R1 Pro");
  assert.ok(mouseMatchesQuery(mouse, "atk pro"));
  assert.ok(mouseMatchesQuery(mouse, "pro atk"));
  assert.ok(mouseMatchesQuery(mouse, "ATK  dragonfly r1"));
  assert.ok(!mouseMatchesQuery(mouse, "razer pro"));
});

test("punctuation and accents don't block a match", () => {
  assert.ok(mouseMatchesQuery(row("G-Wolves", "HTS Plus 4K"), "g wolves hts"));
  assert.ok(mouseMatchesQuery(row("Lamzu", "Maya X"), "lamzu maya-x"));
});

test("the note matches as a phrase, not word by word", () => {
  const mouse = row("ATK", "A9 Air", "PID 0x0084, handled by the shared protocol driver");
  assert.ok(mouseMatchesQuery(mouse, "0x0084"));
  assert.ok(!mouseMatchesQuery(mouse, "atk pro"));
});

test("an empty query matches everything", () => {
  assert.ok(mouseMatchesQuery(row("Razer", "Cobra"), "   "));
});
