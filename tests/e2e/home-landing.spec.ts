import { expect, test, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { packagePageIn, publicPackagesIn } from "@/lib/content/lookup";

import { blockThirdParty, settle } from "./support/network";

// The home page's scroll choreography (docs/renovation/R5-LANDING.md), checked
// where it can go wrong silently: a stage that does not move, a duplicate that
// drifts off its original, a row that stops short, and the page without motion
// or scripts.

const home = content.pages.home;

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

const STAGES = ["hero", "manifesto", "rail", "ticket", "season"] as const;
type Stage = (typeof STAGES)[number];

// The tests wait for the document, not for every picture: a download must not decide when a check starts.
async function open(page: Page, path = "/") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html[data-ready]");
}

/** Scrolls so that a pinned stage is `progress` (0..1) of the way through, and waits for it to be drawn. */
async function scrub(page: Page, stage: Stage, progress: number) {
  await page.evaluate(
    async ([name, p]) => {
      const element = document.querySelector<HTMLElement>(`[data-stage="${name}"]`)!;
      const top = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top + p * (element.offsetHeight - window.innerHeight));
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
    },
    [stage, progress] as const,
  );
}

const variable = (page: Page, name: string) => page.evaluate((property) => document.documentElement.style.getPropertyValue(property), name);

test("each stage pins one screen and the page never scrolls sideways", async ({ page }) => {
  await open(page);
  for (const stage of STAGES) {
    for (const progress of [0, 0.5, 1]) {
      await scrub(page, stage, progress);
      const state = await page.evaluate((name) => {
        const pin = document.querySelector(`[data-stage="${name}"] .pin`)!.getBoundingClientRect();
        return { top: pin.top, height: pin.height, screen: window.innerHeight, page: document.documentElement.scrollWidth, width: window.innerWidth };
      }, stage);
      expect(Math.abs(state.top), `${stage} at ${progress} stays pinned`).toBeLessThan(1.5);
      expect(Math.abs(state.height - state.screen)).toBeLessThan(1.5);
      expect(state.page).toBeLessThanOrEqual(state.width);
    }
  }
});

test("the hero headline is drawn above the picture and lifts away on scroll", async ({ page }) => {
  await open(page);
  const title = page.locator(".hero-title");
  await expect(title).toBeVisible();
  await expect.poll(() => title.evaluate((element) => Number(getComputedStyle(element).opacity)), { timeout: 15_000 }).toBe(1);
  // Whatever is painted at the middle of the headline belongs to the headline, not the picture.
  const onTop = await title.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return Boolean(hit && (element.contains(hit) || hit.contains(element)) && !hit.closest(".hero-art"));
  });
  expect(onTop).toBe(true);

  await scrub(page, "hero", 0.5);
  expect(parseFloat(await variable(page, "--hero-type-y"))).toBeLessThan(-20);
  expect(Number(await variable(page, "--hero-type-scale"))).toBeLessThan(0.95);
  expect(Number(await variable(page, "--hero-type-alpha"))).toBeLessThan(0.5);
  expect(Number(await variable(page, "--hero-art-scale"))).toBeLessThan(1);
});

/** How far the pointing fingertip is from the antenna it touches (0 = on it), in shares of the arm's width. */
const armOffset = (page: Page) =>
  page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>(".hero-frame")!;
    const arm = document.querySelector<HTMLElement>(".hero-arm")!;
    const style = getComputedStyle(frame);
    const box = frame.getBoundingClientRect();
    const limb = arm.getBoundingClientRect();
    const touch = box.left + (box.width * parseFloat(style.getPropertyValue("--touch-x"))) / 100;
    const tip = limb.left + limb.width * Number(style.getPropertyValue("--arm-tip-x"));
    return (tip - touch) / limb.width;
  });

/** Where the router and the arm (with its finger on the antenna) are in the picture, as shares of it. */
const ROUTER = [0.41, 0.2, 0.95, 0.69] as const;
const ARM = [-0.14, 0.33, 0.43, 0.6] as const;

