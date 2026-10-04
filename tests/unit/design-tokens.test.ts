import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, meetsContrastAA, parseHexColor } from "@/lib/design/contrast";

const tokensCss = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})\\s*;`).exec(tokensCss);
  if (!match) throw new Error(`Token --${name} is not a hex colour in tokens.css`);
  return match[1];
}

describe("contrast helpers", () => {
  it("parses short and long hex colours", () => {
    expect(parseHexColor("#fff")).toEqual([255, 255, 255]);
    expect(parseHexColor("#E60012")).toEqual([230, 0, 18]);
    expect(() => parseHexColor("red")).toThrow();
  });

  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });

  it("applies the large-text threshold", () => {
    expect(meetsContrastAA("#777777", "#ffffff")).toBe(false);
    expect(meetsContrastAA("#777777", "#ffffff", { largeText: true })).toBe(true);
  });
});

describe("The design tokens meet WCAG AA for body text", () => {
  const pairs: Array<[string, string, string]> = [
    ["ink on canvas", "tm-color-ink", "tm-color-canvas"],
    ["muted text on canvas", "tm-color-ink-muted", "tm-color-canvas"],
    ["muted text on surface", "tm-color-ink-muted", "tm-color-surface"],
    ["red link text on canvas", "tm-color-red", "tm-color-canvas"],
    ["text on the red action", "tm-color-on-red", "tm-color-red"],
    ["text on the pressed red action", "tm-color-on-red", "tm-color-red-press"],
    ["text on ink surfaces", "tm-color-on-ink", "tm-color-ink"],
    ["danger text on its wash", "tm-color-danger", "tm-color-danger-wash"],
    ["success text on its wash", "tm-color-success", "tm-color-success-wash"],
    ["red text on its wash", "tm-color-red-press", "tm-color-red-wash"],
  ];

  it.each(pairs)("%s", (_label, foreground, background) => {
    const ratio = contrastRatio(token(foreground), token(background));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
