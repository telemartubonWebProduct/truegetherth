// One stage of the home page on several shapes of screen, to see that it fits:
//   node scripts/media/stage-sizes.mjs [stage] [progress 0..1] [url]
// Stages: hero, manifesto, ticket, season, and rail. Needs a running site and Playwright's Chromium.
// For a pinned stage it also prints whether anything in the stage's screen is cut off at the bottom.
// The rail (the recommended packages) is not pinned (R12): it is put at the top of the screen, and the
// script prints how tall it is, how many cards of the open tab's row are whole on the screen, whether the
// next one peeks at the edge and whether the page has grown wider than the screen; a second picture has
// the row scrolled to its end.
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const stage = process.argv[2] ?? "rail";
const progress = Number(process.argv[3] ?? 0.05);
const base = process.argv[4] ?? "http://localhost:3200";
const out = path.resolve("shots");
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [412, 915],
  [390, 844],
  [360, 640],
];

/** The row of packages: the section at the top of the screen, then the open tab's row scrolled to its end. */
async function rail(page, width, height) {
  await page.evaluate(() => {
    const section = document.querySelector("#packages");
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY);
  });
  await page.waitForTimeout(1800);
  const facts = await page.evaluate(() => {
    const section = document.querySelector("#packages");
    const row = section.querySelector("[data-rail-panel]:not([hidden]) [data-rail-track]");
    const edge = row.getBoundingClientRect();
    const cards = [...row.children].map((card) => card.getBoundingClientRect());
    return {
      height: section.offsetHeight,
      card: `${Math.round(cards[0].width)}x${Math.round(cards[0].height)}`,
      count: cards.length,
      whole: cards.filter((box) => box.left >= edge.left - 0.5 && box.right <= edge.right + 0.5).length,
      peek: cards.some((box) => box.left < edge.right - 8 && box.right > edge.right),
      wide: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  await page.screenshot({ path: path.join(out, `size-rail-${width}x${height}.png`) });
  await page.evaluate(() => {
    const row = document.querySelector("#packages [data-rail-panel]:not([hidden]) [data-rail-track]");
    row.scrollTo({ left: row.scrollWidth, behavior: "instant" });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, `size-rail-${width}x${height}-end.png`) });
  const screens = (facts.height / height).toFixed(2);
  const row = `${facts.whole} of ${facts.count} cards whole${facts.peek ? ", the next peeks" : ""}`;
  console.log(`${width}x${height}`, `section ${facts.height}px (${screens} screens), cards ${facts.card}, ${row}${facts.wide ? ", PAGE WIDER THAN THE SCREEN" : ""}`);
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const [width, height] of sizes) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("html[data-ready]");
  try {
    await page.getByRole("button", { name: /ใช้เฉพาะที่จำเป็น|Necessary only/i }).first().click({ timeout: 3000 });
  } catch {
    // The choice is stored already.
  }
  await page.mouse.move(width / 2, 4);
  if (stage === "rail") {
    await rail(page, width, height);
    await context.close();
    continue;
  }
  await page.evaluate(
    ([name, p]) => {
      const element = document.querySelector(`[data-stage="${name}"]`);
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + p * (element.offsetHeight - window.innerHeight));
    },
    [stage, progress],
  );
  await page.waitForTimeout(1800);
  // What reaches below the screen inside the pinned screen (it would be cut off there).
  const cut = await page.evaluate((name) => {
    const pin = document.querySelector(`[data-stage="${name}"] .pin`);
    const limit = pin.getBoundingClientRect().bottom + 0.5;
    const over = [...pin.querySelectorAll("*")].filter((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return box.height > 0 && box.width > 0 && box.bottom > limit && style.position !== "absolute" && !element.closest("[hidden]");
    });
    return over.slice(0, 4).map((element) => `${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]} +${Math.round(element.getBoundingClientRect().bottom - limit)}px`);
  }, stage);
  await page.screenshot({ path: path.join(out, `size-${stage}-${width}x${height}.png`) });
  console.log(`${width}x${height}`, cut.length ? `cut off: ${cut.join(", ")}` : "fits");
  await context.close();
}
await browser.close();
