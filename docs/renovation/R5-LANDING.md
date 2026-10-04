# R5 — Scroll landing, black-and-white theme, truegetherth

Date: 2026-10-03 to 2026-10-04. Repository: `C:\Users\sutti\Documents\telemart-ubon-v2`, pushed on 2026-10-04 to the private GitHub repository `telemartubonWebProduct/truegetherth` (not connected to Vercel).

On 2026-10-03 the owner stopped work in the old repository and started a rebuild here: first a new landing page (minimal black and white, five scroll-driven stages, a real 3D router with a robot arm), then, the same day: bring the old system over, design a new logo for the theme, rename everything to **truegetherth**, keep the update/publish system and the back-office package management, reuse the old environment, and bring all the pages. This document records what that merge did and what still stands open. Older documents in this folder describe the system that was brought over; where they mention the film, the `[locale]` folder, the navy and red theme or the name Telemart, this document is what holds now.

## 1. What was brought over

Everything committed in the old repository at `88bea0d` (branch `renovation/backlog-2026-10-01`): the content model and its validation (`src/lib/content`, `src/content`), the Mirror editor and its preview, catalog and media management, publish/history/rollback, the call-back form with leads, retention and the inbox, cookie consent, GA4 events and the report, the Admin sign-in flows, the Supabase migrations with their pgTAP tests, the unit and end-to-end tests, the scripts (dev-project push with its target check, backup and restore, smoke tests, lab vitals) and the documents. The uncommitted film rework of the old working tree was left behind.

`.env` and `.env.local` were copied from the old repository (git-ignored; public Supabase URL and publishable key, the server-only secret key, the GA4 property id and the SMTP account). They point at the hosted dev project.

## 2. What changed in the merge

### Routes

Thai and English each have their own root layout in a route group (`src/app/(th)`, `src/app/(en)`) instead of `src/app/[locale]` plus a rewrite, which answered 404 to RSC requests on Vercel. `src/app/_site` holds what both share: `layout.tsx` (the document, fonts, theme, consent banner and tags), `page-route.tsx` and `package-route.tsx`. The page files in the two groups are generated from `src/content/routes.ts` by `node scripts/routes/generate.mjs`; the URLs are the same as before (`tests/e2e/public-routes.spec.ts`).

### The home page (content schema 5)

`pages.home` was reshaped for the landing, so the back office edits every word of it:

| Section | Fields |
| --- | --- |
| `hero` | eyebrow, heading (1–3 lines), two buttons, up to four tag links, the still of the router, the note under it |
| `manifesto` | label and one sentence (inked from the bottom up by the scroll) |
| `promos` | label, heading, hint, and 1–4 tabs, each a category's cards (package, picture), its button, remark and "view all" |
| `steps` | label, heading, description, four steps, and the words of the slip that prints them |
| `services` | label, heading, 3–4 services with a link each |
| `prices` | label, heading, column names, which group of the catalog to list, "view all" |
| `faq` | label, heading, questions |

Gone from the home page: the film and its beats, the equipment section, the mobile columns and the solar teaser (their pages remain). `CONTENT_SCHEMA_VERSION` is 5; a release published under version 4 is not shown until it is published again. The media registry lost the film and the concept router and gained `hero-router-still` and `truegetherth-logo`.

`src/components/site/home/Landing.tsx` renders the stages from that document with edit bindings on every field; `Hero.tsx` and `scene.ts` are the 3D hero, `RailTabs.tsx` the tabs of the package rail, `ScrollDriver.tsx` the one scroll handler. In the editor's preview the page is locked flat (no pinned stages), every tab's row shows under its title and the questions are open, so every field can be clicked. Prices and package names on the home page are the catalog's own: the cards and the table read the packages, and both carry the note that prices are not confirmed.

### Theme

The default theme is black and white: ink `#0b0b0c`, muted `#5c5c61`, surface `#f4f4f6`, line `#e2e2e6`, a graphite second tone, red `#e60012` kept as the one accent (`src/lib/content/theme.ts`, mirrored in `src/styles/tokens.css`). The main button is an ink pill (white on a dark tone); red is for prices, meters and the live step. Type is Inter and Anuphan, light for headlines. `src/app/globals.css` holds the shared classes, `src/styles/landing.css` the stages, the floating navigation and the motion. The navigation is the same floating pills on every page: logo, the Menu pill (the whole menu and the language switch in its panel), shortcuts on wide screens, and the contact button; it turns light over dark sections. The closing contact band is in the ink tone and runs into the footer.

States that wait their turn in the scroll stages (steps not reached, chapters not active, the sentence before it is inked) differ by tone, rule and position rather than by fading text out, so they keep the contrast WCAG asks for.

### Brand

`node scripts/brand/logo.mjs` draws, from one definition, the lockup (`public/brand/truegetherth-logo.png`), the mark, the app icon (`src/app/icon.svg`, `favicon.ico`, `apple-icon.png`) and the share picture (`public/media/og-image.png`). The mark is two overlapping rings with the overlap in red; the wordmark is Inter, with the closing "th" a tone back. It is an original design and borrows nothing from True's logo.