/** The headline, the router and the arm on the screen, and whether the headline is clear of both. */
const composition = async (page: Page) => {
  // Measured once the picture's entrance (it settles from slightly enlarged) is over.
  await expect
    .poll(() => page.locator(".hero-art-inner").evaluate((element) => getComputedStyle(element).transform), { timeout: 10_000 })
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  return page.evaluate(
    ([router, arm]) => {
      const frame = document.querySelector(".hero-frame")!.getBoundingClientRect();
      const share = ([x0, y0, x1, y1]: readonly number[]) => ({
        left: frame.left + frame.width * x0,
        top: frame.top + frame.height * y0,
        right: frame.left + frame.width * x1,
        bottom: frame.top + frame.height * y1,
      });
      const title = document.querySelector(".hero-title")!.getBoundingClientRect();
      const overlap = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      const boxes = { router: share(router), arm: share(arm) };
      return {
        ...boxes,
        overRouter: overlap(title, boxes.router),
        overArm: overlap(title, boxes.arm),
        width: window.innerWidth,
        height: window.innerHeight,
        page: document.documentElement.scrollWidth,
      };
    },
    [ROUTER, ARM] as const,
  );
};

function expectClear(layout: Awaited<ReturnType<typeof composition>>) {
  expect(layout.overArm, "headline over the arm").toBe(false);
  expect(layout.overRouter, "headline over the router").toBe(false);
  // The fingertip is on screen, and so is the whole router.
  expect(layout.arm.right).toBeGreaterThan(0);
  expect(layout.arm.right).toBeLessThan(layout.width);
  expect(layout.router.left).toBeGreaterThanOrEqual(0);
  expect(layout.router.right).toBeLessThanOrEqual(layout.width * 1.01);
  expect(layout.router.bottom).toBeLessThan(layout.height);
  expect(layout.page).toBeLessThanOrEqual(layout.width);
}

test("the router is drawn live over its still", async ({ page }) => {
  // A test browser draws WebGL in software, where the page keeps the still (see Hero.tsx).
  // data-hero-still asks for the scene's one unmoving frame regardless: enough to see it load and draw.
  await page.addInitScript(() => {
    new MutationObserver((_, observer) => {
      if (!document.documentElement) return;
      document.documentElement.setAttribute("data-hero-still", "");
      observer.disconnect();
    }).observe(document, { childList: true });
  });
  await open(page);
  await expect(page.locator(".hero-frame")).toHaveAttribute("data-live", "scene", { timeout: 45_000 });
  await expect(page.locator(".hero-canvas")).toHaveCSS("opacity", "1");
  const drawn = await page.locator(".hero-canvas").evaluate((canvas: HTMLCanvasElement) => ({ width: canvas.width, height: canvas.height }));
  expect(drawn.width).toBeGreaterThan(300);
  expect(drawn.width / drawn.height).toBeCloseTo(16 / 9, 1);
  // The scene says where the antenna is, and the arm hangs on it.
  const touch = await page.locator(".hero-frame").evaluate((frame: HTMLElement) => parseFloat(frame.style.getPropertyValue("--touch-x")));
  expect(touch).toBeGreaterThan(30);
  expect(touch).toBeLessThan(60);
});

