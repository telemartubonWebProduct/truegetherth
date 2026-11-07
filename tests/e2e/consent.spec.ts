import { expect, test, type Page } from "@playwright/test";

import { CONSENT_COOKIE } from "@/lib/analytics/consent";
import { content } from "@/lib/content";
import { telHref } from "@/lib/content/render";
import { siteUrl } from "@/lib/seo/metadata";

import { consentState, noChoice } from "./support/consent";
import { blockThirdParty, serveAt, settle } from "./support/network";

// Cookie consent (M5, PDPA): nothing optional loads until the visitor chooses;
// refusing is as easy as accepting; "Cookie settings" in the footer changes or
// withdraws the choice. Then Google Ads and GA4 (production domain only) load
// according to it, and clicks on LINE and phone links reach GA4 as their own
// events. Requests to Google are blocked, so the tag's queue
// (window.dataLayer) and the script elements show what would be sent.

const { consent, integrations, contact } = content.site;
const production = siteUrl().origin;

test.use({ storageState: noChoice });

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
  await serveAt(context, baseURL!, production);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

function gtagCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => Array.from((window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [], (entry) => Array.from(entry)));
}

async function configured(page: Page) {
  return (await gtagCalls(page)).filter(([command]) => command === "config").map(([, id]) => id);
}

async function scripts(page: Page) {
  return page.evaluate(() => Array.from(document.scripts, (script) => script.src).filter((src) => /googletagmanager|tawk/.test(src)));
}

const banner = (page: Page) => page.getByRole("region", { name: consent.heading.th });

test("a first visit asks before anything optional loads, and refusing is one click", async ({ page, context }) => {
  await page.goto("/");
  await expect(banner(page)).toBeVisible();
  await settle(page);
  expect(await scripts(page)).toEqual([]);
  expect(await page.evaluate(() => "gtag" in window)).toBe(false);

  await banner(page).getByRole("button", { name: consent.rejectAll.th }).click();
  await expect(banner(page)).toBeHidden();
  const cookie = (await context.cookies()).find((entry) => entry.name === CONSENT_COOKIE);
  expect(cookie?.value).toMatch(new RegExp(`^${consent.policyVersion}\\.00\\.\\d+$`));

  await page.reload();
  await settle(page);
  await expect(banner(page)).toBeHidden();
  expect(await scripts(page)).toEqual([]);
});

test("accepting everything on the production domain loads Google Ads and GA4, and no chat widget", async ({ page }) => {
  await page.goto(`${production}/broadband`);
  await banner(page).getByRole("button", { name: consent.acceptAll.th }).click();
  await expect(banner(page)).toBeHidden();
  await expect.poll(() => configured(page)).toEqual([integrations.googleAdsId, integrations.ga4MeasurementId]);
  const [first] = await gtagCalls(page);
  expect(first).toEqual(["consent", "default", { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]);
  await settle(page);
  expect(await scripts(page)).toEqual([expect.stringContaining("googletagmanager.com/gtag/js")]);
});

test("choosing analytics only configures GA4 and not Google Ads, and nothing counts off the production domain", async ({ page }) => {
  await page.goto(`${production}/monthy`);
  await banner(page).getByRole("button", { name: consent.customize.th }).click();
  await banner(page).getByRole("checkbox", { name: new RegExp(consent.analyticsTitle.th) }).check();
  await banner(page).getByRole("button", { name: consent.save.th }).click();
  await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
  expect((await gtagCalls(page))[0]).toEqual(["consent", "default", expect.objectContaining({ analytics_storage: "granted", ad_storage: "denied" })]);

  // The same choice on a preview or development host: GA4 is never configured there.
  await page.context().addCookies(consentState({ analytics: true, ads: false }).cookies);
  await page.goto("/monthy");
  await settle(page);
  expect(await configured(page)).toEqual([]);
  expect(await scripts(page)).toEqual([]);
});

test("Cookie settings in the footer reopens the choice, and withdrawing advertising reloads without it", async ({ page }) => {
  await page.context().addCookies(consentState({ analytics: true, ads: true }).cookies);
  await page.goto(`${production}/`);
  await expect.poll(() => configured(page)).toEqual([integrations.googleAdsId, integrations.ga4MeasurementId]);
  await expect(banner(page)).toBeHidden();

  await page.getByRole("contentinfo").getByRole("button", { name: consent.settingsLink.th }).click();
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).getByRole("heading", { name: consent.heading.th })).toBeFocused();
  const ads = banner(page).getByRole("checkbox", { name: new RegExp(consent.adsTitle.th) });
  await expect(ads).toBeChecked();
  await ads.uncheck();
  await Promise.all([page.waitForEvent("load"), banner(page).getByRole("button", { name: consent.save.th }).click()]);

  await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
  expect((await gtagCalls(page)).filter(([, name]) => name === "conversion")).toEqual([]);
  await expect(banner(page)).toBeHidden();
});

