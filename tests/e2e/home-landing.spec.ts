import { expect, test, type Page } from "@playwright/test";

import { heroArt } from "@/components/site/home/hero-art";
import { content } from "@/lib/content";
import { todayInThailand } from "@/lib/content/dates";
import { featuredIn, packagePageIn, publicPackagesIn } from "@/lib/content/lookup";

import { blockThirdParty, settle } from "./support/network";

// The home page's scroll choreography (docs/renovation/R5-LANDING.md), checked
// where it can go wrong silently: a stage that does not move, a painting whose
// router slides under the navigation or the headline, a duplicate that drifts
// off its original, a row of packages that the page's scroll moves sideways or
// that stops short (R12), and the page without motion or scripts.

const home = content.pages.home;
const today = todayInThailand();
/** The cards of a tab of recommended packages: the catalog's recommended packages of the tab's categories. */
const cardsOf = (tab: number) => featuredIn(content, home.promos.tabs[tab].categories, today);

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

/** The pinned stages. The row of packages between the second and the third is not one (R12). */
const STAGES = ["hero", "manifesto", "ticket", "season"] as const;
type Stage = (typeof STAGES)[number];

// The tests wait for the document, not for every picture: a download must not decide when a check starts.
async function open(page: Page, path = "/") {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("html[data-ready]");
}

/**
 * Scrolls so that a pinned stage is `progress` (0..1) of the way through, and waits for it to be drawn. Again if
 * the stage moved meanwhile: the row of packages has no set height (R12) and gets its own once it comes near, which
 * moves the stages under it. And to a whole pixel short, not a part of one past: that height need not be a whole
 * number of pixels.
 */
async function scrub(page: Page, stage: Stage, progress: number) {
  await page.evaluate(
    async ([name, p]) => {
      const element = document.querySelector<HTMLElement>(`[data-stage="${name}"]`)!;
      const place = () => element.getBoundingClientRect().top + window.scrollY;
      for (let pass = 0; pass < 5; pass++) {
        const top = place();
        window.scrollTo(0, Math.floor(top + p * (element.offsetHeight - window.innerHeight)));
        await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
        if (Math.abs(place() - top) < 0.5) break;
      }
    },
    [stage, progress] as const,
  );
}

/** A scroll value, read where ScrollDriver writes it: on an element that reads it. Empty when nothing has it. */
const variable = (page: Page, name: string) =>
  page.evaluate((property) => {
    const holders = [...document.querySelectorAll<HTMLElement>('[style*="' + property + ':"]')].filter((element) => !element.closest("[hidden]"));
    return holders[0]?.style.getPropertyValue(property) ?? "";
  }, name);

/** Scrolls the page so that the top of the recommended packages is `below` pixels above the top of the screen. */
async function toPackages(page: Page, below = 0) {
  await page.evaluate(async (offset) => {
    const section = document.querySelector<HTMLElement>("#packages")!;
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + offset);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
  }, below);
}

/** The open tab's row of packages. */
const row = (page: Page) => page.locator("[data-rail-panel]:not([hidden]) [data-rail-track]");

/** Where the open tab's row is: its own scroll, its cards' outer edges, the page margin, and the page's scroll and width. */
const along = (page: Page) =>
  page.evaluate(() => {
    const track = document.querySelector<HTMLElement>("[data-rail-panel]:not([hidden]) [data-rail-track]")!;
    const cards = [...track.children].map((card) => card.getBoundingClientRect());
    return {
      left: track.scrollLeft,
      room: track.scrollWidth - track.clientWidth,
      first: cards[0].left,
      last: cards[cards.length - 1].right,
      lefts: cards.map((card) => card.left),
      rights: cards.map((card) => card.right),
      count: cards.length,
      margin: parseFloat(getComputedStyle(document.body).getPropertyValue("--pad")),
      width: window.innerWidth,
      scrollY: window.scrollY,
      page: document.documentElement.scrollWidth,
      top: document.querySelector("#packages")!.getBoundingClientRect().top,
    };
  });

