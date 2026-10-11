// Cuts the hero painting into its layers:  node scripts/media/hero-tableau.mjs [--debug] [--replace]
//
// The sources (design/hero/tableau/source/, see the README beside them) are
// pictures made from one painting: the sky with nobody in it, the figures
// alone on flat green, and a bank of near cloud drawn over green. The page
// stacks them again, each on a layer of its own, so every figure can drift a
// little against the sky (src/components/site/home/Hero.tsx).
//
// This writes to public/media/hero-v4/ the sky of each pack (wide for desktop,
// tall for phones), each figure and the near cloud at the sizes the page needs,
// and the True Online mark of the router's frame. Where each layer sits in each
// pack is written to src/components/site/home/hero-tableau.ts. With --debug it
// also saves, in shots/hero-tableau/, each cut-out on magenta and each pack laid
// flat, to look at.
//
// The figures are coloured, so "greener than red and blue" finds the backdrop
// only where the green is plain; a pixel counts as an edge only next to plain
// green, and small patches of green enclosed by a figure (the router's lights)
// are kept. Figures that touch by a thread (a ribbon's end on the laptop) are
// told apart by shrinking the picture until the thread breaks.
//
// Browsers keep these files for a year (next.config.ts), so a picture that has
// changed must not keep its name: it goes in a new folder (hero-v5…, `out` and
// `web` below). The script stops at a file that would come out different from
// the one already there; --replace lets it through, for a file that was never
// published.
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const source = "design/hero/tableau/source";
const out = "public/media/hero-v4";
const web = "/media/hero-v4";
const data = "src/components/site/home/hero-tableau.ts";
const debug = process.argv.includes("--debug") ? "shots/hero-tableau" : null;
const replace = process.argv.includes("--replace");

/** Greener than red and blue by less than LOW: figure. By more than HIGH: backdrop. Between: the edge. */
const LOW = 14;
const HIGH = 205;
/** Greener than this is plain backdrop. */
const PLAIN = 150;
/** Only this near to plain backdrop can a pixel be an edge... */
const EDGE = 5;
/** ...or further in, as long as every pixel on the way is at least this green: where a figure fades out softly. */
const FADE = 22;
/** Enclosed green smaller than this (in pixels) belongs to the figure: a status light, not a gap. */
const HOLE = 12;
/** Figures joined by less than twice this many pixels are separate figures. */
const THREAD = 7;
/** Anything smaller than this is a speck, not a figure. */
const SPECK = 2400;

// The figures of the wide painting, by roughly where each one's middle is (shares of the picture).
const FIGURES = [
  { id: "sea-god", at: [0.2, 0.58] },
  { id: "cherub-phone", at: [0.41, 0.28] },
  { id: "cherub-controller", at: [0.5, 0.64] },
  { id: "goddess", at: [0.64, 0.52] },
  { id: "cherub-laptop", at: [0.78, 0.72] },
  { id: "muse", at: [0.87, 0.5] },
];

// Where two figures overlap in the painting, the line between them, in pixels of
// figures.png: what is in front keeps its whole outline, what is behind ends at
// the line. Here the tip of a cherub's wing lies over the muse's sleeve. These
// belong to this one picture: after making figures.png again, the script says so
// by finding the wrong number of figures, and the line has to be drawn again.
const CUTS = [
  [
    [2286, 946],
    [2305, 960],
    [2317, 977],
    [2323, 990],
    [2320, 1000],
    [2310, 1006],
    [2297, 1008],
  ],
];

