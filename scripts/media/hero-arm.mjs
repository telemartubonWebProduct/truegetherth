// Cuts the robot arm out of its green-screen pictures:  node scripts/media/hero-arm.mjs [--debug]
//
// The sources (design/hero/parts/) are two generated pictures of the same arm
// in the same place on flat green: the hand open, and the hand pointing. The
// page lays one over the other and fades between them as the arm reaches in.
//
// The arm is white, grey, black and chrome, so green tells the two apart
// completely: how much greener a pixel is than it is red or blue is how much
// backdrop is in it. And since the arm has no colour of its own, it is saved in
// grey, taken from red and blue only, which leaves no green on its edges or in
// its reflections.
// A new picture goes in a new folder (hero-v4…): the files are cached for a week.
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const parts = "design/hero/parts";
// (The generator named the files by its own guess: the one called "pointing" is the open hand.)
const poses = {
  open: "Robot_arm_pointing_index_finger_2K_20261003193014.jpg",
  point: "Studio_product_photograph_of_a_2K_20261003193111.jpg",
};
const out = "public/media/hero-v3";
const debug = process.argv.includes("--debug") ? "shots" : null;
/** Greener than red and blue by less than LOW: arm. By more than HIGH: backdrop. Between: the edge. */
const LOW = 26;
const HIGH = 104;
/** Only this near to plain backdrop can a pixel be an edge; further in, green is a reflection on the arm. */
const EDGE = 4;
/** How much the arm is brightened. */
const LIFT = 1.1;
/** The sizes written, as shares of the full picture. */
const SCALES = [1, 0.5];

const smooth = (value, from, to) => {
  const t = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

async function cut(file) {
  const { data, info } = await sharp(path.join(parts, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const green = new Float32Array(W * H);
  const plain = new Uint8Array(W * H);
  let red = 0;
  let blue = 0;
  let count = 0;
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3];
    const g = data[i * 3 + 1];
    const b = data[i * 3 + 2];
    green[i] = g - Math.max(r, b);
    if (green[i] > HIGH) {
      plain[i] = 1;
      red += r;
      blue += b;
      count++;
    }
  }
  // The backdrop's own red and blue, to take out of the pixels it is mixed into.
  red /= count;
  blue /= count;

  // Plain backdrop, grown by EDGE pixels: where an edge may be.
  const near = new Uint8Array(W * H);
  const pass = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let found = 0;
      for (let k = -EDGE; k <= EDGE && !found; k++) if (x + k >= 0 && x + k < W) found = plain[y * W + x + k];
      pass[y * W + x] = found;
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let found = 0;
      for (let k = -EDGE; k <= EDGE && !found; k++) if (y + k >= 0 && y + k < H) found = pass[(y + k) * W + x];
      near[y * W + x] = found;
    }
  }

  const pixels = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    const solid = near[i] ? 1 - smooth(green[i], LOW, HIGH) : 1;
    // Tighten the edge a little: the outermost fringe is mostly backdrop.
    const alpha = smooth(solid, 0.12, 0.92);
    let grey = 0;
    if (alpha > 0) {
      const r = (data[i * 3] - (1 - solid) * red) / Math.max(solid, 0.05);
      const b = (data[i * 3 + 2] - (1 - solid) * blue) / Math.max(solid, 0.05);
      // A little brighter than it was shot: the router beside it is drawn in a brighter white.
      grey = Math.max(0, Math.min(255, ((r + b) / 2) * LIFT));
    }
    pixels[i * 4] = pixels[i * 4 + 1] = pixels[i * 4 + 2] = grey;
    pixels[i * 4 + 3] = Math.round(alpha * 255);
  }
  return { pixels, W, H };
}

const cuts = {};
for (const [pose, file] of Object.entries(poses)) cuts[pose] = await cut(file);
const { W, H } = cuts.point;

// One box round both poses, so they stay in register when the page stacks them.
let top = H;
let bottom = 0;
let right = 0;
for (const { pixels } of Object.values(cuts)) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pixels[(y * W + x) * 4 + 3] < 128) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x > right) right = x;
    }
  }
}
const margin = 24;
const box = { left: 0, top: Math.max(0, top - margin), width: Math.min(W, right + margin), height: 0 };
box.height = Math.min(H, bottom + margin) - box.top;

// The fingertip of the pointing hand: the furthest right the arm reaches.
const { pixels: pointing } = cuts.point;
let tipX = 0;
for (let x = W - 1; x >= 0 && !tipX; x--) for (let y = 0; y < H; y++) if (pointing[(y * W + x) * 4 + 3] > 200) tipX = x;
let rows = 0;
let sum = 0;
for (let y = 0; y < H; y++) {
  if (pointing[(y * W + tipX - 6) * 4 + 3] > 200) {
    rows++;
    sum += y;
  }
}
const tip = { x: (tipX - box.left) / box.width, y: (sum / rows - box.top) / box.height };

await mkdir(out, { recursive: true });
for (const [pose, { pixels }] of Object.entries(cuts)) {
  const cropped = await sharp(pixels, { raw: { width: W, height: H, channels: 4 } }).extract(box).png().toBuffer();
  for (const scale of SCALES) {
    const width = Math.round(box.width * scale);
    const file = path.join(out, `arm-${pose}-${width}.webp`);
    const info = await sharp(cropped).resize({ width }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(file);
    console.log(`${file}  ${info.width}x${info.height}  ${Math.round((await stat(file)).size / 1024)} KB`);
  }
  if (debug) {
    await mkdir(debug, { recursive: true });
    await sharp({ create: { width: box.width, height: box.height, channels: 3, background: "#f4f4f6" } })
      .composite([{ input: cropped }])
      .png()
      .toFile(path.join(debug, `arm-${pose}-on-page.png`));
  }
}
console.log(`box ${box.width}x${box.height}; fingertip at ${tip.x.toFixed(4)}, ${tip.y.toFixed(4)} of it`);
