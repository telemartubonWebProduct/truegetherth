import { expect, test, type Page } from "@playwright/test";

import { content, getPackagePage, packageById } from "@/lib/content";
import { detailPackagesIn, packageHomeIn, publicPackagesIn } from "@/lib/content/lookup";
import { benefitOptions, downloadMbps, packageDetailPath, priceLimits } from "@/lib/content/package-facts";
import { formatNumber } from "@/lib/content/render";

import { blockThirdParty, settle } from "./support/network";

// Package pages (docs/renovation/R3-PACKAGE-PAGES.md): filters, sorting and
// comparison over the page's packages, and a page for each package.

const { ui } = content.site;
const broadband = publicPackagesIn(content, "broadband-new", "new-customer");

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

const count = (shown: number, total: number) => ui.resultCount.th.replace("{shown}", String(shown)).replace("{total}", String(total));

/** Ids of the cards a visitor sees, in the order they appear on screen. */
function visibleCards(page: Page) {
  return page.locator("main [data-package]:visible").evaluateAll((cards) =>
    cards
      .map((card) => ({ id: (card as HTMLElement).dataset.package!, box: card.getBoundingClientRect() }))
      .sort((a, b) => a.box.top - b.box.top || a.box.left - b.box.left)
      .map((card) => card.id),
  );
}

test("speed, price and benefit filters leave only matching packages, and clear again", async ({ page }) => {
  await page.goto("/broadband");
  const status = page.locator("[data-result-count]");
  await expect(status).toHaveText(count(broadband.length, broadband.length));

  await page.getByRole("button", { name: "1 Gbps", exact: true }).click();
  await expect(page.getByRole("button", { name: "1 Gbps", exact: true })).toHaveAttribute("aria-pressed", "true");
  const fast = broadband.filter((item) => downloadMbps(item) === 1000);
  await expect.poll(() => visibleCards(page)).toEqual(fast.map((item) => item.id));
  await expect(status).toHaveText(count(fast.length, broadband.length));

  await page.getByRole("button", { name: ui.clearFilters.th }).click();
  await expect(status).toHaveText(count(broadband.length, broadband.length));

  const limit = priceLimits(broadband)[0];
  await page.getByLabel(ui.filterPrice.th).selectOption(String(limit));
  await expect.poll(() => visibleCards(page)).toEqual(broadband.filter((item) => item.price.amount <= limit).map((item) => item.id));

  await page.getByLabel(ui.filterPrice.th).selectOption("");
  const [benefit] = benefitOptions(broadband);
  await page.getByLabel(ui.filterBenefit.th).selectOption(benefit);
  await expect.poll(() => visibleCards(page)).toEqual(broadband.filter((item) => item.benefits.includes(benefit)).map((item) => item.id));
});

test("sorting reorders the cards on screen", async ({ page }) => {
  await page.goto("/broadband");
  await page.getByLabel(ui.sortBy.th).selectOption("price-low");
  const cheapestFirst = [...broadband].sort((a, b) => a.price.amount - b.price.amount).map((item) => item.id);
  await expect.poll(() => visibleCards(page)).toEqual(cheapestFirst);
  await page.getByLabel(ui.sortBy.th).selectOption("price-high");
  await expect.poll(() => visibleCards(page)).toEqual([...cheapestFirst].reverse());
  await page.getByLabel(ui.sortBy.th).selectOption("recommended");
  await expect.poll(() => visibleCards(page)).toEqual(broadband.map((item) => item.id));
});

test("a section left empty by the filters says so and keeps its anchor", async ({ page }) => {
  const doc = getPackagePage("/monthy");
  await page.goto("/monthy");
  const items = doc.sections.flatMap((section) => section.groups.flatMap((group) => publicPackagesIn(content, group.category, group.group)));
  await page.getByLabel(ui.filterPrice.th).selectOption(String(priceLimits(items)[0]));
  await expect(page.getByText(ui.noMatches.th).first()).toBeVisible();
  for (const section of doc.sections) await expect(page.locator(`section[id="${section.id}"]`)).toBeAttached();
});

