import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { todayInThailand } from "@/lib/content/dates";
import { detailPackagesIn } from "@/lib/content/lookup";
import { packageDetailPath } from "@/lib/content/package-facts";

import { noChoice } from "./support/consent";
import { blockThirdParty, settle } from "./support/network";

// M6 accessibility check: axe (WCAG 2.2 A/AA rules) on every kind of public page, in both
// languages, on desktop and phone, including the states people meet: the cookie banner, the
// call-back form with its messages, the open menu and the package comparison. Automated rules
// find only part of the problems; docs/renovation/M6-LAUNCH.md lists the manual checks.

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function violations(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  // The navigation, its open menu and the home page's opening fade in; contrast is measured once they are there.
  await expect
    .poll(() => page.evaluate(() => [...document.querySelectorAll(".nav, .nav-panel, .nav-panel li, .hero-scene, .hero-foot, .hero-foot > * > *")].every((element) => getComputedStyle(element).opacity === "1")), { timeout: 15_000 })
    .toBe(true);
  const { violations: found } = await new AxeBuilder({ page }).withTags(tags).analyze();
  return found.map((violation) => ({
    rule: violation.id,
    impact: violation.impact,
    targets: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
  }));
}

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

const item = detailPackagesIn(content, todayInThailand())[0];
const pages = ["/", "/broadband", "/broadband-old", "/monthy", "/topup", "/wEnergy", "/service", "/wifiService", "/termsAndPrivacy", packageDetailPath(item.id), "/en", "/en/service", "/no-such-page"];

for (const path of pages) {
  test(`${path} passes the automated WCAG checks`, async ({ page }) => {
    await page.goto(path);
    expect(await violations(page)).toEqual([]);
  });
}

test("the cookie banner and its choices pass", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ storageState: noChoice, baseURL });
  await blockThirdParty(context, baseURL!);
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("[data-consent-banner]")).toBeVisible();
  expect(await violations(page)).toEqual([]);
  await page.getByRole("button", { name: content.site.consent.customize.th }).click();
  expect(await violations(page)).toEqual([]);
  await context.close();
});

test("the call-back form passes, with every message showing", async ({ page }) => {
  await page.goto("/service#callback");
  await page.locator("form[data-lead-form]").getByRole("button", { name: content.site.leadForm.submit.th }).click();
  await expect(page.getByText(content.site.leadForm.errors.consent.th)).toBeVisible();
  expect(await violations(page)).toEqual([]);
});

test("the open menu passes", async ({ page }) => {
  await page.goto("/broadband");
  await page.getByRole("button", { name: content.site.ui.menu.th }).click();
  await expect(page.getByRole("navigation", { name: content.site.ui.mainNavigation.th })).toBeVisible();
  expect(await violations(page)).toEqual([]);
});
