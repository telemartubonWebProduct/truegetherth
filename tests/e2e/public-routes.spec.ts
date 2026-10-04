import { expect, test, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { detailPackagesIn } from "@/lib/content/lookup";
import { packageDetailPath } from "@/lib/content/package-facts";
import { localizePath, locales } from "@/lib/i18n/locales";

import { blockThirdParty, settle } from "./support/network";

// Every public URL of the current site must keep working through the
// renovation (docs/renovation/CURRENT-SITE-AUDIT.md, PLAN.md). Thai stays at
// these URLs; English serves the same paths under /en.
const publicPaths = [
  "/",
  "/broadband",
  "/broadband-old",
  "/monthy",
  "/topup",
  "/wEnergy",
  "/service",
  "/wifiService",
  "/termsAndPrivacy",
];

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

function trackFailures(page: Page, origin: string) {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(`page error: ${error.message}`));
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) {
      failures.push(`${response.status()} ${decodeURIComponent(response.url())}`);
    }
  });
  return failures;
}

for (const locale of locales) {
  for (const path of publicPaths) {
    const url = localizePath(path, locale);

    test(`${url} renders in ${locale === "th" ? "Thai" : "English"} without errors or broken local assets`, async ({ page, baseURL }) => {
      const failures = trackFailures(page, baseURL!);

      const response = await page.goto(url, { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main#main")).toBeVisible();

      // Search engines get the page's own URL and its other language.
      const linkPath = async (selector: string) => new URL((await page.locator(selector).getAttribute("href"))!).pathname;
      expect(await linkPath('link[rel="canonical"]')).toBe(url);
      for (const other of locales) {
        expect(await linkPath(`link[rel="alternate"][hreflang="${other}"]`)).toBe(localizePath(path, other));
      }
      expect(await linkPath('link[rel="alternate"][hreflang="x-default"]')).toBe(path);

      // Lazy images below the fold only load once scrolled into view.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      });
      await page.waitForLoadState("networkidle");

      expect(await page.locator("img:not([alt])").count(), "images without alt").toBe(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "horizontal scroll").toBeLessThanOrEqual(0);
      expect(failures).toEqual([]);
    });
  }
}

test("the language switch opens the same page in the other language", async ({ page }) => {
  await page.goto("/monthy");
  await page.getByRole("button", { name: "เมนู" }).click();
  await page.locator("header").getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/monthy$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Postpaid mobile add-ons");

  await page.locator("footer").getByRole("link", { name: "ไทย" }).click();
  await expect(page).toHaveURL(/\/monthy$/);
  expect(new URL(page.url()).pathname).toBe("/monthy");
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
});

test("links inside the English site stay in English", async ({ page }) => {
  await page.goto("/en");
  const hrefs = await page.locator("main a[href^='/'], header a[href^='/'], footer a[href^='/']").evaluateAll((links) =>
    links.filter((link) => !link.hasAttribute("hreflang")).map((link) => link.getAttribute("href")!),
  );
  expect(hrefs.length).toBeGreaterThan(10);
  expect(hrefs.filter((href) => !href.startsWith("/en"))).toEqual([]);
});

test("old in-page anchors still land on their sections", async ({ page }) => {
  const anchors: [string, string][] = [
    ["/monthy", "internetpure"],
    ["/monthy", "socialInternet"],
    ["/monthy", "entertainment"],
    ["/monthy", "game"],
    ["/topup", "internet"],
    ["/topup", "internetcall"],
    ["/topup", "call"],
    ["/topup", "entertain"],
    ["/topup", "game"],
    ["/topup", "inssurance"],
    ["/broadband-old", "cctv"],
    ["/wEnergy", "solar"],
  ];
  for (const [path, id] of anchors) {
    await page.goto(`${path}#${id}`);
    await expect(page.locator(`[id="${id}"]`), `${path}#${id}`).toBeInViewport();
  }
});

test("package buttons open a LINE chat with the sales team", async ({ page }) => {
  await page.goto("/broadband");
  const buttons = page.getByRole("link", { name: /^สนใจแพ็กเกจนี้/ });
  expect(await buttons.count()).toBeGreaterThan(3);
  const first = buttons.first();
  await expect(first).toHaveAttribute("href", "https://lin.ee/blqnOJow");
  await expect(first).toHaveAttribute("target", "_blank");
  await expect(first).toHaveAttribute("rel", /noopener/);
  await expect(first).toHaveAttribute("data-cta", "broadband-new-interest");
});

test("the menu opens, marks the current page and closes with Escape", async ({ page }) => {
  await page.goto("/broadband-old");
  const toggle = page.getByRole("button", { name: "เมนู" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("navigation", { name: content.site.ui.mainNavigation.th });
  await expect(menu.getByRole("link", { name: "ลูกค้าปัจจุบัน", exact: true })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeHidden();
});

test("old and duplicate URLs redirect permanently", async ({ request }) => {
  const redirects: [string, string][] = [
    ["/SoonContent", "/"],
    ["/en/SoonContent", "/en"],
    ["/th", "/"],
    ["/th/broadband", "/broadband"],
  ];
  for (const [from, to] of redirects) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(new URL(response.headers().location, "http://x").pathname, from).toBe(to);
  }
});

test("unknown URLs get a real 404 page in both languages", async ({ page }) => {
  for (const url of ["/no-such-page", "/en/no-such-page"]) {
    const response = await page.goto(url);
    expect(response?.status(), url).toBe(404);
    await expect(page.getByRole("heading", { name: "ไม่พบหน้านี้" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});

test("search engines get a sitemap of both languages and robots rules", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname).sort();
  // Every public page and every package page (docs/renovation/R3-PACKAGE-PAGES.md), in both languages.
  const pages = [...publicPaths, ...detailPackagesIn(content).map((item) => packageDetailPath(item.id))];
  const expected = pages.flatMap((path) => locales.map((locale) => localizePath(path, locale))).sort();
  expect(listed).toEqual(expected);
  expect(xml).toContain('hreflang="x-default"');

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  const text = await robots.text();
  expect(text).toContain("Disallow: /admin");
  expect(text).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
});
