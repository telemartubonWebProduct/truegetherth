import type { ReactNode } from "react";

import { SiteLayout, siteMetadata, siteViewport } from "../_site/layout";

// Root layout of the Thai pages, at the site's unprefixed URLs (see ../_site/layout.tsx).
// Written by scripts/routes/generate.mjs.
export const generateMetadata = () => siteMetadata("th");
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <SiteLayout locale="th">{children}</SiteLayout>;
}