/** The meter under the row: the bar, the red part that says which share of the row is in view and where, and that share. */
const meter = (page: Page) =>
  page.evaluate(() => {
    const box = (selector: string) => {
      const { left, right, width } = document.querySelector(selector)!.getBoundingClientRect();
      return { left, right, width };
    };
    const track = document.querySelector<HTMLElement>("[data-rail-panel]:not([hidden]) [data-rail-track]")!;
    return { bar: box(".rail-meter"), mark: box(".rail-meter span"), share: track.clientWidth / track.scrollWidth };
  });

/**
 * A gesture over the row, in pixels of scroll (positive: on along the row, down the page): a finger on a phone,
 * the wheel on a desktop (sideways, as a trackpad or Shift and the wheel send it).
 */
async function gesture(page: Page, isMobile: boolean | undefined, along: number, down: number) {
  const box = (await row(page).boundingBox())!;
  const y = box.y + 120;
  if (isMobile) {
    // The finger moves against the scroll, a little at a time as a hand does.
    const x = box.x + box.width * (along > 0 ? 0.8 : 0.5);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let step = 1; step <= 12; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - (along * step) / 12, y: y - (down * step) / 12 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
  } else {
    await page.mouse.move(box.x + box.width / 2, y);
    await page.mouse.wheel(along, down);
  }
}

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

/** The arrangement of the painting the screen shows (landing.css shows one of the two). */
const pack = (page: Page) => page.locator(".hero-pack").filter({ visible: true });

/** How far a layer of the shown arrangement is shifted from its place, in pixels. */
const shift = (page: Page, id: string) =>
  pack(page)
    .locator(`[data-layer="${id}"]`)
    .evaluate((layer) => {
      const [x = "0", y = "0"] = getComputedStyle(layer).translate.replace("none", "0px").split(" ");
      return { x: parseFloat(x), y: parseFloat(y) };
    });

/** The router's frame with its True Online mark, the headline and the navigation on the screen. */
const composition = async (page: Page) => {
  // Measured once the picture's entrance (it settles from slightly enlarged) is over.
  await expect
    .poll(() => page.locator(".hero-scene").evaluate((element) => getComputedStyle(element).transform), { timeout: 10_000 })
    .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  return page.evaluate(() => {
    type Box = { left: number; top: number; right: number; bottom: number };
    const box = (element: Element): Box => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    };
    const overlap = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const shown = [...document.querySelectorAll(".hero-pack")].find((element) => element.checkVisibility())!;
    const router = box(shown.querySelector(".hero-box[data-mark]")!);
    const mark = box(shown.querySelector(".hero-mark")!);
    const title = box(document.querySelector(".hero-title")!);
    const pills = [...document.querySelectorAll(".nav-logo, .nav-partner, .nav-menu, .nav-tags, .nav-right")].filter((element) => element.checkVisibility()).map(box);
    return {
      arrangement: shown.classList.contains("hero-pack-tall") ? ("tall" as const) : ("wide" as const),
      layers: [...shown.querySelectorAll(".hero-layer")].map((layer) => layer.getAttribute("data-layer")),
      router,
      mark,
      overRouter: overlap(title, router),
      underNavigation: pills.some((pill) => overlap(pill, mark)),
      width: window.innerWidth,
      height: window.innerHeight,
      page: document.documentElement.scrollWidth,
    };
  });
};

function expectClear(layout: Awaited<ReturnType<typeof composition>>) {
  expect(layout.layers).toEqual(heroArt.packs[layout.arrangement].layers.map((layer) => layer.id));
  expect(layout.overRouter, "headline over the router").toBe(false);
  expect(layout.underNavigation, "the True Online mark under the navigation").toBe(false);
  // The whole router, with its mark, is on the screen.
  expect(layout.router.left).toBeGreaterThanOrEqual(0);
  expect(layout.router.right).toBeLessThanOrEqual(layout.width * 1.01);
  expect(layout.mark.top).toBeGreaterThanOrEqual(0);
  expect(layout.router.bottom).toBeLessThan(layout.height);
  expect(layout.page).toBeLessThanOrEqual(layout.width);
}

