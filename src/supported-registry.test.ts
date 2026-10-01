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

test("Redragon and Keychron Launcher catalogs are listed with their retail names", () => {
  const models = registrySupportedModels();
  const redragon = models.filter((m) => m.brand === "Redragon").map((m) => m.model);
  assert.ok(redragon.includes("M724 K1NG 1K"), "code plus retail name");
  assert.ok(redragon.includes("Predator M612"), "retail name that already holds the code");
  const g3Air = models.find((m) => m.brand === "Keychron" && m.model === "G3 Air");
  assert.deepEqual(g3Air?.pids, [0xd077]);
  const m3Mini4k = models.find((m) => m.brand === "Keychron" && m.model === "M3 Mini 4K");
  assert.deepEqual(m3Mini4k?.pids, [0xd037, 0xd041], "PIDs grouped per model");
  assert.ok(!models.some((m) => m.brand === "Keychron" && m.model.startsWith("Keychron ")), "brand prefix stripped");
});

test("a stale row under the exact registry name is upgraded to supported", () => {
  const base: Mouse[] = [
    { brand: "Redragon", model: "PREDATOR M612", status: "driver", req: 3, note: "not implemented" },
    { brand: "Keychron", model: "M7 8K", status: "pending", req: 2, note: "requested" },
  ];
  const merged = withRegistryMice(base);
  const m612 = merged.filter((m) => m.brand === "Redragon" && normalizeKey(m.model) === "predatorm612");
  assert.equal(m612.length, 1, "upgraded in place, not duplicated");
  assert.equal(m612[0]!.status, "supported");
  assert.deepEqual(m612[0]!.pids, [0xfc61]);
  assert.equal(m612[0]!.req, 3, "request votes kept");
  assert.equal(merged.find((m) => m.brand === "Keychron" && m.model === "M7 8K")?.status, "supported");
  assert.equal(base[0]!.status, "driver", "the static table is not mutated");
});

test("bridge, test-needed, and fuzzy-matched rows keep their status", () => {
  const base: Mouse[] = [
    { brand: "Redragon", model: "M724 K1NG 1K", status: "bridge", req: 1, note: "needs Bridge" },
    { brand: "Redragon", model: "Predator M612", status: "likely", req: 1, note: "needs a hardware test" },
    // The registry names it "WG14P Yari Pro Wireless 8K Gaming Mouse": a fuzzy match only.
    { brand: "Fantech", model: "WG14P Yari Pro", status: "likely", req: 4, note: "tracked" },
  ];
  const merged = withRegistryMice(base);
  assert.equal(merged.find((m) => m.brand === "Redragon" && m.model === "M724 K1NG 1K")?.status, "bridge");
  assert.equal(merged.find((m) => m.brand === "Redragon" && m.model === "Predator M612")?.status, "likely");
  const fantech = merged.filter((m) => m.brand === "Fantech" && /WG14P/.test(m.model));
  assert.equal(fantech.length, 1);
  assert.equal(fantech[0]!.status, "likely");
});