test("the arm reaches in, touches the antenna and taps", async ({ page }) => {
  await open(page);
  await expect(page.locator("video")).toHaveCount(0);
  const still = page.locator(".hero-poster");
  await expect(still).toHaveAttribute("alt", /.+/);
  await expect.poll(() => still.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 15_000 }).toBe(true);
  for (const pose of [".hero-arm-open", ".hero-arm-point"]) await expect(page.locator(pose)).toHaveAttribute("alt", "");

  // The reach starts once the picture is settled: the live scene, or here the still.
  const frame = page.locator(".hero-frame");
  await expect(frame).toHaveAttribute("data-live", /scene|still/, { timeout: 30_000 });
  const moving = await page.evaluate(() => ({
    arm: getComputedStyle(document.querySelector(".hero-arm")!).animationName,
    rings: getComputedStyle(document.querySelector(".hero-rings span")!).animationName,
  }));
  expect(moving).toEqual({ arm: "reach, tap", rings: "ring" });

  // The finger arrives on the antenna, the hand by then pointing; that is what switches the router on.
  await expect.poll(async () => Math.abs(await armOffset(page)), { timeout: 15_000, intervals: [150] }).toBeLessThan(0.004);
  await expect(frame).toHaveAttribute("data-touched", "");
  await expect(page.locator(".hero-arm-point")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-arm-open")).toHaveCSS("opacity", "0");
  // A tap never pushes the finger past the antenna, and never draws it back far.
  const seen: number[] = [];
  for (let sample = 0; sample < 40; sample++) {
    seen.push(await armOffset(page));
    await page.waitForTimeout(160);
  }
  expect(Math.max(...seen)).toBeLessThan(0.004);
  expect(Math.min(...seen)).toBeGreaterThan(-0.03);
  expect(Math.min(...seen), "the finger draws back before it taps").toBeLessThan(-0.008);
});

test("scrolling draws the arm back while the camera turns over the router", async ({ page }) => {
  await open(page);
  const rig = page.locator(".hero-arm-rig");
  await expect(rig).toHaveCSS("opacity", "1");
  await scrub(page, "hero", 0.5);
  expect(Number(await variable(page, "--hero-progress"))).toBeGreaterThan(0.4);
  await expect(rig).toHaveCSS("opacity", "0");
  await scrub(page, "hero", 0);
  await expect(rig).toHaveCSS("opacity", "1");
});

test("the arm and the router stay clear of the headline", async ({ page }) => {
  await open(page);
  expectClear(await composition(page));
});

test("the hero stops moving once it has scrolled off the screen", async ({ page }) => {
  await open(page);
  await expect(page.locator(".hero-frame")).toHaveAttribute("data-live", /.+/, { timeout: 30_000 });
  const state = () => page.locator(".hero-arm").evaluate((element) => getComputedStyle(element).animationPlayState);
  expect((await state()).split(", ").every((value) => value === "running")).toBe(true);
  await scrub(page, "rail", 0.5);
  await expect(page.locator("html")).toHaveAttribute("data-hero-away", "");
  expect((await state()).split(", ").every((value) => value === "paused")).toBe(true);
  await scrub(page, "hero", 0.2);
  await expect(page.locator("html")).not.toHaveAttribute("data-hero-away", "");
});

test("the inked sentence lies exactly on the pale one and fills with scroll", async ({ page }) => {
  await open(page);
  await scrub(page, "manifesto", 0.5);
  const boxes = await page.evaluate(() => {
    const rect = (selector: string) => {
      const { left, top, width, height } = document.querySelector(selector)!.getBoundingClientRect();
      return { left, top, width, height };
    };
    const text = (selector: string) => document.querySelector(selector)!.textContent;
    return { base: rect(".manifesto-base"), fill: rect(".manifesto-fill"), same: text(".manifesto-base") === text(".manifesto-fill") };
  });
  expect(boxes.same).toBe(true);
  for (const side of ["left", "top", "width", "height"] as const) expect(Math.abs(boxes.base[side] - boxes.fill[side])).toBeLessThan(0.5);

  await scrub(page, "manifesto", 0);
  expect(parseFloat(await variable(page, "--manifesto-wipe"))).toBe(0);
  await scrub(page, "manifesto", 0.5);
  const half = parseFloat(await variable(page, "--manifesto-wipe"));
  expect(half).toBeGreaterThan(20);
  expect(half).toBeLessThan(80);
  await scrub(page, "manifesto", 1);
  expect(parseFloat(await variable(page, "--manifesto-wipe"))).toBe(100);
});

