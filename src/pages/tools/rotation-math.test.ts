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
  assert.deepEqual(analyzeSwipes(swipes(0, 12)), { swipes: 12, correction: 0, spread: 0, margin: 0 });
});

test("a clockwise tilt is corrected with a negative angle", () => {
  const result = analyzeSwipes(swipes(7, 12));
  assert.equal(result?.correction, -7);
});

test("a counter-clockwise tilt is corrected with a positive angle", () => {
  const result = analyzeSwipes(swipes(-4.5, 12));
  assert.equal(result?.correction, 4.5);
});

test("returns null with no movement", () => {
  assert.equal(analyzeSwipes([]), null);
});

test("ignores jitter when counting swipes", () => {
  const jitter = Array.from({ length: 30 }, (_, i) => ({ dx: i % 2 ? 1 : -1, dy: 0 }));
  assert.equal(countSwipes(jitter), 0);
});

test("one-way motion with small backward jitter is a single swipe", () => {
  const samples = Array.from({ length: 20 }, (_, i) => ({ dx: i % 2 === 0 ? 50 : -1, dy: 0 }));
  assert.equal(countSwipes(samples), 1);
});

test("identical swipes have no spread", () => {
  const result = analyzeSwipes(swipes(7, 12));
  assert.equal(result?.spread, 0);
  assert.equal(result?.margin, 0);
});

test("scattered swipes report a spread and a margin that shrinks with more swipes", () => {
  const scattered = (count: number): RotationSample[] =>
    Array.from({ length: count }, (_, i) => swipes(5 + (i % 2 === 0 ? 2 : -2), 1)).flatMap((one, i) =>
      i % 2 === 0 ? one : one.map(({ dx, dy }) => ({ dx: -dx, dy: -dy })),
    );
  const few = analyzeSwipes(scattered(10));
  const many = analyzeSwipes(scattered(40));
  assert.equal(few?.correction, -5);
  assert.equal(few?.spread, 2);
  assert.ok(many && few && many.margin < few.margin);
});

test("batching of mouse events does not change the result", () => {
  const fine = swipes(6, 12);
  const coarse: RotationSample[] = [];
  for (let i = 0; i < fine.length; i += 4) {
    const chunk = fine.slice(i, i + 4);
    coarse.push({ dx: chunk.reduce((a, s) => a + s.dx, 0), dy: chunk.reduce((a, s) => a + s.dy, 0) });
  }
  assert.deepEqual(analyzeSwipes(coarse), analyzeSwipes(fine));
});
