import { expect, test } from "@playwright/test";

import { blockThirdParty, settle } from "./support/network";

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
});
test.afterEach(async ({ page }) => { await settle(page); });

for (const width of [320, 390, 768, 1280]) {
  for (const path of ["/", "/en/broadband"]) {
    test(`dealer identity and usable navigation at ${width}px on ${path}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: "load" });
      const logo = page.locator(".nav-logo");
      await expect(logo).toHaveAccessibleName(/ทรูออนไลน์ โดย เทเลมาร์ท|True Online by Telemart/);
      await expect(logo.locator("img")).toHaveAttribute("src", /true-online-telemart-v1/);
      await expect.poll(() => logo.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const rects = await page.locator(".nav").evaluate((header) => {
        const selectors = [".nav-logo", ".nav-menu", ".nav-right"];
        return selectors.map((selector) => {
          const rect = header.querySelector(selector)!.getBoundingClientRect();
          return { x: rect.x, right: rect.right, y: rect.y, bottom: rect.bottom };
        });
      });
      for (const rect of rects) { expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.right).toBeLessThanOrEqual(width); }
      expect(rects[0].right).toBeLessThanOrEqual(rects[1].x);
      expect(rects[1].right).toBeLessThanOrEqual(rects[2].x);
      const shortcuts = page.locator(".nav-tags");
      if (await shortcuts.isVisible()) {
        const tags = await shortcuts.boundingBox();
        expect(tags!.x + tags!.width).toBeLessThanOrEqual(rects[2].x);
      }
      await expect(page.locator("body")).not.toContainText("truegetherth");
      await expect(page).not.toHaveTitle(/truegetherth/i);
      await expect(page.locator("footer")).toContainText(/บริษัท เทเลมาร์ท|Telemart Communication Co/);
      await expect(page.locator("footer")).toContainText(/ไม่ใช่เว็บไซต์หลัก|not the main website/);
      const iconHref = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute("href");
      expect(iconHref).toMatch(/^\/icon\.svg\?/);
      expect((await page.request.get(iconHref!)).ok()).toBe(true);
      if (testInfo.project.name === "desktop" && (width === 390 || width === 1280)) {
        if (path === "/") {
          await expect.poll(() => page.locator(".hero img:visible").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
          await page.locator(".hero").evaluate(async (hero) => {
            await Promise.all(hero.getAnimations({ subtree: true }).filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished));
          });
        }
        await page.screenshot({ path: `shots/brand-2026-11-07/${width}-${path === "/" ? "home" : "broadband-en"}.png` });
      }
      await page.locator(".nav-menu").click();
      await expect(page.locator(".nav-panel")).toBeVisible();
      await expect(page.locator(".nav-menu")).toHaveAttribute("aria-expanded", "true");
    });
  }
}
