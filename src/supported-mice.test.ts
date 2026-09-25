import assert from "node:assert/strict";
import test from "node:test";

import { DEVICE_DRIVERS } from "@openmouse/protocol/drivers/registry";
import { ATK_COMPX_PRODUCT_IDS } from "@openmouse/protocol/drivers/atk/products";
import { WLMOUSE_PRODUCTS, GLORIOUS_PRODUCTS, GLORIOUS_CLASSIC_PRODUCTS } from "@openmouse/protocol/drivers/vendors";
import { BITMOUSE_PRODUCT_IDS } from "@openmouse/protocol/bitmouse";
import { EGG_DEVICE_PROFILES } from "@openmouse/protocol/endgame-gear-op1";
import { KEYCHRON_M6_PRODUCT_ID, KEYCHRON_NAPE_PRODUCTS, KEYCHRON_M6_RECEIVER_PRODUCT_ID } from "@openmouse/protocol/keychron";
import { LAMZU_PRODUCTS, LAMZU_INCA_PRODUCTS } from "@openmouse/protocol/lamzu";
import { MICROSOFT_PRODUCTS } from "@openmouse/protocol/microsoft";
import {
  LOGITECH_BOLT_PRODUCT_IDS,
  LOGITECH_DIRECT_PRODUCT_IDS,
} from "@openmouse/protocol/logitech";
import {
  NINJUTSO_LEGACY_MOUSE_PRODUCT_IDS,
  NINJUTSO_MOUSE_PRODUCT_IDS,
  NINJUTSO_LEGACY_RECEIVER_PRODUCT_IDS,
  NINJUTSO_RECEIVER_PRODUCT_IDS,
} from "@openmouse/protocol/ninjutso";
import {
  MCHOSE_DOCK_PRODUCT_ID,
  MCHOSE_LINK_PRODUCT_IDS,
  MCHOSE_PRODUCTS,
  MCHOSE_V3_PRODUCT_IDS,
  mchoseV3FindProduct,
} from "@openmouse/protocol/mchose";
import { ORBITAL_DEVICES } from "@openmouse/protocol/orbital";
import { PULSAR_XS1_PRODUCT_IDS } from "@openmouse/protocol/pulsar";
import { RAZER_PRODUCTS } from "@openmouse/protocol/razer-devices";
import { TEEVOLUTION_PRODUCT_IDS } from "@openmouse/protocol/teevolution";
import { ZAUNKOENIG_PRODUCT_IDS } from "@openmouse/protocol/zaunkoenig";
import { CORSAIR_PRODUCT_IDS } from "@openmouse/protocol/corsair";
import { KSNAKE_PRODUCTS } from "@openmouse/protocol/ksnake";
import { HYPERX_PULSEFIRE_HASTE_PIDS } from "@openmouse/protocol/hyperx";
import { INCOTT_PRODUCT_IDS } from "@openmouse/protocol/incott";
import { VAXEE_PRODUCT_IDS } from "@openmouse/protocol/vaxee";
import { RYUNIX_PRODUCT_IDS } from "@openmouse/protocol/ryunix";
import { DELUX_PRODUCT_IDS } from "@openmouse/protocol/delux";
import { DAREU_PRODUCT_IDS } from "@openmouse/protocol/dareu";
import { REDRAGON_PRODUCT_IDS } from "@openmouse/protocol/redragon";
import { RAWM_PRODUCT_IDS } from "@openmouse/protocol/rawm";
import { GEARHUB_PRODUCTS } from "@openmouse/protocol/gearhub";
import { MCHOSE_A5_GEN1_PRODUCTS } from "@openmouse/protocol/mchose";

import { MICE, STATUS, type Mouse, type Status } from "./supported-mice.ts";

/**
 * The supported-devices page is hand-maintained request tracking, but its
 * "supported"/"quickwin" claims and the PIDs pinned in `pids` must never
 * disagree with the actual drivers in `@openmouse/protocol`. These tests keep
 * the table honest: if a driver is removed, or a PID is wrong, the build fails
 * here instead of showing a dead entry to users.
 */

