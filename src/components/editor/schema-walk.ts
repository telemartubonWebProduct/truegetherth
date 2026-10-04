import type { ZodType } from "zod";

import { benefitRef, cta, link, linkTarget, localizedText, mediaRef, packageRef, price } from "@/lib/content/schema";
import { hexColor, theme, tone } from "@/lib/content/theme";

// Reads the content schema to decide which editor a field gets. The Mirror
// editor never hard-codes page fields: any field the schema has can be edited
// with the control its type calls for, and structure (ids, paths, layout, the
// Google Ads tag and chat script) stays read-only so the fixed layout and links
// cannot break and no script can be set from the back office.

type Def = {
  type: string;
  shape?: Record<string, ZodType>;
  element?: ZodType;
  innerType?: ZodType;
  valueType?: ZodType;
  entries?: Record<string, string>;
  values?: unknown[];
  format?: string;
  in?: ZodType;
};

export function defOf(schema: ZodType): Def {
  return (schema as unknown as { _zod: { def: Def } })._zod.def;
}

/** Strips optional/default/readonly wrappers; says whether the field may be left out. */
export function unwrap(schema: ZodType): { schema: ZodType; optional: boolean } {
  let current = schema;
  let optional = false;
  for (;;) {
    const def = defOf(current);
    if (def.type === "optional" || def.type === "nullable" || def.type === "default" || def.type === "readonly" || def.type === "prefault") {
      optional ||= def.type === "optional" || def.type === "nullable";
      current = def.innerType!;
    } else if (def.type === "pipe" && def.in) {
      current = def.in;
    } else {
      return { schema: current, optional };
    }
  }
}

/** The schema of the value at `path` inside a document, or null if the path leaves the schema. */
export function schemaAt(root: ZodType, path: readonly string[]): ZodType | null {
  let current: ZodType = root;
  for (const segment of path) {
    const { schema } = unwrap(current);
    const def = defOf(schema);
    if (def.type === "object" && def.shape) {
      const next = def.shape[segment];
      if (!next) return null;
      current = next;
    } else if (def.type === "array" && def.element) {
      current = def.element;
    } else if (def.type === "record" && def.valueType) {
      current = def.valueType;
    } else {
      return null;
    }
  }
  return current;
}

export type FieldKind =
  | "localized"
  | "localizedList"
  | "text"
  | "textList"
  | "number"
  | "boolean"
  | "enum"
  | "tone"
  | "color"
  | "theme"
  | "media"
  | "mediaList"
  | "benefitList"
  | "package"
  | "target"
  | "cta"
  | "link"
  | "price"
  | "object"
  | "objectList";

/** Structure the editor shows but never changes. */
const readOnlyKeys = new Set(["id", "path", "source", "src", "width", "height", "kind", "category", "group", "layout", "googleAdsId", "ga4MeasurementId", "tawkSrc"]);

export function isReadOnly(key: string | undefined): boolean {
  return key !== undefined && readOnlyKeys.has(key);
}

export function fieldKind(field: ZodType): FieldKind {
  const { schema } = unwrap(field);
  if (schema === localizedText) return "localized";
  if (schema === linkTarget) return "target";
  if (schema === cta) return "cta";
  if (schema === link) return "link";
  if (schema === price) return "price";
  if (schema === mediaRef) return "media";
  if (schema === packageRef) return "package";
  if (schema === tone) return "tone";
  if (schema === hexColor) return "color";
  if (schema === theme) return "theme";
  const def = defOf(schema);
  switch (def.type) {
    case "array": {
      const element = unwrap(def.element!).schema;
      if (element === localizedText) return "localizedList";
      if (element === mediaRef) return "mediaList";
      if (element === benefitRef) return "benefitList";
      if (defOf(element).type === "string") return "textList";
      return "objectList";
    }
    case "object":
      return "object";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "enum":
      return "enum";
    default:
      return "text";
  }
}

export function enumOptions(field: ZodType): string[] {
  const def = defOf(unwrap(field).schema);
  return def.entries ? Object.values(def.entries) : [];
}

/** Fields of an object schema in declaration order. */
export function objectFields(field: ZodType): [string, ZodType][] {
  const def = defOf(unwrap(field).schema);
  return def.shape ? Object.entries(def.shape) : [];
}
