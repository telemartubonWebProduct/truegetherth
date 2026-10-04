import { benefits } from "@/content/benefits";
import { catalog } from "@/content/catalog";
import { media } from "@/content/media";
import { home } from "@/content/pages/home";
import { broadbandExistingPage, broadbandNewPage, mobileMonthlyPage, mobilePrepaidPage } from "@/content/pages/packages";
import { solarPage } from "@/content/pages/solar";
import { agentPage, contactPage, termsPage } from "@/content/pages/support";
import { site } from "@/content/site";

import { benefitIn, mediaIn, packageIn, packagePageIn, publicPackagesIn } from "./lookup";
import { siteContent, type Benefit, type CatalogPackage, type CategoryId, type MediaAsset, type PackagePage, type SiteContent } from "./schema";
import { contentProblems } from "./validate";

// The published content of the public site (M2 keeps it in src/content; M3
// stores Admin drafts in Supabase with the same schema, and M4 publishes
// releases). Everything is validated when this module loads, so a broken
// reference fails the build instead of rendering a half-empty page. Only the
// server imports this module: the renderer receives content as data.

export type { SiteContent } from "./schema";
export { contentProblems } from "./validate";

function load(): SiteContent {
  const parsed = siteContent.parse({
    site,
    media,
    benefits,
    catalog,
    pages: {
      home,
      packages: [broadbandNewPage, broadbandExistingPage, mobileMonthlyPage, mobilePrepaidPage],
      solar: solarPage,
      contact: contactPage,
      agent: agentPage,
      terms: termsPage,
    },
  });
  const problems = contentProblems(parsed);
  if (problems.length > 0) throw new Error(`Site content has ${problems.length} problem(s):\n${problems.join("\n")}`);
  return parsed;
}

export const content = load();

export const getMedia = (id: string): MediaAsset => mediaIn(content, id);
export const getBenefit = (id: string): Benefit => benefitIn(content, id);
export const getPackagePage = (path: PackagePage["path"]): PackagePage => packagePageIn(content, path);
export const publicPackages = (category: CategoryId, group: string): CatalogPackage[] => publicPackagesIn(content, category, group);
export const packageById = (id: string): CatalogPackage => packageIn(content, id);
