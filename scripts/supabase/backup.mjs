#!/usr/bin/env node
// Backs up the truegetherth database and pictures (M6, docs/renovation/M6-LAUNCH.md).
//
//   npm run db:backup:dev              the dev project wdcbbjvxrcxuaabcipqo (verified like db:push:dev)
//   npm run db:backup:local            the local stack, to rehearse a restore (db:restore:local)
//   node scripts/supabase/backup.mjs --local --workdir <dir>    a local stack started from another folder
//
// Writes backups/<UTC time>-<dev|local>/ (ignored by git; it holds personal data — keep it private
// and delete it when it is no longer needed):
//   roles.sql, schema.sql   for the record, and for a restore into a project made from scratch
//   data.sql                every row (Admin accounts, content history, requests), as COPY blocks
//   data-restore.sql        the same without empty blocks: what a restore loads with psql
//   storage/media/          the uploaded pictures of the media bucket
//   manifest.json           when, from where, the migrations it was taken at, and row counts
//
// data.sql holds the rows of the auth, public, private and storage schemas, without what the
// migrations create themselves (the media bucket's row; the daily cron job lives in another
// schema), so it loads into a project whose migrations are applied: see db:restore:local.
// For the dev project set SUPABASE_ACCESS_TOKEN in the terminal for this run, as for db:push:dev.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { cliEnvironment, fail, linkDevProject, readAccessToken, root, run, supabaseCli, verifyDevProject } from "./dev-project.mjs";
import { DATA_SCHEMAS, EXCLUDED_DATA, rowCounts, withoutEmptyCopies } from "./backup-format.mjs";
import { DEV_PROJECT_REF } from "./dev-target.mjs";

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

async function main() {
  const { values } = parseArgs({ options: { dev: { type: "boolean" }, local: { type: "boolean" }, workdir: { type: "string" } } });
  if (Boolean(values.dev) === Boolean(values.local)) fail("Usage: npm run db:backup:dev  |  npm run db:backup:local", 2);

  const target = values.dev ? "dev" : "local";
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const out = path.join(root, "backups", `${stamp}-${target}`);
  mkdirSync(path.join(out, "storage"), { recursive: true });

  let supabase;
  let where;
  if (values.dev) {
    const token = readAccessToken();
    await verifyDevProject(token);
    supabase = supabaseCli(cliEnvironment(token));
    linkDevProject(supabase);
    where = "--linked";
  } else {
    supabase = supabaseCli(cliEnvironment(), values.workdir ? path.resolve(values.workdir) : root);
    where = "--local";
  }

  console.log(`Backing up the ${target} database to ${path.relative(root, out)} ...`);
  supabase("db", "dump", where, "--role-only", "-f", path.join(out, "roles.sql"));
  supabase("db", "dump", where, "-f", path.join(out, "schema.sql"));
  supabase("db", "dump", where, "--data-only", "--use-copy", "-s", DATA_SCHEMAS.join(","), "-x", EXCLUDED_DATA.join(","), "-f", path.join(out, "data.sql"));
  console.log("Copying the media bucket ...");
  // A relative path with forward slashes: the CLI reads "C:\…" as a URL.
  supabase("--experimental", "storage", "cp", "-r", "ss:///media", path.relative(root, path.join(out, "storage")).split(path.sep).join("/"), where);

  const data = readFileSync(path.join(out, "data.sql"), "utf8");
  // What psql loads in a restore: some internal tables refuse even an empty COPY.
  writeFileSync(path.join(out, "data-restore.sql"), withoutEmptyCopies(data));
  const counts = rowCounts(data);
  const migrations = readdirSync(path.join(root, "supabase", "migrations")).filter((name) => name.endsWith(".sql")).sort();
  const pictures = files(path.join(out, "storage")).length;
  writeFileSync(
    path.join(out, "manifest.json"),
    `${JSON.stringify({ takenAt: new Date().toISOString(), target, projectRef: values.dev ? DEV_PROJECT_REF : "local", migrationsInRepository: migrations, rows: counts, pictures }, null, 2)}\n`,
  );
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  console.log(`Done: ${total} rows in ${Object.keys(counts).length} tables, ${pictures} pictures. Keep ${path.relative(root, out)} private.`);
}

await run(main);
