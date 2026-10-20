import type { ReactNode } from "react";

/* A decorative glow drawn in text. The characters come from a seeded noise
   field, so the same props always give the same picture and nothing shifts
   between renders. It is tinted with the accent token in CSS (.lp-ascii) and
   hidden from assistive tech. */

const RAMP = " .:-=+*#%@";
/* A monospace cell is taller than it is wide; distances are measured in
   "rows" so a glow stays round instead of stretching sideways. */
const CELL_ASPECT = 0.43;

export interface AsciiFieldProps {
  seed: number;
  cols: number;
  rows: number;
  /** Centre of the glow as a fraction of the box on each axis. May sit outside 0..1. */
  origin: readonly [number, number];
  /** Radius of the glow as a fraction of the box width. */
  reach: number;
  /** Above 1 flattens the glow vertically, for a low band instead of a round pool. */
  squash?: number;
  className?: string;
}

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

const cache = new Map<string, string>();

function draw({ seed, cols, rows, origin, reach, squash = 1 }: AsciiFieldProps): string {
  const key = `${seed}:${cols}:${rows}:${origin[0]}:${origin[1]}:${reach}:${squash}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  const rand = seeded(seed);
  const gridCols = 14;
  const gridRows = Math.max(2, Math.round((gridCols * rows) / (cols * CELL_ASPECT)));
  const grid = Array.from({ length: gridRows + 2 }, () => Array.from({ length: gridCols + 2 }, () => rand()));
  const noise = (x: number, y: number): number => {
    const gx = (x / cols) * gridCols;
    const gy = (y / rows) * gridRows;
    const ix = Math.floor(gx);
    const iy = Math.floor(gy);
    const fx = smooth(gx - ix);
    const fy = smooth(gy - iy);
    const top = grid[iy]![ix]! * (1 - fx) + grid[iy]![ix + 1]! * fx;
    const bottom = grid[iy + 1]![ix]! * (1 - fx) + grid[iy + 1]![ix + 1]! * fx;
    return top * (1 - fy) + bottom * fy;
  };

  const ox = origin[0] * cols;
  const oy = origin[1] * rows;
  const radius = reach * cols * CELL_ASPECT;
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const d = Math.hypot((x - ox) * CELL_ASPECT, (y - oy) * squash) / radius;
      const glow = Math.max(0, 1 - d) ** 1.1;
      const level = glow * (0.6 + 0.4 * noise(x, y)) + (rand() - 0.5) * 0.06;
      const index = Math.min(RAMP.length - 1, Math.floor(level * RAMP.length * 1.35));
      line += index > 0 ? RAMP[index] : " ";
    }
    lines.push(line.replace(/\s+$/, ""));
  }
  const text = lines.join("\n");
  cache.set(key, text);
  return text;
}

export function AsciiField(props: AsciiFieldProps): ReactNode {
  return (
    <pre className={`lp-ascii${props.className ? ` ${props.className}` : ""}`} aria-hidden="true">
      {draw(props)}
    </pre>
  );
}

export interface AsciiWaveProps {
  seed: number;
  cols: number;
  rows: number;
  className?: string;
}

const waveCache = new Map<string, string>();

/* A horizontal signal trace: a dense centre line whose thickness swells and
   thins along its length, fading to nothing at both ends. Used as a divider. */
function drawWave({ seed, cols, rows }: AsciiWaveProps): string {
  const key = `${seed}:${cols}:${rows}`;
  const hit = waveCache.get(key);
  if (hit !== undefined) return hit;

  const rand = seeded(seed);
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;
  const mid = (rows - 1) / 2;
  const lines: string[] = [];
  const swell = Array.from({ length: cols }, (_, x) => {
    const edge = Math.sin((Math.PI * x) / (cols - 1)) ** 0.7;
    const pulse = 0.5 + 0.5 * Math.sin(x * 0.085 + p1) * Math.cos(x * 0.029 + p2) + 0.18 * Math.sin(x * 0.21 + p3);
    return { edge, thick: 0.4 + Math.max(0, pulse) * (mid + 0.3) * edge };
  });
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const { edge, thick } = swell[x]!;
      const dy = Math.abs(y - mid);
      const level = Math.exp(-(dy * dy) / (2 * thick * thick)) * (0.3 + 0.7 * edge) + (rand() - 0.5) * 0.08;
      const index = Math.min(RAMP.length - 1, Math.floor(level * RAMP.length));
      line += index > 0 ? RAMP[index] : " ";
    }
    lines.push(line.replace(/\s+$/, ""));
  }
  const text = lines.join("\n");
  waveCache.set(key, text);
  return text;
}

export function AsciiWave(props: AsciiWaveProps): ReactNode {
  return (
    <pre className={`lp-ascii${props.className ? ` ${props.className}` : ""}`} aria-hidden="true">
      {drawWave(props)}
    </pre>
  );
}
