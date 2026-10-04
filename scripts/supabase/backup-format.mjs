// What a backup (backup.mjs) holds, how its rows are counted, and how it is prepared for a
// restore (restore-local.mjs, and the runbook in docs/renovation/M6-LAUNCH.md).

/** Schemas whose rows are backed up: Admin accounts (auth), the site's data, and picture records. */
export const DATA_SCHEMAS = ["auth", "public", "private", "storage"];

/** Rows the migrations create themselves; a restore applies the migrations first. */
export const EXCLUDED_DATA = ["storage.buckets"];

/** Row counts of a data dump, from its COPY blocks: { "public.leads": 12, … }. */
export function rowCounts(sql) {
  const counts = {};
  let table = null;
  for (const line of sql.split(/\r?\n/)) {
    if (table === null) {
      const match = /^COPY "([^"]+)"\."([^"]+)"/.exec(line);
      if (match) {
        table = `${match[1]}.${match[2]}`;
        counts[table] = 0;
      }
    } else if (line === "\\.") {
      table = null;
    } else {
      counts[table] += 1;
    }
  }
  return counts;
}

/**
 * The dump without COPY blocks that hold no rows. Some internal Supabase tables (storage's
 * analytics and vector buckets, for example) refuse even an empty COPY from the postgres role,
 * and an empty block restores nothing.
 */
export function withoutEmptyCopies(sql) {
  const lines = sql.split(/\r?\n/);
  const kept = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^COPY "[^"]+"\."[^"]+"/.test(lines[index]) && lines[index + 1] === "\\.") {
      index += 1;
      continue;
    }
    kept.push(lines[index]);
  }
  return kept.join("\n");
}
