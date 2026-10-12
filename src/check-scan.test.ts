import { test } from "node:test";
import assert from "node:assert/strict";
import { brandFor } from "./check-scan.ts";

test("the shared K-snake/AJAZZ vendor ids resolve by product id", () => {
  // The NJ07 MC and its family are AJAZZ even though the vendor id is
  // K-snake's; the diagnostic used to call every 0xA8A5 device "K-snake".
  for (const pid of [0x2157, 0x2158, 0x2167, 0x2168, 0x2177, 0x2178]) {
    assert.equal(brandFor(0xa8a4, pid), "AJAZZ");
    assert.equal(brandFor(0xa8a5, pid), "AJAZZ");
  }
  assert.equal(brandFor(0xa8a4, 0x2255), "K-snake");
  assert.equal(brandFor(0xa8a5, 0x2255), "K-snake");
});

test("an unknown product on the shared vendor ids stays ambiguous", () => {
  assert.equal(brandFor(0xa8a5, 0x1234), "K-snake / AJAZZ");
});

test("other vendor ids keep their plain brand label", () => {
  assert.equal(brandFor(0x1532, 0x0001), "Razer");
  assert.equal(brandFor(0x3367, 0x0001), "Endgame Gear");
  assert.equal(brandFor(0x9999, 0x0001), null);
});
