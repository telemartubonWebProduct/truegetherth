#!/usr/bin/env node
// What stands between a page's stylesheets and its first paint, and what a browser then names as
// the page's largest paint (docs/renovation/R10-FIRST-PAINT.md). Two questions a score cannot answer:
//
// - How long does the first layout take, and did the page's scripts run before the first paint or
//   after it? (A script that has run by then is counted in PageSpeed's estimate; one that runs
//   after is not.)
// - Which element is the largest paint, and does a picture that arrives late take its place?
//
//   node scripts/perf/first-paint.mjs <url> [--runs 3] [--shape phone|desktop] [--size 412x823] [--reduced]
//        [--css "<rules added to the stylesheets>"] [--block <part of a url to refuse>] [--late <part of a url>=<ms>]...
//
// --css tries a rule without a build; --block shows the page without a file (a font, say); --late
// holds files back, as a slow connection does. Measure through scripts/perf/delay-proxy.mjs.
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const url = args[0];
if (!url) throw new Error("usage: first-paint.mjs <url> [options]");
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const runs = Number(option("--runs", "3"));
const css = option("--css", "");
const block = option("--block", "");
const late = args.flatMap((arg, index) => (arg === "--late" ? [args[index + 1].split("=")] : []));
const [width, height] = option("--size", "412x823").split("x").map(Number);
const phone = option("--shape", "phone") === "phone";

for (let run = 0; run < runs; run += 1) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...(phone ? { viewport: { width, height }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true } : { viewport: { width: 1350, height: 940 } }),
    reducedMotion: args.includes("--reduced") ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  if (css) {
    await page.route("**/*.css", async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: `${await response.text()}\n${css}` });
    });
  }
  if (block) await page.route((address) => address.href.includes(block), (route) => route.abort());
  for (const [part, ms] of late) {
    await page.route((address) => address.href.includes(part), async (route) => {
      await new Promise((resolve) => setTimeout(resolve, Number(ms)));
      await route.continue();
    });
  }
  await page.addInitScript(() => {
    window.__largest = [];
    new PerformanceObserver((entries) => {
      for (const entry of entries.getEntries()) {
        const element = entry.element;
        window.__largest.push({ at: Math.round(entry.startTime), size: entry.size, what: element ? `${element.tagName.toLowerCase()}.${String(element.className).split(" ")[0]}` : "?", layer: element?.closest?.("[data-layer]")?.dataset.layer ?? "", file: (entry.url || "").split("/").pop() });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  const client = await context.newCDPSession(page);
  const events = [];
  client.on("Tracing.dataCollected", (data) => events.push(...data.value));
  await client.send("Tracing.start", { transferMode: "ReportEvents", traceConfig: { includedCategories: ["devtools.timeline", "loading", "blink.user_timing", "disabled-by-default-devtools.timeline"] } });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(late.length > 0 ? 4000 : 1500);
  const largest = await page.evaluate(() => window.__largest);
  const done = new Promise((resolve) => client.once("Tracing.tracingComplete", resolve));
  await client.send("Tracing.end");
  await done;
  await browser.close();

  const start = events.find((event) => event.name === "navigationStart" && event.args?.data?.documentLoaderURL?.startsWith("http"))?.ts ?? 0;
  const at = (event) => (event.ts - start) / 1000;
  const paint = events.find((event) => event.name === "firstContentfulPaint" && event.ts > start);
  const parse = events.find((event) => event.name === "ParseHTML" && event.ts > start);
  const main = events.filter((event) => event.pid === parse.pid && event.tid === parse.tid && event.ts >= start && event.dur !== undefined).sort((a, b) => a.ts - b.ts);
  const before = (name) => main.filter((event) => event.name === name && event.ts <= paint.ts);
  const total = (name) => before(name).reduce((sum, event) => sum + event.dur / 1000, 0).toFixed(1);
  const layouts = before("Layout")
    .filter((event) => event.dur > 500)
    .map((event) => `${(event.dur / 1000).toFixed(1)} ms (${event.args?.beginData?.dirtyObjects} boxes)`);
  const script = main.find((event) => event.name === "EvaluateScript" && /\/_next\//.test(event.args?.data?.url ?? ""));
  console.log(
    `run ${run + 1}: first paint ${at(paint).toFixed(0)} ms | before it: styles ${total("UpdateLayoutTree")} ms, layout ${layouts.join(" + ")}, paint ${total("Paint")} ms | first script ran at ${script ? at(script).toFixed(0) : "-"} ms, ${script && script.ts < paint.ts ? "BEFORE the paint" : "after the paint"}`,
  );
  for (const entry of largest) console.log(`   largest paint: ${String(entry.at).padStart(5)} ms  ${String(entry.size).padStart(7)} px²  ${entry.what} ${entry.layer} ${entry.file}`);
}
