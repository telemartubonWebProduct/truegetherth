// The fixed parts of the home page's opening picture: an oil painting cut into
// layers (design/hero/tableau/README.md). The files and where each layer sits
// are written by scripts/media/hero-tableau.mjs to hero-tableau.ts. The words,
// the buttons and the sky's own picture and description are content
// (pages.home.hero); these are not, because each is tied to the others.

/** A picture saved at several widths, narrowest first; the browser takes one. */
export type Files = { src: string; width: number }[];

/** The thin signal frame hung on a layer, in shares of the layer's own box: left, top, width, height. */
export type HeroFrame = { box: number[]; reading?: string; mark?: boolean };

/** One cut-out, placed in the picture in shares of the picture's width (x, w) and height (y, h). */
export type HeroLayer = {
  id: string;
  files: Files;
  x: number;
  y: number;
  w: number;
  h: number;
  /** How far it shifts with the pointer and the scroll: more for what is nearer. */
  depth: number;
  /** How far it floats up and down on its own (share of the picture's height), tilts (degrees) and drifts sideways (share of the width). */
  bob: number;
  turn: number;
  sway: number;
  /** One such movement, in seconds. */
  time: number;
  frame?: HeroFrame;
};

/** One arrangement of the painting: the sky, and the layers over it from back to front. */
export type HeroPack = { width: number; height: number; sky: Files; layers: HeroLayer[] };

export type HeroTableau = {
  /** The True Online mark shown on the router's frame: the owner's own asset, never a generated one. */
  mark: { src: string; width: number; height: number };
  /** `wide` covers a desktop screen; `tall` stands above the headline on a phone or an upright tablet. */
  packs: { wide: HeroPack; tall: HeroPack };
};

export { heroTableau as heroArt } from "./hero-tableau";