test("two or three packages compare side by side, and no more than three", async ({ page }) => {
  await page.goto("/broadband");
  const pick = (id: string) => page.locator(`[data-package="${id}"]`).getByRole("checkbox", { name: new RegExp(ui.compareAdd.th) });
  await pick(broadband[0].id).check();
  await expect(page.getByText(ui.compareMore.th)).toBeVisible();
  await expect(page.getByRole("button", { name: ui.compareOpen.th, exact: true })).toBeDisabled();
  await pick(broadband[1].id).check();
  await pick(broadband[2].id).check();
  await expect(page.getByText(ui.compareChosen.th.replace("{count}", "3"))).toBeVisible();
  await expect(pick(broadband[3].id)).toBeDisabled();

  await page.getByRole("button", { name: ui.compareOpen.th, exact: true }).click();
  const dialog = page.getByRole("dialog", { name: ui.compareOpen.th });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("columnheader")).toHaveText(broadband.slice(0, 3).map((item) => item.name.th));
  for (const item of broadband.slice(0, 3)) await expect(dialog).toContainText(formatNumber(item.price.amount, "th"));
  await expect(dialog.getByRole("link", { name: new RegExp(ui.packageDetails.th) }).first()).toHaveAttribute("href", packageDetailPath(broadband[0].id));
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: ui.compareClear.th, exact: true }).click();
  await expect(pick(broadband[0].id)).not.toBeChecked();
  await expect(page.getByRole("region", { name: ui.compareOpen.th })).toHaveCount(0);
});

test("each package has its own page, in both languages", async ({ page }) => {
  const item = packageById("fiber-1g-799");
  const home = packageHomeIn(content, item)!;
  await page.goto("/broadband");
  await page.locator(`[data-package="${item.id}"]`).getByRole("link", { name: new RegExp(ui.packageDetails.th) }).click();
  await expect(page).toHaveURL(packageDetailPath(item.id));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.name.th);
  await expect(page.locator("main")).toContainText(formatNumber(item.price.amount, "th"));
  await expect(page.getByRole("navigation", { name: ui.breadcrumb.th }).getByRole("link", { name: home.pageTitle.th })).toHaveAttribute("href", `${home.path}#${home.hash}`);
  await expect(page.locator("[data-package-notes]")).toContainText(ui.unverifiedNote.th);
  for (const note of home.notes) await expect(page.locator("[data-package-notes]")).toContainText(note.th);
  await expect(page.getByRole("link", { name: new RegExp(`^${home.cta.label.th}`) })).toHaveAttribute("href", "https://lin.ee/blqnOJow");
  await expect(page.getByRole("link", { name: ui.callSales.th })).toHaveAttribute("href", /^tel:/);

  await page.goto(`/en${packageDetailPath(item.id)}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.name.en);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("every package page renders, and hidden packages have none", async ({ page, request, isMobile }) => {
  test.skip(isMobile, "the same pages as desktop");
  for (const item of detailPackagesIn(content)) {
    const response = await request.get(packageDetailPath(item.id));
    expect(response.status(), item.id).toBe(200);
  }
  const hidden = content.catalog.find((item) => item.review.status === "hidden")!;
  expect((await page.goto(packageDetailPath(hidden.id)))?.status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(`${packageDetailPath(broadband[0].id)}</loc>`);
});

test("without JavaScript every package shows and nothing pretends to filter", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "th-TH" });
  await blockThirdParty(context, baseURL!);
  const page = await context.newPage();
  await page.goto("/broadband");
  await expect(page.getByRole("heading", { name: ui.findPackage.th })).toBeHidden();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.locator("main [data-package]:visible")).toHaveCount(broadband.length);
  await settle(page);
  await context.close();
});
