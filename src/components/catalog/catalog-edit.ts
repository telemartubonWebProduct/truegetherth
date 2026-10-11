import type { CatalogOrder } from "@/lib/content/documents";
import type { CatalogPackage, CategoryId, LocalizedText, PackagePage, SiteContent } from "@/lib/content/schema";

// What the "Packages and promos" page does to the content, as plain functions
// of the content: each returns the new body of one document (a package, a
// package page, or the catalog's order), which the page hands to the draft
// store. Nothing here knows about React or the server, so the rules (a copy
// starts hidden, a group with packages cannot be removed, a page keeps at
// least one group) are unit-tested without a browser.

export const categories: CategoryId[] = ["broadband-new", "broadband-existing", "mobile-monthly", "mobile-prepaid", "solar"];

/** A group of packages as a package page lists it: under one of the page's headings. */
export type GroupEntry = {
  category: CategoryId;
  group: string;
  /** The heading of the page's section it is listed under. */
  section: { id: string; heading: LocalizedText };
  /** Its own heading on the page, when it has one. */
  heading?: LocalizedText;
  /** The name shown in the back office: its own heading, else its section's. */
  name: string;
  /** False for the solar page's one group, which the page's layout fixes. */
  editable: boolean;
};

/** The package page of a category; solar has a page of another shape. */
export function pageOf(content: SiteContent, category: CategoryId): PackagePage | undefined {
  return content.pages.packages.find((doc) => doc.id === category);
}

/** The groups of a category in the order its page shows them, then any group that packages name but no page lists. */
export function groupsIn(content: SiteContent, category: CategoryId): GroupEntry[] {
  const groups: GroupEntry[] = [];
  if (category === "solar") {
    const { packages } = content.pages.solar;
    groups.push({ category, group: packages.group, section: { id: packages.id, heading: packages.heading }, name: packages.heading.th, editable: false });
  }
  for (const section of pageOf(content, category)?.sections ?? []) {
    for (const entry of section.groups) {
      if (entry.category !== category) continue;
      groups.push({
        category,
        group: entry.group,
        section: { id: section.id, heading: section.heading },
        heading: entry.heading,
        name: entry.heading?.th ?? section.heading.th,
        editable: true,
      });
    }
  }
  const listed = new Set(groups.map((entry) => entry.group));
  for (const item of content.catalog) {
    if (item.category !== category || listed.has(item.group)) continue;
    listed.add(item.group);
    groups.push({ category, group: item.group, section: { id: "", heading: { th: "ยังไม่อยู่ในหน้าเว็บ", en: "Not on a page yet" } }, name: item.group, editable: false });
  }
  return groups;
}

export function packagesIn(content: SiteContent, category: CategoryId, group: string): CatalogPackage[] {
  return content.catalog.filter((item) => item.category === category && item.group === group);
}

/** `stem-1`, `stem-2`, …: the first that is not taken. */
export function uniqueId(taken: (id: string) => boolean, stem: string): string {
  let n = 1;
  while (taken(`${stem}-${n}`)) n += 1;
  return `${stem}-${n}`;
}

/** An id made of an English name ("Netflix combo" gives "netflix-combo"), or null when the name has nothing to make one of. */
export function slugOf(name: string): string | null {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return /^[a-z]/.test(slug) ? slug : null;
}

/**
 * The id of a new package: its English name as a slug ("Fiber 1000 899" gives
 * "fiber-1000-899"), numbered from 2 when taken, or `fallback-n` when the
 * name has nothing to make one of. The id is the package's address
 * (/packages/<id>) and never changes afterwards; the name can.
 */