test("every mouse uses a known status and both extremes are represented", () => {
  for (const m of MICE) {
    assert.ok(m.status in STATUS, `${m.brand} ${m.model}: unknown status "${m.status}"`);
  }
  assert.ok(MICE.some((m) => m.status === "supported"), "no supported mice are listed");
  assert.ok(MICE.some((m) => m.status === "unknown"), "no unknown mice are listed");
});

test("brand + model are unique and request counts are sane", () => {
  const seen = new Set<string>();
  for (const m of MICE) {
    const key = `${m.brand}\u0000${m.model}`;
    assert.ok(!seen.has(key), `duplicate entry: ${m.brand} ${m.model}`);
    seen.add(key);
    assert.ok(Number.isInteger(m.req) && m.req >= 0, `${m.brand} ${m.model}: req must be >= 0`);
    assert.ok(m.note.trim().length > 0, `${m.brand} ${m.model}: note is empty`);
  }
});

// Brands with an actual driver in @openmouse/protocol/drivers/registry.ts.
const DRIVER_BRANDS = new Set<string>([
  ...DEVICE_DRIVERS.map((driver) => driver.brand.toLowerCase()),
  // These products are driven by a shared protocol family and report their own
  // brand after identification.
  "crdrako",
  "vxe",
]);

test("supported / PR / quickwin claims require a registered driver brand", () => {
  const claimed = MICE.filter((m) => m.status === "supported" || m.status === "pr" || m.status === "quickwin");
  assert.ok(claimed.length > 0, "no supported claims to validate");
  for (const m of claimed) {
    assert.ok(
      DRIVER_BRANDS.has(m.brand.toLowerCase()),
      `${m.brand} ${m.model} is marked "${m.status}" but ${m.brand} has no driver in @openmouse/protocol`,
    );
  }
});

