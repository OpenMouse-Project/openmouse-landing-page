export interface PollingSnapshot {
  samples: number;
  /** Reports per second over all active movement. */
  average: number;
  /** Reports per second over the most recent gaps. */
  current: number;
  /** Highest reading of `current` seen so far. */
  peak: number;
}

/** Gaps longer than this are pauses in movement, not the mouse's report rate. */
export const PAUSE_MS = 100;
const WINDOW = 50;
const MIN_WINDOW = 5;
const STANDARD_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

const rate = (gaps: readonly number[]): number => {
  const total = gaps.reduce((sum, gap) => sum + gap, 0);
  return total > 0 ? (1000 * gaps.length) / total : 0;
};

/** Turns a stream of pointer report timestamps (ms) into polling rate readings. */
export class PollingMeter {
  private last: number | null = null;
  private activeMs = 0;
  private gapCount = 0;
  private recent: number[] = [];
  private peak = 0;
  private samples = 0;

  push(timestamp: number): void {
    this.samples += 1;
    if (this.last !== null) {
      const gap = timestamp - this.last;
      if (gap >= 0 && gap <= PAUSE_MS) {
        this.activeMs += gap;
        this.gapCount += 1;
        this.recent.push(gap);
        if (this.recent.length > WINDOW) this.recent.shift();
        if (this.recent.length === WINDOW) this.peak = Math.max(this.peak, rate(this.recent));
      }
    }
    this.last = timestamp;
  }

  /** Call when the pointer leaves, so the time away is not read as one long gap. */
  pause(): void {
    this.last = null;
  }

  snapshot(): PollingSnapshot | null {
    if (this.activeMs <= 0) return null;
    const current = this.recent.length >= MIN_WINDOW ? rate(this.recent) : 0;
    return {
      samples: this.samples,
      average: (1000 * this.gapCount) / this.activeMs,
      current,
      peak: Math.max(this.peak, current),
    };
  }
}

/** The common polling rate closest to `hz`, or null when none is within 15%. */
export function nearestStandardRate(hz: number): number | null {
  if (hz <= 0) return null;
  let best: number = STANDARD_RATES[0];
  for (const candidate of STANDARD_RATES) {
    if (Math.abs(Math.log(hz / candidate)) < Math.abs(Math.log(hz / best))) best = candidate;
  }
  return Math.abs(hz - best) / best <= 0.15 ? best : null;
}
