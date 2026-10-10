import { expect, test, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { siteUrl } from "@/lib/seo/metadata";

import { consentState, everything, necessaryOnly } from "./support/consent";
import { blockThirdParty, serveAt, settle } from "./support/network";

// A Google Ads conversion is a visitor asking to be contacted: a click on LINE
// or on a phone number (here), or a sent call-back form (leads.spec.ts, which
// needs the local database). Opening a page is not one. It counts on the
// production domain only, and only after the visitor agreed to advertising
// cookies (consent.spec.ts covers refusing); previews and development
// machines report none. The server under test is served at the production
// origin, and requests to Google are blocked, so the calls are read from the
// tag's queue (window.dataLayer) that gtag.js sends.
// The editor and its preview are covered in admin-editor.spec.ts.

const { googleAdsId, googleAdsLeadConversion } = content.site.integrations;
const production = siteUrl().origin;

test.use({ storageState: consentState(everything) });

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
  await serveAt(context, baseURL!, production);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

/** Every gtag() call queued on the page, in order. */
function gtagCalls(page: Page): Promise<unknown[][]> {
  return page.evaluate(() => {
    const queue = (window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [];
    return Array.from(queue, (entry) => Array.from(entry));
  });
}

async function conversions(page: Page) {
  return (await gtagCalls(page)).filter(([command, name]) => command === "event" && name === "conversion");
}

/** Waits until the tag is configured and the page has stopped loading. */
async function tagConfigured(page: Page) {
  await expect.poll(async () => (await gtagCalls(page)).some(([command, id]) => command === "config" && id === googleAdsId)).toBe(true);
  await settle(page);
}

/** Clicks a contact link of the footer without leaving the page: the site's own listener hears the click first. */
async function clickContact(page: Page, cta: string) {
  await page.locator(`footer a[data-cta="${cta}"]`).first().evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), { once: true });
    (link as HTMLAnchorElement).click();
  });
}

test("the site names its own domain as the production domain", () => {
  expect(production).toBe("https://www.truegetherth.com");
});

for (const path of ["/", "/en", "/broadband"]) {
  test(`opening ${path} on the production domain reports no conversion`, async ({ page }) => {
    await page.goto(`${production}${path}`);
    await tagConfigured(page);
    expect(await conversions(page)).toEqual([]);
  });
}

test("a click on LINE or on a phone number is one conversion each, after the tag is configured", async ({ page }) => {
  await page.goto(`${production}/broadband`);
  await tagConfigured(page);

  await clickContact(page, "footer-line");
  expect(await conversions(page)).toEqual([["event", "conversion", { send_to: googleAdsLeadConversion }]]);
  await clickContact(page, "footer-call");
  expect(await conversions(page)).toHaveLength(2);

  // E-mail and Facebook are contact events in Analytics, but not conversions.
  await clickContact(page, "footer-email");
  await clickContact(page, "footer-facebook");
  expect(await conversions(page)).toHaveLength(2);
  const events = (await gtagCalls(page)).filter(([command]) => command === "event").map(([, name]) => name);
  expect(events).toEqual(["contact_line", "conversion", "contact_phone", "conversion", "contact_email", "contact_facebook"]);
});

test("elsewhere, such as a preview deployment, a click reports none", async ({ page }) => {
  await page.goto("/broadband");
  await tagConfigured(page);
  expect(new URL(page.url()).origin).not.toBe(production);
  await clickContact(page, "footer-line");
  await clickContact(page, "footer-call");
  expect(await conversions(page)).toEqual([]);
});

test.describe("without advertising cookies", () => {
  test.use({ storageState: consentState(necessaryOnly) });

  test("a click reports nothing at all", async ({ page }) => {
    await page.goto(`${production}/broadband`);
    await settle(page);
    await clickContact(page, "footer-line");
    expect(await gtagCalls(page)).toEqual([]);
  });
});

test("Google Analytics 4 counts the production domain only", async ({ page }) => {
  const ga4 = content.site.integrations.ga4MeasurementId!;
  const ga4Config = async () => (await gtagCalls(page)).filter(([command, id]) => command === "config" && id === ga4);
  await page.goto(`${production}/monthy`);
  await tagConfigured(page);
  expect(await ga4Config()).toHaveLength(1);

  await page.goto("/monthy");
  await tagConfigured(page);
  expect(await ga4Config()).toEqual([]);
});