// How each pack is put together, back to front. `depth` is how far a layer
// shifts with the pointer and the scroll (the near cloud most); `bob` is how
// far it floats up and down on its own, in shares of the picture's height,
// `turn` how far it tilts (degrees), `sway` how far it drifts sideways (shares
// of the picture's width), `time` one such movement in seconds. `frame` is the
// thin signal frame hung on the layer, in shares of the layer's own box, with
// the reading it shows; the router's frame carries the True Online mark instead.
//
// In the wide pack every figure is where it was painted, but for the goddess,
// who stands a little lower (`shift`, shares of the picture): painted, the
// router's antennas touch the top edge, where the navigation is. The tall pack is the
// same figures stood upright over the tall sky, each placed by its middle (`x`,
// share of the width), its top (`y`, share of the height) and its width (`w`,
// share of the width): the router in the sky's glow, everything above the last
// quarter of the picture, where the headline goes.
const ROUTER = [-0.04, -0.01, 1.08, 0.238];
const PACKS = {
  wide: {
    sky: "plate.png",
    widths: [2560, 1440],
    near: { depth: 1.5, sway: 0.006, time: 26, drop: 0.13 },
    layers: [
      { id: "sea-god", depth: 0.3, frame: { box: [0.3, 0.02, 0.48, 0.5], reading: "0.9565" } },
      { id: "muse", depth: 0.5, bob: 0.004, time: 9 },
      { id: "cherub-phone", depth: 0.7, bob: 0.012, turn: 1.6, time: 6.4, frame: { box: [0.1, 0.0, 0.88, 0.8], reading: "0.9982" } },
      { id: "goddess", depth: 0.85, bob: 0.004, time: 8, shift: [0, 0.05], frame: { box: ROUTER, mark: true } },
      { id: "cherub-controller", depth: 1, bob: 0.014, turn: -1.8, time: 7.2, frame: { box: [0.08, 0.0, 0.92, 0.78], reading: "0.9717" } },
      { id: "cherub-laptop", depth: 1.1, bob: 0.011, turn: 1.4, time: 5.8, frame: { box: [0.0, 0.0, 0.96, 0.7], reading: "0.9840" } },
    ],
  },
  tall: {
    sky: "plate-portrait.png",
    widths: [1080, 720],
    near: { depth: 1.5, sway: 0.012, time: 26, drop: 0, place: { x: 0.4, y: 0.4, w: 2 } },
    layers: [
      { id: "sea-god", depth: 0.3, place: { x: 0.215, y: 0.525, w: 0.5 } },
      { id: "muse", depth: 0.5, bob: 0.003, time: 9, place: { x: 0.8, y: 0.515, w: 0.27 } },
      { id: "cherub-phone", depth: 0.7, bob: 0.007, turn: 1.6, time: 6.4, place: { x: 0.16, y: 0.215, w: 0.24 }, frame: { box: [0.1, 0.0, 0.88, 0.8], reading: "0.9982" } },
      { id: "goddess", depth: 0.85, bob: 0.003, time: 8, place: { x: 0.52, y: 0.125, w: 0.46 }, frame: { box: ROUTER, mark: true } },
      { id: "cherub-controller", depth: 1, bob: 0.008, turn: -1.8, time: 7.2, place: { x: 0.19, y: 0.385, w: 0.25 }, frame: { box: [0.08, 0.0, 0.92, 0.78], reading: "0.9717" } },
      { id: "cherub-laptop", depth: 1.1, bob: 0.007, turn: 1.4, time: 5.8, place: { x: 0.845, y: 0.3, w: 0.27 }, frame: { box: [0.0, 0.0, 0.96, 0.7], reading: "0.9840" } },
    ],
  },
};
/** The sizes each figure is written at, as shares of its size in the source. */
const SCALES = [1, 0.5];
/** One more for a figure the tall arrangement draws much smaller than it was painted: a phone needs a third of the sea god's width. */
const SMALLER = { "sea-god": [0.34] };

const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const smooth = (value, from, to) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const share = (value) => Number(value.toFixed(4));

