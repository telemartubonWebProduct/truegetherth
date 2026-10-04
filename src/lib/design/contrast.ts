// WCAG 2.x contrast helpers. Used to guard the design tokens today and, later,
// to validate colours an Admin picks in theme settings.

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function parseHexColor(hex: string): [number, number, number] {
  const match = HEX_COLOR.exec(hex.trim());
  if (!match) {
    throw new Error(`Expected a #rgb or #rrggbb colour, received "${hex}"`);
  }
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  return [0, 2, 4].map((start) => Number.parseInt(digits.slice(start, start + 2), 16)) as [
    number,
    number,
    number,
  ];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHexColor(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [lighter, darker] = a > b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

/** AA needs 4.5:1 for body text and 3:1 for large text (24px, or 18.66px bold). */
export function meetsContrastAA(
  foreground: string,
  background: string,
  { largeText = false }: { largeText?: boolean } = {},
): boolean {
  return contrastRatio(foreground, background) >= (largeText ? 3 : 4.5);
}
