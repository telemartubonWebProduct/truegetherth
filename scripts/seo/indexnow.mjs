// Tells Bing and the other IndexNow search engines (Yandex, Naver, Seznam, Yep)
// that the site's pages exist or have changed, so they fetch them soon rather
// than whenever they next crawl. Bing's index also feeds Copilot and the web
// search of ChatGPT. Run it after a deploy that adds or changes pages, or after
// a publish that changes packages:
//
//   node scripts/seo/indexnow.mjs            submits every address in the live sitemap
//   node scripts/seo/indexnow.mjs --dry-run  lists them and submits nothing
//
// The key proves the site is ours: it is the name and the content of a file in
// public/ (public/<key>.txt), which must be live on the site before a
// submission is accepted. It is not a secret; anyone can read it there.
// docs/renovation/R13-SEARCH-AND-PARTNER.md has the rest.
import { readdirSync, readFileSync } from "node:fs";

const origin = process.env.SITE_URL || "https://www.truegetherth.com";
const dryRun = process.argv.includes("--dry-run");

const keyFile = readdirSync("public").find((name) => /^[0-9a-f]{32}\.txt$/.test(name));
if (!keyFile) throw new Error("No IndexNow key file (public/<32 hex characters>.txt)");
const key = keyFile.slice(0, -".txt".length);
if (readFileSync(`public/${keyFile}`, "utf8").trim() !== key) throw new Error(`public/${keyFile} must contain its own name`);

const live = await fetch(`${origin}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) throw new Error(`${origin}/${keyFile} does not serve the key yet: deploy first`);

const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
if (urlList.length === 0) throw new Error(`No addresses in ${origin}/sitemap.xml`);
console.log(`${urlList.length} addresses from ${origin}/sitemap.xml`);
if (dryRun) {
  console.log(urlList.join("\n"));
  process.exit(0);
}

// One request takes up to 10,000 addresses.
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(origin).host, key, keyLocation: `${origin}/${keyFile}`, urlList }),
});
// 200 and 202 are accepted; 403 means the key file was not found or does not match; 422 that an address is not this host's.
console.log(`IndexNow answered ${response.status} ${response.statusText}`);
if (!response.ok) process.exit(1);
