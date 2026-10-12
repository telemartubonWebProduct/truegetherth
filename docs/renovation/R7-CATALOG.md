# R7 — Packages and promos

Date: 2026-10-09. Branch `feat/catalog-admin`, on top of `feat/hero-tableau`.

The owner asked for packages and promos to be kept as ordinary lists (add, edit, copy, remove, several at once), with the groups they belong to managed the same way, apart from the Mirror editor, which should keep to the words and pictures of each page; and for the places where the two meet to be easy for an Admin to follow. Until now a package was edited in a panel of the Mirror editor, its group was a fixed part of a page, and the home page's recommended packages were cards an Admin picked one by one inside the home page.

What the owner decided, on four questions:

1. The five categories stay fixed (new and existing home internet, monthly and prepaid mobile, solar): each is a page of the site with its own address. Groups inside them are free: add, rename, reorder, remove.
2. The home page's recommended packages come from a switch on the package, not from cards chosen in the home page.
3. A package can have days it shows on. (The owner answered "all four as recommended"; this one had been put as a question without a recommendation and was read as yes.)
4. A copy keeps the price and the terms of its original, and starts hidden.

## 1. What changed in the content

`CONTENT_SCHEMA_VERSION` is 8.

- **Recommended packages.** The catalog document, which held the order of the packages, now also holds `featured`: the ids of the packages recommended on the home page, in the order of their cards (`SiteContent.featured`). A tab of the home page no longer lists cards: it names the categories it shows (`promos.tabs[].categories`), and its cards are the recommended packages of those categories that are shown today (`featuredIn`). A tab with no card is left out, and the whole stage when there is none.
- **The card's picture** is the package's own `image` (it already was the picture of the package's detail page). `src/content/catalog/featured.ts` carries over the twenty cards the home page had, each with the picture it had. A recommended package that is shown must have a picture; the check says which one has none.
- **Days.** `showFrom` and `showUntil` on a package, both optional, both a calendar day in Thailand (`todayInThailand()`, `src/lib/content/dates.ts`). `isShown(item, today)` is the one test of whether visitors see a package: not hidden, and today within its days. Package pages, the home page, detail pages, the sitemap and the packages a contact request may name all use it. An end day before the start day is refused.
- **Groups.** A package page's sections and groups were already content; what changed is the checks. A group may now be empty (the page shows nothing for it until it has a package), and a group listed twice on the site is refused, since a package would then show in two places.
- Removing a recommended package is allowed: its card goes with it. Hiding one is allowed too: the card comes back when the package does.

Prices are still imported, not verified. Nothing here writes or changes a price: a new package has none (0, which cannot be shown), a copy has its original's, and the "confirm with our team" note stays next to every unverified price.

## 2. The page

`/admin/catalog` ("แพ็กเกจและโปร", `src/components/catalog`, `src/app/admin/(console)/catalog`), second in the back office's menu.

- **Tabs**: the five categories with their counts, then "โปรแนะนำหน้าแรก" and "สิทธิประโยชน์".
- **A category** lists its groups under the headings of its page (left, or above on a phone) and its packages: picture, name, price, speed or allowance, how it stands with visitors today (shown and verified, shown and not verified, hidden, waiting for a day, past its days), and the buttons: recommend (★), up, down, edit, copy, show or hide, remove. Search by name and filter by standing. Ticking packages brings up what can be done to several: show, hide, move to a group, remove.
- **A group**, once chosen: add a package, rename (the name is the heading visitors read), move among the groups under its heading, remove when it is empty, and "ดูบนหน้าเว็บ", which opens the Mirror editor on that page. A new group goes under one of the page's headings or under a new heading at the end of the page. A page keeps at least one group. Solar has one group, fixed by its page's layout.
- **A new package or a copy is named first** (Thai and English). The English name becomes its id, which is its address (`/packages/<id>`) and never changes; the dialog shows the address before anything is made. Names can be changed afterwards.
- **A package's form** slides in from the right, in the order an Admin fills it in: the card visitors will get, then name, group and picture; price; what the customer gets; details and conditions; and how it shows (verified, not verified, hidden; recommended on the home page; from day, until day; internal notes). Each change is saved as it is made.
- **Recommended packages**: the cards of each home tab in order, to reorder or take out. Recommending a package that has no picture asks for one first.
- **Benefits**: the list packages choose from. One that a package uses cannot be removed.
- Removed packages are listed under "ลบในร่าง" until the next publish and can be brought back.

Everything is a draft, saved by the same store as the Mirror editor's (`DraftStore`: a package, a package page, or the catalog document), reviewed and published at `/admin/publish`, and undone by rolling back, as before. `src/components/catalog/catalog-edit.ts` holds what each action does to the content as plain functions, unit-tested without a browser.

## 3. Where it meets the rest

| The Admin wants | Where | What ties it |
| --- | --- | --- |
| a package on a page | its group, in its form | a page lists groups; a package names one |
| a package on the home page | ★ in the list, or the box in its form | the catalog document's `featured` |
| a promo that ends by itself | the two days in its form | `isShown` |
| to see the page a group is on | "ดูบนหน้าเว็บ" on the group | the Mirror editor's preview shows drafts |
| to change a package seen in the Mirror editor | click it there: the panel says what it is and links to its form | `/admin/catalog?package=<id>` |
| to change a page's words, pictures, buttons, a tab's title | the Mirror editor | unchanged |

The Mirror editor no longer edits packages, benefits or the package order: its "แพ็กเกจและสิทธิประโยชน์" panel (`CatalogManager.tsx`) is gone, and its toolbar has a link to the new page instead. A home tab's categories are read-only there, like other structure.

## 4. Days and the cache

Public pages are static and rebuilt at most once a day, so a package that starts or ends on a day appears or goes within a day of midnight in Thailand, not on the minute. Publishing rebuilds at once, as before. The lead form checks the day when a request arrives, so a package past its days cannot be asked for by name even from a page that still shows it. For an exact hour, hide or show the package by hand and publish.

## 5. One publish is needed

A release made under an earlier version (7 or before) is not shown by this code: the site shows `src/content` until an Admin publishes again, and drafts saved under an earlier version are skipped (the pages list them; they are not deleted). So once this is deployed the site shows the repository's content, with the twenty cards carried over, until someone publishes at `/admin/publish`.

Before merging, whoever can sign in to the database production reads should look at whether it holds a release or drafts with edits that are not in `src/content` (a price or a sentence changed in the back office): those would stop showing and have to be made again. That was not checked here (no sign-in, and which Supabase project production reads is not known in this repository). The same holds for the two changes this one sits on (versions 6 and 7).

## 6. Checks

`npm run lint`, `npm run typecheck`, `npm test` (170), `npm run build`, and the whole browser suite against the local Supabase stack (`npm run db:start`, then `E2E_PORT=3210 npm run test:e2e:local`): 221 passed, 13 skipped, 1 failed, 4 did not run. The failure is the password-recovery test of `admin-auth.spec.ts`, as in R6: the local stack mails its links to port 3000, and on this machine the run's server was on 3210; the four that did not run follow it in the same file. That run was made before new packages and copies were named first; the catalog, editor, publish, home and package-page suites were run again after it (88 passed, 11 skipped).

- `tests/unit/catalog.test.ts`: the days (including the day in Thailand around midnight UTC), recommended packages per tab and their order, new and copied packages, ids from names, places in the order, and adding, renaming, moving and removing groups.
- `tests/e2e/admin-catalog.spec.ts`: only active Admins get in; a package is named, added hidden with no price, refused when shown without a price, priced, copied (price kept, hidden), found by search and filter, and removed with others at once, none of it reaching visitors; a group is added, renamed, filled from a package's form, cannot be removed while it has a package, and shows under its new name in the editor's preview; recommending a package without a picture asks for one, its card can be moved and shows in the home page's preview; a package past its days or waiting for one leaves its page; benefits; and the automated WCAG checks on the list, the form, the naming dialog, the recommended packages and the benefits.
- The Mirror editor's suite now checks that a card there leads to the package's form, and uploads a picture on the solar page instead of onto a home card; the publish suite changes a package's picture instead of a card's.

Looked at in screenshots of the production build on the local stack at 1440×900 and 390×844: the list, a group, the form from top to bottom, the recommended packages, several packages ticked, and the phone layout.

Not checked: a real phone; the dev Supabase project (no sign-in here); pgTAP (nothing in the database changed).

## 7. Left open

- **The public cards.** The owner asked for better-looking promo cards. This change keeps the cards as they were. `design/cards/proposals.html` (open it in a browser) shows three directions on real packages, with the prices the catalog has: A, a slip led by the figure, needing no picture; B, a picture plate with the figure over it; C, one row per package. 77 of the 99 packages have no picture, which is why A and C exist. The owner chose A and B together; `R8-PROMO-CARDS.md` is what was built. The "until" tag in the proposals is an example of what a package with an end day could show; no package has one yet, and it is not built.
- **An exact hour** for a promo to start or end (§4) would need the pages rebuilt on a schedule; that is a Vercel setting, the owner's to decide.
- **A package's address cannot be renamed** once made. To change it: copy the package under the new name and remove the old one (the old address then answers "not found").
- The catalog's categories are fixed (decision 1). A sixth would be a new page of the site: its route, its page document, its menu entry.

## Hiding a benefit on one package (12 Oct 2026)

The owner asked for a way to switch a benefit off without taking it out of the package. Each line of a package's benefits in the form has a button, "ซ่อน": the benefit stays in the list, struck through, and visitors no longer see it on the card, the package's page, the comparison or the filters; "แสดง" brings it back. It is kept in the package as `hiddenBenefits`, and `shownBenefits` (`src/lib/content/package-facts.ts`) is the one place that takes them out: public code reads that, the back office reads the whole list.

The field is optional, so every draft and release of schema version 10 still reads and the version was not raised: raising it would have set aside the drafts the owner had not yet published.
