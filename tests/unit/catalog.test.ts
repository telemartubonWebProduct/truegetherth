import { describe, expect, it } from "vitest";

import {
  blankPackage,
  copyOf,
  featuredMoved,
  featuredWith,
  groupsIn,
  orderIntoGroup,
  orderWithin,
  pageOf,
  slugOf,
  packageIdFor,
  uniqueId,
  withGroupAdded,
  withGroupMoved,
  withGroupRemoved,
  withGroupRenamed,
} from "@/components/catalog/catalog-edit";
import { content, contentProblems } from "@/lib/content";
import { todayInThailand } from "@/lib/content/dates";
import { parseDocument } from "@/lib/content/draft-model";
import { detailPackagesIn, featuredIn, isShown, publicPackagesIn } from "@/lib/content/lookup";
import type { CatalogPackage, SiteContent } from "@/lib/content/schema";

// "Packages and promos" (docs/renovation/R7-CATALOG.md): which packages
// visitors see on a given day, which get a card on the home page, and what the
// back office's page does to the content when an Admin adds, copies, moves or
// removes something.

const today = "2026-10-09";
const shown = content.catalog.find((item) => item.review.status !== "hidden" && item.category === "broadband-new")!;
const withPackage = (change: Partial<CatalogPackage>, id = shown.id): SiteContent => ({ ...content, catalog: content.catalog.map((item) => (item.id === id ? { ...item, ...change } : item)) });

describe("the days a package shows on", () => {
  it("are Thailand's days, whatever the server's clock says", () => {
    // 01:30 on 9 October in Bangkok is still 8 October in UTC.
    expect(todayInThailand(new Date("2026-10-08T18:30:00Z"))).toBe("2026-10-09");
    expect(todayInThailand(new Date("2026-10-08T16:59:00Z"))).toBe("2026-10-08");
  });

  it("include the first and the last day, and are open where none is set", () => {
    expect(isShown(shown, today)).toBe(true);
    expect(isShown({ ...shown, showFrom: today }, today)).toBe(true);
    expect(isShown({ ...shown, showUntil: today }, today)).toBe(true);
    expect(isShown({ ...shown, showFrom: "2026-10-10" }, today)).toBe(false);
    expect(isShown({ ...shown, showUntil: "2026-10-08" }, today)).toBe(false);
    expect(isShown({ ...shown, review: { ...shown.review, status: "hidden" } }, today)).toBe(false);
  });

  it("take a package off its page, its own page and the home page when they are over", () => {
    const over = withPackage({ showUntil: "2026-10-08" });
    expect(publicPackagesIn(content, shown.category, shown.group, today).map((item) => item.id)).toContain(shown.id);
    expect(publicPackagesIn(over, shown.category, shown.group, today).map((item) => item.id)).not.toContain(shown.id);
    expect(detailPackagesIn(over, today).map((item) => item.id)).not.toContain(shown.id);
    // The day before, it was still there.
    expect(publicPackagesIn(over, shown.category, shown.group, "2026-10-08").map((item) => item.id)).toContain(shown.id);
  });

  it("must not end before they begin, and must be real dates", () => {
    expect(contentProblems(withPackage({ showFrom: "2026-11-01", showUntil: "2026-10-31" }))).toEqual([expect.stringContaining("วันสิ้นสุดการแสดงต้องไม่ก่อนวันเริ่ม")]);
    expect(parseDocument(`package:${shown.id}`, { ...shown, showUntil: "31/10/2026" }).ok).toBe(false);
    expect(parseDocument(`package:${shown.id}`, { ...shown, showUntil: "2026-02-30" }).ok).toBe(false);
    expect(parseDocument(`package:${shown.id}`, { ...shown, showFrom: "2026-10-01", showUntil: "2026-10-31" }).ok).toBe(true);
  });
});