Renamed to truegetherth: the brand name and site name in the content, page titles, the back office's titles and brand mark, the invitation and recovery e-mails' subjects and headings, the lead export's file name, the contact form's sender name, the package name.

Kept, because they are facts rather than branding, for the owner to decide:

- the company's legal name in the footer, the copyright line and the terms (บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด);
- the e-mail addresses (`Truetelemart@hotmail.com`, the contact form's mailbox) and the staff-system link;
- the default site address `https://www.telemartubon.com` (`NEXT_PUBLIC_SITE_URL` overrides it) — canonical links, the sitemap and GA4's production check use it;
- the Supabase organization and project names, and the local stack's `project_id`.

## 3. State of the hosted dev project

At the start of 2026-10-04 the dev project (`wdcbbjvxrcxuaabcipqo`) answered `PGRST202` for `published_content()`: only M1's migration was there. The same day, on the owner's say, `npm run db:push:dev` listed the four pending migrations (content drafts, catalog and media, content releases, leads) and `npm run db:push:dev:apply` applied them; the migration list now matches on both sides. Checked afterwards, as a visitor with the publishable key: `published_content()` answers with no release (so the site shows `src/content` until the first publish), and `content_drafts`, `content_releases`, `leads` and `admin_memberships` are refused. Not checked: signing in as the Admin the owner granted on 2026-09-30, and a real save, publish or lead on the hosted project (the back-office tests run against the local stack).

The push script needed a personal access token in the terminal. It now also accepts the Supabase CLI's own sign-in on the machine (`npx supabase login`): without a token it verifies the project ref, the organization and that the project is running from the projects that account can see, then runs the CLI with that sign-in. No stored secret is read.

## 4. Verification

Section 6 has the last run's numbers.

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- `supabase test db` on the local stack (pgTAP).
- Playwright on a desktop and a phone profile against the production build: every public URL in both languages, redirects, 404, sitemap; axe (WCAG 2.2 A/AA) on every kind of page, the cookie banner, the form with its messages and the open menu; consent and the Ads conversion; package pages, filters and comparison; the home page's stages (`tests/e2e/home-landing.spec.ts`), also with reduced motion, without scripts, on a short screen and on six screen shapes.
- Against the local Supabase stack: the Admin sign-in flows, the Mirror editor, publishing, the lead inbox and the public lead form.
- By eye: `node scripts/media/shots.mjs` (the scroll, whole pages) and `node scripts/media/stage-sizes.mjs <stage>` (one stage on nine screen sizes, with a check that nothing is cut off).

A test browser draws WebGL in software, so in tests the hero keeps its still; the live 3D scene has to be looked at in a real browser.

## 5. Open, for the owner

- Decide whether production gets its own Supabase project (the dev project now has every migration, section 3).
- The legal name, e-mail addresses and domain under the new name (section 2, Brand); a domain for truegetherth, if there is to be one, and then `NEXT_PUBLIC_SITE_URL`, GA4 and Google Ads settings.
- Package prices are still the imported ones, not verified.
- Going live: the code is in the private repository `telemartubonWebProduct/truegetherth`, which Vercel does not know yet. The old repository's `main` is still what Vercel serves. To launch, import the new repository in Vercel (or point the existing Vercel project at it), set the environment there (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and as Sensitive `SUPABASE_SECRET_KEY`; `NEXT_PUBLIC_SITE_URL` for the domain; `GA4_PROPERTY_ID`, `EMAIL_USER`, `EMAIL_PASS` where used) and follow the checklist in `M6-LAUNCH.md`.

## 6. Last run (2026-10-04, on the owner's Windows machine)

| Check | Result |
| --- | --- |
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | 149 tests in 20 files pass |
| `npm run build` | builds; with the hosted dev project's environment it logs that the published release cannot be read (section 3) and uses `src/content` |
| `supabase test db` (local stack) | 157 pgTAP tests in 5 files pass |
| Playwright, every suite, desktop and phone profiles, build against the local stack | 217 pass, 10 skipped on purpose (they run once, on the desktop profile), none fail |
| After that run: counted prices made to land exactly on time, with a test for it | `tests/e2e/home-landing.spec.ts` rerun: 51 pass, 7 skipped on purpose |

Three things were found by these runs and fixed rather than excused: the contact button in the navigation had no name for screen readers on a phone; steps and chapters that wait their turn were faded below the contrast text needs; and a counted price could sit a few baht short of the catalog's number for several seconds (a spring's long tail).

Not covered by a test: the live 3D scene on a real graphics chip (a test browser draws WebGL in software and keeps the still). It was looked at in the desktop app's browser after the merge (the scene started and drew), and `node scripts/media/hero-poster.mjs --look` renders its frame from the same code.

The local stack ran from a scratch copy of `supabase/` on ports 546xx with `site_url` on the test port, because Windows reserves the default ports on this machine and port 3000 is another app's; `scripts/e2e/run-local.sh` is the same procedure for a machine where the defaults are free.
