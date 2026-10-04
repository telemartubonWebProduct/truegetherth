import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DraftStore, summarize, type DiscardAction, type SaveAction } from "@/components/editor/draft-store";
import { content } from "@/lib/content";
import { CONTENT_SCHEMA_VERSION, type DraftRecord } from "@/lib/content/draft-model";
import type { SaveOutcome } from "@/lib/content/drafts";

const heading = ["services", "heading"];

/** A server that keeps one revision per document, like content_drafts. */
function serverSaves() {
  const revisions = new Map<string, number>();
  return vi.fn<SaveAction>(async ({ documentId, expectedRevision }) => {
    const revision = revisions.get(documentId) ?? 0;
    if (expectedRevision !== revision) return { ok: false, reason: "conflict", current: null };
    revisions.set(documentId, revision + 1);
    return { ok: true, revision: revision + 1, updatedAt: `2026-09-30T10:00:0${revision + 1}Z` };
  });
}

function makeStore(save: SaveAction, options: { discard?: DiscardAction } = {}) {
  return new DraftStore({
    published: content,
    working: content,
    drafts: [],
    save,
    discard: options.discard ?? vi.fn<DiscardAction>(async () => ({ ok: true })),
    delay: 800,
  });
}

const homeHeading = (store: DraftStore) => store.getSnapshot().content.pages.home.services.heading;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("autosave", () => {
  it("shows an edit at once and saves it after a pause, from the revision it knows", async () => {
    const save = serverSaves();
    const store = makeStore(save);
    const previews: string[] = [];
    store.onDocument = (documentId) => previews.push(documentId);

    store.edit("page:home", heading, { th: "หัวเรื่องใหม่", en: "A new heading" });
    expect(homeHeading(store).en).toBe("A new heading");
    expect(previews).toEqual(["page:home"]);
    expect(store.metaOf("page:home").status).toBe("pending");
    expect(save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0]).toMatchObject({ documentId: "page:home", expectedRevision: 0 });
    expect(store.metaOf("page:home")).toMatchObject({ status: "saved", revision: 1 });
    expect(summarize(store.getSnapshot()).status).toBe("saved");
    expect(store.hasUnsaved()).toBe(false);

    store.edit("page:home", [...heading, "en"], "Another heading");
    await vi.advanceTimersByTimeAsync(800);
    expect(save.mock.calls[1][0]).toMatchObject({ expectedRevision: 1 });
    expect(store.metaOf("page:home").revision).toBe(2);
  });

  it("saves once for a burst of typing", async () => {
    const save = serverSaves();
    const store = makeStore(save);
    for (const text of ["N", "Ne", "New"]) {
      store.edit("page:home", [...heading, "en"], text);
      await vi.advanceTimersByTimeAsync(300);
    }
    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenCalledTimes(1);
    expect((save.mock.calls[0][0].body as typeof content.pages.home).services.heading.en).toBe("New");
  });

  it("saves changes made during a save once that save is confirmed", async () => {
    let finish: (outcome: SaveOutcome) => void = () => {};
    const save = vi.fn<SaveAction>(
      ({ expectedRevision }) =>
        new Promise((resolve) => {
          finish = resolve;
          void expectedRevision;
        }),
    );
    const store = makeStore(save);
    store.edit("page:home", [...heading, "en"], "First");
    await vi.advanceTimersByTimeAsync(800);
    expect(store.metaOf("page:home").status).toBe("saving");

    store.edit("page:home", [...heading, "en"], "Second");
    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenCalledTimes(1);

    finish({ ok: true, revision: 1, updatedAt: "2026-09-30T10:00:01Z" });
    await vi.advanceTimersByTimeAsync(300);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toMatchObject({ expectedRevision: 1 });
    finish({ ok: true, revision: 2, updatedAt: "2026-09-30T10:00:02Z" });
    await vi.advanceTimersByTimeAsync(0);
    expect(store.metaOf("page:home")).toMatchObject({ status: "saved", revision: 2 });
  });

  it("does not send a document the schema rejects, and says where", async () => {
    const save = serverSaves();
    const store = makeStore(save);
    store.edit("page:home", [...heading, "en"], "");
    await vi.advanceTimersByTimeAsync(800);
    expect(save).not.toHaveBeenCalled();
    const meta = store.metaOf("page:home");
    expect(meta.status).toBe("invalid");
    expect(meta.issues).toEqual([{ path: ["services", "heading", "en"], message: "ต้องกรอกข้อความ" }]);
    expect(store.hasUnsaved()).toBe(true);

    store.edit("page:home", [...heading, "en"], "Fixed");
    await vi.advanceTimersByTimeAsync(800);
    expect(save).toHaveBeenCalledTimes(1);
    expect(store.metaOf("page:home").status).toBe("saved");
  });

  it("saves a document again once the document that blocked it is fixed", async () => {
    const save = serverSaves();
    const store = makeStore(save);
    const [tab] = content.pages.home.promos.tabs;
    const card = tab.items[0];
    const featured = card.packageId;
    // Hiding a package is refused while a card of the home page still shows it.
    store.edit(`package:${featured}`, ["review", "status"], "hidden");
    await vi.advanceTimersByTimeAsync(800);
    expect(store.metaOf(`package:${featured}`).status).toBe("invalid");
    expect(save).not.toHaveBeenCalled();

    const shown = new Set(tab.items.map((entry) => entry.packageId));
    const other = content.catalog.find((item) => item.review.status !== "hidden" && item.category === "broadband-new" && !shown.has(item.id))!;
    store.edit("page:home", ["promos", "tabs", tab.id, "items", card.id, "packageId"], other.id);
    // Fake timers run a zero-delay timer set during a tick one millisecond later.
    await vi.advanceTimersByTimeAsync(810);
    expect(save.mock.calls.map((call) => call[0].documentId)).toEqual(["page:home", `package:${featured}`]);
    expect(store.metaOf(`package:${featured}`).status).toBe("saved");
  });

  it("saves a new package, its place in the order and its removal once each (R4)", async () => {
    const save = serverSaves();
    const store = makeStore(save);
    const fresh = { ...content.catalog[0], id: "fresh", review: { status: "hidden" as const, notes: ["ใหม่"] } };
    store.create("package:fresh", fresh);
    store.replace("catalog", { order: ["fresh", ...content.catalog.map((item) => item.id)] });
    await vi.advanceTimersByTimeAsync(2000);
    expect(save.mock.calls.map((call) => call[0].documentId).sort()).toEqual(["catalog", "package:fresh"]);
    expect(store.getSnapshot().content.catalog[0].id).toBe("fresh");
    expect(store.metaOf("catalog").status).toBe("saved");

    store.remove("package:fresh");
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(3);
    expect(save.mock.calls[2][0]).toMatchObject({ documentId: "package:fresh", body: { $deleted: true } });
    expect(store.getSnapshot().content.catalog.some((item) => item.id === "fresh")).toBe(false);
  });

  it("reports a failed request and saves again on retry", async () => {
    const save = vi.fn<SaveAction>().mockRejectedValueOnce(new Error("network")).mockResolvedValue({ ok: true, revision: 1, updatedAt: "2026-09-30T10:00:01Z" });
    const store = makeStore(save);
    store.edit("page:home", [...heading, "en"], "Offline edit");
    await vi.advanceTimersByTimeAsync(800);
    expect(store.metaOf("page:home").status).toBe("error");
    expect(summarize(store.getSnapshot()).status).toBe("error");

    store.retry("page:home");
    await vi.advanceTimersByTimeAsync(0);
    expect(store.metaOf("page:home").status).toBe("saved");
  });
});

