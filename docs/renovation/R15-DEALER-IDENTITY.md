# R15 — True Online dealer identity

Date: 2026-11-07. Branch: `codex/true-online-brand`.

The owner requested replacing the rings and truegetherth wordmark, including browser icons, with True Online dealer branding in the manner of the supplied example. The example's TNT Intertech Solutions name belongs to another business and is not reused.

## Identity

- Original owner-supplied True Online artwork: `public/assets/wEnergy/trueonline.png`, unchanged.
- Reproducible dealer lockup: `node scripts/brand/logo.mjs` → `public/brand/true-online-telemart-v1.png` (744×189). True's lettering is not redrawn; BY TELEMART is a separate attribution line below it.
- One dealer logo in the header at all sizes. The second desktop partner pill is removed. Footer company identity and the existing partner disclosure remain.
- Header dimensions are reserved; lazy loading is retained. No new runtime dependency, preloading or blocking network request is introduced.
- Tiny browser favicon: original red initial extracted from the supplied artwork, on white; SVG embeds its own raster so it needs no external image/font request. ICO contains 16/32/48 px variants. Apple home-screen icon uses the complete dealer lockup.
- Share image gets the new versioned filename `og-image-v3.png`; the painting is unchanged.
- Bilingual public names, title suffixes, accessible names, FAQ references, consent and terms now refer to Telemart / True Online by Telemart. Admin mark, title and contact email display name follow. Legal company details, contact channels, domain, canonical URLs, sitemap, package names, prices and benefits are unchanged.
- Stable `truegetherth-logo` media id and saved comparison identifiers are retained for existing drafts/history. Old versioned image assets remain available to existing saved content and caches; current repository content uses the new assets. No schema or database change.

## Certificate evidence — pending owner documents

The owner says a new company is being arranged and certificate documents are being requested. The certificate has not been supplied or independently checked. This change adds no certificate page, certificate number, expiry, document image, “verified” badge or statement that the new company has been registered/certified. Existing operating-company details and owner-stated dealer disclosure remain in place.

When the actual evidence is available, confirm: exact legal entity and registration number; issuer and exact certified role; validity/expiry and permitted scope; right to use the supplied marks and dealer attribution; issuer's verification channel; which details can be public. Do not copy seals/signatures or disclose personal identifiers, personal phone numbers, QR verification tokens or full identity documents. Prepare a public redacted copy separately from the original. The customer-facing company page and privacy/consent identity must reflect the entity actually receiving and processing applications. These are implementation prerequisites, not a claim of legal approval or a guarantee against complaints.

## Validation

- `npm run lint`, `npm run typecheck`, `npm test` (196 tests), `npm run build`: pass.
- After the build, `E2E_PORT=3210 npx playwright test --project=desktop`: 121 passed, 52 intentionally skipped.
- Then separately `E2E_PORT=3210 npx playwright test --project=mobile`: 102 passed, 27 intentionally skipped. DB-writing/admin suites require the local Supabase stack; these results do not claim those flows ran locally.
- Header identity, local icon response, menu controls and non-overlap checked at 320, 390, 768 and 1280 px, on Thai home and English broadband, in both browser projects. Existing hero composition tests cover short 360×640 and 375×667 screens; the original pill height is preserved there to avoid the router mark. Original assertions were retained. The first run found the two short-phone collisions; the final runs above pass after the responsive-height fix.
- Screenshot capture waits for the hero pictures and finite entrance animations, so the review images show the settled page. Reviewed the 390 px home and English broadband, 1280 px home and a 64 px favicon rendering. Actual physical-phone testing is unavailable.
- Before: [owner-supplied logo crop](images/r15-before-owner-logo.png). After: [390 px home](images/r15-after-mobile-390.png), [1280 px home](images/r15-after-desktop-1280.png), [390 px English broadband](images/r15-after-broadband-en-390.png), [favicon](images/r15-favicon-64.png).
- Performance measurement follows below.

## Advertising identity is a separate verification

Publishing a partner certificate on the site does not itself complete Google Ads advertiser verification. Google's guidance says the submitted organization name must exactly match its registration documents and information must be consistent with the Ads account. Its misrepresentation policy also requires accurate business identity and affiliation. Prepare the actual registration and authorization evidence first; do not submit the future entity as already registered, or use another company's certificate as its proof. No Ads identity submission or account/payment-profile change is included in this PR.

Official references checked 2026-11-07: [Advertiser verification](https://support.google.com/adspolicy/answer/9703665?hl=en), [Business operations verification issues](https://support.google.com/adspolicy/answer/11938893?hl=en), [Misrepresentation](https://support.google.com/adspolicy/answer/6020955?hl=en).

After deployment, Google Search may continue showing the previous favicon until it recrawls and processes the homepage; this can take days to weeks and display is not guaranteed. The ICO route remains available for Search (the SVG icon is for browsers). [Google favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search), checked 2026-11-07.

Local Lighthouse mobile, production build on port 3210, fresh browser with `--no-proxy-server` (not Google's hosted PageSpeed service or field data): `/broadband` performance 100, LCP 1078.08 ms, CLS 0; home performance 100, LCP 1064.5738 ms, CLS 0. JSON reports are retained locally under `shots/brand-2026-11-07/`.
