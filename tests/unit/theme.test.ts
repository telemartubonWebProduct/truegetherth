import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { defaultTheme, derivePalette, mix, theme, themeProblems, themeVariables } from "@/lib/content/theme";

const tokensCss = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");
const token = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`).exec(tokensCss)?.[1];

describe("theme settings", () => {
  it("derive exactly the palette in tokens.css from the default theme", () => {
    const palette = derivePalette(defaultTheme);
    expect(palette.accent).toBe(token("tm-color-red"));
    expect(palette.accentPress).toBe(token("tm-color-red-press"));
    expect(palette.accentWash).toBe(token("tm-color-red-wash"));
    expect(palette.ink).toBe(token("tm-color-ink"));
    expect(palette.muted).toBe(token("tm-color-ink-muted"));
    expect(palette.surface).toBe(token("tm-color-surface"));
    expect(palette.line).toBe(token("tm-color-line"));
    expect(palette.inkSurface).toBe(token("tm-tone-ink-surface"));
    expect(palette.inkLine).toBe(token("tm-tone-ink-line"));
    expect(palette.onInkMuted).toBe(token("tm-tone-ink-muted"));
  });

  it("publish the default theme, which adds no styles to the page", () => {
    expect(content.site.theme).toEqual(defaultTheme);
    expect(themeVariables(defaultTheme)).toEqual({});
  });

  it("accept brand colours that keep 4.5:1 and reject ones that do not", () => {
    expect(themeProblems(defaultTheme)).toEqual([]);
    expect(theme.safeParse({ ...defaultTheme, accent: "#c8102e" }).success).toBe(true);

    const pale = theme.safeParse({ ...defaultTheme, accent: "#ff8a8a" });
    expect(pale.success).toBe(false);
    expect(pale.error?.issues[0].message).toContain("ตัวอักษรบนพื้นสีแบรนด์");

    expect(themeProblems({ ...defaultTheme, muted: "#9ca3af" }).length).toBeGreaterThan(0);
    expect(themeProblems({ ...defaultTheme, ink: "#6b7280" }).length).toBeGreaterThan(0);
    expect(theme.safeParse({ ...defaultTheme, surface: "red" }).success).toBe(false);
  });

  it("turn a changed theme into CSS variables for the colours that changed", () => {
    const variables = themeVariables({ ...defaultTheme, accent: "#c8102e" });
    expect(variables["--tm-color-red"]).toBe("#c8102e");
    expect(variables["--tm-color-red-press"]).toBe(mix("#c8102e", "#000000", 0.2));
    expect(variables["--tm-color-ink"]).toBeUndefined();
    expect(themeVariables({ ...defaultTheme, ink: "#111111" })["--tm-tone-ink-canvas"]).toBe("#111111");
  });
});