async function read(file) {
  const { data: pixels, info } = await sharp(path.join(source, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { pixels, W: info.width, H: info.height };
}

/** Grows a mask by `reach` pixels in every direction (a square, which is enough for an edge band). */
function grow(mask, W, H, reach) {
  const pass = new Uint8Array(W * H);
  const grown = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    let last = -Infinity;
    for (let x = 0; x < W; x++) {
      if (mask[y * W + x]) last = x;
      if (x - last <= reach) pass[y * W + x] = 1;
    }
    last = Infinity;
    for (let x = W - 1; x >= 0; x--) {
      if (mask[y * W + x]) last = x;
      if (last - x <= reach) pass[y * W + x] = 1;
    }
  }
  for (let x = 0; x < W; x++) {
    let last = -Infinity;
    for (let y = 0; y < H; y++) {
      if (pass[y * W + x]) last = y;
      if (y - last <= reach) grown[y * W + x] = 1;
    }
    last = Infinity;
    for (let y = H - 1; y >= 0; y--) {
      if (pass[y * W + x]) last = y;
      if (last - y <= reach) grown[y * W + x] = 1;
    }
  }
  return grown;
}

/** Numbers the connected patches of a mask; returns the number at each pixel (0 = none) and each patch's size and whether it touches the border. */
function patches(mask, W, H) {
  const label = new Int32Array(W * H);
  const sizes = [0];
  const onBorder = [false];
  const queue = new Int32Array(W * H);
  for (let start = 0; start < W * H; start++) {
    if (!mask[start] || label[start]) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    let size = 0;
    let border = false;
    const take = (i) => {
      if (!mask[i] || label[i]) return;
      label[i] = id;
      queue[tail++] = i;
    };
    take(start);
    while (head < tail) {
      const i = queue[head++];
      size++;
      const x = i % W;
      const y = (i - x) / W;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) border = true;
      if (x > 0) take(i - 1);
      if (x < W - 1) take(i + 1);
      if (y > 0) take(i - W);
      if (y < H - 1) take(i + W);
    }
    sizes.push(size);
    onBorder.push(border);
  }
  return { label, sizes, onBorder };
}

/**
 * Takes the green out: returns RGBA with the backdrop clear, the edge mixed
 * back to the figure's own colour, and no green cast left on what stays.
 */
function key({ pixels, W, H }) {
  const green = new Float32Array(W * H);
  const plain = new Uint8Array(W * H);
  const keyColour = [0, 0, 0];
  let count = 0;
  for (let i = 0; i < W * H; i++) {
    const r = pixels[i * 3];
    const g = pixels[i * 3 + 1];
    const b = pixels[i * 3 + 2];
    green[i] = g - Math.max(r, b);
    if (green[i] > PLAIN) {
      plain[i] = 1;
      keyColour[0] += r;
      keyColour[1] += g;
      keyColour[2] += b;
      count++;
    }
  }
  for (let c = 0; c < 3; c++) keyColour[c] /= count;

  // Green shut in by a figure and small: lights and reflections, not backdrop.
  const { label, sizes, onBorder } = patches(plain, W, H);
  const backdrop = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (label[i] && (onBorder[label[i]] || sizes[label[i]] >= HOLE)) backdrop[i] = 1;
  const near = grow(backdrop, W, H, EDGE);
  // A soft edge is wider than that: follow the green inwards from the backdrop for as long as it lasts.
  {
    const queue = new Int32Array(W * H);
    let head = 0;
    let tail = 0;
    for (let i = 0; i < W * H; i++) if (backdrop[i]) queue[tail++] = i;
    const take = (i) => {
      if (near[i] === 2 || backdrop[i] || green[i] < FADE) return;
      near[i] = 2;
      queue[tail++] = i;
    };
    while (head < tail) {
      const i = queue[head++];
      const x = i % W;
      if (x > 0) take(i - 1);
      if (x < W - 1) take(i + 1);
      if (i >= W) take(i - W);
      if (i < W * (H - 1)) take(i + W);
    }
  }

  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    let r = pixels[i * 3];
    let g = pixels[i * 3 + 1];
    let b = pixels[i * 3 + 2];
    let alpha = 1;
    if (backdrop[i]) alpha = 0;
    else if (near[i]) {
      const solid = 1 - clamp((green[i] - LOW) / (HIGH - LOW));
      // Tighten the edge a little: the outermost fringe is mostly backdrop.
      alpha = smooth(solid, 0.26, 0.94);
      if (alpha > 0 && solid < 1) {
        const part = Math.max(solid, 0.08);
        r = (r - (1 - solid) * keyColour[0]) / part;
        g = (g - (1 - solid) * keyColour[1]) / part;
        b = (b - (1 - solid) * keyColour[2]) / part;
      }
      // No colour here is greener than it is red or blue: what is, is the backdrop's cast.
      g = Math.min(g, Math.max(r, b) + 3);
    }
    rgba[i * 4] = clamp(r, 0, 255);
    rgba[i * 4 + 1] = clamp(g, 0, 255);
    rgba[i * 4 + 2] = clamp(b, 0, 255);
    rgba[i * 4 + 3] = Math.round(alpha * 255);
  }
  return { rgba, W, H };
}

