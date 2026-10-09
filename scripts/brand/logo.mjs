// Draws the truegetherth brand files from one definition:
//   public/brand/truegetherth-logo.png   the lockup (mark + wordmark) for white surfaces
//   public/brand/truegetherth-mark.svg   the mark alone
//   src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png   the app icon
//   public/media/og-image.png            1200x630, what social apps show for a shared page
//
// The mark is two rings that overlap ("together"); where they meet is the one
// red mark. The wordmark is Inter, the site's own Latin face, set tight; the
// closing "th" steps back a tone. It is an original mark: it borrows nothing
// from the True logo, which stays True's.
//
// Usage: node scripts/brand/logo.mjs [--look file.png]   (needs the Playwright Chromium of the e2e tests)
// It prints the lockup's size, which goes in src/content/media.ts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const at = (...parts) => path.join(root, ...parts);
const look = process.argv.includes("--look") ? process.argv[process.argv.indexOf("--look") + 1] : null;

const INK = "#0b0b0c";
const RED = "#e60012";
const QUIET = "#77777c";
const PAPER = "#ffffff";
const SURFACE = "#f4f4f6";

// The mark in a box 100 high: two rings of radius R whose centres are D apart.
const R = 30;
const STROKE = 9;
const D = 32;
const inner = R - STROKE / 2;
const reach = Math.sqrt(inner ** 2 - (D / 2) ** 2);
const MARK_WIDTH = D + 2 * R + STROKE;

/** The two rings and the lens between them, centred on (cx, cy), scaled by k. */
function mark({ cx, cy, k = 1, ring = INK, lens = RED }) {
  const left = cx - (D / 2) * k;
  const right = cx + (D / 2) * k;
  const top = cy - reach * k;
  const bottom = cy + reach * k;
  const r = inner * k;
  return [
    `<path d="M ${cx} ${top} A ${r} ${r} 0 0 1 ${cx} ${bottom} A ${r} ${r} 0 0 1 ${cx} ${top} Z" fill="${lens}"/>`,
    `<circle cx="${left}" cy="${cy}" r="${R * k}" fill="none" stroke="${ring}" stroke-width="${STROKE * k}"/>`,
    `<circle cx="${right}" cy="${cy}" r="${R * k}" fill="none" stroke="${ring}" stroke-width="${STROKE * k}"/>`,
  ].join("");
}

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_WIDTH} ${2 * R + STROKE}" role="img" aria-label="truegetherth">${mark({
  cx: MARK_WIDTH / 2,
  cy: R + STROKE / 2,
})}</svg>\n`;

// The app icon: the mark in white on an ink tile.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="${INK}"/>${mark({
  cx: 32,
  cy: 32,
  k: 0.44,
  ring: PAPER,
})}</svg>\n`;

const font = readFileSync(at("src/fonts/inter-latin-wght-normal.woff2")).toString("base64");
const fontFace = `@font-face{font-family:"Inter";src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900}`;

// The lockup, drawn large and scaled down afterwards.
const lockup = `<div id="logo" style="display:inline-flex;align-items:center;gap:30px;padding:8px 8px 24px">
  <svg xmlns="http://www.w3.org/2000/svg" width="${MARK_WIDTH * 1.46}" height="${(2 * R + STROKE) * 1.46}" viewBox="0 0 ${MARK_WIDTH} ${2 * R + STROKE}" style="margin-top:20px">${mark({ cx: MARK_WIDTH / 2, cy: R + STROKE / 2 })}</svg>
  <span style="font:560 150px/1.3 Inter;letter-spacing:-0.05em;color:${INK}">truegether<span style="color:${QUIET};margin-left:0.03em">th</span></span>
</div>`;

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
await page.setContent(`<!doctype html><html><head><style>${fontFace}html,body{margin:0;background:transparent}</style></head><body>${lockup}</body></html>`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const raw = await page.locator("#logo").screenshot({ omitBackground: true });
const logo = await sharp(raw).trim().resize({ height: 200 }).png({ compressionLevel: 9 }).toBuffer();
const size = await sharp(logo).metadata();

if (look) {
  await sharp(logo).flatten({ background: PAPER }).extend({ top: 40, bottom: 40, left: 40, right: 40, background: PAPER }).toFile(look);
  console.log(`${look} written (${size.width}x${size.height}); nothing else changed`);
  await browser.close();
  process.exit(0);
}

mkdirSync(at("public/brand"), { recursive: true });
writeFileSync(at("public/brand/truegetherth-logo.png"), logo);
writeFileSync(at("public/brand/truegetherth-mark.svg"), markSvg);
writeFileSync(at("src/app/icon.svg"), iconSvg);

// favicon.ico holds PNG pictures as they are (every browser of the last decade reads that).
const sizes = [16, 32, 48];
const pictures = await Promise.all(sizes.map((px) => sharp(Buffer.from(iconSvg), { density: 384 }).resize(px, px).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
pictures.forEach((picture, index) => {
  const entry = 6 + 16 * index;
  header.writeUInt8(sizes[index], entry);
  header.writeUInt8(sizes[index], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(picture.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += picture.length;
});
writeFileSync(at("src/app/favicon.ico"), Buffer.concat([header, ...pictures]));
await sharp(Buffer.from(iconSvg), { density: 1200 }).resize(180, 180).png().toFile(at("src/app/apple-icon.png"));

// The share picture: the hero's router with the logo, no words, so it suits both languages.
const dataUri = (file, type) => `data:${type};base64,${readFileSync(at(file)).toString("base64")}`;
const share = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await share.setContent(
  `<!doctype html><html><body style="margin:0">
<div style="position:relative;width:1200px;height:630px;background:${SURFACE};overflow:hidden">
  <img src="${dataUri("design/hero/router/poster-v3.webp", "image/webp")}" style="position:absolute;right:-70px;top:-74px;height:780px">
  <div style="position:absolute;inset:0;background:linear-gradient(to right,${SURFACE} 0%,rgba(244,244,246,0.86) 30%,rgba(244,244,246,0) 58%)"></div>
  <img src="data:image/png;base64,${logo.toString("base64")}" style="position:absolute;left:72px;top:72px;height:54px">
  <div style="position:absolute;left:72px;top:156px;width:96px;height:3px;background:${RED}"></div>
</div></body></html>`,
  { waitUntil: "load" },
);
await share.screenshot({ path: at("public/media/og-image.png") });
await browser.close();

console.log(`public/brand/truegetherth-logo.png ${size.width}x${size.height} (set this size in src/content/media.ts)`);
console.log("public/brand/truegetherth-mark.svg, src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png, public/media/og-image.png written");
