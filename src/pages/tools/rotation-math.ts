export interface RotationSample {
  dx: number;
  dy: number;
}

export interface RotationResult {
  swipes: number;
  /** Degrees to rotate the sensor output, counter-clockwise positive, in [-90, 90]. */
  correction: number;
}

export const MIN_SWIPES = 10;

/**
 * Fit the axis the swipes travel along and return the rotation that levels it.
 * Swipes alternate direction, so the fit uses the second moments of the deltas
 * (sign-free) rather than a line through the path.
 */
export function analyzeSwipes(samples: readonly RotationSample[]): RotationResult | null {
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const { dx, dy } of samples) {
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (sxx + syy === 0) return null;

  // Screen y points down, so a positive angle here is a clockwise tilt.
  const tilt = (0.5 * Math.atan2(2 * sxy, sxx - syy) * 180) / Math.PI;
  // A mostly vertical stroke has no horizontal axis to level.
  if (Math.abs(tilt) > 45) return { swipes: countSwipes(samples), correction: 0 };
  return { swipes: countSwipes(samples), correction: Math.round(tilt * 10) / 10 || 0 };
}

/** Count direction reversals along the horizontal axis, ignoring jitter. */
export function countSwipes(samples: readonly RotationSample[], threshold = 40): number {
  let direction = 0;
  let travelled = 0;
  let swipes = 0;
  for (const { dx } of samples) {
    const sign = Math.sign(dx);
    if (sign === 0) continue;
    if (sign === direction || direction === 0) {
      direction = sign;
      travelled += Math.abs(dx);
      continue;
    }
    if (travelled >= threshold) swipes += 1;
    direction = sign;
    travelled = Math.abs(dx);
  }
  if (travelled >= threshold) swipes += 1;
  return swipes;
}