/** The pixels of the lines in CUTS, three pixels thick. */
function cutLines(W, H) {
  const line = new Uint8Array(W * H);
  for (const points of CUTS) {
    for (let k = 1; k < points.length; k++) {
      const [x0, y0] = points[k - 1];
      const [x1, y1] = points[k];
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2);
      for (let step = 0; step <= steps; step++) {
        const x = Math.round(x0 + ((x1 - x0) * step) / steps);
        const y = Math.round(y0 + ((y1 - y0) * step) / steps);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < W && y + dy >= 0 && y + dy < H) line[(y + dy) * W + x + dx] = 1;
      }
    }
  }
  return line;
}

/** Splits the keyed picture into its figures: one RGBA cut-out each, with its place in the picture. */
function figures({ rgba, W, H }) {
  const line = cutLines(W, H);
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) solid[i] = rgba[i * 4 + 3] >= 128 && !line[i] ? 1 : 0;
  // Shrunk by THREAD, threads between figures are gone: what is left of each figure is its seed.
  const hollow = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) hollow[i] = solid[i] ? 0 : 1;
  const eaten = grow(hollow, W, H, THREAD);
  const core = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) core[i] = solid[i] && !eaten[i] ? 1 : 0;
  const { label, sizes } = patches(core, W, H);

  // Each seed takes back the pixels nearest to it, through the figure only.
  const owner = new Int32Array(W * H);
  const queue = new Int32Array(W * H);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < W * H; i++) {
    if (label[i] && sizes[label[i]] >= SPECK) {
      owner[i] = label[i];
      queue[tail++] = i;
    }
  }
  // First up to the drawn lines, then the lines themselves go to whichever side reaches them.
  for (const crossing of [false, true]) {
    const visible = (i) => rgba[i * 4 + 3] > 0 && (crossing || !line[i]);
    if (crossing) {
      head = 0;
      tail = 0;
      for (let i = 0; i < W * H; i++) if (owner[i]) queue[tail++] = i;
    }
    const take = (i, id) => {
      if (owner[i] || !visible(i)) return;
      owner[i] = id;
      queue[tail++] = i;
    };
    while (head < tail) {
      const i = queue[head++];
      const x = i % W;
      const y = (i - x) / W;
      if (x > 0) take(i - 1, owner[i]);
      if (x < W - 1) take(i + 1, owner[i]);
      if (y > 0) take(i - W, owner[i]);
      if (y < H - 1) take(i + W, owner[i]);
    }
  }

  const found = new Map();
  for (let i = 0; i < W * H; i++) {
    const id = owner[i];
    if (!id) continue;
    const x = i % W;
    const y = (i - x) / W;
    let box = found.get(id);
    if (!box) found.set(id, (box = { id, left: x, right: x, top: y, bottom: y, sumX: 0, sumY: 0, size: 0 }));
    if (x < box.left) box.left = x;
    if (x > box.right) box.right = x;
    if (y < box.top) box.top = y;
    if (y > box.bottom) box.bottom = y;
    box.sumX += x;
    box.sumY += y;
    box.size++;
  }
  const pieces = [...found.values()];
  if (pieces.length !== FIGURES.length) throw new Error(`Expected ${FIGURES.length} figures on the green, found ${pieces.length}: ${pieces.map((piece) => `${piece.size}px at ${(piece.sumX / piece.size / W).toFixed(2)},${(piece.sumY / piece.size / H).toFixed(2)}`).join("; ")}`);

  const margin = 6;
  const cuts = {};
  for (const figure of FIGURES) {
    // The piece whose middle is nearest to where this figure is expected.
    const distance = (piece) => Math.hypot(piece.sumX / piece.size / W - figure.at[0], piece.sumY / piece.size / H - figure.at[1]);
    const piece = pieces.reduce((best, candidate) => (distance(candidate) < distance(best) ? candidate : best));
    if (piece.taken) throw new Error(`Two figures claim the same piece: ${figure.id} and ${piece.taken}`);
    piece.taken = figure.id;
    const left = Math.max(0, piece.left - margin);
    const top = Math.max(0, piece.top - margin);
    const width = Math.min(W, piece.right + margin + 1) - left;
    const height = Math.min(H, piece.bottom + margin + 1) - top;
    const cut = Buffer.alloc(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const from = (top + y) * W + left + x;
        if (owner[from] !== piece.id) continue;
        rgba.copy(cut, (y * width + x) * 4, from * 4, from * 4 + 4);
      }
    }
    cuts[figure.id] = { rgba: cut, width, height, left, top };
  }
  return cuts;
}

