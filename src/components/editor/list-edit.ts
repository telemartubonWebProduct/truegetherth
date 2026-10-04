import type { ZodType } from "zod";

import { defOf, unwrap } from "./schema-walk";

// Adding, removing and reordering the items of a list in the Mirror editor
// (R4: FAQ, menus, cards, steps, film scenes, offer tabs…). Pure functions, so
// the rules are unit-tested: the schema's limits hold, and a new item starts as
// a copy of the last one with ids no other item uses.

type LengthCheck = { _zod: { def: { check: string; minimum?: number; maximum?: number; length?: number } } };

/** How many items a list may have, from its schema. */
export function arrayBounds(schema: ZodType): { min: number; max: number } {
  const def = defOf(unwrap(schema).schema) as { checks?: LengthCheck[] };
  let min = 0;
  let max = Number.POSITIVE_INFINITY;
  for (const check of def.checks ?? []) {
    const { check: kind, minimum, maximum, length } = check._zod.def;
    if (kind === "min_length" && minimum !== undefined) min = minimum;
    if (kind === "max_length" && maximum !== undefined) max = maximum;
    if (kind === "length_equals" && length !== undefined) min = max = length;
  }
  return { min, max };
}

function idOf(item: unknown): string | null {
  return typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : null;
}

/** Adds `-n` to every `id` inside a value, so a copied item does not repeat its original's ids (anchors, tracking ids). */
function suffixIds(value: unknown, suffix: string): unknown {
  if (Array.isArray(value)) return value.map((entry) => suffixIds(entry, suffix));
  if (typeof value !== "object" || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, key === "id" && typeof entry === "string" ? `${entry}${suffix}` : suffixIds(entry, suffix)]),
  );
}

/** A new item for the end of the list: a copy of the last item with fresh ids. */
export function newItem(list: readonly unknown[]): unknown {
  const last = list.at(-1);
  if (last === undefined) throw new Error("A list needs an item to copy");
  const taken = new Set(list.map(idOf).filter((id): id is string => id !== null));
  const base = idOf(last);
  if (base === null) return structuredClone(last);
  const stem = base.replace(/-\d+$/, "");
  let n = 2;
  while (taken.has(`${stem}-${n}`)) n += 1;
  // The stem without the old counter keeps "faq-2" from becoming "faq-2-2".
  const renamed = suffixIds(structuredClone(last), `-${n}`) as Record<string, unknown>;
  return { ...renamed, id: `${stem}-${n}` };
}

export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function removeItem<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, position) => position !== index);
}
