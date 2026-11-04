# R12 — The row of recommended packages is scrolled sideways

Date: 2026-11-03. Branch `feat/rail-swipe`, from `main`.

The owner tried the home page with people who had never used the site: on "โปรแนะนำ" the stage pinned and scrolling down slid the cards sideways, and they were confused. The owner's words: "ตรงนี้ควรเลื่อนซ้ายขวาไม่ใช่เลื่อนลง". First-time visitors from ads land here, so it matters.

## What changed

- **Not pinned.** The recommended packages are a section that scrolls by with the page (`.rail` in `landing.css`, `Landing.tsx`). Scrolling down only ever moves the page. The other four stages are as they were.
- **A native sideways row.** Each tab's row is `overflow-x: auto` with scroll snap to each card, momentum on touch, and trackpad or Shift and the wheel on a desktop. One card and the start of the next show on a phone, two on a tablet, three or four on a desktop: the card that peeks at the edge says there is more. A swipe past an end stays in the row (`overscroll-behavior-x: contain`). Lenis leaves sideways trackpad gestures over the row alone (`data-lenis-prevent-horizontal`).
- **Arrows on wide screens** (768px and up), under the row at the end of the meter. They move by the cards in view, and are `aria-disabled` at the ends so focus is not lost. Their names come from the content: `pages.home.promos.previous` and `next`, Thai and English, with Thai labels in the editor. The schema gives them defaults, so a release or draft of version 10 published before them still reads (unit test in `releases.test.ts`), and `CONTENT_SCHEMA_VERSION` stays 10.
- **The meter** is a position indicator for the row's own scroll: the red part is the share of the row in view, at its place. `RailTabs.tsx` writes `--rail-at` and `--rail-view` on the meter (registered in `landing.css`, not inherited), measuring first and writing after. It measures nothing until the section is near (IntersectionObserver), because the section is laid out only then.
- **Tabs** switch the category as before, and a row opens at its first card.
- **The hint** now reads "เลือกหมวด แล้วเลื่อนซ้าย–ขวาเพื่อดูแพ็กเกจอื่น" and shows on phones too, right above the row.
- **`ScrollDriver.tsx`** no longer knows the rail: `--rail-x`, `--rail-meter`, the row's measuring and its resize observer are gone with their `@property` rules and `READERS` lines.
- The cards rise in turn once, when the row comes into view, so a card scrolled in later is already there.

## Found on the way

- A box that scrolls on one axis scrolls on the other unless told not to. With a few pixels to scroll down (a card still rising was enough), the row took a vertical swipe on a phone for itself and the page did not move. The row is `overflow: auto hidden`, with room under the cards for their rise.
- The names kept for screen readers in the cards are positioned. Once the row was no longer inside a positioned stage, they lay beyond the screen and made the page 1,788px wide on the flat page. The row now holds them (`position: relative`).
- The section has no set height. Under motion it is still laid out only when near (`content-visibility: auto`, with a guess of 840px inside its padding, where the browser keeps the visitor's place), so nothing new is laid out before the first paint.

## Checks

`npm run lint`, `npm run typecheck`, `npm test` (unit), `npm run build`, and Playwright against the production build (`E2E_PORT=3230`, since 3210 was another session's server). `tests/e2e/home-landing.spec.ts` has new tests for each of these:
- the row is not pinned, and the page's scroll never moves it;
- a swipe (touch on the phone profile, the wheel on the desktop) moves the row and stops at a card, and a vertical swipe over it moves the page;
- the meter;
- the arrows and the keyboard;
- a tab opens its row at the first card;
- at eight screen sizes the next card peeks and the last card ends flush with the page margin.

`node scripts/media/stage-sizes.mjs rail` at nine sizes: the section is 930 to 1,120px tall, the next card peeks at every size, and the page never grows wider than the screen.

Not checked: a real phone, and the Mirror editor's preview (its suites need the local Supabase stack). In the editor, every card lies in view on a wrapped row.

## For the owner

If a release was ever published from the back office, its hint still says "เลื่อนลง" until the hint (หน้าแรก → โปรแนะนำ → คำอธิบาย) is changed and published again. The live site showed the repository's words on 3 Nov 2026.
