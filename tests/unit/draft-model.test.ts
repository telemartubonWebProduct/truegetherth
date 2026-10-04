import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { applyDrafts, CONTENT_SCHEMA_VERSION, validateDraft, type DraftRecord } from "@/lib/content/draft-model";
import { defaultTheme } from "@/lib/content/theme";

const draft = (documentId: DraftRecord["documentId"], body: unknown, extra: Partial<DraftRecord> = {}): DraftRecord => ({
  documentId,
  schemaVersion: CONTENT_SCHEMA_VERSION,
  body,
  revision: 1,
  updatedAt: "2026-09-30T00:00:00Z",
  updatedBy: null,
  ...extra,
});

const home = content.pages.home;

describe("applying drafts", () => {
  it("renders valid drafts over the published content", () => {
    const edited = { ...home, services: { ...home.services, heading: { th: "หัวเรื่องใหม่", en: "A new heading" } } };
    const { content: result, problems } = applyDrafts(content, [draft("page:home", edited)]);
    expect(problems).toEqual([]);
    expect(result.pages.home.services.heading.en).toBe("A new heading");
    expect(result.pages.solar).toBe(content.pages.solar);
  });

  it("leaves out drafts that no longer fit, and says why", () => {
    const missingEnglish = { ...home, services: { ...home.services, heading: { th: "มีแต่ไทย", en: "" } } };
    const brokenLink = { ...home, hero: { ...home.hero, visual: "no-such-image" } };
    const { content: result, problems } = applyDrafts(content, [
      draft("page:home", missingEnglish),
      draft("page:solar", content.pages.solar, { schemaVersion: 99 }),
      draft("package:no-such-package", content.catalog[0]),
      draft("page:home", brokenLink),
    ]);
    expect(result).toBe(content);
    expect(problems.map((problem) => problem.documentId)).toEqual(["page:home", "page:solar", "package:no-such-package", "page:home"]);
    expect(problems[0].messages[0]).toContain("services.heading.en");
    expect(problems[0].messages[0]).toContain("ต้องกรอกข้อความ");
    expect(problems[3].messages[0]).toContain('ไม่มีรูป "no-such-image"');
  });
});

describe("validating a save", () => {
  it("accepts a document that keeps the site consistent", () => {
    const repriced = { ...content.catalog[0], price: { ...content.catalog[0].price, amount: 459 } };
    expect(validateDraft(content, `package:${content.catalog[0].id}`, repriced)).toMatchObject({ ok: true });
  });

  it("rejects bodies the schema refuses, broken references and unreadable colours", () => {
    const hiddenPackage = content.catalog.find((item) => item.review.status === "hidden")!;
    const withHidden = structuredClone(home);
    withHidden.promos.tabs[0].items[0].packageId = hiddenPackage.id;
    const hidden = validateDraft(content, "page:home", withHidden);
    expect(hidden.ok).toBe(false);
    expect(!hidden.ok && hidden.messages[0]).toContain("ถูกซ่อน");

    const paleTheme = { ...content.site, theme: { ...defaultTheme, accent: "#ffb3b3" } };
    const pale = validateDraft(content, "site", paleTheme);
    expect(pale.ok).toBe(false);
    expect(!pale.ok && pale.messages.join(" ")).toContain("4.5:1");

    expect(validateDraft(content, "page:home", { ...home, extra: true }).ok).toBe(false);
    // A new picture is fine; a broken one is not.
    expect(validateDraft(content, "media:new-picture", content.media["truegetherth-logo"]).ok).toBe(true);
    expect(validateDraft(content, "media:new-picture", { ...content.media["truegetherth-logo"], width: -1 }).ok).toBe(false);
  });
});
