import { expect, test } from "@playwright/test";

import { content } from "@/lib/content";
import { todayInThailand } from "@/lib/content/dates";
import { detailPackagesIn } from "@/lib/content/lookup";
import { localizePath } from "@/lib/i18n/locales";

import { blockThirdParty } from "./support/network";

test.use({ javaScriptEnabled: false });
test.beforeEach(async ({ context, baseURL }) => blockThirdParty(context, baseURL!));

for (const locale of ["th", "en"] as const) {
  test(`application guidance is readable without scripts and linked from contact and broadband details (${locale})`, async ({ page }) => {
    const application = localizePath("/wifiService", locale);
    await page.goto(application);
    const main = page.locator("main");
    await expect(main).toContainText(locale === "th" ? "บ้านเลขที่" : "house number");
    await expect(main).toContainText("VAT");
    await expect(main).toContainText(locale === "th" ? "ยังไม่ใช่การสมัครสำเร็จ" : "does not complete an application");
    await expect(main.locator(`a[href="${localizePath("/service", locale)}#callback"]`)).toBeVisible();
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.goto(localizePath("/service", locale));
    await expect(page.locator(`main a[href="${application}"]`)).toBeVisible();

    const item = detailPackagesIn(content, todayInThailand()).find((entry) => entry.category === "broadband-new")!;
    await page.goto(localizePath(`/packages/${item.id}`, locale));
    await expect(page.locator(`[data-application-guide] a[href="${application}"]`)).toBeVisible();
  });
}
