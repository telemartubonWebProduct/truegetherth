#!/usr/bin/env node
// Lab measurement of the public pages (M6, docs/renovation/M6-LAUNCH.md): Largest Contentful
// Paint, Cumulative Layout Shift, Total Blocking Time (long tasks after first paint) and what the
// page downloads, on a phone with Lighthouse's mobile throttling (4x slower CPU, 150 ms, 1.6 Mbps)
// and on an unthrottled desktop. Real visitors' numbers (field data) come from Search Console or
// GA4 later; this is for comparing builds.
//
//   node scripts/perf/lab-vitals.mjs [origin]          default http://127.0.0.1:3000
//
// Third-party requests are blocked and a "necessary cookies only" choice is set, so the numbers
// are the site's own (Google tags and chat load only after consent anyway).
import { chromium, devices } from "@playwright/test";

const origin = process.argv[2] ?? "http://127.0.0.1:3000";
const pages = ["/", "/broadband", "/service", "/packages/fiber-500-499", "/en"];
const profiles = {
  mobile: { device: devices["Pixel 7"], cpu: 4, network: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 } },
  desktop: { device: devices["Desktop Chrome"], cpu: 1, network: null },
};

const observe = () => {
  window.__vitals = { lcp: 0, cls: 0, tbt: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__vitals.lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__vitals.tbt += Math.max(0, entry.duration - 50);
  }).observe({ type: "longtask", buffered: true });
};

const browser = await chromium.launch();
const rows = [];
for (const [name, profile] of Object.entries(profiles)) {
  for (const path of pages) {
    const context = await browser.newContext({ ...profile.device, locale: "th-TH" });
    const { hostname } = new URL(origin);
    await context.addCookies([{ name: "tm_consent", value: `2026-10-02.000.${Math.floor(Date.now() / 1000)}`, domain: hostname, path: "/" }]);
    await context.route((url) => url.origin !== origin && url.protocol.startsWith("http"), (route) => route.abort());
    await context.addInitScript(observe);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    if (profile.network) await cdp.send("Network.emulateNetworkConditions", { offline: false, ...profile.network });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    let bytes = 0;
    let requests = 0;
    cdp.on("Network.loadingFinished", (event) => {
      bytes += event.encodedDataLength;
      requests += 1;
    });
    await page.goto(`${origin}${path}`, { waitUntil: "load", timeout: 120_000 });
    // Settle like Lighthouse: wait for the network to go quiet, then read the observers.
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
    await page.waitForTimeout(1500);
    const vitals = await page.evaluate(() => window.__vitals);
    rows.push({ profile: name, page: path, "LCP (s)": (vitals.lcp / 1000).toFixed(2), CLS: vitals.cls.toFixed(3), "TBT (ms)": Math.round(vitals.tbt), "KB": Math.round(bytes / 1024), requests });
    await context.close();
  }
}
await browser.close();
console.table(rows);