describe("conflicts", () => {
  const theirs = (body: unknown): DraftRecord => ({
    documentId: "page:home",
    schemaVersion: CONTENT_SCHEMA_VERSION,
    body,
    revision: 4,
    updatedAt: "2026-09-30T09:59:00Z",
    updatedBy: "a2222222-2222-4222-8222-222222222222",
  });

  it("stops saving the document until the Admin keeps their version", async () => {
    const other = { ...content.pages.home, services: { ...content.pages.home.services, heading: { th: "ของอีกคน", en: "Theirs" } } };
    const save = vi
      .fn<SaveAction>()
      .mockResolvedValueOnce({ ok: false, reason: "conflict", current: theirs(other) })
      .mockResolvedValue({ ok: true, revision: 5, updatedAt: "2026-09-30T10:00:05Z" });
    const store = makeStore(save);
    store.edit("page:home", [...heading, "en"], "Mine");
    await vi.advanceTimersByTimeAsync(800);
    expect(store.metaOf("page:home").status).toBe("conflict");
    expect(summarize(store.getSnapshot()).status).toBe("conflict");

    store.edit("page:home", [...heading, "th"], "ของฉัน");
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(1);

    store.keepMine("page:home");
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0]).toMatchObject({ expectedRevision: 4 });
    expect(homeHeading(store)).toEqual({ th: "ของฉัน", en: "Mine" });
    expect(store.metaOf("page:home")).toMatchObject({ status: "saved", revision: 5 });
  });

  it("can continue from the other Admin's version instead", async () => {
    const other = { ...content.pages.home, services: { ...content.pages.home.services, heading: { th: "ของอีกคน", en: "Theirs" } } };
    const save = vi.fn<SaveAction>().mockResolvedValue({ ok: false, reason: "conflict", current: theirs(other) });
    const store = makeStore(save);
    const previews: unknown[] = [];
    store.onDocument = (_id, body) => previews.push(body);
    store.edit("page:home", [...heading, "en"], "Mine");
    await vi.advanceTimersByTimeAsync(800);

    store.takeTheirs("page:home");
    expect(homeHeading(store)).toEqual({ th: "ของอีกคน", en: "Theirs" });
    expect(store.metaOf("page:home")).toMatchObject({ status: "saved", revision: 4 });
    expect(previews.at(-1)).toMatchObject({ services: { heading: { en: "Theirs" } } });
    expect(store.hasUnsaved()).toBe(false);
  });
});

describe("discarding", () => {
  it("throws the draft away on the server and shows the published document", async () => {
    const edited = { ...content.pages.home, services: { ...content.pages.home.services, heading: { th: "ร่าง", en: "Draft" } } };
    const discard = vi.fn<DiscardAction>(async () => ({ ok: true }));
    const store = new DraftStore({
      published: content,
      working: { ...content, pages: { ...content.pages, home: edited } },
      drafts: [{ documentId: "page:home", revision: 3 }],
      save: serverSaves(),
      discard,
    });
    expect(homeHeading(store).en).toBe("Draft");

    await expect(store.discard("page:home")).resolves.toEqual({ ok: true });
    expect(discard).toHaveBeenCalledWith({ documentId: "page:home", expectedRevision: 3 });
    expect(homeHeading(store)).toEqual(content.pages.home.services.heading);
    expect(store.metaOf("page:home").revision).toBe(0);
  });

  it("only resets local changes when nothing was saved yet", async () => {
    const discard = vi.fn<DiscardAction>();
    const store = makeStore(serverSaves(), { discard });
    store.edit("page:home", [...heading, "en"], "Unsaved");
    await store.discard("page:home");
    expect(discard).not.toHaveBeenCalled();
    expect(homeHeading(store)).toEqual(content.pages.home.services.heading);
    await vi.advanceTimersByTimeAsync(2000);
    expect(store.hasUnsaved()).toBe(false);
  });
});
