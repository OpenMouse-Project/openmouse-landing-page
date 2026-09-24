import { WLMOUSE_PRODUCTS, GLORIOUS_PRODUCTS, GLORIOUS_CLASSIC_PRODUCTS } from "@openmouse/protocol/drivers/vendors";
import { LAMZU_PRODUCTS } from "@openmouse/protocol/lamzu";
import { KEYCHRON_NAPE_PRODUCTS } from "@openmouse/protocol/keychron";
import { ORBITAL_DEVICES } from "@openmouse/protocol/orbital";
import { FANTECH_PRODUCTS } from "@openmouse/protocol/fantech";
import { GWOLVES_PRODUCTS } from "@openmouse/protocol/drivers/gwolves/products";

import { MICE, REGISTRY_REQ, type Mouse } from "./supported-mice.ts";

/**
 * Adds the models named by the `@openmouse/protocol` product registries to the
 * supported-devices table as `supported` rows, so a model the drivers cover can
 * never be missing from the page. Rows the table already tracks (by exact or
 * fuzzy name match) are left alone.
 */

export function normalizeKey(part: string): string {
  return part.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

/**
 * Canonical display names come from the static table, keyed by their
 * normalized form, so any casing/spacing variant of a known brand groups with
 * the same name.
 */
const CANONICAL_BRAND_BY_KEY = new Map(
  [...new Set(MICE.map((m) => m.brand))].map((brand) => [normalizeKey(brand), brand] as const),
);

export function canonicalBrand(brand: string): string {
  return CANONICAL_BRAND_BY_KEY.get(normalizeKey(brand)) ?? brand;
}

function brandModelKey(brand: string, model: string): string {
  return `${normalizeKey(canonicalBrand(brand))}|${normalizeKey(model)}`;
}

/**
 * Build a set of normalized words from a model name, dropping common filler
 * words ("wireless", "gaming", "mouse") that vary between catalog submissions.
 */
function modelWords(model: string): Set<string> {
  const skip = new Set(["wireless", "wired", "gaming", "mouse", "keyboard", "the", "a", "and", "or", "for"]);
  return new Set(
    model
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !skip.has(w)),
  );
}

/**
 * Two entries from the same brand are considered the same device when they share
 * at least 2 significant words, the shorter name's words are at least 60 %
 * present in the longer one, and the shorter has at least 70 % as many words
 * as the longer (prevents "Beast X Pro" matching "Beast Mini Pro").
 *
 * "WG14P Yari Pro" vs "WG14P Yari Pro Wireless 8K Gaming Mouse" → match.
 * "Beast X Pro" vs "Beast Mini Pro" → no match (different product line).
 */
function modelsMatch(a: string, b: string): boolean {
  const aw = modelWords(a);
  const bw = modelWords(b);
  if (aw.size === 0 || bw.size === 0) return false;
  const smaller = aw.size <= bw.size ? aw : bw;
  const larger = aw.size <= bw.size ? bw : aw;
  if (smaller.size < 2) return false;
  if (smaller.size / larger.size < 0.7) return false;
  let shared = 0;
  for (const w of smaller) if (larger.has(w)) shared++;
  return shared / smaller.size >= 0.6;
}

/**
 * Models the protocol's PID registries name and whose drivers therefore
 * definitively cover them. Only registries that carry names are used; bare-PID
 * registries (Teevolution, Zaunkoenig, Ninjutso) stay curated. Receivers and
 * dongles are excluded.
 */
export function registrySupportedModels(): Mouse[] {
  const rows: Mouse[] = [];

  for (const [pid, info] of WLMOUSE_PRODUCTS) {
    if (info.wireless || /receiver/i.test(info.name)) continue;
    rows.push({ brand: "WLMouse", model: info.name, status: "supported", req: 0, note: "", pids: [pid] });
  }
  for (const [pid, info] of LAMZU_PRODUCTS) {
    rows.push({
      brand: info.brand ?? "Lamzu",
      model: info.model,
      status: "supported",
      req: 0,
      note: "",
      pids: [pid],
    });
  }
  for (const [pid, info] of KEYCHRON_NAPE_PRODUCTS) {
    if (info.receiver) continue;
    rows.push({ brand: "Keychron", model: info.name, status: "supported", req: 0, note: "", pids: [pid] });
  }
  for (const [pid, info] of ORBITAL_DEVICES) {
    if (info.receiver) continue;
    rows.push({ brand: "Orbital", model: info.name, status: "supported", req: 0, note: "", pids: [pid] });
  }
  for (const [pid, info] of FANTECH_PRODUCTS) {
    rows.push({ brand: "Fantech", model: info.model, status: "supported", req: 0, note: "", pids: [pid] });
  }
  for (const [pid, info] of GWOLVES_PRODUCTS) {
    if (info.wireless) continue;
    rows.push({ brand: "G-Wolves", model: info.model, status: "supported", req: 0, note: "", pids: [pid] });
  }
  for (const [pid, info] of GLORIOUS_PRODUCTS) {
    if (/receiver/i.test(info.name)) continue;
    rows.push({ brand: "Glorious", model: info.name, status: "supported", req: 0, note: "", pids: [pid] });
  }
  for (const [pid, info] of GLORIOUS_CLASSIC_PRODUCTS) {
    if (/receiver/i.test(info.name)) continue;
    rows.push({ brand: "Glorious", model: info.name, status: "supported", req: 0, note: "", pids: [pid] });
  }

  for (const row of rows) row.req = REGISTRY_REQ[`${row.brand}|${row.model}`] ?? 0;

  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = brandModelKey(row.brand, row.model);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** The static table plus every registry-listed model it does not track yet. */
export function withRegistryMice(base: Mouse[]): Mouse[] {
  const known = new Set(base.map((m) => brandModelKey(m.brand, m.model)));
  const byBrand = new Map<string, Mouse[]>();
  for (const m of base) {
    const bk = normalizeKey(canonicalBrand(m.brand));
    if (!byBrand.has(bk)) byBrand.set(bk, []);
    byBrand.get(bk)!.push(m);
  }

  const rows = [...base];
  for (const model of registrySupportedModels()) {
    const key = brandModelKey(model.brand, model.model);
    if (known.has(key)) continue;
    const bk = normalizeKey(canonicalBrand(model.brand));
    if (byBrand.get(bk)?.some((s) => modelsMatch(s.model, model.model))) continue;
    rows.push({ ...model, note: "Auto-listed from the @openmouse/protocol driver registry." });
    known.add(key);
    if (!byBrand.has(bk)) byBrand.set(bk, []);
    byBrand.get(bk)!.push(model);
  }
  return rows;
}
