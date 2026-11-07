# R16 — Contact measurement audit

Date: 2026-11-07. Branch: `codex/organic-conversion-audit`.

## Existing conversion scope

The owner's 2026-11-04 change (`4326b8d`) made Google Ads conversions apply only after a callback request is successfully stored and is not a duplicate. LINE and telephone clicks remain separate GA4 contact events. This audit preserves that behavior, the consent gates and the production-host restriction.

| Action | GA4 | Google Ads | Meta, with advertising consent |
| --- | --- | --- | --- |
| LINE / telephone click | `contact_line` / `contact_phone` | No conversion | `Contact` |
| Successfully stored, nonduplicate callback | `generate_lead` | Existing configured conversion | Browser + CAPI `Lead`, shared event id |
| Page opening or failed callback | No lead event | No conversion | No lead event |

Meta CAPI already exists in the application. Its production activation and any external CRM/GTM/offline sender have not been established. No additional sender or advertising goal is introduced.

## Package context

The existing delegated contact handler now adds `package_id` from the clicked link's explicit `data-package-id`, or its nearest `[data-package]` container. The comparison table sets the explicit id on each package's LINE link. Cards and detail sections already provide their package containers. Generic footer and contact links do not inherit a previously viewed package.

No new event is emitted: the event name, consent, destination, CTA id and page path remain unchanged. A successful callback already includes its package id. No personal information is added to GA4. Thai and English E2E cases cover two distinct cards, the second comparison column, detail LINE/telephone and a generic footer link, including exact event counts.

## Live verification (production before this branch)

The owner approved an analytics-only test at `/service?utm_source=qa&utm_medium=test&utm_campaign=conversion_audit_20261107`, with one LINE and one telephone click, without sending a message, placing a call or submitting the production form.

- The correct web stream matches the site's configured measurement id. A different property in the default signed-in account was not modified.
- Brave's uBlock replaced the Google tag response with a no-op stub. Data-layer calls alone did not establish delivery. Extensions were left unchanged.
- In a clean browser, both contact events received HTTP 204 from Google's collection endpoint, with analytics granted and advertising denied (`G101`). Both then appeared once in GA4 Realtime, independently confirming receipt. No advertising event was sent in this test.
- Temporary navigation guards prevented opening external applications and were removed after testing. These QA events are not customer leads and must be excluded from conversion analysis using the `qa / test` session source/medium or the QA campaign.

Sanitized evidence is kept locally under `shots/conversion-audit-2026-11-07/`: `clean-live-contact-transport.json`, `ga4-realtime-contact-events.jpg`, `organic-search-traffic.jpg` and `ga4-package-id-proposal.jpg`. Account snapshots, cookies, tokens and database keys are not committed.

## Organic baseline and reporting

The filtered GA4 Traffic acquisition report for **10 October–6 November 2026** shows **Organic Search: 1 session, 1 engaged session, 4 events and 0 key events**. This is a pre-change baseline with too little traffic to evaluate SEO performance. It does not establish rankings or results from the November releases. The unfiltered report's totals did not reconcile with its visible rows; no all-channel totals or percentages are inferred from it.

The property currently has no custom dimensions. A concrete, unsaved proposal was reviewed: event-scoped dimension **Package ID**, parameter `package_id`, description `แพ็กเกจที่เกี่ยวข้องกับการติดต่อ / Package associated with a contact event`. Saving this account setting remains subject to the owner's approval. No dimension was created during this audit.

After registration and data processing, review Traffic acquisition with Session default channel group = Organic Search (or Session source/medium), break contacts down by event name and Package ID, and exclude QA traffic. Distinguish contact clicks, stored requests and qualified/installed customers. GA4 session attribution persists independently of the form's backend `requestSource`; the latter only reads UTMs present on the final form URL. Missing backend UTMs are not proof of Direct or Organic traffic. Do not add UTMs to internal links.

## Validation and remaining work

Local callback success/duplicate, consent and admin tests use a separate disposable Supabase project on loopback ports, not a hosted database. No real callback was submitted on production. Production receipt of `generate_lead` was therefore not asserted by this audit.

The first complete desktop suite passed 175 tests. The first mobile suite passed 108, skipped 22 desktop-only cases and failed one existing homepage native-swipe snap assertion. Focused repetitions also reproduced intermittent alignment failure. A proposed CDP-session-lifetime explanation did not resolve it and was reverted; no homepage runtime or swipe-test assertions are changed in this branch. The final complete mobile run passed 109 tests with 22 expected skips, including the unchanged swipe assertion. Lint, typecheck, 196 unit tests and the production build passed. The intermittent snap behavior remains an explicit test risk, not a claimed fix. Final performance and CI results are recorded in the pull request.

Local Lighthouse mobile performance: home 100; broadband initial 70 (TBT 2,754 ms, CLS 0), followed by three fresh-browser runs scoring 100/100/100 (LCP about 1.06 s, CLS 0). This variation is retained as evidence; it is not a guarantee of every future PageSpeed run. No new dependency, preload, request or rendering work was added before first paint.

Remaining external work: owner approval for this PR and the Package ID dimension, production verification after an approved release, and company/certificate evidence once the actual documents are available. Existing legal identity is retained.