test("the painting is laid in layers over its sky, and the figures float", async ({ page }) => {
  await open(page);
  // Pictures only: no film, and nothing drawn by script.
  await expect(page.locator(".hero video, .hero canvas")).toHaveCount(0);
  const sky = page.locator(".hero-sky");
  await expect(sky).toHaveAttribute("alt", /.+/);
  await expect.poll(() => sky.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 15_000 }).toBe(true);

  // Every figure of the arrangement in view has its picture; the figures say nothing to a screen reader.
  const figures = pack(page).locator(".hero-float > img:not(.hero-mark)");
  const layout = await composition(page);
  await expect(figures).toHaveCount(heroArt.packs[layout.arrangement].layers.length);
  await expect.poll(() => figures.evaluateAll((images: HTMLImageElement[]) => images.every((image) => image.complete && image.naturalWidth > 0)), { timeout: 15_000 }).toBe(true);
  expect(await figures.evaluateAll((images) => images.every((image) => image.getAttribute("alt") === "" && image.closest("[aria-hidden]") !== null))).toBe(true);
  // The mark on the router's frame is the owner's own file, not part of a generated picture.
  await expect(pack(page).locator(".hero-mark")).toHaveAttribute("src", heroArt.mark.src);

  // Each floats on its own, and a cherub is not where it was a moment ago.
  expect(await pack(page).locator(".hero-float").evaluateAll((floats) => floats.every((float) => getComputedStyle(float).animationName === "hero-float"))).toBe(true);
  const cherub = pack(page).locator('[data-layer="cherub-phone"] .hero-float');
  const before = (await cherub.boundingBox())!;
  await expect.poll(async () => Math.abs((await cherub.boundingBox())!.y - before.y), { timeout: 5_000, intervals: [200] }).toBeGreaterThan(0.3);
});

test("the pointer shifts the layers, the nearer the more", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "a phone has no pointer to follow");
  await open(page);
  expect(await shift(page, "near-clouds")).toEqual({ x: 0, y: 0 });
  await page.mouse.move(30, 30);
  await page.mouse.move(40, 40);
  await expect.poll(() => page.locator(".hero-scene").evaluate((scene: HTMLElement) => Number(scene.style.getPropertyValue("--px"))), { timeout: 5_000 }).toBeLessThan(-0.8);
  const far = await shift(page, "sea-god");
  const near = await shift(page, "near-clouds");
  // The pointer is at the top left: everything leans right and down, the near cloud furthest.
  expect(far.x).toBeGreaterThan(0.5);
  expect(near.x).toBeGreaterThan(far.x * 2);
  expect(near.y).toBeGreaterThan(far.y);
});

test("scrolling parts the layers while the picture draws back into its frame", async ({ page }) => {
  await open(page);
  await scrub(page, "hero", 0.5);
  expect(Number(await variable(page, "--hero-progress"))).toBeGreaterThan(0.4);
  const far = await shift(page, "sea-god");
  const near = await shift(page, "near-clouds");
  expect(far.y).toBeLessThan(-2);
  expect(near.y).toBeLessThan(far.y * 2);
  await scrub(page, "hero", 0);
  expect((await shift(page, "sea-god")).y).toBeGreaterThan(-1);
});

test("the router and its mark stay clear of the headline and the navigation", async ({ page }) => {
  await open(page);
  expectClear(await composition(page));
});

