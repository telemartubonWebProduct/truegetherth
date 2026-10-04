#!/usr/bin/env node
// Rehearses a restore on the local Supabase stack (M6, docs/renovation/M6-LAUNCH.md):
//
//   npm run db:restore:local -- backups/<folder> --yes [--workdir <dir>]
//
// 1. resets the local database, which applies every migration (all local data is replaced),
// 2. loads the backup's data.sql in one transaction, triggers off as in a dump restore,
// 3. puts the backup's pictures back into the media bucket,
// 4. counts the rows of every table again and compares them with the backup's manifest.
// The same steps restore a hosted project (migrations with db:push, data.sql with psql,
// pictures with `supabase storage cp`); the runbook has the commands. This script only ever
// touches the local stack.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { rowCounts, withoutEmptyCopies } from "./backup-format.mjs";
import { cliEnvironment, fail, root, run, supabaseCli } from "./dev-project.mjs";

function projectId(workdir) {
  const config = readFileSync(path.join(workdir, "supabase", "config.toml"), "utf8");
  const match = /^project_id\s*=\s*"([^"]+)"/m.exec(config);
  if (!match) fail("No project_id in supabase/config.toml");
  return match[1];
}

/** Runs SQL in the local database container (psql comes with it). */
function psql(container, args, input) {
  const result = spawnSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", ...args], {
    input,
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (result.error) fail(`Could not run docker: ${result.error.message}`);
  if (result.status !== 0) fail(`psql failed:\n${result.stderr}`);
  return result.stdout;
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { yes: { type: "boolean" }, workdir: { type: "string" } } });
  const backup = positionals[0] ? path.resolve(positionals[0]) : "";
  if (!backup || !existsSync(path.join(backup, "manifest.json"))) fail("Usage: npm run db:restore:local -- backups/<folder> --yes", 2);
  if (!values.yes) fail("This replaces all data in the LOCAL stack. Add --yes to go ahead.", 2);
  const workdir = values.workdir ? path.resolve(values.workdir) : root;
  const container = `supabase_db_${projectId(workdir)}`;
  const manifest = JSON.parse(readFileSync(path.join(backup, "manifest.json"), "utf8"));

  const supabase = supabaseCli(cliEnvironment(), workdir);
  console.log("Resetting the local database (applies every migration) ...");
  supabase("db", "reset", "--local", "--yes");

  console.log("Loading data.sql ...");
  // As `supabase db dump` writes it: session_replication_role = replica keeps triggers (such as
  // the append-only audit log) from firing on rows that already passed them once.
  psql(container, ["--single-transaction", "-q"], withoutEmptyCopies(readFileSync(path.join(backup, "data.sql"), "utf8")));
  // (data-restore.sql holds the same, for a restore with psql by hand.)
  // Identity columns continue after the restored rows.
  psql(
    container,
    ["-q"],
    `do $$ declare r record; begin
       for r in select c.table_schema, c.table_name, c.column_name from information_schema.columns c
                where c.is_identity = 'YES' and c.table_schema in ('public', 'private') loop
         execute format('select setval(pg_get_serial_sequence(%L, %L), greatest(coalesce((select max(%I) from %I.%I), 0), 1), (select max(%I) from %I.%I) is not null)',
           r.table_schema || '.' || r.table_name, r.column_name, r.column_name, r.table_schema, r.table_name, r.column_name, r.table_schema, r.table_name);
       end loop; end $$;`,
  );

  if (existsSync(path.join(backup, "storage", "media"))) {
    console.log("Putting the pictures back ...");
    // A relative path with forward slashes: the CLI reads "C:\…" as a URL.
    supabase("--experimental", "storage", "cp", "-r", path.relative(root, path.join(backup, "storage", "media")).split(path.sep).join("/"), "ss:///", "--local");
  }

  console.log("Comparing row counts with the backup ...");
  const expected = manifest.rows;
  const restored = rowCounts(
    psql(
      container,
      ["-At"],
      Object.keys(expected)
        .map((table) => {
          const [schema, name] = table.split(".");
          return `select 'COPY "${schema}"."${name}"'; select 'row' from "${schema}"."${name}"; select '\\.';`;
        })
        .join("\n"),
    ),
  );
  const mismatches = Object.entries(expected).filter(([table, count]) => restored[table] !== count);
  for (const [table, count] of mismatches) console.error(`  ${table}: backup ${count}, restored ${restored[table] ?? "missing"}`);
  if (mismatches.length > 0) fail(`${mismatches.length} tables differ from the backup.`);
  const total = Object.values(expected).reduce((sum, count) => sum + count, 0);
  console.log(`Restore matches the backup: ${total} rows in ${Object.keys(expected).length} tables, taken ${manifest.takenAt}.`);
}

await run(main);
