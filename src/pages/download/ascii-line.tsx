import { useEffect, useMemo, useRef, type ReactNode } from "react";

/* A one-line ASCII divider. The base line is a seeded signal: unbroken, dense in some
   stretches and thin in others, so the same seed always draws the same line.
   While it is on screen a few characters at a time glitch to a neighbouring
   level or a stray symbol, then settle back. Nothing moves for visitors who
   ask for reduced motion, and the line is hidden from assistive tech. */

const RAMP = ".:-=+*#";
const GLITCH = "01/\\|<>_~^";
const TICK_MS = 130;

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

function baseLine(seed: number, cols: number): string[] {
  const rand = seeded(seed);
  const p1 = rand() * Math.PI * 2;
  const p2 = rand() * Math.PI * 2;
  const p3 = rand() * Math.PI * 2;
  return Array.from({ length: cols }, (_, x) => {
    const edge = Math.sin((Math.PI * x) / (cols - 1)) ** 0.7;
    const pulse = 0.5 + 0.5 * Math.sin(x * 0.085 + p1) * Math.cos(x * 0.029 + p2) + 0.18 * Math.sin(x * 0.21 + p3);
    const level = Math.max(0, pulse) * edge * 0.9 + (rand() - 0.5) * 0.12;
    return RAMP[Math.max(0, Math.min(RAMP.length - 1, Math.floor(level * RAMP.length)))]!;
  });
}

export function AsciiLine({ seed, cols, className }: { seed: number; cols: number; className?: string }): ReactNode {
  const base = useMemo(() => baseLine(seed, cols), [seed, cols]);
  const ref = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rand = seeded(seed * 7919 + 13);
    const live = new Map<number, { char: string; ttl: number }>();
    let timer = 0;

    const tick = (): void => {
      for (const [index, glitch] of live) {
        if (--glitch.ttl <= 0) live.delete(index);
      }
      const spawn = rand() < 0.7 ? 1 + Math.floor(rand() * 3) : 0;
      for (let i = 0; i < spawn; i++) {
        const index = 4 + Math.floor(rand() * (cols - 8));
        const stray = rand() < 0.35;
        const level = RAMP.indexOf(base[index]!) + (rand() < 0.5 ? -1 : 1);
        const char = stray ? GLITCH[Math.floor(rand() * GLITCH.length)]! : RAMP[Math.max(0, Math.min(RAMP.length - 1, level))]!;
        live.set(index, { char, ttl: 2 + Math.floor(rand() * 3) });
      }
      el.textContent = base.map((char, index) => live.get(index)?.char ?? char).join("");
    };

    const start = (): void => {
      if (!timer) timer = window.setInterval(tick, TICK_MS);
    };
    const stop = (): void => {
      window.clearInterval(timer);
      timer = 0;
    };
    // Only animate while the line is actually on screen.
    const observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
    observer.observe(el);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [base, cols, seed]);

  return (
    <pre ref={ref} className={className} aria-hidden="true">
      {base.join("")}
    </pre>
  );
}
