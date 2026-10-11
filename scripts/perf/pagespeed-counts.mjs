#!/usr/bin/env node
// What PageSpeed's score of a page is made of (docs/renovation/R10-FIRST-PAINT.md).
//
// PageSpeed loads the page once on a fast machine, notes when the largest paint was seen, and then
// estimates how long everything that had arrived and run by that moment would take on a slow phone
// (1.6 Mbps, 150 ms, a processor four times slower). That estimate is the "Largest Contentful Paint"
// it reports, a quarter of the score. This runs the same Lighthouse and lists what was counted:
// every request and task, with the time the estimate gives it.
//
//   LIGHTHOUSE_DIR=<a folder where `npm i lighthouse` was run> node scripts/perf/pagespeed-counts.mjs <url> [runs]
//
// Lighthouse is not a dependency of this project (it is large, and only this needs it). Measure
// through scripts/perf/delay-proxy.mjs, not localhost directly: with no network at all, pictures
// asked for after the first paint are back before it shows, and are counted as they never are on
// a real connection. LIST=0 prints the scores only.
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

if (!process.env.LIGHTHOUSE_DIR) throw new Error("Set LIGHTHOUSE_DIR to a folder where `npm i lighthouse` was run.");
const home = path.dirname(createRequire(path.join(path.resolve(process.env.LIGHTHOUSE_DIR), "package.json")).resolve("lighthouse/package.json"));
const load = (file) => import(pathToFileURL(path.join(home, file)).href);
const { default: lighthouse } = await load("core/index.js");
const { LanternLargestContentfulPaint } = await load("core/computed/metrics/lantern-largest-contentful-paint.js");

const [url, runs = "1"] = process.argv.slice(2);
if (!url) throw new Error("usage: pagespeed-counts.mjs <url> [runs]");
const list = process.env.LIST !== "0";
const port = 9333;
const short = (address) => {
  try {
    return new URL(address).pathname.split("/").slice(-2).join("/").slice(-48) || "/";
  } catch {
    return String(address).slice(0, 48);
  }
};
const pad = (value, width) => String(value).padStart(width);

const scores = [];
for (let run = 0; run < Number(runs); run += 1) {
  // Lighthouse's own launcher cannot start Chrome on every machine; Playwright's browser is driven instead.
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
  try {
    const { lhr, artifacts } = await lighthouse(url, { port, output: "json", logLevel: "error", onlyCategories: ["performance"] });
    const audit = lhr.audits;
    const seen = audit.metrics?.details?.items?.[0] ?? {};
    const element = (audit["lcp-breakdown-insight"]?.details?.items ?? []).find((item) => item.type === "node");
    const score = Math.round((lhr.categories.performance.score ?? 0) * 100);
    scores.push({ score, lcp: audit["largest-contentful-paint"].numericValue });
    console.log(
      `run ${run + 1}: ${score} | first paint ${audit["first-contentful-paint"].displayValue}, largest paint ${audit["largest-contentful-paint"].displayValue}, blocked ${audit["total-blocking-time"].displayValue}, shift ${audit["cumulative-layout-shift"].displayValue}` +
        ` | seen on this machine: first paint ${Math.round(seen.observedFirstContentfulPaint)} ms, largest ${Math.round(seen.observedLargestContentfulPaint)} ms: ${(element?.snippet ?? "?").slice(0, 90)}`,
    );
    if (!list) continue;

    const estimate = await LanternLargestContentfulPaint.request(
      { trace: artifacts.Trace, devtoolsLog: artifacts.DevtoolsLog, gatherContext: artifacts.GatherContext, settings: lhr.configSettings, URL: artifacts.URL, SourceMaps: artifacts.SourceMaps, HostDPR: artifacts.HostDPR, simulator: null },
      { computedCache: new Map() },
    );
    // The estimate is the mean of a hopeful and a wary one; the wary one counts the most.
    const rows = [...estimate.pessimisticEstimate.nodeTimings.entries()].map(([node, timing]) => ({ node, ...timing })).sort((a, b) => a.endTime - b.endTime);
    let bytes = 0;
    for (const { node, startTime, endTime } of rows) {
      if (node.type === "network") {
        bytes += node.request.transferSize;
        console.log(`   ${pad(Math.round(startTime), 5)} → ${pad(Math.round(endTime), 5)} ms ${pad((node.request.transferSize / 1024).toFixed(1), 6)} KiB  ${node.request.priority.padEnd(8)} ${node.request.resourceType.padEnd(10)} ${short(node.request.url)}`);
      } else if (endTime - startTime >= 15) {
        console.log(`   ${pad(Math.round(startTime), 5)} → ${pad(Math.round(endTime), 5)} ms  main thread ${Math.round(endTime - startTime)} ms${node.didPerformLayout?.() ? " (layout)" : ""} ${[...(node.getEvaluateScriptURLs?.() ?? [])].map(short).join(", ").slice(0, 110)}`);
      }
    }
    console.log(`   counted before the largest paint: ${(bytes / 1024).toFixed(0)} KiB`);
  } finally {
    await browser.close();
  }
}
if (scores.length > 1) {
  const sorted = [...scores].sort((a, b) => a.score - b.score);
  console.log(`scores ${scores.map((item) => item.score).join(" ")} | median ${sorted[Math.floor(sorted.length / 2)].score}, largest paint ${(sorted[Math.floor(sorted.length / 2)].lcp / 1000).toFixed(1)} s`);
}