// Every product id the protocol pins, so a `pids` entry that no driver knows
// about (renamed, removed, or a typo) is caught. Only rows that actually claim
// driver coverage are validated: a "test needed"/"driver needed" row pins
// aspirational PIDs that will only exist once the driver lands upstream, so it
// is exempt. The moment the protocol pins those PIDs, the row is flipped to
// "supported" and this check proves the PIDs are real.
const PID_UNIVERSE = new Set<number>([
  ...BITMOUSE_PRODUCT_IDS,
  ...WLMOUSE_PRODUCTS.keys(),
  ...LAMZU_PRODUCTS.keys(),
  ...LOGITECH_DIRECT_PRODUCT_IDS,
  ...LOGITECH_BOLT_PRODUCT_IDS,
  // Logitech Lightspeed receivers (drivers/vendors.ts).
  0xc54d, 0xc539, 0xc0a8, 0xc547, 0xc54f,
  // Logitech next-gen direct USB ids: G PRO 2 LIGHTSPEED (0xc09a),
  // PRO X SUPERLIGHT 2 (0xc09b) and PRO X SUPERLIGHT 2 DEX (0xc0a0).
  0xc09a, 0xc09b, 0xc0a0,
  ...RAZER_PRODUCTS.keys(),
  // Razer models with dedicated drivers, deliberately excluded from the
  // RAZER_PRODUCTS registry (drivers/razer/devices.ts): Cobra, Viper Mini,
  // Viper V4 Pro.
  0x00a3, 0x008a, 0x00e5, 0x00e6,
  ...KEYCHRON_NAPE_PRODUCTS.keys(),
  // Keychron M6 wired control PID and its Link-KM receiver (drivers/keychron).
  KEYCHRON_M6_PRODUCT_ID,
  KEYCHRON_M6_RECEIVER_PRODUCT_ID,
  ...TEEVOLUTION_PRODUCT_IDS,
  ...ZAUNKOENIG_PRODUCT_IDS,
  ...CORSAIR_PRODUCT_IDS,
  ...NINJUTSO_LEGACY_MOUSE_PRODUCT_IDS,
  ...NINJUTSO_MOUSE_PRODUCT_IDS,
  ...NINJUTSO_LEGACY_RECEIVER_PRODUCT_IDS,
  ...NINJUTSO_RECEIVER_PRODUCT_IDS,
  ...ORBITAL_DEVICES.keys(),
  ...EGG_DEVICE_PROFILES.keys(),
  // Endgame WE-series cables/receivers (drivers/endgame/egg-we-hid.ts).
  0x1960, 0x1961, 0x1962, 0x1968, 0x1970, 0x1972, 0x1982,
  // VGN Dragonfly F2 Master+ (drivers/vgn/hid.ts).
  0xfb56, 0xfb57,
  // VXE R1 SE+ wired transport (drivers/atk/hid.ts).
  ...ATK_COMPX_PRODUCT_IDS,
  // Pulsar X3 family on the Sonix XS-1 feature interface (drivers/pulsar/pulsar-xs1-hid.ts).
  ...PULSAR_XS1_PRODUCT_IDS,
  // Finalmouse ULX dongle (drivers/finalmouse/hid.ts).
  0x0100,
  // Fantech WG14P Yari Pro (drivers/fantech/hid.ts).
  0x503d,
  // WALLHACK M-001 mouse: real config PID and in-app demo PID (drivers/wallhack/mouse-hid.ts).
  0x1110, 0x0807,
  // SteelSeries Aerox 3 (drivers/steelseries/aerox3-hid.ts).
  0x1836,
  // SteelSeries Rival 3 Wireless (drivers/steelseries/rival3-wireless-hid.ts).
  0x1830,
  // SteelSeries Aerox 5 (drivers/steelseries/aerox5-hid.ts).
  0x1850,
  // SteelSeries Aerox 5 Wireless, wired mode + 2.4 GHz mode, all editions
  // (drivers/steelseries/aerox5-wireless-hid.ts).
  0x1854, 0x185e, 0x1862, 0x1852, 0x185c, 0x1860,
  // SteelSeries Rival 650 Wireless, wired mode + 2.4 GHz wireless mode
  // (drivers/steelseries/rival650-hid.ts).
  0x172b, 0x1726,
  // SteelSeries Aerox 9 Wireless, wired mode + 2.4 GHz mode, both editions
  // (drivers/steelseries/aerox9-wireless-hid.ts).
  0x185a, 0x1876, 0x1858, 0x1874,
  // SteelSeries Rival 310, all three colorway/bundle variants
  // (drivers/steelseries/rival310-hid.ts).
  0x1720, 0x171e, 0x1736,
  // SteelSeries Prime+ (drivers/steelseries/prime-plus-hid.ts).
  0x182c,
  // SteelSeries Sensei TEN, incl. CS:GO Neon Rider Edition
  // (drivers/steelseries/sensei-ten-hid.ts).
  0x1832, 0x1834,
  // SteelSeries Prime Mini Wireless, wired mode + 2.4 GHz mode
  // (drivers/steelseries/prime-mini-wireless-hid.ts).
  0x184a, 0x1848,
  // Glorious Pixart Model O 2 / I 2 family (drivers/glorious/hid.ts) and
  // classic pre-Pixart Model O/D/I family (drivers/glorious/classic-hid.ts).
  // MCHOSE A7 V2 family: model ids plus the receiver/Bluetooth link ids
  // (drivers/mchose/hid.ts).
  ...MCHOSE_PRODUCTS.map((product) => product.productId),
  ...Object.values(MCHOSE_LINK_PRODUCT_IDS),
  MCHOSE_DOCK_PRODUCT_ID,
  // MCHOSE A7 V3 generation, a separate protocol on the same usage page
  // (drivers/mchose/v3-hid.ts).
  ...MCHOSE_V3_PRODUCT_IDS,
  ...GLORIOUS_PRODUCTS.keys(),
  ...GLORIOUS_CLASSIC_PRODUCTS.keys(),
  ...MICROSOFT_PRODUCTS,
  // K-snake X11 wired + 2.4 GHz dongle share PID 0x2255 (src/ksnake).
  ...KSNAKE_PRODUCTS.keys(),
  // HyperX Pulsefire Haste wired + wireless dongle (src/hyperx).
  ...HYPERX_PULSEFIRE_HASTE_PIDS,
  // Incott's 2.4 GHz dongle and wired link, shared by all six model
  // families (src/incott).
  ...INCOTT_PRODUCT_IDS,
  // VAXEE wireless mice, including the report-0x0e receiver ids
  // (src/vaxee/index.ts).
  ...VAXEE_PRODUCT_IDS,
  // Ryunix KYU Pro MX1 — wired 0x026e and wireless 0x026f (src/ryunix).
  ...RYUNIX_PRODUCT_IDS,
  // Delux M800 Mini — wireless 0xfa60 and wired 0xfa55 links (src/delux).
  ...DELUX_PRODUCT_IDS,
  // Dareu A950 PRO Mg — wired direct 0x1117 and TM265 receiver 0x1114
  // (src/dareu).
  ...DAREU_PRODUCT_IDS,
  // Redragon M724 K1NG 1K (src/redragon).
  ...REDRAGON_PRODUCT_IDS,
  // RAWM HUB family mice and receivers (src/rawm).
  ...RAWM_PRODUCT_IDS,
  // GearHub dongle 0x402d + cable 0x4026, shared by the Lingbao M5 Pro and
  // Attack Shark R2 / R3 (src/gearhub).
  ...GEARHUB_PRODUCTS.keys(),
  // MCHOSE A5 Pro Max, first-generation A5 protocol (src/mchose/a5-gen1.ts).
  ...MCHOSE_A5_GEN1_PRODUCTS.keys(),
  // ASUS ROG Gladius II P502 (src/asus — has no exported subpath, so pinned
  // as a literal like the dedicated Razer drivers above).
  0x1845,
  // Lamzu Inca 8K — wired 0x0009, 1K receiver 0x000f, 8K receiver 0x0010
  // (src/lamzu).
  ...LAMZU_INCA_PRODUCTS.keys(),
  // SteelSeries Rival 3 wired (drivers/steelseries/rival3-hid.ts).
  0x1824, 0x184c,
]);
test("every pinned PID on a coverage claim exists in the protocol registry", () => {
  const withPids: Array<Mouse & { pids: readonly number[] }> = MICE.filter(
    (m): m is Mouse & { pids: readonly number[] } => m.pids !== undefined && (m.status === "supported" || m.status === "quickwin"),
  );
  assert.ok(withPids.length > 0, "no pinned PIDs to validate");
  for (const m of withPids) {
    assert.ok(m.pids.length > 0, `${m.brand} ${m.model}: pids is empty`);
    for (const pid of m.pids) {
      assert.ok(
        PID_UNIVERSE.has(pid),
        `${m.brand} ${m.model}: PID 0x${pid.toString(16)} is not in any @openmouse/protocol registry`,
      );
    }
  }
});

