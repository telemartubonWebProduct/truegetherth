# R6 — The painted hero

Date: 2026-10-08 to 2026-10-09. Branch `feat/hero-tableau`, on top of `chore/remove-tawk`.

The owner asked for the home page's opening to become artwork in the manner of a classical oil painting with a modern joke in it, cut into layers so the figures can move a little, on desktop and on phones. It replaces the 3D router and the robot arm of R5. What the owner chose, question by question: classical gods and cherubs with present-day devices; full colour; the headline in white over the picture, full bleed; thin "signal" frames on the figures; the router painted by the generator with the real True Online mark added afterwards; gentle floating and parallax, no video.

## 1. The picture

One painting, a goddess lifting the True router over her head among three cherubs (a phone, a game controller, a laptop), a sea god with a tablet and a muse with headphones. The owner generated it with Nano Banana Pro from the prompts in `design/hero/tableau/README.md`, then three pictures derived from it, so that light and brushwork agree across the layers:

| File in `design/hero/tableau/source/` | What it is |
| --- | --- |
| `master.jpg` | the whole painting, with the True router put in from `reference/router-plain.png` |
| `figures.png` | the six figures alone on flat green, each exactly where it was painted |
| `plate.png` | the sky, clouds and sea with nobody in them |
| `near-clouds.png` | the sky again with green painted along the top of the lowest cloud bank |
| `plate-portrait.png` | an upright sky for phones |

`master-portrait.jpg` and `figures-portrait.png` are an upright painting with figures of its own; they are not used (§5).

Three concept drafts came first (`design/hero/tableau/drafts/`, Seedream 5.0 Flash through Higgsfield, 2 credits); the owner chose A.

## 2. Cutting it into layers

`node scripts/media/hero-tableau.mjs` (add `--debug` to save every cut-out on magenta and each arrangement laid flat in `shots/hero-tableau/`).

- **The green.** A pixel is backdrop where it is much greener than it is red or blue. Next to backdrop, and further in for as long as the green lasts (a figure that fades out softly, such as the rock's base), a pixel is an edge: partly clear, mixed back to the figure's own colour, and never left greener than it is red or blue.
- **The figures.** The picture is shrunk until threads between figures break (a ribbon's end rests on the laptop); what is left of each figure takes back the pixels nearest to it. Where two really overlap (a wing tip over the muse's sleeve) the line between them is drawn by hand in `CUTS`; if `figures.png` is made again the script stops, saying how many figures it found, and the line has to be drawn again.
- **The near cloud** is what lies below the lowest green in each column of `near-clouds.png`; columns where the green line breaks take their neighbours' height.
- **The True Online mark** is copied from `design/hero/router/trueonline.png`. No generator draws a True logo: the router is painted without one, and a picture that shows lettering on it is not kept.

It writes the sky of each arrangement, each layer at two sizes and the mark to `public/media/hero-v4/` (measured on the dev server: 425 kB of pictures for a 1440-pixel screen, 525 kB for 1920, 435 kB on a phone with a dense screen; browsers keep the files for a year, so a new picture goes in `hero-v5`, and since R10 the script refuses to change a file in place), and where each layer sits to `src/components/site/home/hero-tableau.ts`. That file is generated: the numbers to change are at the top of the script (`PACKS`: place, depth, how far each layer floats, the signal frames).

There are two arrangements of the same cut-outs. `wide` is the painting as it was painted, except that the goddess stands a little lower so the router's antennas clear the top edge. `tall` stands the same figures upright over the upright sky, the router in its glow, everything above the last quarter of the picture.

## 3. The page

`Hero.tsx` and the hero part of `src/styles/landing.css`. `scene.ts`, three.js, the model in `public/models` and `public/media/hero-v3` are gone.

- The sky is one picture and every figure a plain `<img>` placed over it in shares of the painting's box. Nothing is drawn by script, so the painting is whole without scripts, with reduced motion and in the Mirror editor's preview. Both arrangements are in the page; the one not shown is never downloaded (its pictures are lazy and its box is `display: none`).
- **Wide** (wider than 4:5): the sky and the figures share one box that covers the screen. On a screen squarer than 3:2, where the picture loses its sides, the goddess stands lower still so the router does not come under the navigation's pills.
- **Tall** (4:5 and narrower): the sky covers the screen's width from the top, and the figures stand in a box as wide as the room above the words allows, so on a short phone the group is smaller rather than behind the headline.
- The words are white, in the ink tone (`data-tone="ink"` on `.hero-foot`), over a shade that belongs to the picture and is framed with it when the scroll draws the picture back.
- **Motion**, only under `html[data-motion]`: each figure floats on its own, the layers shift with the pointer (the nearer the more; `--px`, `--py`, written by `Hero.tsx` where there is a pointer that hovers) and part as the page scrolls (`--hero-progress`, from `ScrollDriver`), the sky breathes, a glow pulses behind the router, and the signal frames flicker now and then. All of it stops once the hero has scrolled away.
- The signal frames show a number, which is decoration: no speed, price or offer is stated in the picture. The router's frame is red and carries the True Online mark.

Content: the hero's fields are unchanged. `hero.visual` now names the painting's sky (`hero-tableau-sky`), with a description of the whole picture, and the note under it says "AI-generated illustration". Because a release that still named the router's still would get the figures laid over it, `CONTENT_SCHEMA_VERSION` is 7.

## 4. Checks

`npm run lint`, `npm run typecheck`, `npm test` (150), `npm run build`, and the whole browser suite against the local Supabase stack (`npm run db:start`, then `E2E_PORT=3210 npm run test:e2e:local`): 215 passed, 13 skipped, 1 failed. The failure is the password-recovery test of `admin-auth.spec.ts`: the local stack mails its links to port 3000, and on this machine the run's server was on 3210 because another app has 3000. The Admin suites include the Mirror editor and its comparison, pixel for pixel, of the preview of the home page with the public one, which passed. `tests/e2e/home-landing.spec.ts` now checks: every layer of the arrangement in view has its picture and the figures float; the layers shift with the pointer and part with the scroll, the nearer the more; the router's frame and its True Online mark are on screen and clear of the headline and of the navigation at nine screen sizes; with reduced motion nothing moves or shifts and the painting is all there; without scripts the sky, the goddess and the mark show.

Looked at in screenshots of the dev server at 1920×1080, 1440×810, 1024×768, 768×1024, 390×844, 375×667, 360×640 and 844×390, at rest, half scrolled and with reduced motion.

Not checked: the page on a real phone, and the pgTAP database tests (nothing in the database changed).

## 5. Left open

- **The upright painting.** `master-portrait.jpg` still has a generic router with five antennas, and `figures-portrait.png` came back with green only in its middle (the sky and the clouds are still there above and below, and the router is not on green), so it cannot be cut. The phone therefore uses the wide painting's figures. To give the phone its own figures: put the True router into `master-portrait.jpg` (step 1 of the README), make `figures-portrait.png` again from the result (step 2), then give the `tall` pack its own figures in the script.
- **The sea god's chest is bare** in the painting, although the prompts ask for full robes. The owner's call; step 1 of the README has the sentence that dresses him.
- **The share picture** (`public/media/og-image.png`, `scripts/brand/logo.mjs`) still shows the 3D router, from `design/hero/router/poster-v3.webp`.
- **The rest of the site is still black and white.** The owner said the painting's palette could carry over to the site if it suits; that is to be decided on the preview.
- The pale outline round some figures is in the generated pictures themselves (a faint glow the generator painted round each figure on the green).
