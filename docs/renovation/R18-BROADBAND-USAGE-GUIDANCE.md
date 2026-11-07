# R18 — Broadband usage guidance

7 November 2026. Owner requested continuing immediate SEO improvements as well as scheduled measurement.

## Customer information gap

The existing speed-choice answer recommends considering simultaneous use but gives no concrete workload examples. Add a distinct answer about 500 Mbps, working from home and 4K, plus practical Wi-Fi test interpretation. These answer decision questions alongside the existing catalog without another keyword landing page. No observed ranking improvement or measured query demand is inferred from adding them.

Two new FAQ entries use the existing editable bilingual content model and appear below cards. Existing title, H1, first-screen layout, package names/prices/benefits, contact paths, homepage and hero are unchanged. No schema/version change, new component, dependency, image or first-paint request. Existing FAQ structured data reads exactly the same questions/answers. This is customer guidance, not a claim that general commercial queries are now ranking.

## Primary sources checked 7 November 2026

- [Netflix speed recommendations](https://help.netflix.com/en/node/306): stable 15 Mbps or more for 4K. This is not a screen-count guarantee.
- [Zoom HD requirements](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0066166): 1080p video needs at least 3.8 Mbps sending and 3.0 Mbps receiving. Account, settings, device and other requirements also apply; our text does not promise that any particular subscription enables 1080p.
- [True Online support](https://www.true.th/help/faq-hub/trueonline-knowledge-digital-service-center): compare 2.4/5 GHz and test nearer the router when the signal is weak. We do not transfer another channel's offers, prices or equipment promises into our packages.

Leave capacity for simultaneous tasks is practical guidance inferred from shared connection use, not an officially specified maximum number of devices. Netflix and Zoom are application examples, explicitly not added package benefits. The Wi-Fi answer advises recording conditions and contacting the team rather than assuming a package upgrade solves coverage.

## Verification

Lint, typecheck, 196 unit tests and the production build pass. Final full desktop E2E: **125 passed, 52 skipped**. Then separately full mobile E2E: **106 passed, 27 skipped**. Skips require a local database or another device project; these local counts do not claim that database-writing flows ran. Production must be checked separately because a published content release can override repository fallback copy. No hosted database publish is authorized merely to force fallback copy onto production.

Local QA first checked that the built and served HTML contains both new FAQ ids and the callback form. An old cached release from the isolated local test database initially hid the new copy. A build with no Supabase configuration showed the new copy but disabled the callback form, causing its accessibility case to fail. The final setup retains the local test keys and uses the loopback hostname `localhost:54621` to avoid the previous cached endpoint, without editing `.env.local`, publishing database content or deleting the existing cache. That build's HTML contains the new answers and form.

Mobile lab measurements using the documented `pagespeed-counts.mjs` through the 40 ms delay proxy: **93, 99, 98; median 98**, CLS 0. The largest paint remains the unchanged introductory paragraph. A separate CLI run scored 86 on the candidate and 83 on the existing public site, with large CPU benchmark variation; these results are retained rather than hidden. Google's PageSpeed API returned HTTP429 quota exceeded. The lab median clears the 95 target, but this does not claim a fresh score from Google's hosted service or a field-data improvement.

390 × 844 review: [first screen before](images/r18-mobile-before.png), [after](images/r18-mobile-after.png), [FAQ before](images/r18-faq-before.png), [after](images/r18-faq-after.png), [English answer](images/r18-faq-en-after.png). The new answers are below the cards and folded by default; screenshot review opened them. No horizontal overflow was observed.