test("the package row walks its whole overflow and stops flush with the margin", async ({ page }) => {
  await open(page);
  const edges = () =>
    page.evaluate(() => {
      const cards = [...document.querySelectorAll("[data-rail-panel]:not([hidden]) .card")].map((card) => card.getBoundingClientRect());
      const margin = parseFloat(getComputedStyle(document.body).getPropertyValue("--pad"));
      return { first: cards[0].left, last: cards[cards.length - 1].right, margin, width: window.innerWidth, count: cards.length };
    });

  await scrub(page, "rail", 0);
  const start = await edges();
  expect(start.count).toBeGreaterThan(3);
  expect(Math.abs(start.first - start.margin)).toBeLessThan(1.5);
  expect(start.last).toBeGreaterThan(start.width);

  await scrub(page, "rail", 1);
  const end = await edges();
  expect(Math.abs(end.last - (end.width - end.margin))).toBeLessThan(1.5);
  expect(Number(await variable(page, "--rail-meter"))).toBe(1);
});

test("the counted prices land on the catalog's own numbers", async ({ page }) => {
  await open(page);
  await scrub(page, "rail", 0);
  const cards = home.promos.tabs[0].items.map((card) => content.catalog.find((item) => item.id === card.packageId)!);
  const shown = page.locator("[data-rail-panel]:not([hidden]) .card-price > .num");
  await expect(shown).toHaveCount(cards.length);
  // A card counts when it comes into view, so the row is walked along first, as a visitor's scroll does.
  for (let step = 0; step <= 12; step++) {
    await scrub(page, "rail", step / 12);
    await page.waitForTimeout(120);
  }
  await expect.poll(() => shown.allTextContents(), { timeout: 8000 }).toEqual(cards.map((item) => item.price.amount.toLocaleString("en-US")));
  await page.locator("#prices").scrollIntoViewIfNeeded();
  const listed = publicPackagesIn(content, home.prices.category, home.prices.group);
  await expect.poll(() => page.locator("#prices .col-price .num").allTextContents(), { timeout: 8000 }).toEqual(listed.map((item) => item.price.amount.toLocaleString("en-US")));
});

test("each tab shows its own row of packages, and that row is the one that walks", async ({ page }) => {
  await open(page);
  await scrub(page, "rail", 0);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(home.promos.tabs.length);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);

  const second = home.promos.tabs[1];
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel");
  await expect(panel).toHaveCount(1);
  await expect(panel.locator(".card")).toHaveCount(second.items.length);
  await expect(panel.locator(".card").first()).toHaveAttribute("data-package", second.items[0].packageId);
  // The button under the row follows the tab.
  await expect(page.locator(".rail-more a")).toHaveAttribute("data-cta", second.viewAll.id);

  // Arrow keys move between tabs, as in any tab list.
  await tabs.nth(1).press("ArrowLeft");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(tabs.first()).toBeFocused();

  // Nothing in the pinned screen is cut off at the bottom, whichever tab is open.
  for (let index = 0; index < home.promos.tabs.length; index++) {
    await tabs.nth(index).click();
    const over = await page.evaluate(() => {
      const pin = document.querySelector('[data-stage="rail"] .pin')!;
      const limit = pin.getBoundingClientRect().bottom + 0.5;
      return [...pin.querySelectorAll("*")].filter((element) => !element.closest("[hidden]") && element.getBoundingClientRect().height > 0 && element.getBoundingClientRect().bottom > limit).length;
    });
    expect(over, home.promos.tabs[index].id).toBe(0);
  }
});

test("the slip prints one step at a time and tears at the end", async ({ page }) => {
  await open(page);
  const lit = () => page.locator(".cue[data-lit]").count();
  const status = page.locator("[data-slip-status]");

  await scrub(page, "ticket", 0);
  expect(await lit()).toBe(0);
  const first = await status.textContent();
  expect(Number(await variable(page, "--packet-alpha"))).toBe(0);

  await scrub(page, "ticket", 0.45);
  expect(await lit()).toBeGreaterThan(0);
  expect(await lit()).toBeLessThan(4);
  await expect(page.locator(".cue[data-now]")).toHaveCount(1);
  expect(await status.textContent()).not.toBe(first);
  expect(Number(await variable(page, "--packet-cut"))).toBe(0);

  await scrub(page, "ticket", 1);
  expect(await lit()).toBe(4);
  await expect(page.locator("[data-slip-value][data-set]")).toHaveCount(3);
  expect(Number(await variable(page, "--packet-cut"))).toBe(1);
});

