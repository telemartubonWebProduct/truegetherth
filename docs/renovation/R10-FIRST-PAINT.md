# R10 — What a phone fetches before the first paint

Date: 2026-10-11. Branch `perf/home-mobile`.

The owner sent Google's PageSpeed report of the live home page on a phone: Performance 82, the other three 100. A second run of the same report three minutes later said 90. This is what the number is made of, what was changed, and what could not be settled from here.

## 1. How PageSpeed makes the number

PageSpeed (Lighthouse 13.5) does not load the page on a slow phone. It loads it once on a fast machine, notes the moment the largest paint was seen, and then estimates how long everything that **had arrived and had run by that moment** would take on a slow phone (1.6 Mbps, 150 ms, a processor four times slower). That estimate is the "Largest Contentful Paint" it reports, a quarter of the score. On this page it was the only thing costing points: first paint 1.1 s, blocked time 50 ms, no layout shift, largest paint 3.6 s.

Three rules of that estimate decide everything below:

- A file counts if it finished before the largest paint was seen, whatever it was for. A script counts if it had started to run by then.
- A picture asked for with `loading="lazy"` is requested once the first frame is being made, so over any real network it comes back after the first paint, and is not counted when the largest paint is in that first frame.
- A browser does not time what it first paints unseen (at no opacity). The headline is in the first paint; a picture that arrives a moment later and is painted visibly becomes the largest paint instead, and the moment moves to when it arrived.

The last rule is the likeliest reason the same page scored 82 and 90. The painting faded in from the first frame, so a figure that arrived a few milliseconds into the fade was painted visibly and took the headline's place, and one that was already there was not timed at all. Seen here on `main`: with 40 ms of network the goddess becomes the largest paint and the score is 85; with none the headline stays and the score is 90. (Google's 82 run itself could not be read: its service was over its daily quota for anyone without a key.)

The same Lighthouse, run here against the production build, gives Google's figures to the decimal (90, largest paint 3.6 s), and `scripts/perf/pagespeed-counts.mjs` lists what it counted. On `main`, 435 KiB before the largest paint:

| Counted | KiB |
| --- | --- |
| The page | 33 |
| Three stylesheets | 18 |
| Two fonts (Inter 47, Anuphan 19) | 66 |
| Scripts | 213, of which the animation library 49 |
| The sky, asked for at once | 67 |
| The cloud bank, asked for ahead of the page (R9) | 38 |

## 2. What changed

**Nothing of the painting is asked for ahead of the first paint.** The sky is lazy like the figures, and the early request for the largest layer (R9) is gone: it was made for a picture that is no longer what the browser times.

**The painting waits a moment in the dark and comes out whole.** Its box is dark from the first paint, so the white headline can be read at once (it used to stand on a box that was still fading in from the page's white). The scene inside holds for 0.4 s and then settles in over 1.6 s (`landing.css`, `hero-settle` on `.hero-scene`). On an ordinary connection every picture has arrived by then, so the painting no longer assembles piece by piece; and what is first painted during the wait is not timed, so the largest paint is the headline, in the first frame. This is a choice with a cost, and the owner should know it: on a fast connection the painting shows up to 0.4 s later than it could. On a slow one nothing changes: a picture that arrives after the wait shows at once and is timed when it arrives (checked with pictures held back 1.5 s: the sky becomes the largest paint at its arrival). With reduced motion there is no wait.

**No animation library.** `motion` (49 KiB compressed) was fetched by every page for two things: the menu panel's entrance and exit, and the counting numbers. The panel is CSS now (`nav-panel-in`, `nav-panel-out`; it stays in the page for 200 ms while it leaves), and `CountUp.tsx` is a few lines over `IntersectionObserver` and `requestAnimationFrame`. The package is removed.

**Inter in two cuts** (`scripts/fonts/subset.py`, `src/fonts/index.ts`). The Latin file was 47 KiB, most of it letters and weights the site does not set. `inter-basic` (26 KiB) holds what the site's own words use, in weights 300 to 700, and is the one every page asks for; `inter-more` (13 KiB) holds the rest of the Latin range and is fetched only by a page that shows one of its characters (its `unicode-range`). The file both are cut from is kept in `scripts/fonts/source`.

**The stages below the opening are laid out when they come near** (`content-visibility: auto`, under `html[data-motion]` only). The first layout was 1,138 boxes and 85 ms on this machine; it is 272 boxes and about 45 ms. A stage's height is set, so nothing moves when it is laid out. The two sections after the stages have no set height, so they get it only where the browser keeps the visitor's place when something above the screen grows (`@supports (overflow-anchor: auto)`: not Safari).

**The scroll driver measures before it writes.** It read five positions a frame, each after writing custom properties on `<html>`, so the browser worked the whole page's styles out five times a frame; PageSpeed listed it as forced reflow. It reads everything first now. The row of packages is measured once its stage is within two screens, not while the page starts (which laid that stage out before anything had been shown), and Lenis is fetched a quarter of a second after the first frame.

**Smaller things.** The logo is not asked for ahead of the page. The True Online mark is laid on the white it is shown on, at 248 pixels: 4 KiB instead of 13. A phone takes the 720-pixel sky instead of missing it by one pixel, and the sea god has a third size. The painting's files are kept by browsers for a year instead of a week, and `scripts/media/hero-tableau.mjs` now refuses to change a file in place (a changed picture goes in a new folder; `--replace` is for a file that was never published).

## 3. Measurements

Lighthouse 13.5, phone profile, the production build on this machine, each answer held back 40 ms by `scripts/perf/delay-proxy.mjs`. The proxy matters: straight from localhost a lazy picture is back before the first frame shows and is counted, as it never is over a network.

| Page, phone | `main` | This branch |
| --- | --- | --- |
| Home | 85 to 86 (largest paint 4.2 to 4.3 s), six runs | 95 to 100, median 97 (largest paint 2.6 s; 1.8 to 2.9 s), 24 runs |
| /broadband | 96 (2.7 to 2.8 s) | 97 (2.5 to 2.6 s) |
| /monthy | 94 to 96 (2.8 to 3.0 s) | 95 to 97 (2.6 to 2.9 s) |

Home on a desktop: 100. Accessibility, best practices and SEO: 100 on every page measured.

Counted before the largest paint on the home page now: the page 33, stylesheets 18, fonts 45, scripts 162; 259 KiB, no picture.

**What decides between 97 and 100.** The scripts are held back by the browser until the stylesheets have arrived, and the first paint needs the same stylesheets: the two start together, the scripts with a network round trip to make and the paint with a layout. If the paint is first, no script is counted and the estimate is 1.6 to 2.1 s (99 to 100); if a script runs first, it is counted. On this machine the two are a few milliseconds apart. With the footer laid out on demand as well, the paint won four runs of five (99, 100, 100, 100, 100); that was taken out again (below), and now the scripts win about four runs of five. Which way it goes on Google's machines could not be known before the deploy (a preview deployment is behind Vercel's sign-in); section 7 has what they said afterwards.

