// Writes the public route files:  node scripts/routes/generate.mjs
//
// Thai and English each have their own root layout (src/app/(th) at the site's
// unprefixed URLs, src/app/(en) under /en), so every public page needs one
// small file per language that names the page and the language. They are all
// alike, so they are generated from the list of pages in src/content/routes.ts
// rather than kept by hand. Run it after adding a page to that list.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const routes = readFileSync("src/content/routes.ts", "utf8");
const pages = [...routes.matchAll(/\{ path: "([^"]+)", page: "([^"]+)" \}/g)].map(([, route, page]) => [route.replace(/^\//, ""), page]);
if (pages.length === 0) throw new Error("No pages found in src/content/routes.ts");

const write = (file, text) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
  console.log(file);
};
const up = (depth) => "../".repeat(depth);

for (const [locale, group, prefix, where] of [
  ["th", "(th)", "", "Thai pages, at the site's unprefixed URLs"],
  ["en", "(en)", "en", "English pages, under /en"],
]) {
  write(
    `src/app/${group}/layout.tsx`,
    `import type { ReactNode } from "react";

import { SiteLayout, siteMetadata, siteViewport } from "../_site/layout";

// Root layout of the ${where} (see ../_site/layout.tsx).
// Written by scripts/routes/generate.mjs.
export const generateMetadata = () => siteMetadata("${locale}");
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <SiteLayout locale="${locale}">{children}</SiteLayout>;
}
`,
  );
  for (const [segment, id] of pages) {
    const parts = [prefix, segment].filter(Boolean);
    write(
      ["src/app", group, ...parts, "page.tsx"].join("/"),
      `import { pageRoute } from "${up(parts.length + 1)}_site/page-route";

// Written by scripts/routes/generate.mjs.
const route = pageRoute("${id}", "${locale}");

export const generateMetadata = route.generateMetadata;
export default route.Page;
`,
    );
  }
  const parts = [prefix, "packages", "[packageId]"].filter(Boolean);
  write(
    ["src/app", group, ...parts, "page.tsx"].join("/"),
    `import { packageRoute } from "${up(parts.length + 1)}_site/package-route";

// Written by scripts/routes/generate.mjs.
const route = packageRoute("${locale}");

// A package published after the build renders on its first visit.
export const dynamicParams = true;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
`,
  );
}
