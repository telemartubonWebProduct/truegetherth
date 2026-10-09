import { describe, expect, it } from "vitest";

import { arrayBounds, moveItem, newItem, removeItem } from "@/components/editor/list-edit";
import { schemaAt } from "@/components/editor/schema-walk";
import { content } from "@/lib/content";
import { documentSchema } from "@/lib/content/documents";
import { parseDocument } from "@/lib/content/draft-model";

const home = documentSchema("page:home");

describe("editing lists in the editor", () => {
  it("reads each list's limits from the schema", () => {
    expect(arrayBounds(schemaAt(home, ["hero", "heading"])!)).toEqual({ min: 1, max: 3 });
    expect(arrayBounds(schemaAt(home, ["promos", "tabs"])!)).toEqual({ min: 1, max: 4 });
    expect(arrayBounds(schemaAt(home, ["steps", "items"])!)).toEqual({ min: 4, max: 4 });
    expect(arrayBounds(schemaAt(home, ["services", "items"])!)).toEqual({ min: 3, max: 4 });
    expect(arrayBounds(schemaAt(home, ["faq", "items"])!)).toEqual({ min: 1, max: Number.POSITIVE_INFINITY });
  });

  it("adds a copy of the last item with ids nothing else uses, and the page still validates", () => {
    const page = structuredClone(content.pages.home);
    const added = newItem(page.faq.items) as (typeof page.faq.items)[number];
    expect(added.id).not.toBe(page.faq.items.at(-1)!.id);
    expect(page.faq.items.map((item) => item.id)).not.toContain(added.id);
    page.faq.items.push(added);
    expect(parseDocument("page:home", page).ok).toBe(true);

    // A copied tab gets new ids inside it too: its button keeps a tracking id of its own.
    const tab = newItem(page.promos.tabs) as (typeof page.promos.tabs)[number];
    expect(tab.packageCta.id).not.toBe(page.promos.tabs.at(-1)!.packageCta.id);
    expect(tab.categories).toEqual(page.promos.tabs.at(-1)!.categories);

    // Copying a copy counts up instead of piling suffixes.
    const twice = newItem([...page.faq.items, added]) as { id: string };
    expect(twice.id).toBe(`${added.id.replace(/-\d+$/, "")}-3`);
  });

  it("moves and removes items", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b", "c"], 0, -1)).toEqual(["a", "b", "c"]);
    expect(removeItem(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });
});