## 4. Tried and left out

- **The footer and the contact band laid out on demand.** Until such a section is laid out its box is a guess; an accessibility checker (axe, which PageSpeed runs) looks for the colour behind each word, and for words lying beyond the guessed box it finds the page's white instead of the footer's ink: eight false contrast failures, Accessibility 97. A guess taller than the footer would hide it until the footer grew.
- **The sky lazy without the wait.** It arrived just after the first frame, was painted visibly and became the largest paint: worse than before.
- **Package pages laid out on demand.** /monthy lays out 3,556 boxes before its first paint (75 ms here). Its first section is already near the screen, so 25 ms were saved there and none on /broadband, for a page whose length would be a guess until scrolled. Left as it is.
- **The cookie banner after the first paint** (on the home page, by CSS): 3 ms.
- **Inlining the stylesheets** (R9): without a stylesheet to wait for, the scripts are not held back and run before the first paint.
- **Dropping Next.js's polyfills** ("Legacy JavaScript, 14 KiB" in the report). They are the framework's, for browsers from before 2022; without them an iPhone on iOS 15.3 or older would have no working scripts, the call-back form included.

## 5. What the report will still list

None of these costs points; they are listed so nobody chases them twice.

- **Render-blocking requests**: the three stylesheets. They are what the first paint waits for, and what holds the scripts back.
- **Legacy JavaScript**: the framework's polyfills, above.
- **Improve image delivery**: a few kilobytes on figures whose nearest file is a little larger than the screen needs.
- **Optimize DOM size**: about 1,000 elements. Twenty package cards in four tabs are in the page for search engines and for visitors without scripts; what changed is how many are laid out at first.
- **Network dependency tree**: the page, then its stylesheets. Nothing to shorten.

## 6. The tools

- `scripts/perf/pagespeed-counts.mjs <url> [runs]`: the score, and every file and task the estimate counted. Needs Lighthouse installed somewhere (`LIGHTHOUSE_DIR`); it is not a dependency of the project.
- `scripts/perf/delay-proxy.mjs`: the local server from a distance. Measure through it.
- `scripts/perf/first-paint.mjs <url>`: how long the first layout takes, whether the scripts ran before the first paint, and what the browser names as the largest paint; `--late <file>=<ms>` holds files back, `--css` tries a rule without a build.

## 7. On Google's machines, after the deploy

Merged to `main` on 12 Oct 2026 (00:23 in Thailand) together with the steps' pictures (R11) and Next.js 16.4.0, and deployed a minute later. PageSpeed Insights, home page:

| Run (Thailand time) | Phone | Largest paint | What it saw | Desktop |
| --- | --- | --- | --- | --- |
| 00:30, seven minutes after the merge | 89 | 3.2 s | A slow load: the page took 462 ms to arrive and the first paint came at 2.6 s, so everything fetched by then was counted | 98 |
| 00:34 | 100 | 1.5 s | First paint at 280 ms, before the scripts ran: only the page, its styles and its fonts counted | 99 |
| 00:38 | 97 | 2.6 s | First paint at 300 ms, after the scripts had run: they were counted | 99 |

Accessibility, best practices and SEO were 100 in every run, and the element timed was the headline each time. So the two outcomes of section 3 are what Google's machines give as well, 97 and 100, and which one depends on a few milliseconds in their run. Before the change the same report said 82 and 90.

## 8. For the owner

- The number moves from run to run: a single run of 97 or of 100 is the same page.
- The 0.4 s wait of the painting is one line (`landing.css`, `html[data-motion] .hero-scene`). It is what keeps the score from depending on which picture arrives when; taking it out means asking for the sky ahead of the page again (67 KiB counted) and living with a score that moves by eight points between runs.
