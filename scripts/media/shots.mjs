// Screenshots for reviewing a change by eye. Needs a running site
// (npm run dev -- --port 3200) and Playwright's Chromium.
//
//   node scripts/media/shots.mjs [url] [outDir] [locale path]
//     the home page at chosen moments of its scroll choreography
//   node scripts/media/shots.mjs --pages /broadband /contact ... [--base url] [--out dir]
//     whole pages, top to bottom, on a desktop and a phone
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const pagesMode = args.includes("--pages");
const routes = pagesMode ? args.filter((value) => value.startsWith("/")) : [];
const base = pagesMode ? option("--base", "http://localhost:3200") : (args[0] ?? "http://localhost:3200");
const out = path.resolve(pagesMode ? option("--out", "shots") : (args[1] ?? "shots"));
const route = args[2] ?? "/";

/** [stage, progress through its pinned scroll] */
const moments = [
  ["hero", 0],
  ["hero", 0.5],
  ["manifesto", 0.1],
  ["manifesto", 0.55],
  ["rail", 0.02],
  ["rail", 0.5],
  ["rail", 1],
  ["ticket", 0.04],
  ["ticket", 0.45],
  ["ticket", 0.8],
  ["ticket", 1],
  ["season", 0.1],
  ["season", 0.5],
  ["season", 0.95],
];
const anchors = ["prices", "faq"];
const screens = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];

/** Answers the cookie banner (necessary only), so it is not in every picture. */
async function settleConsent(page) {
  const choice = page.getByRole("button", { name: /ใช้เฉพาะที่จำเป็น|Necessary only/i });
  try {
    await choice.first().click({ timeout: 4000 });
  } catch {
    // No banner: the choice is stored already.
  }
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const screen of screens) {
  const { name, ...options } = screen;
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const problems = [];
  page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
  page.on("pageerror", (error) => problems.push(String(error)));

  if (pagesMode) {
    for (const target of routes) {
      await page.goto(base + target, { waitUntil: "networkidle" });
      await settleConsent(page);
      await page.waitForTimeout(600);
      const slug = target.replace(/^\//, "").replace(/[^a-zA-Z0-9]+/g, "-") || "home";
      await page.screenshot({ path: path.join(out, `page-${name}-${slug}.png`), fullPage: true });
      const width = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, screen: window.innerWidth }));
      console.log(name, target, JSON.stringify(width));
    }
    console.log(name, problems.length ? problems : "no console errors");
    await context.close();
    continue;
  }

  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.waitForSelector("html[data-ready]");
  await settleConsent(page);
  // The hand's reach, part of the way in and just before the touch.
  for (const [label, wait] of [["reach-a", 900], ["reach-b", 700]]) {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(out, `${name}-00-${label}.png`) });
  }
  await page.waitForTimeout(1600);

  let count = 0;
  const shoot = async (label) => {
    count += 1;
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(out, `${name}-${String(count).padStart(2, "0")}-${label}.png`) });
  };
  for (const [stage, progress] of moments) {
    await page.evaluate(
      ([stageName, p]) => {
        const element = document.querySelector(`[data-stage="${stageName}"]`);
        const top = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, top + p * (element.offsetHeight - window.innerHeight));
      },
      [stage, progress],
    );
    await shoot(`${stage}-${Math.round(progress * 100)}`);
  }
  for (const id of anchors) {
    await page.evaluate((anchor) => {
      const element = document.getElementById(anchor);
      window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY);
    }, id);
    await shoot(id);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await shoot("foot");
  const width = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, screen: window.innerWidth }));
  console.log(name, JSON.stringify(width), problems.length ? problems : "no console errors");
  await context.close();
}
await browser.close();
console.log(`saved to ${out}`);
