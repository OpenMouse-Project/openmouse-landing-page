import assert from "node:assert/strict";
import test from "node:test";

import { buildLandingData, loadLandingData } from "./landing-data.ts";
import type { Mouse } from "../../data/supported-mice.ts";

const row = (brand: string, model: string, status: Mouse["status"]): Mouse => ({ brand, model, status, req: 0, note: "" });

test("landing data counts only supported models and orders brands by model count", () => {
  const data = buildLandingData([
    row("Razer", "Viper V3 Pro", "supported"),
    row("Razer", "Cobra", "supported"),
    row("Pulsar", "X2 V2", "supported"),
    row("Acme", "Thing", "driver"),
  ]);
  assert.equal(data.supportedModels, 3);
  assert.deepEqual(data.supportedBrands, ["Razer", "Pulsar"]);
});

test("landing search matches every term across brand and model, supported first", () => {
  const data = buildLandingData([
    row("Razer", "Viper Mini", "driver"),
    row("Razer", "Viper V3 Pro", "supported"),
    row("Pulsar", "X2 V2", "supported"),
  ]);
  assert.deepEqual(data.search("viper").map((m) => m.model), ["Viper V3 Pro", "Viper Mini"]);
  assert.deepEqual(data.search("razer v3").map((m) => m.model), ["Viper V3 Pro"]);
  assert.deepEqual(data.search("  "), []);
});

test("the real table has supported models and brands", () => {
  const data = loadLandingData();
  assert.ok(data.supportedModels > 20, `supported models: ${data.supportedModels}`);
  assert.ok(data.supportedBrands.length > 5);
});
