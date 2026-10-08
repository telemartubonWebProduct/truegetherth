import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";

import { bindingLabel, fieldLabel, pathLabel } from "@/components/editor/labels";
import { defOf, enumOptions, fieldKind, isReadOnly, objectFields, unwrap, type FieldKind } from "@/components/editor/schema-walk";
import { mediaUsage, packagePages } from "@/components/editor/usage";
import { content } from "@/lib/content";
import { documentIds, documentSchema, readDocument } from "@/lib/content/documents";
import { parseDocument } from "@/lib/content/draft-model";
import { bindingPath, diffPaths } from "@/lib/content/paths";
import { httpsUrl } from "@/lib/content/schema";

// The Mirror editor builds its form from the content schema. These tests walk
// every document of the real content, so a schema change that the editor
// cannot show, or a field without a Thai name, fails here instead of in front
// of an Admin.

type Field = { path: string[]; key: string; parent?: string; kind: FieldKind; schema: ZodType };

function walk(schema: ZodType, value: unknown, path: string[], fields: Field[]) {
  const kind = fieldKind(schema);
  if (kind === "object") {
    const record = (value ?? {}) as Record<string, unknown>;
    for (const [key, field] of objectFields(schema)) {
      if (isReadOnly(key)) continue;
      fields.push({ path: [...path, key], key, parent: path.at(-1), kind: fieldKind(field), schema: field });
      walk(field, record[key], [...path, key], fields);
    }
  } else if (kind === "objectList" && Array.isArray(value)) {
    const element = unwrap(defOf(unwrap(schema).schema).element!).schema;
    value.forEach((item, index) => walk(element, item, [...path, String(index)], fields));
  }
}

const fields: Field[] = [];
for (const documentId of documentIds(content)) walk(documentSchema(documentId), readDocument(content, documentId), [documentId], fields);

describe("every content value has an editor control", () => {
  it("puts only strings in plain text boxes", () => {
    const wrong = fields.filter((field) => field.kind === "text" && defOf(unwrap(field.schema).schema).type !== "string");
    expect(wrong.map((field) => field.path.join("/"))).toEqual([]);
  });

  it("offers choices for every enum", () => {
    expect(fields.filter((field) => field.kind === "enum" && enumOptions(field.schema).length === 0)).toEqual([]);
  });

  it("covers every kind of value the pages use", () => {
    const kinds = new Set(fields.map((field) => field.kind));
    for (const kind of ["localized", "localizedList", "textList", "text", "number", "boolean", "enum", "tone", "theme", "media", "mediaList", "benefitList", "package", "target", "cta", "price", "object", "objectList"] as const) {
      expect(kinds, kind).toContain(kind);
    }
  });

  it("names every editable field in Thai", () => {
    const unnamed = new Set(fields.filter((field) => fieldLabel(field.key, field.parent) === field.key && !/^\d+$/.test(field.key)).map((field) => field.key));
    expect([...unnamed]).toEqual([]);
  });

  it("keeps structure out of the form", () => {
    const structural = fields.filter((field) => ["id", "path", "layout", "googleAdsId", "ga4MeasurementId", "src", "category", "group"].includes(field.key));
    expect(structural).toEqual([]);
  });

  it("lets Admins change the home conversion of Google Ads, but not the tag", () => {
    const integrations = fields.filter((field) => field.path.slice(0, 2).join("/") === "site/integrations");
    expect(integrations.map((field) => [field.path.join("/"), field.kind])).toEqual([
      ["site/integrations", "object"],
      ["site/integrations/googleAdsHomeConversion", "text"],
    ]);
  });
});

describe("field messages and bindings", () => {
  it("reports schema problems in Thai at the field they concern", () => {
    const home = structuredClone(content.pages.home);
    home.faq.items[1].answer.en = " ";
    const parsed = parseDocument("page:home", home);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues).toEqual([{ path: ["faq", "items", 1, "answer", "en"], message: "ต้องกรอกข้อความ" }]);
    expect(bindingPath(home, parsed.issues[0].path)).toEqual(["faq", "items", home.faq.items[1].id, "answer", "en"]);
  });

  it("accepts only https links where the site opens a URL", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,hi", "http://lin.ee/abc", "https://localhost/x"]) {
      expect(httpsUrl.safeParse(url).success, url).toBe(false);
    }
    expect(httpsUrl.safeParse("https://lin.ee/blqnOJow").success).toBe(true);
    const site = structuredClone(content.site);
    site.contact.lineSales = "javascript:alert(1)";
    const parsed = parseDocument("site", site);
    expect(!parsed.ok && parsed.messages).toEqual(["contact.lineSales: ใช้ลิงก์ที่ขึ้นต้นด้วย https://"]);
  });

  it("accepts a Google Ads conversion only for the site's own tag", () => {
    const site = structuredClone(content.site);
    const { googleAdsId } = site.integrations;
    site.integrations.googleAdsHomeConversion = `${googleAdsId}/Label_2-x`;
    expect(parseDocument("site", site).ok).toBe(true);

    const messages = (value: string) => {
      site.integrations.googleAdsHomeConversion = value;
      const parsed = parseDocument("site", site);
      return !parsed.ok && parsed.messages;
    };
    expect(messages("AW-1/abc")).toEqual([`integrations.googleAdsHomeConversion: ต้องเป็นบัญชี Google Ads เดียวกับแท็กของเว็บ (${googleAdsId}/…)`]);
    for (const value of ["", googleAdsId, `${googleAdsId}/`, `${googleAdsId}/a'b`, `'};alert(1);//`]) {
      expect(messages(value), value).toEqual(["integrations.googleAdsHomeConversion: ใช้รูปแบบ AW-ตัวเลข/รหัส conversion เช่น AW-123456789/AbC-12_x"]);
    }
  });

  it("lists what changed between two versions of a document", () => {
    const home = content.pages.home;
    const edited = structuredClone(home);
    edited.steps.items[0].title.th = "ใหม่";
    edited.faq.items[0].answer.en = "New";
    expect(diffPaths(home, edited)).toEqual([
      ["steps", "items", home.steps.items[0].id, "title", "th"],
      ["faq", "items", home.faq.items[0].id, "answer", "en"],
    ]);
    expect(pathLabel(home, ["faq", "items", home.faq.items[0].id, "answer", "en"])).toBe(
      `คำถามที่พบบ่อย › รายการ › ${home.faq.items[0].question.th} › คำตอบ › English`,
    );
  });

  it("names what a preview highlight points at", () => {
    expect(bindingLabel(content, `page:home/steps/items/${content.pages.home.steps.items[0].id}/description`)).toBe("คำอธิบาย");
    expect(bindingLabel(content, `page:home/steps/items/${content.pages.home.steps.items[1].id}`)).toBe(content.pages.home.steps.items[1].title.th);
    expect(bindingLabel(content, `page:home/faq/items/${content.pages.home.faq.items[0].id}`)).toBe(content.pages.home.faq.items[0].question.th);
    expect(bindingLabel(content, "site/ui/chatOnLine")).toBe("ปุ่ม แชต LINE");
  });

  it("finds where shared pictures and packages appear", () => {
    expect(mediaUsage(content, content.site.brand.logo)).toContain("site/brand/logo");
    const featured = content.pages.home.promos.tabs[0].items[0].packageId;
    expect(packagePages(content, featured)).toContain("home");
  });
});
