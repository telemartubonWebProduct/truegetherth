# Broadband buying guidance — 6 November 2026

## Problem and change

Search Console's exact /broadband baseline for October 10–November 3 was 11 impressions, zero clicks and average position 76. The page already showed packages and administrative FAQs, but did not help a visitor compare speed needs or separate Wi-Fi coverage from package speed.

Three bilingual answers now cover choosing 500 Mbps versus 1 Gbps, Wi-Fi in a home with several floors, and comparing equipment, contract and benefit-selection conditions. They sit in the existing native details section below the package cards. Two crawlable links lead from that section to the existing contact/area-check page and application steps, using those pages' localized headings. No new content schema, route, client script, image or font is introduced. No package facts, pricing, benefits or hero artwork are changed.

The coverage advice is supported by Ofcom's guidance: https://www.ofcom.org.uk/phones-and-broadband/service-quality/broadband-wifi-help and https://www.ofcom.org.uk/phones-and-broadband/coverage-and-speeds/improving-your-wifi-experience . It is general guidance, not a promise about a True package, fixed device counts or installation eligibility.

FAQPage continues to match the visible answers via the existing renderer. Google retired FAQ rich results in May 2026; this change is for useful customer information, not a rich-result promise.

## Indexation checks

The old coverage report listed four Thai broadband package pages as discovered but not indexed. Direct URL inspections on November 6 instead confirm all four are on Google: fiber-700-599, fiber-1g-799, fiber-1500-1199 and fiber-500-650-cctv. All report valid HTTPS and breadcrumb enhancements. No duplicate indexing requests or speculative canonical edits were made. Evidence is saved locally in shots/seo-audit-2026-11-06/gsc-package-inspections.json (ignored by Git).

Earlier requests for /service and /wifiService were accepted by Google, as was a request to recrawl /broadband after the preceding SEO release. Request acceptance is not proof of completed indexing or improved rankings.

## Verification

Lint, typecheck, 196 unit tests and production build pass. Run full desktop and mobile E2E separately. The existing bilingual FAQ test also checks both new internal links, and the 390x844 regression ensures the complete first-price area stays in the initial viewport. Screenshots and full run outcomes are included in the PR handoff.
