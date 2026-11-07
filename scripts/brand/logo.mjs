// Dealer branding uses the owner's original True Online artwork unchanged.
// Run: node scripts/brand/logo.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const at = (...parts) => path.join(root, ...parts);
const original = readFileSync(at("public/assets/wEnergy/trueonline.png"));
const font = readFileSync(at("scripts/fonts/source/inter-latin-wght-normal.woff2")).toString("base64");
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>
    @font-face{font-family:Inter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}
    body{margin:0;background:transparent}#logo{width:744px;padding:0 0 4px;display:flex;flex-direction:column;align-items:center;gap:22px}
    img{width:744px;height:117px}span{font:600 38px/1.2 Inter;letter-spacing:5px;color:#29292c}
    </style></head><body><div id="logo"><img src="data:image/png;base64,${original.toString("base64")}" alt=""><span>BY TELEMART</span></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const logo = await page.locator("#logo").screenshot({ omitBackground: true });
  mkdirSync(at("public/brand"), { recursive: true });
  writeFileSync(at("public/brand/true-online-telemart-v1.png"), logo);
  // The large home-screen icon retains the full dealer identity.
  const appleTile = await sharp({ create: { width: 512, height: 512, channels: 4, background: "#ffffff" } })
    .composite([{ input: await sharp(logo).resize({ width: 456 }).toBuffer(), gravity: "centre" }]).png().toBuffer();
  // At 16px a full horizontal logo becomes unreadable. Extract the original
  // initial instead of redrawing it; leave the source file unchanged.
  const initial = await sharp(original).extract({ left: 0, top: 0, width: 80, height: 117 }).resize({ height: 416 }).toBuffer();
  const tile = await sharp({ create: { width: 512, height: 512, channels: 4, background: "#ffffff" } })
    .composite([{ input: initial, gravity: "centre" }]).png().toBuffer();
  writeFileSync(at("src/app/icon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${tile.toString("base64")}"/></svg>\n`);
  await sharp(appleTile).resize(180, 180).png().toFile(at("src/app/apple-icon.png"));
  const sizes = [16, 32, 48];
  const pictures = await Promise.all(sizes.map((px) => sharp(tile).resize(px, px).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
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
  const painting = await sharp(at("design/hero/tableau/source/master.jpg")).resize({ width: 1200, height: 630, fit: "cover", position: "north" }).jpeg({ quality: 88 }).toBuffer();
  await page.setContent(`<!doctype html><html><body style="margin:0"><div style="position:relative;width:1200px;height:630px">
    <img src="data:image/jpeg;base64,${painting.toString("base64")}" style="width:1200px;height:630px">
    <div style="position:absolute;left:48px;top:44px;padding:16px 24px;border-radius:24px;background:white">
    <img src="data:image/png;base64,${logo.toString("base64")}" style="width:224px;height:auto"></div></div></body></html>`);
  await page.screenshot({ path: at("public/media/og-image-v3.png") });
  console.log("Dealer logo", await sharp(logo).metadata().then(({ width, height }) => ({ width, height })));
} finally { await browser.close(); }