describe("the home page's recommended packages", () => {
  const [tab] = content.pages.home.promos.tabs;
  const cards = featuredIn(content, tab.categories, today);

  it("are the catalog's recommended list, in its order, a tab's categories at a time", () => {
    expect(cards.length).toBeGreaterThan(3);
    expect(cards.map((item) => item.id)).toEqual(content.featured.filter((id) => cards.some((item) => item.id === id)));
    expect(cards.every((item) => tab.categories.includes(item.category) && item.image !== undefined)).toBe(true);
    // Every tab of the home page has cards, and no package is on two tabs.
    const all = content.pages.home.promos.tabs.flatMap((entry) => featuredIn(content, entry.categories, today).map((item) => item.id));
    expect(new Set(all).size).toBe(all.length);
    expect(all.length).toBe(content.featured.length);
  });

  it("leave out a package that is hidden, outside its days, or gone from the catalog", () => {
    const [first, second, third] = cards;
    const ids = (next: SiteContent) => featuredIn(next, tab.categories, today).map((item) => item.id);
    expect(ids(withPackage({ review: { ...first.review, status: "hidden" } }, first.id))).not.toContain(first.id);
    expect(ids(withPackage({ showFrom: "2026-12-01" }, second.id))).not.toContain(second.id);
    expect(ids({ ...content, catalog: content.catalog.filter((item) => item.id !== third.id) })).not.toContain(third.id);
    // None of that is a problem in the content: the card simply is not there.
    expect(contentProblems(withPackage({ review: { ...first.review, status: "hidden" } }, first.id))).toEqual([]);
    expect(contentProblems({ ...content, catalog: content.catalog.filter((item) => item.id !== third.id) }).filter((problem) => problem.includes("แนะนำ"))).toEqual([]);
  });

  it("are added at the end and taken out without disturbing the rest", () => {
    const bare = content.catalog.find((item) => !content.featured.includes(item.id))!;
    expect(featuredWith(content, bare.id, true)).toEqual([...content.featured, bare.id]);
    expect(featuredWith(content, content.featured[1], false)).toEqual(content.featured.filter((id) => id !== content.featured[1]));
    // Ids the catalog no longer has are dropped on the way.
    expect(featuredWith({ ...content, featured: ["gone", ...content.featured] }, bare.id, true)).toEqual([...content.featured, bare.id]);
  });

  it("change places within one tab only", () => {
    const ids = cards.map((item) => item.id);
    const moved = featuredMoved(content, ids, 0, 2);
    expect(moved.filter((id) => ids.includes(id))).toEqual([ids[1], ids[2], ids[0], ...ids.slice(3)]);
    expect(moved.filter((id) => !ids.includes(id))).toEqual(content.featured.filter((id) => !ids.includes(id)));
  });
});

describe("packages in the back office", () => {
  it("start hidden and without a price when new", () => {
    const fresh = blankPackage("new-customer-new-1", "broadband-new", "new-customer", "month", { th: "โปรใหม่", en: "New promo" });
    expect(fresh.review.status).toBe("hidden");
    expect(fresh.price.amount).toBe(0);
    expect(parseDocument("package:new-customer-new-1", fresh).ok).toBe(true);
  });

  it("are copied whole, price and terms included, but hidden and without their days", () => {
    const source: CatalogPackage = { ...shown, showFrom: "2026-10-01", showUntil: "2026-10-31" };
    const copy = copyOf(source, `${shown.id}-copy-1`);
    expect(copy.price).toEqual(shown.price);
    expect(copy.benefits).toEqual(shown.benefits);
    expect(copy.conditions).toEqual(shown.conditions);
    expect(copy.review.status).toBe("hidden");
    expect(copy.name.th).toBe(`${shown.name.th} (สำเนา)`);
    expect(copy.showFrom).toBeUndefined();
    expect(copy.showUntil).toBeUndefined();
    expect(parseDocument(`package:${copy.id}`, copy).ok).toBe(true);
    // The original is untouched.
    expect(source.review.status).toBe(shown.review.status);
  });

  it("take the place asked for in the catalog's order", () => {
    const siblings = content.catalog.filter((item) => item.category === shown.category && item.group === shown.group).map((item) => item.id);
    const last = siblings.at(-1)!;
    // A new package, or one moved in, goes after the group's last.
    const intoGroup = orderIntoGroup(content, "fresh", shown.category, shown.group);
    expect(intoGroup[intoGroup.indexOf(last) + 1]).toBe("fresh");
    // A copy goes right after its original.
    const afterFirst = orderIntoGroup(content, "fresh", shown.category, shown.group, siblings[0]);
    expect(afterFirst[afterFirst.indexOf(siblings[0]) + 1]).toBe("fresh");
    // Reordering a group leaves every other package where it was.
    const swapped = orderWithin(content, siblings, 0, 1);
    expect(swapped.filter((id) => siblings.includes(id))).toEqual([siblings[1], siblings[0], ...siblings.slice(2)]);
    expect(swapped.filter((id) => !siblings.includes(id))).toEqual(content.catalog.map((item) => item.id).filter((id) => !siblings.includes(id)));
  });

  it("get ids nothing else has", () => {
    expect(uniqueId((id) => id === "a-1" || id === "a-2", "a")).toBe("a-3");
    expect(slugOf("Netflix combo 2026!")).toBe("netflix-combo-2026");
    expect(slugOf("โปรใหม่")).toBeNull();
    expect(slugOf("2026 offers")).toBeNull();
    // A package's id is its English name, numbered when taken; a name with nothing to use falls back to the group.
    const taken = (id: string) => id === "fiber-1000" || id === "fiber-1000-2";
    expect(packageIdFor(taken, "Fiber 1000", "new-customer-new")).toBe("fiber-1000-3");
    expect(packageIdFor(taken, "Fiber 2000 (new!)", "new-customer-new")).toBe("fiber-2000-new");
    expect(packageIdFor(taken, "โปร", "new-customer-new")).toBe("new-customer-new-1");
  });
});

