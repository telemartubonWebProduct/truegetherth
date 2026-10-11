# R11 — A picture for each step on the slip

Date: 2026-10-11. Branch `feat/step-pictures`, on top of `perf/home-mobile` (R10).

The owner sent a screenshot of "How it works" on the home page: the slip's picture was a bed of drifting strokes and "looked empty". The request: generate illustrations for it with Higgsfield, and change the picture with the step as the page scrolls.

## What a visitor sees

The slip fills itself in over five moments: before any step, and after each of the four. Before the first step its picture is still the bed of strokes (`Plate`, drawn on a canvas), which reads as "nothing yet". After each step a small painting takes its place, the one of the step just done:

1. **Choose a service**: the muse with her headphones picks the middle of three cards.
2. **Get in touch**: one cherub on the phone, another letting a winged letter go.
3. **Area check**: the sea god looks through a spyglass at a house among palms; a beam of light falls on it.
4. **Installation booked**: the goddess sets the router on the house's roof; a cherub holds an hourglass.

They are the figures of the page's opening painting, doing the four steps. One picture gives way to the next with a short fade, settling from a little larger. On the flat page (reduced motion, no scripts, a short screen, the editor's preview) the slip shows its finished state, so the last picture.

## How it is built

- **The pictures** were made with Higgsfield from the prompts in `design/steps/README.md` and are kept in `design/steps/source/`. `node scripts/media/step-pictures.mjs` writes each at 420 and 840 pixels to `public/media/steps-v1/` (9 to 50 kB a file) and the list the page reads to `src/components/site/home/step-pictures.ts`, which is generated. Browsers keep the files for a year, and the script refuses to change one in place: a changed picture goes in `steps-v2`.
- **The page** (`Landing.tsx`) lays the four pictures over the plate in `.slip-plate`; `data-shown` marks the one that shows, and the server's HTML marks the last. `ScrollDriver.tsx` moves the mark with the slip's phase, in the same place where it switches the steps' lights and the slip's lines. `landing.css` has the fade.
- **They are decoration, not content.** The slip is hidden from assistive technology (the steps themselves are read from the list beside it), the pictures have an empty description, and they are not fields of the Mirror editor, like the layers of the opening painting. The content model is unchanged.
- **Speed** (R10): the pictures are lazy and lie in a stage that is laid out only when it comes near, so nothing of them is fetched before the first paint; on a short phone, where the slip has no room for a picture, they are never fetched.

## What to keep true

- No lettering and no logo in any picture, above all on the router: no generator may draw a True logo. The router of step 4 was checked enlarged.
- Nothing in a picture states a speed, a price, a date or an offer.
- What matters sits in the middle band of each picture: a phone shows a strip 16:7 of it.

## Higgsfield, for next time

- The owner's account is on the free plan: one job at a time, and the newest image model is not open to it. `gpt_image_2` is, at one credit a picture (1K, medium). Four pictures cost four credits; 2.5 were left.
- Its check of uploaded pictures refuses the opening painting as a reference, whole or cropped to the clothed figures (the cherubs and the sea god are bare). The plain router passes. So the pictures were made from words, with the figures described and dressed, and only the router attached.

## Checked

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; the home page's end-to-end tests, extended to the slip's picture at each phase and on the flat page; accessibility and public routes; the editor's suite against the local database; and by eye on a desktop and a phone at each step.
