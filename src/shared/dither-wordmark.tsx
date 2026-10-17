import { useEffect, useRef, type ReactNode } from "react";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const WORD = "OpenMouse";

export function DitherWordmark(): ReactNode {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const node = canvas.current;
    const context = node?.getContext("2d");
    if (!node || !context) return;

    const draw = (): void => {
      const width = Math.max(1, Math.floor(node.clientWidth));
      const height = Math.max(1, Math.floor(node.clientHeight));
      const cell = width < 700 ? 2 : width < 1000 ? 3 : 4;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      node.width = Math.floor(width * ratio);
      node.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / cell);
      const rows = Math.ceil(height / cell);
      const scratch = document.createElement("canvas");
      scratch.width = cols;
      scratch.height = rows;
      const ink = scratch.getContext("2d", { willReadFrequently: true });
      if (!ink) return;
      let size = 100;
      ink.font = `800 ${size}px "DM Sans", system-ui, sans-serif`;
      size *= (cols * 0.99) / Math.max(1, ink.measureText(WORD).width);
      ink.font = `800 ${size}px "DM Sans", system-ui, sans-serif`;
      const ascent = ink.measureText(WORD).actualBoundingBoxAscent || size * 0.72;
      ink.textAlign = "center";
      ink.textBaseline = "alphabetic";
      ink.fillStyle = "#fff";
      ink.fillText(WORD, cols / 2, Math.max(ascent + 1, rows - 1));
      const pixels = ink.getImageData(0, 0, cols, rows).data;

      context.fillStyle = getComputedStyle(node).getPropertyValue("--dither-ink").trim() || "rgba(214,228,240,0.3)";
      const dot = cell - (cell > 2 ? 1.25 : 0.6);
      for (let y = 0; y < rows; y += 1) {
        const fade = 1 - Math.pow(y / rows, 1.6) * 0.82;
        for (let x = 0; x < cols; x += 1) {
          const level = (pixels[(y * cols + x) * 4 + 3] / 255) * fade;
          if (level > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16) context.fillRect(x * cell, y * cell, dot, dot);
        }
      }
    };

    const observer = new ResizeObserver(draw);
    observer.observe(node);
    void document.fonts?.load('800 100px "DM Sans"').then(draw, draw);
    return () => observer.disconnect();
  }, []);

  return <canvas ref={canvas} className="land-footer-dither" aria-hidden="true" />;
}