test("the hero stops moving once it has scrolled off the screen", async ({ page }) => {
  await open(page);
  const state = () => pack(page).locator(".hero-float").evaluateAll((floats) => floats.map((float) => getComputedStyle(float).animationPlayState));
  expect((await state()).every((value) => value === "running")).toBe(true);
  await toPackages(page);
  await expect(page.locator("html")).toHaveAttribute("data-hero-away", "");
  expect((await state()).every((value) => value === "paused")).toBe(true);
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

test("the row of packages is not pinned: scrolling down carries it by and never moves it sideways", async ({ page }) => {
  await open(page);
  await toPackages(page);
  const before = await along(page);
  expect(before.count).toBeGreaterThan(3);
  expect(before.left).toBe(0);
  expect(Math.abs(before.first - before.margin)).toBeLessThan(1.5);
  // The row runs on past the screen, and the next card shows at its edge: there is more to the side.
  expect(before.last).toBeGreaterThan(before.width);
  expect(before.lefts.some((left) => left < before.width - 24 && left > (before.width * 2) / 3)).toBe(true);
  expect(before.page).toBeLessThanOrEqual(before.width);

  await toPackages(page, 300);
  const after = await along(page);
  expect(Math.abs(after.top - (before.top - 300))).toBeLessThan(1.5);
  expect(after.left).toBe(0);
  expect(Math.abs(after.first - before.first)).toBeLessThan(0.5);
  const pinned = await page.locator("#packages").evaluate((section) => [section, ...section.querySelectorAll("*")].some((element) => getComputedStyle(element).position === "sticky"));
  expect(pinned).toBe(false);
});

test("a swipe moves the row and it stops at a card; scrolling down over it moves the page", async ({ page, isMobile }) => {
  await open(page);
  await page.evaluate(() => document.fonts.ready);
  await toPackages(page, 60);
  await expect(row(page)).toHaveClass(/is-in/);
  // Test the settled row, after its entrance and deferred scroll bootstrap.
  await row(page).evaluate(async (track) => {
    await Promise.all(track.getAnimations({ subtree: true }).filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished));
  });
  if (isMobile) await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
  const start = await along(page);

  // Down, over the row: the page goes down and the row stays where it was.
  await gesture(page, isMobile, 0, 300);
  await expect.poll(async () => (await along(page)).scrollY, { timeout: 5_000 }).toBeGreaterThan(start.scrollY + 100);
  expect((await along(page)).left).toBe(0);
  // Wait for the page to come to rest (the wheel's scroll is smoothed) before putting it back.
  await expect.poll(async () => {
    const first = (await along(page)).scrollY;
    await page.waitForTimeout(150);
    return (await along(page)).scrollY - first;
  }).toBe(0);

  // Sideways, over the row: the row moves, the page does not, and the row comes to rest with a card on the margin.
  await toPackages(page, 60);
  const level = (await along(page)).scrollY;
  await gesture(page, isMobile, isMobile ? 240 : 500, 0);
  await expect.poll(async () => (await along(page)).left, { timeout: 5_000 }).toBeGreaterThan(100);
  await expect
    .poll(
      async () => {
        const now = await along(page);
        return now.lefts.some((left) => Math.abs(left - now.margin) < 1.5);
      },
      { timeout: 5_000 },
    )
    .toBe(true);
  const moved = await along(page);
  expect(Math.abs(moved.scrollY - level)).toBeLessThan(2);
  expect(moved.page).toBeLessThanOrEqual(moved.width);
});

test("the meter under the row shows the share of the row in view, where it is, whatever the page's scroll", async ({ page }) => {
  await open(page);
  await toPackages(page, 60);
  // The row is measured once it is near: then the red part is its share in view, at the start of the bar.
  await expect.poll(async () => (await meter(page)).mark.width / (await meter(page)).bar.width).toBeLessThan(0.99);
  const start = await meter(page);
  expect(Math.abs(start.mark.width / start.bar.width - start.share)).toBeLessThan(0.02);
  expect(Math.abs(start.mark.left - start.bar.left)).toBeLessThan(1);

  await row(page).evaluate((track) => track.scrollTo({ left: track.scrollWidth, behavior: "instant" }));
  await expect.poll(async () => Math.abs((await meter(page)).mark.right - (await meter(page)).bar.right)).toBeLessThan(1);
  await toPackages(page, 200);
  const end = await meter(page);
  expect(Math.abs(end.mark.right - end.bar.right)).toBeLessThan(1);
});

test("on a wide screen the arrows move the row by the cards in view, and wait at either end", async ({ page, isMobile }) => {
  await open(page);
  await toPackages(page, 60);
  const back = page.getByRole("button", { name: home.promos.previous.th });
  const on = page.getByRole("button", { name: home.promos.next.th });
  if (isMobile) {
    // A phone swipes: there are no arrows on it.
    await expect(back).toBeHidden();
    await expect(on).toBeHidden();
    return;
  }
  await expect(back).toHaveAttribute("aria-disabled", "true");
  await expect(on).toHaveAttribute("aria-disabled", "false");

  // The card that was cut off at the edge comes to the margin, or the row goes as far as it goes.
  const start = await along(page);
  const cut = start.rights.findIndex((right) => right > start.width - start.margin + 1);
  const wanted = Math.min(start.lefts[cut] - start.margin, start.room);
  await on.click();
  await expect.poll(async () => Math.abs((await along(page)).left - wanted), { timeout: 5_000 }).toBeLessThan(1.5);
  await expect(back).toHaveAttribute("aria-disabled", "false");

  // On to the end: the last card stops flush with the margin, and the arrow waits there, still in the tab order.
  for (let press = 0; press < 8 && (await on.getAttribute("aria-disabled")) === "false"; press++) {
    await on.click();
    await page.waitForTimeout(700);
  }
  await expect(on).toHaveAttribute("aria-disabled", "true");
  const end = await along(page);
  expect(Math.abs(end.last - (end.width - end.margin))).toBeLessThan(1.5);
  await on.click({ force: true });
  await page.waitForTimeout(400);
  expect((await along(page)).left).toBe(end.left);
  await expect(on).toBeFocused();

  // With the keyboard, back to the first card.
  await back.focus();
  for (let press = 0; press < 8 && (await back.getAttribute("aria-disabled")) === "false"; press++) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(700);
  }
  await expect(back).toHaveAttribute("aria-disabled", "true");
  const first = await along(page);
  expect(first.left).toBe(0);
  expect(Math.abs(first.first - first.margin)).toBeLessThan(1.5);
});

