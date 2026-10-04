import { describe, expect, it } from "vitest";

import { changesBetween, pendingPublish } from "@/components/admin/release-diff";
import { content } from "@/lib/content";
import { CONTENT_SCHEMA_VERSION, type DraftRecord } from "@/lib/content/draft-model";
import { usableRelease } from "@/lib/content/releases";

const draft = (documentId: string, body: unknown, revision = 1) =>
  ({ documentId, body, revision, schemaVersion: CONTENT_SCHEMA_VERSION, updatedAt: "", updatedBy: null }) as DraftRecord;

describe("publishing drafts (M4)", () => {
  it("lists what each draft changes, adds and removes, and keeps broken drafts out", () => {
    const home = structuredClone(content.pages.home);
    home.faq.heading.th = "คำถามใหม่";
    const fresh = { ...content.catalog[0], id: "fresh", review: { status: "hidden" as const, notes: ["ใหม่"] } };
    const unused = content.catalog.find((item) => !content.pages.home.promos.tabs.some((tab) => tab.items.some((card) => card.packageId === item.id)))!;
    const shown = content.pages.home.promos.tabs[0].items[0].packageId;
    const pending = pendingPublish(content, [
      draft("page:home", home, 4),
      draft("package:fresh", fresh),
      draft(`package:${unused.id}`, { $deleted: true }),
      draft(`package:${shown}`, { $deleted: true }),
    ]);

    expect(pending.problems.map((problem) => problem.documentId)).toEqual([`package:${shown}`]);
    expect(pending.drafts.map((entry) => [entry.documentId, entry.revision, entry.change?.kind])).toEqual([
      ["page:home", 4, "changed"],
      ["package:fresh", 1, "new"],
      [`package:${unused.id}`, 1, "removed"],
    ]);
    expect(pending.drafts[0].change?.fields).toEqual(["คำถามที่พบบ่อย › หัวเรื่อง › ไทย"]);
    expect(pending.content.pages.home.faq.heading.th).toBe("คำถามใหม่");
    expect(pending.content.catalog.some((item) => item.id === shown)).toBe(true);
  });

  it("compares two releases document by document", () => {
    const edited = structuredClone(content);
    edited.catalog[0].price.amount += 10;
    edited.site.theme.accent = "#c8102e";
    expect(changesBetween(content, edited).map((change) => change.documentId)).toEqual(["site", `package:${content.catalog[0].id}`]);
    expect(changesBetween(content, content)).toEqual([]);
  });

  it("shows only releases this version of the site can render", () => {
    expect(usableRelease({ number: 1, schemaVersion: CONTENT_SCHEMA_VERSION, content })).toEqual(content);
    expect(usableRelease({ number: 1, schemaVersion: CONTENT_SCHEMA_VERSION - 1, content })).toBeNull();
    expect(usableRelease({ number: 1, schemaVersion: CONTENT_SCHEMA_VERSION, content: { ...content, site: {} } })).toBeNull();
    const broken = structuredClone(content);
    broken.pages.home.promos.tabs[0].items[0].packageId = "no-such-package";
    expect(usableRelease({ number: 1, schemaVersion: CONTENT_SCHEMA_VERSION, content: broken })).toBeNull();
  });
});