describe("groups of packages", () => {
  const category = "mobile-monthly" as const;
  const page = pageOf(content, category)!;
  const name = { th: "คอมโบใหม่", en: "New combo" };

  it("are listed as their page shows them, under its headings", () => {
    const groups = groupsIn(content, category);
    expect(groups.map((entry) => entry.group)).toEqual(page.sections.flatMap((section) => section.groups.map((entry) => entry.group)));
    expect(groups.every((entry) => entry.editable && entry.name.length > 0)).toBe(true);
    // The solar page has one group, which its layout fixes.
    expect(groupsIn(content, "solar")).toEqual([expect.objectContaining({ group: content.pages.solar.packages.group, editable: false })]);
    expect(pageOf(content, "solar")).toBeUndefined();
  });

  it("can be added under a heading of the page, or under a new one, and may be empty", () => {
    const section = page.sections[1];
    const under = withGroupAdded(content, page, category, name, { section: section.id });
    expect(under.group).toBe("new-combo");
    expect(under.page.sections[1].groups.at(-1)).toEqual({ id: "new-combo", heading: name, category, group: "new-combo" });
    expect(parseDocument(`page:${category}`, under.page).ok).toBe(true);
    const next: SiteContent = { ...content, pages: { ...content.pages, packages: content.pages.packages.map((doc) => (doc.id === category ? under.page : doc)) } };
    expect(contentProblems(next)).toEqual([]);
    expect(groupsIn(next, category).map((entry) => entry.group)).toContain("new-combo");

    const fresh = withGroupAdded(content, page, category, name, { newSection: { th: "หัวข้อใหม่", en: "Fresh offers" } });
    expect(fresh.page.sections.at(-1)).toMatchObject({ id: "fresh-offers", heading: { th: "หัวข้อใหม่", en: "Fresh offers" }, groups: [{ id: "new-combo", category, group: "new-combo" }] });
    expect(parseDocument(`page:${category}`, fresh.page).ok).toBe(true);

    // A name already taken, or one with no Latin letters, still gets an id of its own.
    const taken = page.sections[0].groups[0].group;
    expect(withGroupAdded(content, page, category, { th: "ซ้ำ", en: taken }, { section: section.id }).group).toBe(`${taken}-1`);
    expect(withGroupAdded(content, page, category, { th: "ไทยล้วน", en: "ไทยล้วน" }, { section: section.id }).group).toBe("group-1");
  });

  it("must each be on one page only", () => {
    const [section] = page.sections;
    const twice = { ...page, sections: [{ ...section, groups: [...section.groups, { ...section.groups[0], id: "again" }] }, ...page.sections.slice(1)] };
    const next: SiteContent = { ...content, pages: { ...content.pages, packages: content.pages.packages.map((doc) => (doc.id === category ? twice : doc)) } };
    expect(contentProblems(next)).toEqual([expect.stringContaining("อยู่ในหน้าเว็บมากกว่าหนึ่งที่")]);
  });

  it("are renamed where their name is: their own heading, or their section's", () => {
    const headed = page.sections.flatMap((section) => section.groups).find((entry) => entry.heading !== undefined)!;
    const renamed = withGroupRenamed(page, headed.group, name);
    expect(renamed.sections.flatMap((section) => section.groups).find((entry) => entry.group === headed.group)!.heading).toEqual(name);

    const plainSection = page.sections.find((section) => section.groups.some((entry) => entry.heading === undefined))!;
    const plain = plainSection.groups.find((entry) => entry.heading === undefined)!;
    const retitled = withGroupRenamed(page, plain.group, name);
    expect(retitled.sections.find((section) => section.id === plainSection.id)!.heading).toEqual(name);
    expect(retitled.sections.find((section) => section.id === plainSection.id)!.groups).toEqual(plainSection.groups);
  });

  it("move among the groups under their heading, and stay put at its ends", () => {
    const section = page.sections.find((entry) => entry.groups.length > 2)!;
    const ids = section.groups.map((entry) => entry.group);
    const down = withGroupMoved(page, ids[0], 1).sections.find((entry) => entry.id === section.id)!;
    expect(down.groups.map((entry) => entry.group)).toEqual([ids[1], ids[0], ...ids.slice(2)]);
    expect(withGroupMoved(page, ids[0], -1)).toEqual(page);
    expect(withGroupMoved(page, ids.at(-1)!, 1)).toEqual(page);
  });

  it("are removed with their heading when it is left empty, but a page keeps at least one", () => {
    const lone = page.sections.find((section) => section.groups.length === 1)!;
    const without = withGroupRemoved(page, lone.groups[0].group)!;
    expect(without.sections.map((section) => section.id)).toEqual(page.sections.filter((section) => section.id !== lone.id).map((section) => section.id));

    const shared = page.sections.find((section) => section.groups.length > 1)!;
    const trimmed = withGroupRemoved(page, shared.groups[0].group)!;
    expect(trimmed.sections.find((section) => section.id === shared.id)!.groups.length).toBe(shared.groups.length - 1);

    const single = pageOf(content, "broadband-new")!;
    expect(single.sections.flatMap((section) => section.groups).length).toBe(1);
    expect(withGroupRemoved(single, single.sections[0].groups[0].group)).toBeNull();
  });
});
