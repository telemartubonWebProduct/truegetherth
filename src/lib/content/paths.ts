import { isDocumentId, type DocumentId } from "./documents";

// Field bindings of the Mirror editor: `<document id>/<path>` such as
// `page:home/hero/heading` or `page:home/faq/items/nationwide/answer`.
// Items of an array of objects are addressed by their `id`, so a binding
// survives reordering; other arrays use the index.

export type Segment = string | number;

export type Binding = { documentId: DocumentId; path: string[] };

export function encodeBinding(documentId: DocumentId, path: readonly Segment[]): string {
  return [documentId, ...path.map(String)].join("/");
}

export function decodeBinding(value: string): Binding | null {
  const [documentId, ...path] = value.split("/");
  if (!documentId || !isDocumentId(documentId)) return null;
  if (path.some((segment) => segment === "")) return null;
  return { documentId, path };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Index of `segment` in `list`: an item with that id, or a numeric index. */
function indexOf(list: unknown[], segment: string): number {
  const byId = list.findIndex((item) => isRecord(item) && item.id === segment);
  if (byId !== -1) return byId;
  if (/^(0|[1-9][0-9]*)$/.test(segment)) {
    const index = Number(segment);
    if (index < list.length && !list.some((item) => isRecord(item) && "id" in item)) return index;
  }
  return -1;
}

/** The value at `path`, or undefined when the path does not exist. */
export function getAt(value: unknown, path: readonly string[]): unknown {
  let current = value;
  for (const segment of path) {
    if (Array.isArray(current)) {
      const index = indexOf(current, segment);
      if (index === -1) return undefined;
      current = current[index];
    } else if (isRecord(current)) {
      if (!Object.hasOwn(current, segment)) return undefined;
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * A copy of `value` with `next` at `path` (structural sharing). The parent
 * must exist; a missing object key is added, which is how optional fields are
 * filled in. Setting `undefined` removes an object key.
 */
export function setAt(value: unknown, path: readonly string[], next: unknown): unknown {
  if (path.length === 0) return next;
  const [segment, ...rest] = path;
  if (Array.isArray(value)) {
    const index = indexOf(value, segment);
    if (index === -1) throw new Error(`No item "${segment}" in list`);
    const copy = value.slice();
    copy[index] = setAt(value[index], rest, next);
    return copy;
  }
  if (isRecord(value)) {
    if (rest.length > 0 && !Object.hasOwn(value, segment)) throw new Error(`No field "${segment}"`);
    const copy: Record<string, unknown> = { ...value };
    const updated = rest.length === 0 ? next : setAt(value[segment], rest, next);
    if (updated === undefined) delete copy[segment];
    else copy[segment] = updated;
    return copy;
  }
  throw new Error(`Cannot set "${segment}" on a ${value === null ? "null" : typeof value}`);
}

/**
 * A path from a schema issue (list items by index) as a binding path (items
 * of object lists by id), so an error can be shown at the field it concerns.
 */
export function bindingPath(value: unknown, path: readonly (string | number)[]): string[] {
  const result: string[] = [];
  let current = value;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === "number") {
      const item = current[segment];
      result.push(isRecord(item) && typeof item.id === "string" ? item.id : String(segment));
      current = item;
    } else {
      result.push(String(segment));
      current = isRecord(current) ? current[String(segment)] : undefined;
    }
  }
  return result;
}

/**
 * Where two versions of a document differ, as binding paths (at most `limit`).
 * Items of object lists are matched by id, other lists by position.
 */
export function diffPaths(a: unknown, b: unknown, limit = 12): string[][] {
  const out: string[][] = [];
  const visit = (left: unknown, right: unknown, path: string[]) => {
    if (out.length >= limit || Object.is(left, right)) return;
    if (Array.isArray(left) && Array.isArray(right)) {
      const byId = [...left, ...right].every((item) => isRecord(item) && typeof item.id === "string");
      if (byId) {
        const ids = new Set([...left, ...right].map((item) => (item as { id: string }).id));
        for (const id of ids) {
          visit(
            left.find((item) => (item as { id: string }).id === id),
            right.find((item) => (item as { id: string }).id === id),
            [...path, id],
          );
        }
      } else if (left.length !== right.length) {
        out.push(path);
      } else {
        left.forEach((item, index) => visit(item, right[index], [...path, String(index)]));
      }
      return;
    }
    if (isRecord(left) && isRecord(right)) {
      for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) visit(left[key], right[key], [...path, key]);
      return;
    }
    out.push(path);
  };
  visit(a, b, []);
  return out;
}
