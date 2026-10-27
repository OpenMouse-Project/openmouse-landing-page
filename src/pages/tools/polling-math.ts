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
/** Peak is only read over at least this much movement, so bursts of reports with near-identical timestamps average out. */
const PEAK_WINDOW_MS = 250;
/** Current needs at least this much movement before it reads anything. */
const CURRENT_WINDOW_MS = 50;
const STANDARD_RATES = [125, 250, 500, 1000, 2000, 4000, 8000] as const;

/** Turns a stream of pointer report timestamps (ms) into polling rate readings. */
export class PollingMeter {
  private last: number | null = null;
  private activeMs = 0;
  private gapCount = 0;
  private samples = 0;
  private peak = 0;
  // The most recent gaps, trimmed from the front once they cover more than PEAK_WINDOW_MS.
  private gaps: number[] = [];
  private head = 0;
  private windowMs = 0;

  push(timestamp: number): void {
    this.samples += 1;
    if (this.last !== null) {
      const gap = timestamp - this.last;
      if (gap >= 0 && gap <= PAUSE_MS) {
        this.activeMs += gap;
        this.gapCount += 1;
        this.gaps.push(gap);
        this.windowMs += gap;
        while (this.windowMs - this.gaps[this.head] >= PEAK_WINDOW_MS) this.windowMs -= this.gaps[this.head++];
        if (this.head > 4096) {
          this.gaps = this.gaps.slice(this.head);
          this.head = 0;
        }
        if (this.windowMs >= PEAK_WINDOW_MS) this.peak = Math.max(this.peak, this.windowRate());
      }
    }
    this.last = timestamp;
  }

  /** Call when the pointer leaves, so the time away is not read as one long gap. */
  pause(): void {
    this.last = null;
    this.gaps = [];
    this.head = 0;
    this.windowMs = 0;
  }

  snapshot(): PollingSnapshot | null {
    if (this.activeMs <= 0) return null;
    return {
      samples: this.samples,
      average: (1000 * this.gapCount) / this.activeMs,
      current: this.windowMs >= CURRENT_WINDOW_MS ? this.windowRate() : 0,
      peak: this.peak,
    };
  }

  private windowRate(): number {
    return this.windowMs > 0 ? (1000 * (this.gaps.length - this.head)) / this.windowMs : 0;
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
