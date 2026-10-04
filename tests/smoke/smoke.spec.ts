import { expect, test, type BrowserContext, type Page } from "@playwright/test";

import { localizePath, locales } from "@/lib/i18n/locales";

// Smoke checks of a deployed site (playwright.smoke.config.ts): every page answers and renders
// without errors, old URLs still redirect, the consent banner comes before any third party, the
// contact page can take a request (or offers LINE and phone), and the back office stays private.
// Read-only: nothing is submitted. Content may differ from the repository (it is published from
// the back office), so the checks look at structure, not words.

const publicPaths = ["/", "/broadband", "/broadband-old", "/monthy", "/topup", "/wEnergy", "/service", "/wifiService", "/termsAndPrivacy"];

/** Every request to another site is blocked and recorded, so analytics count nothing. */
async function blockOthers(context: BrowserContext, origin: string): Promise<string[]> {
  const attempts: string[] = [];
  await context.route(
    (url) => (url.protocol === "http:" || url.protocol === "https:") && url.origin !== origin,
    (route) => {
      attempts.push(route.request().url());
      return route.abort("blockedbyclient");
    },
  );
  return attempts;
}

function failures(page: Page, origin: string): string[] {
  const found: string[] = [];
  page.on("pageerror", (error) => found.push(`page error: ${error.message}`));
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400) found.push(`${response.status()} ${response.url()}`);
  });
  return found;
}

test.beforeEach(async ({ context, baseURL }) => {
  await blockOthers(context, new URL(baseURL!).origin);
});

for (const locale of locales) {
  for (const path of publicPaths) {
    const url = localizePath(path, locale);
    test(`${url} answers and renders in ${locale === "th" ? "Thai" : "English"}`, async ({ page, baseURL }) => {
      const problems = failures(page, new URL(baseURL!).origin);
      const response = await page.goto(url);
      expect(response?.status(), url).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.getByRole("banner")).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      expect(await page.title()).not.toBe("");
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
      expect(problems, url).toEqual([]);
    });
  }
}

test("every package page in the sitemap answers", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const packages = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname).filter((path) => path.startsWith("/packages/"));
  expect(packages.length).toBeGreaterThan(0);
  for (const path of packages) expect((await request.get(path)).status(), path).toBe(200);
});

test("old URLs redirect permanently and unknown ones are a real 404", async ({ request }) => {
  for (const [from, to] of [
    ["/SoonContent", "/"],
    ["/th/broadband", "/broadband"],
  ]) {
    const response = await request.get(from, { maxRedirects: 0 });
    expect(response.status(), from).toBe(308);
    expect(new URL(response.headers().location, "http://x").pathname, from).toBe(to);
  }
  expect((await request.get("/no-such-page")).status()).toBe(404);
});

test("search engines get robots rules and a sitemap of both languages", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /admin");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/en/broadband");
  expect(xml).toContain('hreflang="x-default"');
});

test("HTTPS answers with HSTS", async ({ request, baseURL }) => {
  test.skip(!baseURL!.startsWith("https:"), "Only for HTTPS deployments.");
  const response = await request.get("/");
  expect(response.headers()["strict-transport-security"]).toMatch(/max-age=\d+/);
});

test.describe("a first visit", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("asks for cookie consent before any third party loads", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const attempts = await blockOthers(context, new URL(baseURL!).origin);
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("[data-consent-banner]")).toBeVisible();
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
    expect(attempts.filter((url) => /google|tawk|doubleclick/.test(url))).toEqual([]);
    await context.close();
  });
});

test("the contact page takes call-back requests, or offers LINE and phone instead", async ({ page }) => {
  await page.goto("/service");
  const form = page.locator("form[data-lead-form]");
  const fallback = page.locator("[data-lead-form-unavailable]");
  await expect(form.or(fallback)).toBeVisible();
  const live = await form.isVisible();
  test.info().annotations.push({ type: "call-back form", description: live ? "live (SUPABASE_SECRET_KEY is set)" : "LINE and phone only (no SUPABASE_SECRET_KEY on this deployment)" });
  if (live) await expect(form.getByRole("checkbox")).toBeVisible();
});

test("the back office asks to sign in and is kept out of search engines", async ({ page }) => {
  const response = await page.goto("/admin");
  expect(response?.status()).toBeLessThan(400);
  expect(new URL(page.url()).pathname).toMatch(/^\/admin/);
  const robots = `${response?.headers()["x-robots-tag"] ?? ""} ${(await page.locator('meta[name="robots"]').getAttribute("content")) ?? ""}`;
  expect(robots).toMatch(/noindex/);
});

test("the home page's opening picture loads", async ({ page }) => {
  await page.goto("/");
  const poster = page.locator(".hero-poster");
  await expect(poster).toBeVisible();
  await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
});