/**
 * The near cloud. Its picture is the sky with green painted where the cloud
 * bank ends: in each column the cloud is what lies below the lowest green.
 * Columns where the green line breaks take the height of their neighbours.
 * (The wide page fades the bank out towards the left, where the headline is:
 * src/styles/landing.css.)
 */
function nearCloud({ pixels, W, H }) {
  const edge = new Float32Array(W).fill(-1);
  for (let x = 0; x < W; x++) {
    for (let y = H - 1; y >= 0; y--) {
      const i = (y * W + x) * 3;
      if (pixels[i + 1] - Math.max(pixels[i], pixels[i + 2]) > PLAIN) {
        edge[x] = y;
        break;
      }
    }
  }
  // Fill the gaps: between two known columns in a straight line, past the last one at its height.
  let known = -1;
  for (let x = 0; x < W; x++) {
    if (edge[x] < 0) continue;
    if (known >= 0 && x - known > 1) for (let fill = known + 1; fill < x; fill++) edge[fill] = edge[known] + ((edge[x] - edge[known]) * (fill - known)) / (x - known);
    if (known < 0) for (let fill = 0; fill < x; fill++) edge[fill] = edge[x];
    known = x;
  }
  // Past the last green the bank goes on rising, as its outline does before the line breaks.
  const run = 160;
  const slope = known > run ? (edge[known] - edge[known - run]) / run : 0;
  for (let fill = known + 1; fill < W; fill++) edge[fill] = Math.max(H * 0.2, edge[known] + slope * (fill - known));
  // A stray dot of green above the line would lift one column: take the middle of each neighbourhood.
  const steady = new Float32Array(W);
  const reach = 5;
  for (let x = 0; x < W; x++) {
    const window = [];
    for (let k = -reach; k <= reach; k++) window.push(edge[clamp(x + k, 0, W - 1)]);
    window.sort((a, b) => a - b);
    steady[x] = Math.max(edge[x], window[reach]);
  }

  const rgba = Buffer.alloc(W * H * 4);
  let top = H;
  for (let x = 0; x < W; x++) {
    // Where the line was drawn the edge is the painted one; where it was guessed, it fades over a longer way.
    const feather = x > known ? 46 : 5;
    for (let y = Math.max(0, Math.floor(steady[x])); y < H; y++) {
      const i = y * W + x;
      const r = pixels[i * 3];
      let g = pixels[i * 3 + 1];
      const b = pixels[i * 3 + 2];
      const green = g - Math.max(r, b);
      const alpha = (1 - clamp((green - LOW) / (HIGH - LOW))) * clamp((y - steady[x]) / feather);
      if (alpha <= 0) continue;
      if (green > 0) g = Math.max(r, b);
      rgba[i * 4] = r;
      rgba[i * 4 + 1] = g;
      rgba[i * 4 + 2] = b;
      rgba[i * 4 + 3] = Math.round(alpha * 255);
      if (alpha > 0.5 && y < top) top = y;
    }
  }
  // Only the part of the picture the cloud is in.
  top = Math.max(0, top - 60);
  const cut = Buffer.alloc(W * (H - top) * 4);
  rgba.copy(cut, 0, top * W * 4);
  return { rgba: cut, width: W, height: H - top, left: 0, top };
}