test("exactly one service chapter is lit at a time", async ({ page }) => {
  await open(page);
  const last = home.services.items.length - 1;
  for (const [progress, index] of [
    [0.05, 0],
    [0.5, Math.floor(home.services.items.length / 2)],
    [0.98, last],
  ] as const) {
    await scrub(page, "season", progress);
    await expect(page.locator(".chapter[data-active]")).toHaveCount(1);
    await expect(page.locator(".chapter").nth(index)).toHaveAttribute("data-active", "");
  }
});

test("words and rows rise into place when they come into view", async ({ page }) => {
  await open(page);
  const heading = page.locator("#prices-heading");
  await expect(heading).not.toHaveClass(/is-in/);
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveClass(/is-in/);
  await expect.poll(() => heading.locator(".w").last().evaluate((word) => Number(getComputedStyle(word).opacity))).toBe(1);
});

test("the menu opens, closes with Escape and leads to a page", async ({ page }) => {
  await open(page);
  const menu = page.locator(".nav-menu");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".nav-panel a").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".nav-panel")).toHaveCount(0);

  await menu.click();
  await page.locator('.nav-panel a[href="/broadband"]').click();
  await expect(page).toHaveURL(/\/broadband$/);
  await expect(page.locator("h1")).toHaveText(packagePageIn(content, "/broadband").hero.heading.th);
});

test("the navigation turns light over the dark stages", async ({ page }) => {
  await open(page);
  await expect(page.locator("html")).toHaveAttribute("data-nav", "paper");
  await scrub(page, "ticket", 0.5);
  await expect(page.locator("html")).toHaveAttribute("data-nav", "ink");
});

test("questions are native disclosures", async ({ page }) => {
  await open(page);
  const first = page.locator(".faq details").first();
  await first.scrollIntoViewIfNeeded();
  await expect(first.locator("p")).toBeHidden();
  await first.locator("summary").click();
  await expect(first.locator("p")).toBeVisible();
});

test("English lives at /en and each language links to the other", async ({ page }) => {
  await open(page, "/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("h1")).toContainText(/[A-Za-z]{4}/);
  await expect(page.locator('link[rel="alternate"][hreflang="th"]')).toHaveCount(1);
  const back = page.locator('footer a[lang="th"]');
  await expect(back).toHaveAttribute("href", "/");

  await open(page, "/");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.locator('footer a[lang="en"]')).toHaveAttribute("href", "/en");
});

test("prices carry the note that they are not confirmed", async ({ page }) => {
  await open(page);
  await expect(page.locator("#packages .rail-foot > .note")).toHaveText(content.site.ui.unverifiedNote.th);
  await expect(page.locator("#prices .note")).toContainText(content.site.ui.unverifiedNote.th);
  // Every package has a price in the page's own HTML, before any animation runs.
  const prices = await page.locator("#prices tbody .num").allTextContents();
  expect(prices.length).toBeGreaterThan(4);
});

