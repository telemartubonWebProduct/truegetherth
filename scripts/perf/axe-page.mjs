// Lists what axe (WCAG 2.2 A/AA rules, as tests/e2e/accessibility.spec.ts runs them) finds on one page:
//   node scripts/perf/axe-page.mjs [url] [--mobile]
// Needs a running site and Playwright's Chromium. The cookie banner is answered first unless --banner is given.
import AxeBuilder from "@axe-core/playwright";
import { chromium, devices } from "@playwright/test";

const args = process.argv.slice(2);
const url = args.find((value) => value.startsWith("http")) ?? "http://localhost:3200/";
const mobile = args.includes("--mobile");
const banner = args.includes("--banner");

const browser = await chromium.launch();
const context = await browser.newContext({ ...(mobile ? devices["Pixel 7"] : devices["Desktop Chrome"]), locale: "th-TH" });
const page = await context.newPage();
await page.goto(url, { waitUntil: "load" });
if (!banner) {
  try {
    await page.getByRole("button", { name: /ใช้เฉพาะที่จำเป็น|Necessary only/i }).first().click({ timeout: 3000 });
  } catch {
    // The choice is stored already.
  }
}
await page.evaluate(() => document.fonts.ready);
const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
for (const violation of violations) {
  console.log(`${violation.id} (${violation.impact}): ${violation.help}`);
  for (const node of violation.nodes.slice(0, 12)) {
    console.log(`  ${node.target.join(" ")}`);
    const detail = node.any[0]?.message ?? node.all[0]?.message ?? node.none[0]?.message;
    if (detail) console.log(`    ${detail.slice(0, 200)}`);
  }
}
if (violations.length === 0) console.log("no violations");
await browser.close();
