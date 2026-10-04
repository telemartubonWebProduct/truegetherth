import { defineConfig, devices } from "@playwright/test";

import { CONSENT_COOKIE, serializeConsent } from "./src/lib/analytics/consent";
import { content } from "./src/lib/content";

// Smoke checks of a deployed site (M6, docs/renovation/M6-LAUNCH.md): read-only, safe to run
// against production after every deploy. They send no form, sign nobody in, and block every
// request to other sites, so Google Analytics and Ads count nothing.
//
//   npm run test:smoke                                          https://www.telemartubon.com
//   SMOKE_BASE_URL=https://<preview>.vercel.app npm run test:smoke
//
// A preview behind Vercel Deployment Protection needs SMOKE_BYPASS_SECRET (Vercel's "Protection
// Bypass for Automation" secret) in the environment, never in a file.
const baseURL = process.env.SMOKE_BASE_URL ?? "https://www.telemartubon.com";
const { hostname, protocol } = new URL(baseURL);
const bypass = process.env.SMOKE_BYPASS_SECRET;

// A visitor who chose "necessary only", so the consent banner stays out of the way.
const consent = serializeConsent({ analytics: false, ads: false, chat: false, version: content.site.consent.policyVersion, at: Math.floor(Date.now() / 1000) });

export default defineConfig({
  testDir: "tests/smoke",
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: "list",
  use: {
    baseURL,
    locale: "th-TH",
    trace: "retain-on-failure",
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "true" } : undefined,
    storageState: {
      cookies: [{ name: CONSENT_COOKIE, value: consent, domain: hostname, path: "/", expires: -1, httpOnly: false, secure: protocol === "https:", sameSite: "Lax" }],
      origins: [],
    },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