test("clicks on LINE and phone links reach GA4 as their own events, with the button's id and no personal data", async ({ page }) => {
  await page.context().addCookies(consentState({ analytics: true, ads: false }).cookies);
  await page.goto(`${production}/service`);
  await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
  // Keep the page: the clicks are counted, the LINE app and the dialler stay closed.
  await page.evaluate(() => window.addEventListener("click", (event) => event.preventDefault(), { capture: true }));

  const channels = page.getByRole("region", { name: content.pages.contact.channels.heading.th });
  // The contact page's LINE is the general account, the one whose ID and QR code the site shows.
  await channels.locator(`a[href="${contact.lineService}"]`).first().click();
  await channels.locator(`a[href="${telHref(contact.phones[0].number)}"]`).first().click();
  const events = (await gtagCalls(page)).filter(([command]) => command === "event");
  expect(events).toEqual([
    ["event", "contact_line", { cta_id: "contact-line", page_path: "/service", send_to: integrations.ga4MeasurementId }],
    ["event", "contact_phone", { cta_id: "contact-phone", page_path: "/service", send_to: integrations.ga4MeasurementId }],
  ]);
});

test("the English site asks in English", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("region", { name: consent.heading.en })).toBeVisible();
  await expect(page.getByRole("link", { name: consent.policyLink.en })).toHaveAttribute("href", "/en/termsAndPrivacy#cookies");
});

for (const locale of ["th", "en"] as const) {
  test(`package contact events identify the selected plan across cards, comparison and details (${locale})`, async ({ page }) => {
    await page.context().addCookies(consentState({ analytics: true, ads: false }).cookies);
    const prefix = locale === "th" ? "" : "/en";
    await page.goto(`${production}${prefix}/broadband`);
    await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
    // Exercise the real click handler while keeping external apps closed.
    await page.evaluate(() => window.addEventListener("click", (event) => { if (event.target instanceof Element && event.target.closest('a[href^="tel:"], a[href^="https://lin.ee/"]')) event.preventDefault(); }, { capture: true }));
    const cards = page.locator("main .tm-slip[data-package]");
    const ids = await Promise.all([cards.nth(0).getAttribute("data-package"), cards.nth(1).getAttribute("data-package")]);
    for (const index of [0, 1]) {
      await cards.nth(index).locator(`a[href="${contact.lineSales}"]`).click();
      await cards.nth(index).getByRole("checkbox").check();
    }
    await page.getByRole("button", { name: content.site.ui.compareOpen[locale], exact: true }).click();
    const comparison = page.getByRole("dialog", { name: content.site.ui.compareOpen[locale] });
    await comparison.locator(`a[data-package-id="${ids[1]}"]`).click();
    const events = (await gtagCalls(page)).filter(([command, name]) => command === "event" && name === "contact_line");
    expect(events.map((call) => (call[2] as Record<string, unknown>).package_id)).toEqual([ids[0], ids[1], ids[1]]);
    expect(events).toHaveLength(3);

    await page.goto(`${production}${prefix}/packages/${ids[1]}`);
    await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
    await page.evaluate(() => window.addEventListener("click", (event) => { if (event.target instanceof Element && event.target.closest('a[href^="tel:"], a[href^="https://lin.ee/"]')) event.preventDefault(); }, { capture: true }));
    const detail = page.locator(`section[data-package="${ids[1]}"]`);
    await detail.locator(`a[href="${contact.lineSales}"]`).first().click();
    await detail.locator('a[href^="tel:"]').first().click();
    const detailEvents = (await gtagCalls(page)).filter(([command]) => command === "event");
    expect(detailEvents.map((call) => call[1])).toEqual(["contact_line", "contact_phone"]);
    for (const call of detailEvents) {
      expect(call[2]).toMatchObject({ package_id: ids[1], page_path: `${prefix}/packages/${ids[1]}`, send_to: integrations.ga4MeasurementId });
      expect(Object.keys(call[2] as object).sort()).toEqual(["cta_id", "package_id", "page_path", "send_to"]);
    }
    await page.locator('footer [data-cta="footer-line"]').click();
    const last = (await gtagCalls(page)).filter(([command]) => command === "event").at(-1)!;
    expect(last[2]).not.toHaveProperty("package_id");
  });
}
