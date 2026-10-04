import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { content } from "@/lib/content";
import { loadDraftContent, saveDraft } from "@/lib/content/drafts";

// A database without the M3 migration: PostgREST answers PGRST205 for the
// missing table. The editor must still open (published content) and say why
// it cannot save, instead of failing the whole page.
function clientWithout() {
  const query = {
    select: () => query,
    order: async () => ({ data: null, error: { code: "PGRST205", message: "Could not find the table" } }),
  };
  return { from: () => query, rpc: vi.fn() } as never;
}

describe("drafts on a database without the M3 migration", () => {
  it("loads the published content and marks drafts unavailable", async () => {
    const result = await loadDraftContent(clientWithout(), content);
    expect(result).toEqual({ content, drafts: [], problems: [], available: false });
  });

  it("refuses to save with a message that names the migration", async () => {
    const client = clientWithout();
    const outcome = await saveDraft(client, content, "page:home", 0, content.pages.home);
    expect(outcome).toMatchObject({ ok: false, reason: "error" });
    expect(!outcome.ok && "message" in outcome && outcome.message).toContain("20260930160641_content_drafts.sql");
  });
});
