# truegetherth — instructions for coding agents

**Read `CLAUDE.md` in this folder before anything else and follow it.** It is the current handoff for this repository and is kept up to date; this file only points to it. Where this file, an older document in `docs/renovation`, a prompt or old website copy disagrees with `CLAUDE.md`, `CLAUDE.md` holds. Then read the `docs/renovation` records it names for the part you touch (for the package cards and the packages pages: `R7-CATALOG.md` and `R8-PROMO-CARDS.md`).

The rules that must never be missed:

- `main` of `telemartubonWebProduct/truegetherth` is production: Vercel deploys it to https://www.truegetherth.com. Work on a branch and open a pull request. Never push to `main` or merge a pull request unless the owner says so for that change.
- Package prices and offers are imported, not verified. Never invent or change prices, offers, package names or benefits; keep the VAT label, the review notes and the "confirm with our team" note next to prices.
- Every visible string needs both Thai (`th`) and English (`en`).
- No secrets in the repository or in `NEXT_PUBLIC_` variables. Supabase: only the dev project `wdcbbjvxrcxuaabcipqo`; never touch another organization or project. Do not change Vercel or DNS settings, and do not create a Vercel or Supabase project.
- The site's former name and domain are out of scope: do not bring them back and do not work on them.
- What a phone shows first must not wait for script: no new script, picture or library fetched before the first paint ("Working here" in `CLAUDE.md`). Base styles are the flat layout; motion goes under `html[data-motion]`.
- Before a pull request: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, then `E2E_PORT=3210 npx playwright test --project=desktop` and `E2E_PORT=3210 npx playwright test --project=mobile` as two runs (one run of both can stop midway on this machine).
