# R17 — Organic search research and application guidance

Date: 2026-11-07. Branch: `codex/organic-search-foundation`. Baseline: production commit `22ff2a3`.

## Objective and limits

Increase qualified organic enquiries and installations for True home internet without buying ads. Page-one visibility is the desired outcome, not a guaranteed deliverable. Research, shipped changes, indexation and eventual ranking results are separate evidence stages. Do not report a Lighthouse score, accepted indexing request, average site position or successful release as proof of page-one rankings.

No paid keyword dataset is connected. Search volumes, keyword difficulty and backlink counts are **unknown**. The search tool's results are a discovery sample, not a logged-out, Thailand-localized Google rank tracker. No search demand or easy ranking is inferred from a competitor having a page.

## Search Console baseline

Property: `https://www.truegetherth.com/`, inspected through the already verified owner account on November 7. The performance report's actual data dates and query/page metrics are retained in the local private research report, not committed to this public repository. The available observations are small; site-wide averages and unrelated mobile-plan terms do not establish the ranking of home-internet revenue queries. Search volume, keyword difficulty and the landing-page owner of the speed-query candidate remain unverified.

### Indexation audit

The aggregate Pages report is dated **23 October**, so its exclusions must not be presented as current errors. Direct URL Inspection on November 7 says the **homepage is on Google and indexed** despite its appearance in an older duplicate example. No speculative homepage canonical change is warranted. Two English package examples in that report were not individually re-inspected and remain unverified.

Direct URL Inspection for **`/wifiService`** says **discovered, currently not indexed**, no last crawl and sitemap discovery only; no referring page is reported. That status does not prove any particular content or link issue caused Google's decision. The existing footer and R14 links already lead to this URL. This batch improves its usefulness and contextual discovery rather than claiming it was an orphan.

Earlier indexing requests are already recorded in R14; this pass did not submit duplicates, start validation or change property settings. Raw account snapshots, metrics and screenshots are local only: `shots/organic-research-2026-11-07/`.

## Search intent and competitor sample

Research queries: `สมัครเน็ตบ้านทรู เอกสาร ติดตั้ง`, `เน็ตบ้านทรู คอนโด ตรวจสอบพื้นที่`, and `เน็ตบ้าน ใช้กี่ Mbps ทำงานที่บ้าน 500 1000`.