/**
 * The `likely` V3 rows pin product ids even though the coverage test above only
 * validates `supported` rows. They are the one thing separating the V3 driver
 * from the V2's — the two share a usage page — so a typo here would be a device
 * silently claimed by the wrong protocol.
 */
test("the pinned A7 V3 ids belong to the V3 driver, not the V2's", () => {
  const rows = MICE.filter((m) => m.brand === "Mchose" && /^A7 V3/.test(m.model));
  assert.equal(rows.length, 4, "the A7 V3 family is four models");

  for (const row of rows) {
    assert.ok(row.pids?.length, `${row.model}: no pinned pids`);
    for (const pid of row.pids!) {
      assert.ok(
        MCHOSE_V3_PRODUCT_IDS.includes(pid),
        `${row.model}: 0x${pid.toString(16)} is not a V3 id`,
      );
    }
    // Every row pins exactly one model id, and it must be the model the row
    // names — the rest of its pids are the shared receivers.
    const own = row.pids!.filter((pid) => mchoseV3FindProduct(pid) !== null);
    assert.equal(own.length, 1, `${row.model}: should pin exactly one model id`);
    assert.equal(mchoseV3FindProduct(own[0]!)!.name, row.model);
  }
});

test("no A7 V3 row claims to be confirmed on hardware", () => {
  for (const row of MICE.filter((m) => m.brand === "Mchose" && /^A7 V3/.test(m.model))) {
    assert.equal(row.status, "likely", `${row.model}: nothing V3 has been tested`);
    assert.match(row.note ?? "", /not confirmed on hardware|untested/i);
  }
});
