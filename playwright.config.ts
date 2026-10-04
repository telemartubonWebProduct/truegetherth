import { defineConfig, devices } from "@playwright/test";

import { consentState, necessaryOnly } from "./tests/e2e/support/consent";

// E2E runs against a production build (`npm run build` first). Set
// E2E_BASE_URL to test an already running server instead of starting one.
// Port 3000 matches the local Auth site_url, so links in test emails reach this server.
const port = Number(process.env.E2E_PORT ?? 3000);
const baseURL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`;

// Environments with a preinstalled browser (e.g. Claude Cloud's
// /opt/pw-browsers/chromium) can point Playwright at it instead of downloading.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    locale: "th-TH",
    // A cookie choice is already made, so the banner (M5) stays out of the way; consent.spec.ts starts without one.
    storageState: consentState(necessaryOnly),
    trace: "retain-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Back-office flows share per-run accounts and drafts, so they run once
    // (desktop; the specs cover phone layouts with their own viewports).
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin-[a-z]+\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