const png = (cut) => sharp(cut.rgba, { raw: { width: cut.width, height: cut.height, channels: 4 } }).png().toBuffer();
const size = async (file) => `${((await stat(file)).size / 1024).toFixed(0)} kB`;

// ---------------------------------------------------------------------------------

const keyed = key(await read("figures.png"));
const cuts = figures(keyed);
const cloud = nearCloud(await read("near-clouds.png"));
const wideFrame = { W: keyed.W, H: keyed.H };

await mkdir(out, { recursive: true });
if (debug) await mkdir(debug, { recursive: true });

const written = [];
/** Writes one picture of the folder, unless it would change a file browsers may already hold. */
async function save(image, file) {
  const bytes = await image.toBuffer();
  const target = path.join(out, file);
  const old = await readFile(target).catch(() => null);
  if (old && !old.equals(bytes) && !replace) {
    throw new Error(`${file} would change, and browsers keep it for a year: write to a new folder (hero-v5), or pass --replace if it was never published.`);
  }
  if (!old || !old.equals(bytes)) await writeFile(target, bytes);
  written.push(file);
  return sharp(bytes).metadata();
}

// Each figure, written once: both packs use the same files.
const files = {};
for (const [id, cut] of Object.entries({ ...cuts, "near-clouds": cloud })) {
  const whole = await png(cut);
  files[id] = [];
  for (const scale of [...SCALES, ...(SMALLER[id] ?? [])]) {
    const width = Math.round(cut.width * scale);
    const file = `${id}-${width}.webp`;
    await save(sharp(whole).resize({ width }).webp({ quality: 84, alphaQuality: 92, effort: 6 }), file);
    files[id].unshift({ src: `${web}/${file}`, width });
  }
  if (debug) await sharp(whole).flatten({ background: "#ff00ff" }).png().toFile(path.join(debug, `${id}.png`));
}

// The True Online mark of the router's frame, from the owner's own site assets: never a generated one. The page
// shows it at most 15 pixels high on a white tab, so it is laid on white here (a third of the bytes of a
// transparent one) and is as wide as a sharp screen needs.
const mark = { src: `${web}/true-online-248.webp`, width: 248, height: 0 };
{
  const made = await save(sharp("design/hero/router/trueonline.png").resize({ width: mark.width }).flatten({ background: "#ffffff" }).webp({ quality: 92, effort: 6 }), "true-online-248.webp");
  mark.height = made.height;
}

