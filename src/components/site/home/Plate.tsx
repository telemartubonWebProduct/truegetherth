"use client";

import { useEffect, useRef } from "react";

// Generated plates: drawn on a canvas, no image files. "field" is a bed of
// short strokes that drift like signal moving through fibre; "contour" is a
// stack of slow waves, every fifth one red. They animate only while on screen,
// and hold a single still frame for visitors who ask for reduced motion. A new
// drawing is a new picture for the browser to take up, which on a phone costs
// more than the drawing itself: they drift slowly, so thirty a second is
// plenty, and a plate that something covers (data-rest on its box, set by
// ScrollDriver for the slip's) draws nothing.

type Kind = "field" | "contour";

const RED = "230, 0, 18";

function drawField(context: CanvasRenderingContext2D, width: number, height: number, time: number, ink: string) {
  context.clearRect(0, 0, width, height);
  const gap = Math.max(18, Math.min(30, width / 22));
  const columns = Math.ceil(width / gap) + 1;
  const rows = Math.ceil(height / gap) + 1;
  context.lineCap = "round";
  context.lineWidth = Math.max(1.25, gap / 14);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const drift = Math.sin(time * 0.6 + index * 0.37) * 0.5 + Math.sin(time * 0.23 + row * 0.9) * 0.5;
      const angle = -0.6 + drift * 0.5;
      const length = gap * (0.32 + 0.16 * Math.sin(time * 0.4 + column * 0.6));
      const x = column * gap + Math.sin(time * 0.3 + row) * 2;
      const y = row * gap + Math.cos(time * 0.27 + column) * 2;
      const alpha = 0.05 + 0.14 * (0.5 + 0.5 * Math.sin(time * 0.5 + index * 0.21));
      context.strokeStyle = index % 7 === 0 ? `rgba(${ink}, ${alpha * 1.6})` : `rgba(${RED}, ${alpha})`;
      context.beginPath();
      context.moveTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length);
      context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      context.stroke();
    }
  }
}

function drawContour(context: CanvasRenderingContext2D, width: number, height: number, time: number, ink: string) {
  context.clearRect(0, 0, width, height);
  const lines = 22;
  context.lineWidth = Math.max(1, width / 1100);
  for (let line = 0; line < lines; line += 1) {
    const base = (height * (line + 1.5)) / (lines + 2);
    const amplitude = height * (0.018 + 0.012 * Math.sin(line * 0.7));
    context.strokeStyle = line % 5 === 2 ? `rgba(${RED}, 0.85)` : `rgba(${ink}, ${0.1 + 0.012 * line})`;
    context.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const u = x / width;
      const y =
        base +
        Math.sin(u * 6.2 + time * 0.35 + line * 0.55) * amplitude +
        Math.sin(u * 1.7 - time * 0.12 + line * 0.21) * amplitude * 2.4;
      if (x === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }
}

export function Plate({ kind, tone = "light", className = "" }: { kind: Kind; tone?: "light" | "dark"; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ink = tone === "dark" ? "255, 255, 255" : "11, 11, 12";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = kind === "field" ? drawField : drawContour;
    let frame = 0;
    let visible = false;
    let width = 0;
    let height = 0;
    let drawn = -Infinity;

    const paint = (now: number) => {
      frame = 0;
      const resting = canvas.parentElement?.hasAttribute("data-rest") ?? false;
      if (!resting && now - drawn >= 30) {
        drawn = now;
        draw(context, width, height, still ? 4 : now / 1000, ink);
      }
      if (visible && !still) frame = requestAnimationFrame(paint);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const size = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      // A canvas that changes size is wiped: draw at once.
      drawn = -Infinity;
      kick();
    };

    const resized = new ResizeObserver(size);
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });
    resized.observe(canvas);
    seen.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      seen.disconnect();
    };
  }, [kind, tone]);

  return <canvas ref={ref} className={`plate ${className}`.trim()} aria-hidden="true" />;
}
