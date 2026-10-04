// Takes the still of the hero's router from the live scene itself:
//   node scripts/media/hero-poster.mjs [url] [--look shots/hero-look.png [--scroll 0.8]]
// Needs a running site (npm run dev -- --port 3200) and Playwright's Chromium.
//
// The page shows this still from the first paint and draws the live scene over
// it when it is ready, so the two must be the same view: the still is the
// scene's own first frame, with the status lights on and nothing moving (the
// page does that when <html> carries data-hero-still). It prints where the
// antenna the finger touches is in the still; that goes in src/components/site/home/hero-art.ts.
// With --look it only saves the frame as a PNG to look at, and writes nothing else;
// --scroll takes that look part of the way through the hero's scroll (0..1),
// where the camera has swung up over the router.
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const args = process.argv.slice(2);
const look = args.includes("--look") ? args[args.indexOf("--look") + 1] : null;
const scroll = look && args.includes("--scroll") ? Number(args[args.indexOf("--scroll") + 1]) : 0;
const base = args.find((value) => value.startsWith("http")) ?? "http://localhost:3200";
const out = "public/media/hero-v3";
const WIDTHS = [2560, 1440];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1 });
const problems = [];
page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
page.on("pageerror", (error) => problems.push(String(error)));
await page.addInitScript(() => {
  const mark = () => document.documentElement?.setAttribute("data-hero-still", "");
  mark();
  new MutationObserver((_, observer) => {
    if (!document.documentElement) return;
    mark();
    observer.disconnect();
  }).observe(document, { childList: true });
});
await page.goto(base, { waitUntil: "domcontentloaded" });
await page.waitForSelector('.hero-frame[data-live="scene"]', { timeout: 60_000 });
// Only the canvas: nothing over it, and no entrance still playing.
await page.addStyleTag({
  content: ".nav, .hero-foot, .hero-scroll, .hero-arm-rig, .hero-rings, nextjs-portal { visibility: hidden !important } .hero-canvas { opacity: 1 !important; transition: none !important }",
});
await page.waitForTimeout(2600);
if (scroll) {
  // The still frame is drawn again when its box changes size: scroll, then nudge the window.
  await page.evaluate((progress) => {
    const stage = document.querySelector('[data-stage="hero"]');
    window.scrollTo(0, progress * (stage.offsetHeight - window.innerHeight));
  }, scroll);
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 2560, height: 1442 });
  await page.waitForTimeout(1200);
}
const touch = await page.evaluate(() => {
  const style = document.querySelector(".hero-frame").style;
  return { x: parseFloat(style.getPropertyValue("--touch-x")) / 100, y: parseFloat(style.getPropertyValue("--touch-y")) / 100 };
});
const shot = await page.locator(".hero-canvas").screenshot();
await browser.close();
if (problems.length) console.log(problems);

if (look) {
  await mkdir(path.dirname(path.resolve(look)), { recursive: true });
  await sharp(shot).toFile(look);
  console.log(`saved ${look}`);
} else {
  await mkdir(out, { recursive: true });
  for (const width of WIDTHS) {
    const file = path.join(out, `poster-${width}.webp`);
    const info = await sharp(shot).resize({ width }).webp({ quality: 90, effort: 6 }).toFile(file);
    console.log(`${file}  ${info.width}x${info.height}  ${Math.round((await stat(file)).size / 1024)} KB`);
  }
}
console.log(`touch: { x: ${touch.x.toFixed(4)}, y: ${touch.y.toFixed(4)} }`);
