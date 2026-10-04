import type { HeroSceneFiles } from "./scene";

// The fixed parts of the home page's opening picture: files made by the
// scripts, and the numbers those scripts print. The words, the buttons and the
// still's own picture and description are content (pages.home.hero); these are
// not, because each is tied to the others.

/** A picture saved at several widths; the browser takes one. */
export type Files = { src: string; width: number }[];

export type HeroArt = {
  /** The router: the model and its baked shading, from scripts/blender/router.py. */
  scene: HeroSceneFiles;
  /**
   * Where the antenna the finger touches is in the still (scripts/media/hero-poster.mjs
   * prints it), as shares of the picture. The live scene reports its own.
   */
  touch: { x: number; y: number };
  /** The arm, cut out of its green-screen pictures by scripts/media/hero-arm.mjs: one arm, with the hand open and pointing. */
  arm: {
    width: number;
    height: number;
    open: Files;
    point: Files;
    /** The pointing fingertip, as shares of the arm's picture (the script prints it). */
    tip: { x: number; y: number };
    /** The arm's width as a share of the whole picture's: what makes the hand the right size next to the router. */
    span: number;
  };
};

export const heroArt: HeroArt = {
  scene: { model: "/models/router-v1.glb", occlusion: "/models/router-v1-ao.webp", floor: "/models/router-v1-floor.webp" },
  touch: { x: 0.4235, y: 0.397 },
  arm: {
    width: 2471,
    height: 631,
    open: [
      { src: "/media/hero-v3/arm-open-1236.webp", width: 1236 },
      { src: "/media/hero-v3/arm-open-2471.webp", width: 2471 },
    ],
    point: [
      { src: "/media/hero-v3/arm-point-1236.webp", width: 1236 },
      { src: "/media/hero-v3/arm-point-2471.webp", width: 2471 },
    ],
    tip: { x: 0.9802, y: 0.2266 },
    span: 0.57,
  },
};

/** The picture's own proportions: the still, the canvas and the arm are all laid out in a box of this shape. */
export const HERO_ASPECT = 16 / 9;
