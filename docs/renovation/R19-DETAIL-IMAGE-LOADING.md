# R19 — Broadband detail illustration loading

8 November 2026. Follow-up to the owner's request for immediate technical SEO work.

## Observed behavior and scope

The live new-customer 500 Mbps, 700 Mbps and 1 Gbps detail pages explicitly preload their large illustration. At 390×844 the 500 Mbps image begins around y847, following the offer facts, VAT/review note and contact actions. Its source is a general illustration; it is not needed to read those facts. Mobile production baseline for the 500 Mbps detail page: 98/99/100, median99, CLS0. This is already a good score; it is not evidence of a ranking bottleneck or a promised rank improvement.

Only `broadband-new` detail illustrations switch to native lazy loading with a desktop-only responsive preload (`media="(min-width: 1024px)"`, matching the two-column layout). There is no mobile-applicable document image preload. `getImageProps` supplies the same responsive candidates and sizes as the displayed Image so the preload does not select a different resource. No viewport detection script is added. Source, alt text, intrinsic dimensions, layout and visible content stay the same. Native lazy loading may still fetch an image close to the viewport before it is scrolled into view; do not claim that the image can never load before first paint. Existing-customer, mobile and solar detail images retain their preload behavior through Next16's supported `preload` prop, replacing the deprecated equivalent `priority` prop.

No package name, price, benefit, title, description, URL, schema version, consent/tracking logic, homepage or hero change. `shownBenefits` remains in use. Package-listing `/broadband` is unaffected by this component change and must retain the mobile95 floor.

## Evidence and checks

The installed Next16.4.2 image reference (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`) documents `preload` and native lazy loading. [Official image reference](https://nextjs.org/docs/app/api-reference/components/image). Dimensions remain reserved to avoid layout shift. Check desktop as well as mobile: its illustration can be above the fold.

The focused E2E regression checks both languages, inactivity of the new-customer preload on a 390 px viewport and activation at 1280 px, matching responsive candidates, successful image display on scroll and preservation of an existing-customer offer's preload. [Native responsive preloads](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload#including_media) are handled by the browser. Required full checks, before/after 390 px captures, mobile detail/listing measurements and desktop comparison are recorded before release. A clean browser/data setup is important: confirm the build serves the current content and callback form, not a cached local published release.

Local verification of the final responsive version: lint without warnings, typecheck, 196 unit tests and production build pass; the focused desktop test passes. With the documented 40 ms proxy, mobile detail scores 99/100/100 (median 100), CLS 0; `/broadband` 97, above the 95 floor. Desktop CLI score 99, LCP 0.901 s, CLS 0. The prior public desktop CLI baseline scored 100, LCP 0.516 s; public and local/proxy conditions differ, so this is not a controlled before/after latency comparison. The public mobile detail baseline 98/99/100 likewise does not establish a statistically significant speed gain over the local candidate. Verify the deployed pages and performance separately. No fresh Google-hosted PageSpeed or ranking improvement is claimed from these lab measurements.

[390 px before](images/r19-before-390.png) · [after](images/r19-after-390.png) · [image displayed after scrolling](images/r19-image-after-390.png) · [desktop after](images/r19-after-1280.png).

Final full desktop E2E: **126 passed, 52 skipped**. Then separately full mobile: **107 passed, 27 skipped**. Database-dependent and device-specific cases account for the expected skips; database-writing coverage is verified by CI separately. No test assertion was weakened. A responsive src fallback is retained for image types without a srcset. All final source changes were included in the checked build.