test("an unknown address answers 404 in both languages", async ({ page }) => {
  const response = await page.goto("/no-such-page", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator('[lang="en"] h2')).toBeVisible();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the stages lie flat, everything is visible and the picture holds still", async ({ page }) => {
    await open(page);
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "");
    const state = await page.evaluate(() => ({
      pinned: [...document.querySelectorAll(".pin")].some((pin) => getComputedStyle(pin).position === "sticky"),
      hiddenWords: [...document.querySelectorAll(".w, [data-rev]")].filter((element) => getComputedStyle(element).opacity !== "1").length,
      wipe: getComputedStyle(document.querySelector(".manifesto-fill")!).clipPath,
      page: document.documentElement.scrollWidth,
      width: window.innerWidth,
      moving: [".hero-arm", ".hero-arm-point", ".hero-rings span"].map((selector) => getComputedStyle(document.querySelector(selector)!).animationName),
      active: document.querySelectorAll(".cue").length,
    }));
    expect(state.pinned).toBe(false);
    expect(state.hiddenWords).toBe(0);
    expect(state.wipe).toMatch(/inset\(0(px|%)?/);
    expect(state.page).toBeLessThanOrEqual(state.width);
    expect(state.moving).toEqual(["none", "none", "none"]);
    // The router is its still (no live scene is started), and the arm does not travel:
    // it is already where the reach ends, its hand pointing.
    await expect(page.locator(".hero-poster")).toBeVisible();
    await expect(page.locator(".hero-frame")).not.toHaveAttribute("data-live", /.*/);
    await expect(page.locator(".hero-canvas")).toHaveCSS("opacity", "0");
    expect(Math.abs(await armOffset(page))).toBeLessThan(0.004);
    await expect(page.locator(".hero-arm-point")).toHaveCSS("opacity", "1");
    await expect(page.locator(".hero-arm-open")).toHaveCSS("opacity", "0");
    await expect(page.locator(".hero-title")).toBeVisible();
    await expect(page.locator("[data-rail-panel]:not([hidden]) .card").last()).toBeVisible();
    // The slip shows its finished state rather than an empty form.
    await expect(page.locator("[data-slip-value][data-set]")).toHaveCount(3);
  });
});

test.describe("without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("the page reads top to bottom with nothing left hidden", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".hero-title")).toBeVisible();
    await expect(page.locator(".hero-poster")).toBeVisible();
    await expect(page.locator(".hero-arm-point")).toBeVisible();
    await expect(page.locator(".hero-arm-open")).toHaveCSS("opacity", "0");
    await expect(page.locator(".nav-menu")).toBeVisible();
    await expect(page.locator("#prices-heading")).toBeVisible();
    // The tabs cannot switch, so every row shows under its title.
    await expect(page.locator(".rail-tabs")).toBeHidden();
    await expect(page.locator(".rail-panel-title")).toHaveCount(home.promos.tabs.length);
    await expect(page.locator(".rail-track .card").last()).toBeVisible();
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll("main *, footer *")].filter((element) => getComputedStyle(element).opacity === "0" && !element.closest("[aria-hidden]")).length,
    );
    expect(hidden).toBe(0);
  });
});

// The picture must keep clear of the headline on every shape of screen, not only the two the projects use.
for (const [width, height] of [
  [1920, 1080],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [360, 640],
  [412, 915],
] as const) {
  test(`at ${width}x${height} the hand and the router are in view and clear of the headline`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one project is enough: the test sets its own screen size");
    await page.setViewportSize({ width, height });
    await open(page);
    expectClear(await composition(page));
  });
}

test.describe("on a screen too short to pin a stage", () => {
  test.use({ viewport: { width: 844, height: 390 } });

  test("the page lies flat, and comes alive again when the screen is turned upright", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one project is enough: the test sets its own screen size");
    await open(page);
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "");
    expect(await page.evaluate(() => [...document.querySelectorAll(".pin")].some((pin) => getComputedStyle(pin).position === "sticky"))).toBe(false);
    await expect(page.locator(".hero-title")).toBeVisible();
    await expect(page.locator("[data-slip-value][data-set]")).toHaveCount(3);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("html")).toHaveAttribute("data-motion", "");
    await scrub(page, "ticket", 0.45);
    await expect(page.locator(".cue[data-now]")).toHaveCount(1);

    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", "");
    await expect(page.locator(".cue[data-now]")).toHaveCount(0);
    await expect(page.locator("[data-slip-value][data-set]")).toHaveCount(3);
    expect(await variable(page, "--manifesto-wipe")).toBe("");
  });
});
