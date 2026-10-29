export interface RotationSample {
  dx: number;
  dy: number;
}

export interface RotationResult {
  swipes: number;
  /** Degrees to rotate the sensor output, clockwise positive, in [-45, 45]. */
  correction: number;
  /** Standard deviation of the individual swipe angles, in degrees. */
  spread: number;
  /** Standard error of the correction, in degrees: how far a repeat run is likely to differ. */
  margin: number;
}

export const MIN_SWIPES = 10;
/** Enough swipes that hand scatter averages out to well under a degree. */
export const RECOMMENDED_SWIPES = 30;

interface Stroke {
  dx: number;
  dy: number;
}

const toDegrees = (rad: number): number => (rad * 180) / Math.PI;
const round1 = (value: number): number => Math.round(value * 10) / 10 || 0;

/**
 * Fit the axis the swipes travel along and return the rotation that levels it.
 * Each swipe is reduced to its net displacement, so how the browser batches mouse events
 * and the curve of a turnaround do not skew the fit. Swipes alternate direction, so the fit
 * uses the second moments of those vectors (sign-free) rather than a line through the path.
 */
export function analyzeSwipes(samples: readonly RotationSample[]): RotationResult | null {
  if (!samples.some(({ dx, dy }) => dx !== 0 || dy !== 0)) return null;

  const strokes = splitStrokes(samples);
  if (strokes.length === 0) return { swipes: 0, correction: 0, spread: 0, margin: 0 };

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const { dx, dy } of strokes) {
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  // Screen y points down, so a positive tilt here means the swipes run clockwise of
  // horizontal. Levelling them rotates the output the other way, so the correction is
  // the negated tilt, in the clockwise-positive convention mouse software uses.
  const tilt = toDegrees(0.5 * Math.atan2(2 * sxy, sxx - syy));
  // A mostly vertical stroke has no horizontal axis to level.
  if (Math.abs(tilt) > 45) return { swipes: strokes.length, correction: 0, spread: 0, margin: 0 };

  // Spread of the swipe angles around the fitted axis, weighted like the fit itself.
  let weight = 0;
  let variance = 0;
  for (const { dx, dy } of strokes) {
    const angle = toDegrees(Math.atan2(dy * Math.sign(dx), Math.abs(dx)));
    const w = dx * dx + dy * dy;
    variance += w * (angle - tilt) ** 2;
    weight += w;
  }
  const spread = Math.sqrt(variance / weight);
  const margin = strokes.length > 1 ? spread / Math.sqrt(strokes.length) : spread;
  return { swipes: strokes.length, correction: -round1(tilt) || 0, spread: round1(spread), margin: round1(margin) };
}

/** Count strokes along the horizontal axis. A reversal only counts once the move back covers `threshold`. */
export function countSwipes(samples: readonly RotationSample[], threshold = 40): number {
  return splitStrokes(samples, threshold).length;
}

/**
 * Split the movement into strokes along the horizontal axis and return each one's net
 * displacement. A reversal only starts a new stroke once the move back covers `threshold`;
 * shorter back-steps are jitter and stay part of the stroke they interrupt.
 */
function splitStrokes(samples: readonly RotationSample[], threshold = 40): Stroke[] {
  const strokes: Stroke[] = [];
  let direction = 0;
  let run = 0;
  let net: Stroke = { dx: 0, dy: 0 };
  let reverse = 0;
  let back: Stroke = { dx: 0, dy: 0 };
  for (const { dx, dy } of samples) {
    const sign = Math.sign(dx);
    if (sign === 0) {
      (reverse > 0 ? back : net).dy += dy;
      continue;
    }
    if (direction === 0 || sign === direction) {
      direction = sign;
      run += Math.abs(dx);
      net = { dx: net.dx + dx + back.dx, dy: net.dy + dy + back.dy };
      back = { dx: 0, dy: 0 };
      reverse = 0;
      continue;
    }
    reverse += Math.abs(dx);
    back = { dx: back.dx + dx, dy: back.dy + dy };
    if (reverse < threshold) continue;
    if (run >= threshold) strokes.push(net);
    direction = sign;
    run = reverse;
    net = back;
    back = { dx: 0, dy: 0 };
    reverse = 0;
  }
  if (run >= threshold) strokes.push(net);
  return strokes;
}