export function packageIdFor(taken: (id: string) => boolean, englishName: string, fallback: string): string {
  const slug = slugOf(englishName);
  if (!slug) return uniqueId(taken, fallback);
  if (!taken(slug)) return slug;
  let n = 2;
  while (taken(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

/** A new package starts hidden, with no price: the Admin types every value before showing it. */
export function blankPackage(id: string, category: CategoryId, group: string, per: CatalogPackage["price"]["per"], name: LocalizedText): CatalogPackage {
  return {
    id,
    category,
    group,
    name,
    price: { amount: 0, per, vat: "unknown" },
    benefits: [],
    details: [],
    conditions: [],
    source: { file: "หลังบ้าน", entry: "สร้างในหน้าแพ็กเกจและโปร" },
    review: { status: "hidden", notes: ["สร้างในหลังบ้าน: กรอกชื่อ ราคา และเงื่อนไข แล้วเปลี่ยนสถานะเป็นแสดงบนเว็บ"] },
  };
}

/** The name a copy is offered: the original's, marked as a copy. */
export function copyName(item: CatalogPackage): LocalizedText {
  return { th: `${item.name.th} (สำเนา)`, en: `${item.name.en} (copy)` };
}

/**
 * A copy of a package under a new id: everything the original says, price and
 * terms included, but hidden, so nothing reaches the site before an Admin has
 * read it through. The days it shows on are not copied.
 */
export function copyOf(item: CatalogPackage, id: string, name: LocalizedText = copyName(item)): CatalogPackage {
  const copy: CatalogPackage = {
    ...item,
    id,
    name,
    source: { file: "หลังบ้าน", entry: `สำเนาของ ${item.id}` },
    review: { status: "hidden", notes: [`สำเนาของ “${item.name.th}”: ตรวจชื่อ ราคา และเงื่อนไขก่อนเปลี่ยนสถานะเป็นแสดงบนเว็บ`] },
  };
  delete copy.showFrom;
  delete copy.showUntil;
  return copy;
}

/** The catalog's order with `id` placed right after the last package of a group (at the end when the group is empty). */
export function orderIntoGroup(content: SiteContent, id: string, category: CategoryId, group: string, after?: string): string[] {
  const order = content.catalog.map((item) => item.id).filter((entry) => entry !== id);
  const anchor = after ?? packagesIn(content, category, group).filter((item) => item.id !== id).at(-1)?.id;
  order.splice(anchor ? order.indexOf(anchor) + 1 : order.length, 0, id);
  return order;
}

/** The catalog's order with the packages `ids` (one group, in their order) rearranged so that the one at `index` sits at `to`. */
export function orderWithin(content: SiteContent, ids: string[], index: number, to: number): string[] {
  const next = ids.slice();
  const [moved] = next.splice(index, 1);
  next.splice(to, 0, moved);
  const order = content.catalog.map((item) => item.id);
  // The group's places in the whole order take the group's new order.
  const places = order.map((id, position) => (ids.includes(id) ? position : -1)).filter((position) => position >= 0);
  places.forEach((place, rank) => (order[place] = next[rank]));
  return order;
}

/** The catalog document as the content has it now. */
export function catalogOrderOf(content: SiteContent): CatalogOrder {
  return { order: content.catalog.map((item) => item.id), featured: content.featured };
}

/** The recommended list with a package added at the end, or taken out. Ids the catalog no longer has are dropped on the way. */
export function featuredWith(content: SiteContent, id: string, on: boolean): string[] {
  const known = new Set(content.catalog.map((item) => item.id));
  const rest = content.featured.filter((entry) => entry !== id && known.has(entry));
  return on ? [...rest, id] : rest;
}

/** The recommended list with the packages `ids` (the cards of one home tab, in their order) rearranged so that the one at `index` sits at `to`. */
export function featuredMoved(content: SiteContent, ids: string[], index: number, to: number): string[] {
  const next = ids.slice();
  const [moved] = next.splice(index, 1);
  next.splice(to, 0, moved);
  const featured = content.featured.slice();
  const places = featured.map((id, position) => (ids.includes(id) ? position : -1)).filter((position) => position >= 0);
  places.forEach((place, rank) => (featured[place] = next[rank]));
  return featured;
}

type Where = { section: string } | { newSection: LocalizedText };

/**
 * A package page with a new, empty group: under one of its headings, or under
 * a new heading of its own at the end of the page. Returns the page and the
 * group's id.
 */
export function withGroupAdded(content: SiteContent, page: PackagePage, category: CategoryId, heading: LocalizedText, where: Where): { page: PackagePage; group: string } {
  const groupTaken = (id: string) => content.catalog.some((item) => item.category === category && item.group === id) || page.sections.some((section) => section.groups.some((entry) => entry.group === id || entry.id === id));
  const slug = slugOf(heading.en);
  const group = slug && !groupTaken(slug) ? slug : uniqueId(groupTaken, slug ?? "group");
  const entry = { id: group, heading, category, group };
  if ("section" in where) {
    return { group, page: { ...page, sections: page.sections.map((section) => (section.id === where.section ? { ...section, groups: [...section.groups, entry] } : section)) } };
  }
  const anchorTaken = (id: string) => page.sections.some((section) => section.id === id);
  const anchorSlug = slugOf(where.newSection.en);
  const id = anchorSlug && !anchorTaken(anchorSlug) ? anchorSlug : uniqueId(anchorTaken, anchorSlug ?? "section");
  // Under a heading of its own, the group needs no second heading.
  const first = { id: group, category, group };
  return { group, page: { ...page, sections: [...page.sections, { id, heading: where.newSection, groups: [first], notes: [], tone: page.sections.at(-1)?.tone ?? "canvas" }] } };
}

/** A package page with one group's name changed: its own heading, or its section's when it has none of its own. */
export function withGroupRenamed(page: PackagePage, group: string, heading: LocalizedText): PackagePage {
  return {
    ...page,
    sections: page.sections.map((section) => {
      const entry = section.groups.find((candidate) => candidate.group === group);
      if (!entry) return section;
      if (entry.heading === undefined) return { ...section, heading };
      return { ...section, groups: section.groups.map((candidate) => (candidate.group === group ? { ...candidate, heading } : candidate)) };
    }),
  };
}

/** A package page with one group moved a place up (-1) or down (+1) among the groups under its heading; the same page when it cannot move. */
export function withGroupMoved(page: PackagePage, group: string, by: -1 | 1): PackagePage {
  return {
    ...page,
    sections: page.sections.map((section) => {
      const index = section.groups.findIndex((candidate) => candidate.group === group);
      const to = index + by;
      if (index === -1 || to < 0 || to >= section.groups.length) return section;
      const groups = section.groups.slice();
      [groups[index], groups[to]] = [groups[to], groups[index]];
      return { ...section, groups };
    }),
  };
}

/**
 * A package page without one group; a heading left with no group goes too.
 * Null when the page would be left with nothing: a package page keeps at
 * least one group.
 */
export function withGroupRemoved(page: PackagePage, group: string): PackagePage | null {
  const sections = page.sections.map((section) => ({ ...section, groups: section.groups.filter((candidate) => candidate.group !== group) })).filter((section) => section.groups.length > 0);
  return sections.length > 0 ? { ...page, sections } : null;
}
