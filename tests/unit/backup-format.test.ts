import { describe, expect, it } from "vitest";

import { EXCLUDED_DATA, rowCounts, withoutEmptyCopies } from "../../scripts/supabase/backup-format.mjs";

// M6 backups (scripts/supabase/backup.mjs): the row counts a restore is checked against, and the
// data file psql loads.

const dump = [
  "SET session_replication_role = replica;",
  'COPY "public"."leads" ("id", "name") FROM stdin;',
  "a\tสมชาย",
  "b\tสมหญิง",
  "\\.",
  'COPY "storage"."buckets_vectors" ("id") FROM stdin;',
  "\\.",
  'COPY "auth"."users" ("id") FROM stdin;',
  "u1",
  "\\.",
  "RESET ALL;",
].join("\n");

describe("backups", () => {
  it("counts the rows of every table in a data dump", () => {
    expect(rowCounts(dump)).toEqual({ "public.leads": 2, "storage.buckets_vectors": 0, "auth.users": 1 });
  });

  it("leaves out empty blocks, and nothing else, for the restore", () => {
    const restore = withoutEmptyCopies(dump);
    expect(restore).not.toContain("buckets_vectors");
    expect(rowCounts(restore)).toEqual({ "public.leads": 2, "auth.users": 1 });
    expect(restore.startsWith("SET session_replication_role = replica;")).toBe(true);
    expect(restore.endsWith("RESET ALL;")).toBe(true);
  });

  it("skips the rows the migrations create themselves", () => {
    expect(EXCLUDED_DATA).toContain("storage.buckets");
  });
});