test("the counted prices land on the catalog's own numbers", async ({ page }) => {
  await open(page);
  await toPackages(page, 60);
  const cards = cardsOf(0);
  const shown = page.locator("[data-rail-panel]:not([hidden]) .card-price > .num");
  await expect(shown).toHaveCount(cards.length);
  // A card counts when it comes into view, so the row is walked along first, as a visitor's swipe does.
  for (let step = 0; step <= 12; step++) {
    await row(page).evaluate((track, part) => track.scrollTo({ left: part * (track.scrollWidth - track.clientWidth), behavior: "instant" }), step / 12);
    await page.waitForTimeout(120);
  }
  await expect.poll(() => shown.allTextContents(), { timeout: 8000 }).toEqual(cards.map((item) => item.price.amount.toLocaleString("en-US")));
  // The table counts row by row as it comes into view, and may be taller than the screen: down to its last row.
  await page.locator("#prices").scrollIntoViewIfNeeded();
  await page.locator("#prices .col-price .num").last().scrollIntoViewIfNeeded();
  const listed = publicPackagesIn(content, home.prices.category, home.prices.group, today);
  await expect.poll(() => page.locator("#prices .col-price .num").allTextContents(), { timeout: 8000 }).toEqual(listed.map((item) => item.price.amount.toLocaleString("en-US")));
});

test("a card shows what its package gives over its picture, and a picture for each benefit", async ({ page }) => {
  await open(page);
  await toPackages(page);
  const [first] = cardsOf(0);
  const card = page.locator(`[data-rail-panel]:not([hidden]) [data-package="${first.id}"]`);
  await expect(card.locator(".card-figure")).toContainText(`${first.speed!.download.value}/${first.speed!.upload.value}`);
  await expect(card.locator(".card-perks .tm-benefit-tile img")).toHaveCount(Math.min(first.benefits.length, 4));
  // Only the pictures show, but every benefit is named for a screen reader.
  await expect(card.getByRole("list", { name: content.site.ui.benefits.th }).getByRole("listitem")).toHaveText(first.benefits.map((id) => content.benefits[id].label.th));
});

