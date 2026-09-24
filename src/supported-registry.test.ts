import assert from "node:assert/strict";
import test from "node:test";

import { type Mouse } from "./supported-mice.ts";
import { normalizeKey, registrySupportedModels, withRegistryMice } from "./supported-registry.ts";

const BASE: Mouse[] = [
  { brand: "WLMouse", model: "Beast X", status: "supported", req: 1, note: "tracked" },
  { brand: "Logitech", model: "G502", status: "supported", req: 42, note: "tracked" },
];

test("normalizeKey collapses case, spaces, and punctuation", () => {
  assert.equal(normalizeKey("  Logitech G502 X  "), "logitechg502x");
  assert.equal(normalizeKey("WLMouse Beast X Pro"), "wlmousebeastxpro");
  assert.equal(normalizeKey("Starlight-12 / ULX"), "starlight12ulx");
});

test("registrySupportedModels lists named driver-covered models without receivers or dupes", () => {
  const models = registrySupportedModels();
  assert.ok(models.length > 0, "expected some registry-listed models");
  const keys = new Set(models.map((m) => `${m.brand}\u0000${m.model}`));
  assert.equal(keys.size, models.length, "duplicate brand+model rows");
  assert.ok(models.every((m) => m.status === "supported"));
  assert.ok(!models.some((m) => /receiver|dongle/i.test(m.model)), "receivers leaked in");
  assert.ok(models.some((m) => m.brand === "WLMouse" && m.model === "Beast G"));
  assert.ok(models.some((m) => m.brand === "Orbital" && m.model === "Pathfinder V1"));
});

test("registry-listed models are appended when missing from the table", () => {
  const merged = withRegistryMice(BASE);
  assert.ok(merged.some((m) => m.brand === "WLMouse" && m.model === "Beast G"), "Beast G missing");
  assert.ok(merged.some((m) => m.brand === "WLMouse" && m.model === "Beast X Pro"), "Beast X Pro missing");
  assert.equal(merged.filter((m) => m.brand === "WLMouse" && m.model === "Beast X").length, 1, "base row duplicated");
});

test("a registry model the table tracks under a longer name is not duplicated", () => {
  const base: Mouse[] = [
    { brand: "Fantech", model: "WG14P Yari Pro Wireless 8K Gaming Mouse", status: "supported", req: 4, note: "tracked" },
  ];
  const fantech = withRegistryMice(base).filter((m) => m.brand === "Fantech" && /WG14P/.test(m.model));
  assert.equal(fantech.length, 1);
});
