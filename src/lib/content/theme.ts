import { z } from "zod";

import { contrastRatio, parseHexColor } from "@/lib/design/contrast";

// Theme settings an Admin may change (docs/renovation/R5-LANDING.md):
// six brand colours, checked for WCAG AA before they can be saved, and a
// background tone for each section of the fixed layout. Everything else in
// the palette is derived, so no combination can break text contrast.

export const hexColor = z.string().regex(/^#[0-9a-f]{6}$/, "ใช้รหัสสีแบบ #rrggbb ตัวพิมพ์เล็ก");

/** Section backgrounds: white, light grey, a wash of the brand colour, or black. */
export const toneIds = ["canvas", "surface", "wash", "ink"] as const;
export const tone = z.enum(toneIds);
export type Tone = z.infer<typeof tone>;

export const themeColors = z.strictObject({
  /** The one colour of the page: prices, meters, the live step (signal red). */
  accent: hexColor,
  /** Text and the dark section tone. */
  ink: hexColor,
  /** Secondary text. */
  muted: hexColor,
  /** Light grey sections and panels. */
  surface: hexColor,
  /** Hairlines and card borders. */
  line: hexColor,
  /** A second dark tone for highlights behind white text (graphite). */
  glow: hexColor,
});
export type ThemeColors = z.infer<typeof themeColors>;

export const defaultTheme: ThemeColors = {
  accent: "#e60012",
  ink: "#0b0b0c",
  muted: "#5c5c61",
  surface: "#f4f4f6",
  line: "#e2e2e6",
  glow: "#3a3a40",
};

const white = "#ffffff";
const black = "#000000";

function toHex(channels: number[]): string {
  return `#${channels.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes `color` towards `target`; amount 0 keeps the colour, 1 gives the target. */
export function mix(color: string, target: string, amount: number): string {
  const from = parseHexColor(color);
  const to = parseHexColor(target);
  return toHex(from.map((value, index) => value + (to[index] - value) * amount));
}

/** The full palette a theme produces. With the default theme it equals src/styles/tokens.css. */
export function derivePalette(theme: ThemeColors) {
  return {
    canvas: white,
    ink: theme.ink,
    muted: theme.muted,
    surface: theme.surface,
    line: theme.line,
    accent: theme.accent,
    accentPress: mix(theme.accent, black, 0.2),
    accentWash: mix(theme.accent, white, 0.92),
    onAccent: white,
    onInk: white,
    onInkMuted: "#d4d4d8",
    inkSurface: mix(theme.ink, white, 0.1),
    inkLine: mix(theme.ink, white, 0.25),
    glow: theme.glow,
  };
}

/** Text/background pairs the renderer uses, each needing 4.5:1. */
export function themeContrastPairs(theme: ThemeColors) {
  const p = derivePalette(theme);
  return [
    { label: "ตัวอักษรบนพื้นขาว", foreground: p.ink, background: p.canvas },
    { label: "ตัวอักษรรองบนพื้นขาว", foreground: p.muted, background: p.canvas },
    { label: "ตัวอักษรบนพื้นเทา", foreground: p.ink, background: p.surface },
    { label: "ตัวอักษรรองบนพื้นเทา", foreground: p.muted, background: p.surface },
    { label: "ตัวอักษรบนพื้นสีแบรนด์อ่อน", foreground: p.ink, background: p.accentWash },
    { label: "ตัวอักษรรองบนพื้นสีแบรนด์อ่อน", foreground: p.muted, background: p.accentWash },
    { label: "ตัวอักษรบนพื้นสีแบรนด์", foreground: p.onAccent, background: p.accent },
    { label: "ตัวอักษรบนพื้นดำ", foreground: p.onInk, background: p.ink },
    { label: "ตัวอักษรรองบนพื้นดำ", foreground: p.onInkMuted, background: p.ink },
    { label: "ตัวอักษรรองบนแผงในพื้นดำ", foreground: p.onInkMuted, background: p.inkSurface },
    { label: "ตัวอักษรบนพื้นสีรอง", foreground: p.onInk, background: p.glow },
  ];
}

/** Pairs below 4.5:1, described for the editor. Empty when the theme is usable. */
export function themeProblems(theme: ThemeColors): string[] {
  return themeContrastPairs(theme)
    .map((pair) => ({ ...pair, ratio: contrastRatio(pair.foreground, pair.background) }))
    .filter((pair) => pair.ratio < 4.5)
    .map((pair) => `${pair.label} ต่างกันเพียง ${pair.ratio.toFixed(2)}:1 (ต้องอย่างน้อย 4.5:1)`);
}

const hexPattern = /^#[0-9a-f]{6}$/;

export const theme = themeColors.superRefine((value, context) => {
  // Zod runs refinements after field errors too; contrast needs valid colours.
  if (!Object.values(value).every((color) => typeof color === "string" && hexPattern.test(color))) return;
  for (const message of themeProblems(value)) context.addIssue({ code: "custom", message });
});

/**
 * CSS custom properties that apply a theme to a `.tm-site` element. Only the
 * values that differ from the defaults in tokens.css are returned, so the
 * default theme adds nothing to the page.
 */
export function themeVariables(value: ThemeColors): Record<string, string> {
  const current = derivePalette(value);
  const base = derivePalette(defaultTheme);
  const variables: Record<string, [keyof typeof current, ...string[]]> = {
    accent: ["accent", "--tm-color-red"],
    accentPress: ["accentPress", "--tm-color-red-press"],
    accentWash: ["accentWash", "--tm-color-red-wash"],
    ink: ["ink", "--tm-color-ink", "--tm-color-focus", "--tm-tone-ink-canvas"],
    muted: ["muted", "--tm-color-ink-muted"],
    surface: ["surface", "--tm-color-surface"],
    line: ["line", "--tm-color-line"],
    inkSurface: ["inkSurface", "--tm-tone-ink-surface"],
    inkLine: ["inkLine", "--tm-tone-ink-line"],
    glow: ["glow", "--tm-color-glow"],
  };
  const style: Record<string, string> = {};
  for (const [key, ...names] of Object.values(variables)) {
    if (current[key] === base[key]) continue;
    for (const name of names) style[name] = current[key];
  }
  return style;
}