test("each tab shows its own row of packages, opened at its first card", async ({ page }) => {
  await open(page);
  await toPackages(page, 60);
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(home.promos.tabs.length);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);

  const second = home.promos.tabs[1];
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  const panel = page.getByRole("tabpanel");
  await expect(panel).toHaveCount(1);
  await expect(panel.locator(".card")).toHaveCount(cardsOf(1).length);
  await expect(panel.locator(".card").first()).toHaveAttribute("data-package", cardsOf(1)[0].id);
  // The button under the row follows the tab.
  await expect(page.locator(".rail-more a")).toHaveAttribute("data-cta", second.viewAll.id);

  // Arrow keys move between tabs, as in any tab list.
  await tabs.nth(1).press("ArrowLeft");
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await expect(tabs.first()).toBeFocused();

  // A row left part of the way along opens again at its first card. Whichever tab is open, its cards are whole
  // (the row clips nothing above or below them) and the page is no wider than the screen.
  await row(page).evaluate((track) => track.scrollTo({ left: track.scrollWidth, behavior: "instant" }));
  await expect.poll(async () => (await along(page)).left).toBeGreaterThan(0);
  for (const index of [1, 0, ...home.promos.tabs.keys()]) {
    await tabs.nth(index).click();
    await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
    const opened = await along(page);
    expect(opened.left, home.promos.tabs[index].id).toBe(0);
    expect(Math.abs(opened.first - opened.margin)).toBeLessThan(1.5);
    expect(opened.page).toBeLessThanOrEqual(opened.width);
    const clipped = await row(page).evaluate((track) => {
      const edge = track.getBoundingClientRect();
      return [...track.children].filter((card) => card.getBoundingClientRect().top < edge.top || card.getBoundingClientRect().bottom > edge.bottom).length;
    });
    expect(clipped, home.promos.tabs[index].id).toBe(0);
  }
});

test("the slip prints one step at a time and tears at the end", async ({ page }) => {
  await open(page);
  const lit = () => page.locator(".cue[data-lit]").count();
  const status = page.locator("[data-slip-status]");
  // The slip's picture: the one of the step just done, none before the first step.
  const shown = page.locator("[data-slip-picture][data-shown]");

  await scrub(page, "ticket", 0);
  expect(await lit()).toBe(0);
  await expect(shown).toHaveCount(0);
  const first = await status.textContent();
  // Not yet come in. The row of packages above has a height of its own (R12), which need not be a whole number
  // of pixels: a part of a pixel under way is still the start.
  expect(Number(await variable(page, "--packet-alpha"))).toBeLessThan(0.01);

  await scrub(page, "ticket", 0.45);
  expect(await lit()).toBeGreaterThan(0);
  expect(await lit()).toBeLessThan(4);
  await expect(page.locator(".cue[data-now]")).toHaveCount(1);
  expect(await status.textContent()).not.toBe(first);
  expect(Number(await variable(page, "--packet-cut"))).toBe(0);
  await expect(shown).toHaveCount(1);
  await expect(shown).toHaveAttribute("data-slip-picture", String((await lit()) - 1));
  // Where the slip has room for its picture (not on a short phone), the picture has loaded and is seen.
  if (await page.locator(".slip-plate").isVisible()) {
    await expect.poll(() => shown.evaluate((picture: HTMLImageElement) => picture.complete && picture.naturalWidth > 0 && getComputedStyle(picture).opacity === "1")).toBe(true);
  }

  await scrub(page, "ticket", 1);
  expect(await lit()).toBe(4);
  await expect(page.locator("[data-slip-value][data-set]")).toHaveCount(3);
  await expect(shown).toHaveAttribute("data-slip-picture", "3");
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
      moving: [".hero-float", ".hero-sky", ".hero-glow", ".hero-box"].map((selector) => getComputedStyle(document.querySelector(selector)!).animationName),
      shifted: [...document.querySelectorAll(".hero-layer")].filter((layer) => getComputedStyle(layer).translate !== "none").length,
      active: document.querySelectorAll(".cue").length,
    }));
    expect(state.pinned).toBe(false);
    expect(state.hiddenWords).toBe(0);
    expect(state.wipe).toMatch(/inset\(0(px|%)?/);
    expect(state.page).toBeLessThanOrEqual(state.width);
    expect(state.moving).toEqual(["none", "none", "none", "none"]);
    expect(state.shifted).toBe(0);
    // The painting is all there, every figure in its place, and nothing follows the pointer.
    await expect(page.locator(".hero-sky")).toBeVisible();
    await expect(pack(page).locator('[data-layer="goddess"] .hero-float > img:not(.hero-mark)')).toBeVisible();
    await page.mouse.move(40, 40);
    await page.waitForTimeout(300);
    expect(await page.locator(".hero-scene").evaluate((scene: HTMLElement) => scene.style.getPropertyValue("--px"))).toBe("");
    expectClear(await composition(page));
    await expect(page.locator(".hero-title")).toBeVisible();
    await expect(page.locator("[data-rail-panel]:not([hidden]) .card").last()).toBeVisible();
    // The row of packages is the same row that is scrolled sideways, and its meter follows it.
    expect(await row(page).evaluate((track) => getComputedStyle(track).overflowX)).toBe("auto");
    await toPackages(page, 60);
    await row(page).evaluate((track) => track.scrollTo({ left: track.scrollWidth, behavior: "instant" }));
    await expect.poll(async () => Math.abs((await meter(page)).mark.right - (await meter(page)).bar.right)).toBeLessThan(1);
    // The slip shows its finished state rather than an empty form, with the last step's picture.
    await expect(page.locator("[data-slip-value][data-set]")).toHaveCount(3);
    await expect(page.locator("[data-slip-picture][data-shown]")).toHaveAttribute("data-slip-picture", "3");
  });
});

