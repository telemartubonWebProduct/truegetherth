import type { Benefit, CatalogPackage, CategoryId, Cta, LocalizedText, MediaAsset, PackagePage, SiteContent } from "./schema";

// Lookups over one version of the content (published or a draft). Pure
// functions of their input, so the public pages and the Mirror editor preview
// resolve references the same way.

export function mediaIn(content: SiteContent, id: string): MediaAsset {
  const asset = content.media[id];
  if (!asset) throw new Error(`Unknown media "${id}"`);
  return asset;
}

export function benefitIn(content: SiteContent, id: string): Benefit {
  const entry = content.benefits[id];
  if (!entry) throw new Error(`Unknown benefit "${id}"`);
  return entry;
}

export function packagePageIn(content: SiteContent, path: string): PackagePage {
  const doc = content.pages.packages.find((entry) => entry.path === path);
  if (!doc) throw new Error(`No package page at ${path}`);
  return doc;
}

/** Packages visitors may see, in catalog order. Hidden imports stay out. */
export function publicPackagesIn(content: SiteContent, category: CategoryId, group: string): CatalogPackage[] {
  return content.catalog.filter((item) => item.category === category && item.group === group && item.review.status !== "hidden");
}

/** Where a package belongs: its page and section, the notes that apply to it and the page's package button. */
export type PackageHome = {
  path: string;
  hash: string;
  pageTitle: LocalizedText;
  sectionHeading: LocalizedText;
  notes: LocalizedText[];
  cta: Cta;
};

export function packageHomeIn(content: SiteContent, item: CatalogPackage): PackageHome | null {
  for (const doc of content.pages.packages) {
    const section = doc.sections.find((entry) => entry.groups.some((group) => group.category === item.category && group.group === item.group));
    if (section) {
      return { path: doc.path, hash: section.id, pageTitle: doc.hero.heading, sectionHeading: section.heading, notes: section.notes, cta: doc.packageCta };
    }
  }
  const { solar } = content.pages;
  if (item.category === "solar" && solar.packages.group === item.group) {
    return { path: solar.path, hash: solar.packages.id, pageTitle: solar.hero.heading, sectionHeading: solar.packages.heading, notes: solar.packages.notes, cta: solar.packages.packageCta };
  }
  return null;
}

/** Packages with a page of their own: shown on the site and listed on one of its pages. */
export function detailPackagesIn(content: SiteContent): CatalogPackage[] {
  return content.catalog.filter((item) => item.review.status !== "hidden" && packageHomeIn(content, item) !== null);
}

/** A picture for a package: its own, else the one a home page card shows with it. */
export function packageImageIn(content: SiteContent, item: CatalogPackage): string | null {
  if (item.image) return item.image;
  for (const tab of content.pages.home.promos.tabs) {
    const card = tab.items.find((entry) => entry.packageId === item.id);
    if (card) return card.image;
  }
  return null;
}

export function packageIn(content: SiteContent, id: string): CatalogPackage {
  const item = content.catalog.find((entry) => entry.id === id);
  if (!item) throw new Error(`Unknown package "${id}"`);
  return item;
}
