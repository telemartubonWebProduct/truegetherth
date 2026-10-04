import type { ZodType } from "zod";

import { documentIds, documentSchema, pagePaths, readDocument, type PageDocumentId } from "@/lib/content/documents";
import { encodeBinding } from "@/lib/content/paths";
import { mediaRef, type SiteContent } from "@/lib/content/schema";

import { defOf, unwrap } from "./schema-walk";

// Where shared documents appear, so the editor can say that changing a
// package, a benefit or a picture changes it everywhere it is used.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function walk(schema: ZodType, value: unknown, path: string[], target: ZodType, id: string, found: string[][]) {
  const inner = unwrap(schema).schema;
  if (inner === target) {
    if (value === id) found.push(path);
    return;
  }
  const def = defOf(inner);
  if (def.type === "object" && def.shape && isRecord(value)) {
    for (const [key, field] of Object.entries(def.shape)) walk(field, value[key], [...path, key], target, id, found);
  } else if (def.type === "array" && def.element && Array.isArray(value)) {
    value.forEach((item, index) =>
      walk(def.element!, item, [...path, isRecord(item) && typeof item.id === "string" ? item.id : String(index)], target, id, found),
    );
  }
}

/** Bindings of every place that shows the media asset `id`. */
export function mediaUsage(content: SiteContent, id: string): string[] {
  const found: string[] = [];
  for (const documentId of documentIds(content)) {
    const paths: string[][] = [];
    walk(documentSchema(documentId), readDocument(content, documentId), [], mediaRef, id, paths);
    for (const path of paths) found.push(encodeBinding(documentId, path));
  }
  return found;
}

export function benefitUsage(content: SiteContent, id: string): number {
  return content.catalog.filter((item) => item.benefits.includes(id)).length;
}

/** Pages that show a package: through its group, or on a card of the home page's recommended packages. */
export function packagePages(content: SiteContent, id: string): PageDocumentId[] {
  const item = content.catalog.find((entry) => entry.id === id);
  if (!item) return [];
  const pages: PageDocumentId[] = [];
  if (content.pages.home.promos.tabs.some((tab) => tab.items.some((card) => card.packageId === id))) pages.push("home");
  for (const doc of content.pages.packages) {
    const shown = doc.sections.some((section) => section.groups.some((group) => group.category === item.category && group.group === item.group));
    if (shown) pages.push(doc.id as PageDocumentId);
  }
  if (item.category === "solar" && content.pages.solar.packages.group === item.group) pages.push("solar");
  return pages;
}

/** Sections a page can link to with #hash. */
export function anchorsFor(content: SiteContent, path: string): { id: string; heading: string }[] {
  const doc = content.pages.packages.find((entry) => entry.path === path);
  if (doc) return doc.sections.map((section) => ({ id: section.id, heading: section.heading.th }));
  if (path === pagePaths.solar) return [{ id: content.pages.solar.packages.id, heading: content.pages.solar.packages.heading.th }];
  return [];
}

