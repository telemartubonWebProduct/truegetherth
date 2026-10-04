import type { ReactNode } from "react";

import { SiteLayout, siteMetadata, siteViewport } from "../_site/layout";

// Root layout of the English pages, under /en (see ../_site/layout.tsx).
// Written by scripts/routes/generate.mjs.
export const generateMetadata = () => siteMetadata("en");
export const viewport = siteViewport;

export default function Layout({ children }: { children: ReactNode }) {
  return <SiteLayout locale="en">{children}</SiteLayout>;
}