const packs = {};
for (const [name, pack] of Object.entries(PACKS)) {
  const sky = await sharp(path.join(source, pack.sky)).metadata();
  const frame = { W: sky.width, H: sky.height };
  // Where a cut-out sits in this pack's picture, in pixels of the sky's own size.
  const placed = (cut, place, shift = [0, 0]) => {
    if (!place) {
      // The wide pack: where the figure was painted.
      const scale = frame.W / wideFrame.W;
      return { left: cut.left * scale + shift[0] * frame.W, top: cut.top * scale + shift[1] * frame.H, width: cut.width * scale, height: cut.height * scale };
    }
    const width = place.w * frame.W;
    const height = (width * cut.height) / cut.width;
    return { left: place.x * frame.W - width / 2, top: place.y * frame.H, width, height };
  };

  const layers = pack.layers.map((layer) => ({ ...layer, cut: cuts[layer.id], at: placed(cuts[layer.id], layer.place, layer.shift) }));
  const near = { ...pack.near, id: "near-clouds", cut: cloud, at: placed(cloud, pack.near.place) };
  near.at.top += pack.near.drop * frame.H;

  const skyFiles = [];
  for (const width of pack.widths) {
    const scale = width / frame.W;
    const height = Math.round(frame.H * scale);
    const skyFile = `${name}-sky-${width}.webp`;
    const ground = await sharp(path.join(source, pack.sky)).resize({ width, height, fit: "fill" }).toBuffer();
    await save(sharp(ground).webp({ quality: 80, effort: 6 }), skyFile);
    skyFiles.push({ src: `${web}/${skyFile}`, width });
    if (!debug || width !== pack.widths[0]) continue;

    // To look at: the sky with every layer on it, at rest, as the page lays them.
    const overlays = [];
    for (const layer of [...layers, near]) {
      const box = { left: Math.round(layer.at.left * scale), top: Math.round(layer.at.top * scale), width: Math.round(layer.at.width * scale), height: Math.round(layer.at.height * scale) };
      const sized = await sharp(await png(layer.cut)).resize({ width: box.width, height: box.height, fit: "fill" }).png().toBuffer();
      // What hangs over the picture's edge is cut off there, as the page cuts it.
      const crop = { left: Math.max(0, -box.left), top: Math.max(0, -box.top) };
      crop.width = Math.min(box.width - crop.left, width - Math.max(0, box.left));
      crop.height = Math.min(box.height - crop.top, height - Math.max(0, box.top));
      if (crop.width <= 0 || crop.height <= 0) continue;
      overlays.push({ input: await sharp(sized).extract(crop).png().toBuffer(), left: Math.max(0, box.left), top: Math.max(0, box.top) });
    }
    await sharp(ground).composite(overlays).png().toFile(path.join(debug, `${name}-flat.png`));
  }

  const describe = (layer) => ({
    id: layer.id,
    files: files[layer.id],
    x: share(layer.at.left / frame.W),
    y: share(layer.at.top / frame.H),
    w: share(layer.at.width / frame.W),
    h: share(layer.at.height / frame.H),
    depth: layer.depth,
    bob: layer.bob ?? 0,
    turn: layer.turn ?? 0,
    sway: layer.sway ?? 0,
    time: layer.time ?? 0,
    ...(layer.frame ? { frame: layer.frame.mark ? { box: layer.frame.box, mark: true } : { box: layer.frame.box, reading: layer.frame.reading } } : {}),
  });
  packs[name] = {
    width: frame.W,
    height: frame.H,
    sky: skyFiles.reverse(),
    layers: [...layers.map(describe), describe(near)],
  };
}

const dataModule = `import type { HeroTableau } from "./hero-art";

// Written by scripts/media/hero-tableau.mjs from the pictures in
// design/hero/tableau/source/. Do not edit: change the numbers in the script
// and run it again.
export const heroTableau: HeroTableau = ${JSON.stringify({ mark, packs }, null, 2)};
`;
await writeFile(data, dataModule);

// What an earlier cut left behind and this one does not use.
for (const file of await readdir(out)) if (!written.includes(file)) await rm(path.join(out, file));

for (const file of written) console.log(`${file.padEnd(34)} ${await size(path.join(out, file))}`);
for (const [name, pack] of Object.entries(packs)) {
  console.log(`\n${name} ${pack.width}x${pack.height}`);
  for (const layer of pack.layers) console.log(`  ${layer.id.padEnd(18)} x ${layer.x}  y ${layer.y}  w ${layer.w}  h ${layer.h}`);
}
console.log(`\nWrote ${data}`);
