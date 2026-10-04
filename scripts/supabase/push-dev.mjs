#!/usr/bin/env node
// Applies supabase/migrations to the truegetherth dev project, and only that project.
//
//   npm run db:push:dev          verify the target, then show pending migrations (dry run)
//   npm run db:push:dev:apply    verify, confirm by typing the ref, then push the pending migrations
//
// The apply confirmation is read before the Supabase CLI runs: on Windows the console did not
// deliver typed input to a prompt shown after the CLI had run. Where a terminal cannot take
// input at all, CONFIRM_PROJECT_REF=<ref> set for that run confirms instead.
//
// Runs the same way from cmd, PowerShell, bash and CI. Before anything touches a database it
// confirms, through the Management API, that the project ref is the dev project and that it
// belongs to the telemart-ubon organization; any other project (including truefiberhome) is
// refused. Set SUPABASE_ACCESS_TOKEN in the terminal for this run only:
//
//   cmd:         set SUPABASE_ACCESS_TOKEN=sbp_...
//   PowerShell:  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
//   bash:        export SUPABASE_ACCESS_TOKEN=sbp_...
//
// Without a token it uses the Supabase CLI's own sign-in on this machine (npx supabase login)
// and verifies the same things from the projects that account can see.
//
// Never put the token in .env.local or any committed file. Without SUPABASE_DB_PASSWORD the
// Supabase CLI signs in to the database with a temporary login role created from the token.
import { createInterface } from "node:readline";

import { cliEnvironment, fail, linkDevProject, readAccessToken, run, supabaseCli, verifyDevProject } from "./dev-project.mjs";
import { DEV_PROJECT_REF } from "./dev-target.mjs";

function parseArgs(args) {
  if (args.length === 0) return { apply: false };
  if (args.length === 1 && args[0] === "--apply") return { apply: true };
  fail("Usage: npm run db:push:dev  |  npm run db:push:dev:apply", 2);
}

/** Resolves with the trimmed answer, or null when input closes before a line is entered. */
function ask(question) {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    let answered = false;
    readline.once("close", () => {
      if (answered) return;
      process.stdout.write("\n");
      resolve(null);
    });
    readline.question(question, (answer) => {
      answered = true;
      resolve(answer.trim());
      readline.close();
    });
  });
}

async function confirmApply() {
  const preset = (process.env.CONFIRM_PROJECT_REF ?? "").trim();
  if (preset) {
    if (preset !== DEV_PROJECT_REF) {
      fail(`CONFIRM_PROJECT_REF is '${preset}', expected '${DEV_PROJECT_REF}'; nothing was applied.`);
    }
    console.log(`Confirmed by CONFIRM_PROJECT_REF=${DEV_PROJECT_REF}.`);
    return;
  }

  console.log("This pushes every migration that `npm run db:push:dev` lists as pending.");
  const answer = await ask(`Type the project ref (${DEV_PROJECT_REF}) to apply them: `);
  if (answer === null) {
    fail(
      "No input was received, so nothing was applied. If this terminal cannot take typed input, " +
        `set CONFIRM_PROJECT_REF=${DEV_PROJECT_REF} for this run and try again.`,
    );
  }
  if (answer !== DEV_PROJECT_REF) fail("Cancelled; nothing was applied.");
}

async function main() {
  const { apply } = parseArgs(process.argv.slice(2));
  const token = readAccessToken({ optional: true });
  await verifyDevProject(token);

  const supabase = supabaseCli(cliEnvironment(token));
  if (apply) await confirmApply();
  linkDevProject(supabase);

  if (!apply) {
    console.log("Pending migrations (dry run):");
    supabase("db", "push", "--linked", "--skip-vault", "--dry-run");
    console.log("Dry run only; nothing was applied. To push these migrations run: npm run db:push:dev:apply");
    return;
  }

  supabase("db", "push", "--linked", "--skip-vault", "--yes");
  supabase("migration", "list", "--linked");
}

await run(main);