test.describe("without scripts", () => {
  test.use({ javaScriptEnabled: false });

  test("the page reads top to bottom with nothing left hidden", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".hero-title")).toBeVisible();
    await expect(page.locator(".hero-sky")).toBeVisible();
    await expect(pack(page).locator('[data-layer="goddess"] .hero-float > img:not(.hero-mark)')).toBeVisible();
    await expect(pack(page).locator(".hero-mark")).toBeVisible();
    await expect(page.locator(".nav-menu")).toBeVisible();
    await expect(page.locator("#prices-heading")).toBeVisible();
    // The tabs cannot switch, so every row shows under its title, each with the browser's own bar to scroll it
    // sideways; the meter and the arrows, which need scripts, are not shown.
    await expect(page.locator(".rail-tabs")).toBeHidden();
    await expect(page.locator(".rail-panel-title")).toHaveCount(home.promos.tabs.length);
    await expect(page.locator(".rail-track .card").last()).toBeVisible();
    await expect(page.locator(".rail-bar")).toBeHidden();
    expect(await page.locator(".rail-track").first().evaluate((track) => getComputedStyle(track).scrollbarWidth)).not.toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const hidden = await page.evaluate(
      () => [...document.querySelectorAll("main *, footer *")].filter((element) => getComputedStyle(element).opacity === "0" && !element.closest("[aria-hidden]")).length,
    );
    expect(hidden).toBe(0);
  });
});

// The router must keep clear of the headline and the navigation on every shape of screen, not only the two the projects use.
for (const [width, height] of [
  [1920, 1080],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [900, 700],
  [360, 640],
  [375, 667],
  [412, 915],
] as const) {
  test(`at ${width}x${height} the router is in view, clear of the headline and the navigation`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one project is enough: the test sets its own screen size");
    await page.setViewportSize({ width, height });
    await open(page);
    const layout = await composition(page);
    expect(layout.arrangement).toBe(width < height ? "tall" : "wide");
    expectClear(layout);
  });

  test(`at ${width}x${height} the row of packages shows the next card at its edge and ends flush with the margin`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one project is enough: the test sets its own screen size");
    await page.setViewportSize({ width, height });
    await open(page);
    await toPackages(page, 60);
    const start = await along(page);
    expect(Math.abs(start.first - start.margin)).toBeLessThan(1.5);
    expect(start.lefts.some((left) => left < start.width - 24 && left > start.width / 2)).toBe(true);
    expect(start.page).toBeLessThanOrEqual(start.width);
    await row(page).evaluate((track) => track.scrollTo({ left: track.scrollWidth, behavior: "instant" }));
    const end = await along(page);
    expect(Math.abs(end.last - (end.width - end.margin))).toBeLessThan(1.5);
    expect(end.page).toBeLessThanOrEqual(end.width);
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
    await expect(page.locator("[data-slip-picture][data-shown]")).toHaveAttribute("data-slip-picture", "3");
    expect(await variable(page, "--manifesto-wipe")).toBe("");
  });
});
