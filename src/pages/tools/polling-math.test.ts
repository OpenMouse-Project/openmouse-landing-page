import assert from "node:assert/strict";
import { test } from "node:test";
import { nearestStandardRate, PollingMeter } from "./polling-math.ts";

function feed(meter: PollingMeter, intervalMs: number, count: number, start = 0): number {
  let t = start;
  for (let i = 0; i < count; i += 1) {
    meter.push(t);
    t += intervalMs;
  }
  return t;
}

test("reads a steady 1000 Hz stream", () => {
  const meter = new PollingMeter();
  feed(meter, 1, 200);
  const snap = meter.snapshot();
  assert.equal(Math.round(snap?.average ?? 0), 1000);
  assert.equal(Math.round(snap?.current ?? 0), 1000);
  assert.equal(Math.round(snap?.peak ?? 0), 1000);
});

test("reads a steady 125 Hz stream", () => {
  const meter = new PollingMeter();
  feed(meter, 8, 100);
  assert.equal(Math.round(meter.snapshot()?.average ?? 0), 125);
});

test("pauses in movement do not drag the average down", () => {
  const meter = new PollingMeter();
  const end = feed(meter, 2, 100);
  feed(meter, 2, 100, end + 1500);
  assert.equal(Math.round(meter.snapshot()?.average ?? 0), 500);
});

test("leaving and re-entering is not counted as a gap", () => {
  const meter = new PollingMeter();
  const end = feed(meter, 1, 100);
  meter.pause();
  feed(meter, 1, 100, end + 50);
  assert.equal(Math.round(meter.snapshot()?.average ?? 0), 1000);
});

test("has no reading before there are two reports", () => {
  const meter = new PollingMeter();
  assert.equal(meter.snapshot(), null);
  meter.push(0);
  assert.equal(meter.snapshot(), null);
});

test("snaps to a standard rate only when close", () => {
  assert.equal(nearestStandardRate(980), 1000);
  assert.equal(nearestStandardRate(7600), 8000);
  assert.equal(nearestStandardRate(700), null);
  assert.equal(nearestStandardRate(0), null);
});

test("peak never drops once seen, even before the full window fills", () => {
  const meter = new PollingMeter();
  feed(meter, 1, 10);
  const early = meter.snapshot()?.peak ?? 0;
  feed(meter, 8, 5, 20);
  assert.ok((meter.snapshot()?.peak ?? 0) >= early);
});
