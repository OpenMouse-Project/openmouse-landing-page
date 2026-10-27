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

/** Count strokes along the horizontal axis. A reversal only counts once the move back covers `threshold`. */
export function countSwipes(samples: readonly RotationSample[], threshold = 40): number {
  let direction = 0;
  let run = 0;
  let reverse = 0;
  let swipes = 0;
  for (const { dx } of samples) {
    const sign = Math.sign(dx);
    if (sign === 0) continue;
    if (direction === 0 || sign === direction) {
      direction = sign;
      run += Math.abs(dx);
      reverse = 0;
      continue;
    }
    reverse += Math.abs(dx);
    if (reverse < threshold) continue;
    if (run >= threshold) swipes += 1;
    direction = sign;
    run = reverse;
    reverse = 0;
  }
  if (run >= threshold) swipes += 1;
  return swipes;
}
