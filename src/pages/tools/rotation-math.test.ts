import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeSwipes, countSwipes, type RotationSample } from "./rotation-math.ts";

function swipes(angleDeg: number, count: number): RotationSample[] {
  const rad = (angleDeg * Math.PI) / 180;
  const out: RotationSample[] = [];
  for (let i = 0; i < count; i += 1) {
    const sign = i % 2 === 0 ? 1 : -1;
    for (let step = 0; step < 20; step += 1) {
      out.push({ dx: sign * 10 * Math.cos(rad), dy: sign * 10 * Math.sin(rad) });
    }
  }
  return out;
}

test("level swipes need no correction", () => {
  assert.deepEqual(analyzeSwipes(swipes(0, 12)), { swipes: 12, correction: 0 });
});

test("recovers a clockwise tilt as its own angle", () => {
  const result = analyzeSwipes(swipes(7, 12));
  assert.equal(result?.correction, 7);
});

test("recovers a counter-clockwise tilt as a negative angle", () => {
  const result = analyzeSwipes(swipes(-4.5, 12));
  assert.equal(result?.correction, -4.5);
});

test("returns null with no movement", () => {
  assert.equal(analyzeSwipes([]), null);
});

test("ignores jitter when counting swipes", () => {
  const jitter = Array.from({ length: 30 }, (_, i) => ({ dx: i % 2 ? 1 : -1, dy: 0 }));
  assert.equal(countSwipes(jitter), 0);
});
