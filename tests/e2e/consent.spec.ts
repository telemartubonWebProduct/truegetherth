import { expect, test, type Page } from "@playwright/test";

import { CONSENT_COOKIE } from "@/lib/analytics/consent";
import { content } from "@/lib/content";
import { telHref } from "@/lib/content/render";
import { siteUrl } from "@/lib/seo/metadata";

import { consentState, noChoice } from "./support/consent";
import { blockThirdParty, serveAt, settle } from "./support/network";

// Cookie consent (M5, PDPA): nothing optional loads until the visitor chooses;
// refusing is as easy as accepting; "Cookie settings" in the footer changes or
// withdraws the choice. Then Google Ads, GA4 (production domain only) and Tawk
// load according to it, and clicks on LINE and phone links reach GA4 as their
// own events. Requests to Google and Tawk are blocked, so the tag's queue
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
  expect(cookie?.value).toMatch(new RegExp(`^${consent.policyVersion}\\.000\\.\\d+$`));

  await page.reload();
  await settle(page);
  await expect(banner(page)).toBeHidden();
  expect(await scripts(page)).toEqual([]);
});

test("accepting everything on the production domain loads Google Ads, GA4 and the chat", async ({ page }) => {
  await page.goto(`${production}/broadband`);
  await banner(page).getByRole("button", { name: consent.acceptAll.th }).click();
  await expect(banner(page)).toBeHidden();
  await expect.poll(() => configured(page)).toEqual([integrations.googleAdsId, integrations.ga4MeasurementId]);
  const [first] = await gtagCalls(page);
  expect(first).toEqual(["consent", "default", { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" }]);
  await expect.poll(() => scripts(page), { timeout: 10_000 }).toEqual([expect.stringContaining("googletagmanager.com/gtag/js"), integrations.tawkSrc]);
});

test("choosing analytics only configures GA4 and not Google Ads, and nothing counts off the production domain", async ({ page }) => {
  await page.goto(`${production}/monthy`);
  await banner(page).getByRole("button", { name: consent.customize.th }).click();
  await banner(page).getByRole("checkbox", { name: new RegExp(consent.analyticsTitle.th) }).check();
  await banner(page).getByRole("button", { name: consent.save.th }).click();
  await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
  expect((await gtagCalls(page))[0]).toEqual(["consent", "default", expect.objectContaining({ analytics_storage: "granted", ad_storage: "denied" })]);

  // The same choice on a preview or development host: GA4 is never configured there.
  await page.context().addCookies(consentState({ analytics: true, ads: false, chat: false }).cookies);
  await page.goto("/monthy");
  await settle(page);
  expect(await configured(page)).toEqual([]);
  expect(await scripts(page)).toEqual([]);
});

test("Cookie settings in the footer reopens the choice, and withdrawing advertising reloads without it", async ({ page }) => {
  await page.context().addCookies(consentState({ analytics: true, ads: true, chat: false }).cookies);
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
  await page.context().addCookies(consentState({ analytics: true, ads: false, chat: false }).cookies);
  await page.goto(`${production}/service`);
  await expect.poll(() => configured(page)).toEqual([integrations.ga4MeasurementId]);
  // Keep the page: the clicks are counted, the LINE app and the dialler stay closed.
  await page.evaluate(() => window.addEventListener("click", (event) => event.preventDefault(), { capture: true }));

  const channels = page.getByRole("region", { name: content.pages.contact.channels.heading.th });
  await channels.locator(`a[href="${contact.lineSales}"]`).first().click();
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