| Observed source | Useful format / information | Decision for this site |
| --- | --- | --- |
| [True pre-installation help](https://www.true.th/help/trueonline/pre-install) | Describes installation preparation and router placement | Add practical preparation; preserve package-specific confirmation |
| [True self-service](https://www.true.th/true-online/packages/true-online-self-service) | Serves direct application intent and has channel-specific offers | Our page must clearly describe applying through Telemart; do not copy self-service fees/offers or response-time claims |
| [Blue Violet dealer document page](https://www.truenetonlineforyou.com/documents-for-truefiber-installation) | Separate document guidance for applicant types and a clear contact path | Identify the missing document-check step; do not copy its personal-document collection workflow or contact details |
| [True-fiber speed guide](https://www.true-fiber.com/blog/ความเร็วเน็ตเท่าไหร่ถึงพอ) | Answer-first comparison, scenarios and links to relevant plans | Existing R14 broadband answers already cover speed choice; avoid publishing another near-duplicate article |

The official [general application terms](https://www.true.th/docs/tol-tc-true-application), version 0009/20082026, establish that fees, minimum terms and equipment conditions vary. This research does not verify our imported offers or transfer other channels' prices into our catalog. The official coverage-manual PDF appeared in search, but its direct fetch failed with HTTP 502: it is not claimed as a fully reviewed document.

### Keyword ownership map

These are proposed intent owners, not measured search-volume claims. Preserve existing URLs and avoid making multiple pages compete for the same job.

| Intent / seed queries | Owner URL | Work / evidence status |
| --- | --- | --- |
| โปรเน็ตบ้านทรู, แพ็กเกจติดเน็ตบ้าน, ลูกค้าใหม่ | `/broadband` | Existing package listing, price-first mobile layout and R14 guidance retained; do not rewrite its title again before measuring the previous release |
| สมัครเน็ตบ้านทรู, เตรียมอะไรติดเน็ตบ้าน, ขั้นตอนติดตั้ง | `/wifiService` | First implementation batch below; indexation is an explicit unresolved outcome |
| เช็กพื้นที่เน็ตบ้านทรู, ติดต่อเจ้าหน้าที่ | `/service` | Existing enquiry form and channels retained; add a contextual link to application preparation |
| Specific offered plan name / speed | Existing `/packages/<id>` | Preserve names, prices and benefits; link new-customer broadband details to application guidance |
| เน็ต500mb | **Not assigned yet** | Verify query → page pair and sustained demand before an independent optimization |
| Province / building terms | **Deferred** | Need real local service facts and evidence; no cloned province landing pages |

## First implementation batch

1. Expand the existing three editable application steps: address/building information; comparison and charge confirmation; current document checklist and installation preparation. No new offer, fixed document requirements, installation guarantee or response-time promise.
2. Clarify the application page's title/description and distinguish nationwide enquiry handling from actual address availability. Keep the dealer identity and legal company unchanged.
3. Add a callback path alongside the existing LINE and package choices, using existing localized content. Contact page and new-customer broadband detail pages get crawlable, localized links to the guide; `/broadband` already links to it. No orphan new route or duplicated article is created.
4. Make the existing application illustration lazy instead of preloading it. No dependency, script, font or new image is introduced. Home page, hero artwork and package prices/names/benefits are untouched; the schema and version remain unchanged.

Content still reads from the published content model and remains editable through existing fields. **Deployment alone may not replace a separately published content release**: verify the actual public copy after an approved merge. Do not invalidate releases or publish editor drafts merely to force the new fallback text onto production.

The links from package details are limited to `broadband-new`. Mobile or other package pages do not inherit an irrelevant home-internet application guide. Existing package `shownBenefits`, VAT/review notes and conversion logic remain unchanged.

## Measurement and next actions

| Stage | Check / decision |
| --- | --- |
| Before release | Required lint/types/unit/build; desktop and mobile E2E separately; 390 px visual review; broadband mobile lab performance at least 95 |
| After approved release | Verify exact public copy and links; preserve canonical/hreflang/sitemap; inspect `/wifiService` again after Google processes it. Do not repeatedly request indexing |
| Weekly | Record query + page pairs, country/device, impressions, clicks and position; separate branded/mobile terms from home-internet intent; record GA4 organic contact events and Package ID, excluding QA |
| 28 days after release | Compare with the baseline using the actual data dates; prioritize commercially relevant queries with enough observations and positions roughly 8–20. Tiny samples remain exploratory |
| After two measured rounds without movement | Reassess intent and authority instead of repeatedly rewriting titles. Prepare an earned-link shortlist and owner-reviewed outreach; do not send messages or buy links without explicit instruction |
| Business evidence pending | Owner's new-company registration/certificate and permissioned installation case studies. No invented testimonials, credentials, customer counts, addresses or service guarantees |

The action plan follows [Google's people-first guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [spam policies](https://developers.google.com/search/docs/essentials/spam-policies). A dated review is not a claim that prices or eligibility were reverified. No automation, advertising spend, backlink purchase, external message, DNS/Vercel setting or hosted database change is part of this batch.

## Validation

- Lint, typecheck, 196 unit tests and a production build without database settings pass. A second build against the isolated loopback Supabase test project also passes.
- Complete desktop E2E with local Supabase: **177 passed**, including the editor, publishing, leads and the two new bilingual application cases.
- Complete mobile E2E: **110 passed, 22 expected skips, 1 failure** at the existing homepage native-swipe snap assertion. A second complete mobile run had the same outcome. The new application/link checks pass in both languages on both projects.
- The same homepage assertion passed three focused runs against the prior production build. Earlier intermittent failures are recorded in R14/R16. The cause of the current sequence-dependent failure is not established. A native synthesized-gesture experiment also failed and was reverted. No homepage runtime, swipe helper or assertion change is included. This PR stays draft while CI and the unresolved mobile result are assessed.
- Local mobile Lighthouse: **broadband 100**, LCP 1.059 s, CLS 0; **application 94**, LCP 3.034 s, CLS 0. The prior production application build measured **93**, LCP 3.208 s, CLS 0 under the same local method. These individual runs do not establish a statistically meaningful improvement or a field-data result. The existing application illustration remains a performance follow-up; broadband's required 95 floor is met in the lab.
- Mobile screenshots use a 390 × 844 viewport; the pages have no horizontal overflow or console errors in those captures. Raw account metrics remain local and are excluded from the public PR.

[Application before, 390 px](images/application-guidance-before.png) · [Application after, 390 px](images/application-guidance-after.png)
