import { expect, test } from "@playwright/test";

import { content } from "@/lib/content";
import { localizePath } from "@/lib/i18n/locales";

import { blockThirdParty } from "./support/network";

// The Ubon page (R20) is for a search engine and a visitor on a slow phone
// alike, so everything here is read without scripts.
test.use({ javaScriptEnabled: false });
test.beforeEach(async ({ context, baseURL }) => blockThirdParty(context, baseURL!));

const address = content.site.contact.address!;

for (const locale of ["th", "en"] as const) {
  test(`the Ubon page gives the head office's address, its questions and the way to the packages (${locale})`, async ({ page }) => {
    await page.goto(localizePath("/ubon", locale));
    await expect(page.locator("h1")).toHaveText(content.pages.ubon!.hero.heading[locale]);
    const office = page.locator("#office address");
    await expect(office).toContainText(address.street[locale]);
    await expect(office).toContainText(address.subdistrict[locale]);
    await expect(office).toContainText(address.postalCode);
    await expect(page.locator(`#office a[href="${content.site.contact.mapUrl}"]`)).toBeVisible();
    await expect(page.locator(`main a[href="${localizePath("/broadband", locale)}"]`).first()).toBeVisible();
    await expect(page.locator("#area li")).toHaveText(content.pages.ubon!.serviceArea!.provinces.map((province) => province[locale]));
    await expect(page.locator("#faq details")).toHaveCount(content.pages.ubon!.faq.items.length);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    // Search engines: the business with its postal address, and the page's questions.
    const nodes = (await page.locator('script[type="application/ld+json"]').allTextContents()).flatMap((text) => JSON.parse(text)["@graph"] as Record<string, unknown>[]);
    const business = nodes.find((node) => node["@type"] === "LocalBusiness")!;
    expect(business.address).toMatchObject({ postalCode: address.postalCode, addressRegion: address.province[locale], addressCountry: "TH" });
    expect(nodes.some((node) => node["@type"] === "FAQPage")).toBe(true);

    // Every page's footer leads here.
    await page.goto(localizePath("/broadband", locale));
    await expect(page.locator(`footer a[href="${localizePath("/ubon", locale)}"]`)).toBeVisible();
  });
}
