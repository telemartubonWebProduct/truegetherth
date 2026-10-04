# Current site audit — Telemart Ubon

Date: 2026-09-29 (Asia/Bangkok). Scope: read-only source and local asset audit for renovation planning. No production deployment, email delivery, analytics account, or database access was verified. No application source or dependencies were modified by this audit.

## Repository baseline

- The working tree was clean before audit documentation was created. Current HEAD: `87c70d2` (`remove unnecessary blank lines in layout.tsx`).
- Next.js App Router, TypeScript strict mode, React 19, Thai Prompt font, Material UI, Tailwind, Framer Motion, Swiper and react-multi-carousel are present.
- Declared versions: Next `15.1.11`, React/React DOM `^19.0.0`, MUI `^6.3.1`, Tailwind `^3.4.1`, Framer Motion `^11.17.0`, Nodemailer `^6.10.0`; `eslint-config-next` is `15.1.4`, different from Next. Evidence: `package.json:12-41`.
- Scripts provide dev/build/start/lint only. No test suite, CI workflow, checked-in deployment configuration, database migrations, CMS schema, or environment example was found. `node_modules` and root `.env*` files were absent at audit time. This does not establish the configuration of the live site.
- RTK instructions at `C:/Users/sutti/.claude/RTK.md` were read; `rtk --version` returned `0.42.4`, and `rtk gain` worked. The binary resolves to `C:/Users/sutti/.local/bin/rtk.exe`.

Preparation performed by the coordinating agent after this baseline: `@supabase/supabase-js@2.117.2`, `@supabase/ssr@0.12.7` and `zod@4.6.5` were installed. These are dependencies only; runtime Supabase authentication/database integration is still absent. The initial `npx tsc --noEmit` failed with 10 TS2307 image-import errors before `next-env.d.ts` existed. **Final verified baseline: `npm run build` passed, exit 0, generating all 15 static pages; `npx tsc --noEmit` then passed, exit 0, after Next generated the image declarations.** The image files exist and compile; there is no observed type/build blocker. The coordinator's `npm audit` reported 19 advisories (3 low, 4 moderate, 10 high, 2 critical), including critical Next/Swiper and high Nodemailer entries. The advisories remain unresolved in the planning/setup stage; this is dependency-audit evidence, not a runtime exploitability assessment.

## Current public URLs and content to preserve

| URL | Purpose and current sources | Renovation treatment |
| --- | --- | --- |
| `/` | Promotional homepage: navigation, hero/carousel, announcement, categories, home internet offers, mobile add-ons and True banner. `src/app/page.tsx:5-17,36-90`; `src/datas/home/*` | Rebuild hierarchy and visual design; migrate relevant text, links, and genuine product assets into editable content records. |
| `/broadband` | New home internet customers: packages/speeds/prices/perks. `src/app/broadband/page.tsx`; `src/datas/Boardband/Boardband-new.data.ts` | Preserve URL and verified package facts; enable comparisons, conditions and enquiry CTA. |
| `/broadband-old` | Existing customer speed upgrades, CCTV and TrueID add-ons. `src/app/broadband-old/page.tsx`; `src/datas/Boardband/Boardband-old.data.ts` | Preserve URL and existing-customer intent. |
| `/monthy` | Mobile monthly add-ons: internet, social, calls, streaming, games/lifestyle, insurance/health/Whoscall. `src/app/monthy/page.tsx`; `src/datas/Monthy/*` | Preserve the existing misspelled URL initially; a cleaner URL requires an explicit permanent redirect and canonical decision. |
| `/topup` | Prepaid/mobile top-ups and add-ons: internet, calls, entertainment, games, insurance. `src/app/topup/page.tsx`; `src/datas/Topup/Topup.data.ts` | Preserve URL; verify current availability and commercial terms before publishing migrated prices. |
| `/wEnergy` | W&W Energy solar service, installation process, statistics, knowledge and 3/5/10 kWp packages. `src/app/wEnergy/page.tsx`; `src/datas/wEnergy/solar.data.ts` | Preserve URL unless owner removes solar from scope; keep its identity clear beside True telecom products. |
| `/wifiService` | Apply for home internet via staff; CTA goes to LINE. `src/app/wifiService/page.tsx:9-52`; `src/datas/home/homeInternet.data.ts:43-51` | Preserve inbound URL; replace duplicated image-led content with a clear enquiry flow. |
| `/service` | Contact form plus LINE/Facebook/contact information. `src/app/service/page.tsx:9-205` | Preserve URL and validate authoritative contact destinations. |
| `/termsAndPrivacy` | Terms/privacy including Tawk disclosure. `src/app/termsAndPrivacy/page.tsx` | Preserve URL; reconcile final text with actual data collection and integrations. |
| `/SoonContent` | Public “This site is not ready” placeholder. `src/app/SoonContent/page.tsx` | Decide whether to replace, remove, or redirect; do not retain an indexable unfinished page by accident. |
| `POST /api/contact` | Server-side Gmail delivery through Nodemailer. `src/app/api/contact/route.ts` | Replace with validated, abuse-resistant lead handling and observable delivery status. |

Existing product prices/claims are source data, not verified current offers. Package copy contains inconsistencies: the Au Bon Pain item says 79 baht and 5GB in its title but uses `price: 200` and `speed: "3 GB"` (`src/datas/Monthy/game.data.ts:132-141`). A catalog review is required before migration becomes published content.

## Contacts, tracking and integrations

- Most package purchase/apply buttons redirect directly to the shared LINE URL in `src/globals/buttonActionPath.ts:1`. Examples: `src/components/HomeInternet/new-customer/Package.tsx:172`, `src/components/Monthy/Promotions.tsx:108`, `src/components/Topup/Promotion.tsx:70`. This is currently a lead-generation flow; no cart, payment, order database, or order confirmation was found.
- The service page uses a different LINE destination from the shared package CTA (`src/app/service/page.tsx:97`). The unused-in-layout `BasicSpeedDial` component also declares this alternate LINE destination (`src/components/SpeedDial/BasicSpeedDial.tsx:16`). Confirm whether both accounts intentionally serve different teams.
- Footer contact phone numbers are displayed as text, not tracked telephone links (`src/components/Footer/Footer.tsx:108-136`). Contact details are repeated in components and should become centrally managed settings.
- “เข้าสู่ระบบ” currently opens the separate `telemartmanagement.com` site (`src/components/Navbar/Navbar.tsx:68-73`). It is not authentication for this repository. No local admin route, auth guard, Supabase client, role management, database client, CMS, or media library was found.
- The active layout installs a Google Ads `AW-` gtag, not an identified GA4 `G-` property (`src/app/layout.tsx:41-58`). The homepage fires a `conversion` event on mount, without requiring a contact action (`src/app/page.tsx:23-31`). This can count ordinary home visits as conversions and can also miss the event if gtag loads after the effect.
- No contact-click event instrumentation, form-success event, consent state, campaign attribution persistence, GA4 reporting API integration, or analytics dashboard was found. The observed source does not prove what Google receives in production.
- Tawk is injected by `MainLayout` through `TawkScript` (`src/layouts/MainLayout.tsx:5,17`; `src/app/TawkScript.tsx:5-13`). A legacy `_document.tsx` is also present under `src/app/pages`; it is not the App Router root document (`src/app/pages/_document.tsx:1-27`). The rebuild should deliberately choose and configure its chat provider.

## Concrete repair and migration risks

1. **Announcement image size:** `src/datas/home/promotePromotion.data.ts:1-3` imports three Git-tracked files under `src/assets/promoteProduct`; `Announce` actively renders them (`src/components/home/announce/Announce.tsx:12,54-65`). All three compile into `.next/static/media/L1.*.webp`, `L2.*.webp` and `L3.*.webp`; `.next/trace` records their actual workspace paths. Each source is 2048×2048, and their combined source size is 6,131,332 bytes (about 6.13 MB). Review image dimensions/crops and delivery settings in the rebuild. This is source-size evidence, not a measured browser transfer size; Next image optimisation can serve smaller variants.
2. **Asset case sensitivity:** `/assets/tol-ico/Sim 10GB.png` and `/assets/tol-ico/iQiyi.png` are referenced by `src/datas/home/WifiHome.data.ts:37,78`; actual filenames are `sim 10GB.png` and `iQIYI.png`. A case-sensitive deployment can return 404s even when Windows serves them.
3. **Minimal contact validation:** the server only checks truthiness of first/last name, email and message (`src/app/api/contact/route.ts:6-13`); it does not enforce strings, trimming, lengths, email/phone format or payload size. No rate limiting or bot protection was found. It returns the caught error object to the caller (`src/app/api/contact/route.ts:40-45`) and has no lead persistence, deduplication or audit trail. The subject field sent by the client is ignored by the endpoint.
4. **SEO configuration:** root description remains “Testing Prompt Thai font” (`src/app/layout.tsx:18-21`). A manually added icon link points to the absent public path `/src/app/logo.ico` (`src/app/layout.tsx:40`), while Next also generates a valid `/favicon.ico` link from `src/app/favicon.ico`; remove the invalid extra link during cleanup. No route-specific metadata, sitemap, robots configuration, canonical/OG fields, or structured data was found.
5. **UI/content architecture:** most pages are client components, and content is distributed across `src/datas`, JSX literals and images. Prices, legal conditions, links, headings and contact settings have no single source of truth or revision history. Home repeats `id="category"` (`src/app/page.tsx:55,63`), making section targeting ambiguous.
6. **Dependency migration:** multiple overlapping UI/carousel layers increase the upgrade surface. Next and its ESLint config versions should be aligned; the `next lint` script must be replaced if migrating to a Next release that removes it. Select the supported current releases using primary documentation and peer-dependency checks at implementation time; this audit does not claim latest versions or vulnerability status.

### M1 update (2026-09-29)

- Fixed: item 2 (the two case-mismatched icons), the invalid `/src/app/logo.ico` link from item 4, and item 6's Next/ESLint alignment (Next 16.3.7 with the ESLint CLI).
- Found and fixed while adding Linux smoke tests: React hydration error #418 on `/`, `/broadband`, `/broadband-old` and `/wEnergy` in production (MUI `Typography` `<p>` nested in `<p>`), and MUI/Emotion styles emitted inline in `<body>`. Both reproduced on the pre-M1 build first.
- The page files moved to `src/app/(public)/…`; URLs are unchanged and covered by `tests/e2e/public-routes.spec.ts`.
- Still open for M2/M5: the root description text, the conversion event fired on every home visit, contact validation (item 3) and the `/SoonContent` decision.

## Asset inventory and media rules

- `public` contains 157 files, totaling 16,715,613 bytes (about 16.7 MB): 101 WebP, 36 PNG, 13 SVG, 5 JPG, 1 TSX source file and 1 executable.
- `src/assets/promoteProduct` contains an additional 17 tracked image files totaling 26,331,751 bytes (about 26.3 MB), including the three active announcement source images. Include this source-asset directory in the migration inventory; it is not part of the `public` count.
- Product and brand assets live in `assets/HomeInternet`, `assets/tol-ico`, `assets/PackagePlan`, `assets/packages`, `assets/packagesMobileScreen`, `assets/topup`, `assets/monthy`, `assets/solar`, and related directories. Graphic/lifestyle assets also appear under `assets/imgAiPromote`, `backgrounds`, and `mascot`.
- `public/assets/etc/UltraViewer_setup_6.6.113_en.exe` is 3,649,024 bytes and is publicly addressable. Retention/removal needs an explicit product decision; it was not deleted.
- Existing genuine product photography, True/W&W logos, provider banners and benefit logos must be preserved or replaced by owner-authorized source assets. Higgsfield generation is for supporting decorative graphics/video only, as the user requested.
- Future media records should distinguish product/brand assets from generated support graphics, with alt text, mobile crops, dimensions, provenance, usage locations, and publication state.

## Proposed route and file map for the rebuild

This is a planning proposal, not implemented functionality. All existing public URLs above should remain functional or receive individually approved permanent redirects.

| Area | Proposed files/routes | Reason |
| --- | --- | --- |
| Public site | `src/app/(site)/layout.tsx`; existing page URL folders inside `(site)` | Shared navigation/footer and server-rendered published content; route group preserves public URLs. |
| Shared page rendering | `src/features/content/renderer/PageRenderer.tsx`; `sections/*`; `schema/*` | Both public pages and admin preview use the same components and content schema so mirror preview matches the real page. |
| Theme and site settings | `src/features/content/site-settings/*`; `src/styles/tokens.css` | Editable brand colors, contact channels, menu, background selection, typography and common CTAs within defined design constraints. |
| Product catalog | `src/features/catalog/*`; optional approved package detail routes | Structured verified packages, categories, prices, units, VAT, availability, conditions and CTA destinations. |
| Admin shell/auth | `/admin/login`; protected `/admin`; `src/features/auth/*`; `src/lib/supabase/*` | Supabase sessions, invitation/role policy and route/data access controls. |
| Mirror editing | `/admin/editor/[pageId]`; `src/features/editor/*` | Select text/image/button/background on real page preview; edit mode, instant draft preview, desktop/mobile view, save/publish and revision restore. |
| Admin content/media | `/admin/packages`; `/admin/media`; `/admin/navigation`; `/admin/settings` | Complete structured content and assets management when inline selection is insufficient. |
| Leads | `/admin/leads`; `src/features/leads/*`; validated `/api/contact` | Persist enquiries, source package/page, assignment, progress and delivery outcome. |
| Analytics/reports | `/admin/analytics`; `/admin/reports`; `src/features/analytics/*` | GA4 reporting plus correctly defined contact-click and form-submit events; human-readable funnels and date filters. |
| Search and SEO | `src/app/sitemap.ts`; `src/app/robots.ts`; `src/features/seo/*` | Per-page metadata, preserved URLs, canonical map, OG and appropriate structured data. |
| Data operations | `supabase/migrations/*`; `scripts/migrate-content.*`; import validation | RLS policies, content versions, structured migration from current TS data, validation and rollback. |

Mirror editing acceptance: the admin first sees the same page as visitors; entering edit mode exposes selectable content; modifying a field immediately updates the draft preview; save/publish behavior is explicit; drafts are not visible to visitors before publication; revision restore reproduces the prior published page. “Every variable editable” should mean all content and approved presentation controls, with validation and shared rendering, rather than unrestricted executable code.

## Evidence still needed before implementation/release

- Chosen MotionSites visual reference and confirmation of brand/solar scope, package source of truth, contact destinations and editing/publishing workflow.
- Target Supabase project, hosting/deployment ownership, authenticated admin roles and required external system integration with the existing management site.
- GA4 property/reporting credentials and approved contact conversion definitions; real Google Ads ownership and existing conversion expectations.
- Verified current packages, imagery rights and commercial/legal wording; no credentials should be stored in this documentation.
- Baseline production URL/index inventory, backups and deployment configuration. Git history references a prior Vercel-origin security PR, but that alone does not verify current hosting or deployment access.
- After approved implementation: actual build/type/lint checks, mobile and keyboard accessibility review, edit/save/publish/restore verification, auth/RLS isolation, enquiry delivery, GA4 reporting and deployment smoke evidence.

## Appendix: router / TV box references for proposed 3D hero

Read-only follow-up inventory on 2026-09-29. Two local images were visually inspected: `Router.png` and the new-customer `ico-trueid-tv.webp`. Dimensions and transparency below were read from the image files. No images, videos, meshes, application code or dependencies were created or changed for this inventory.

| Actual local reference | Dimensions / alpha | Identification and confidence |
| --- | --- | --- |
| `public/assets/tol-ico/Router.png` | 200×200 PNG, RGBA with transparent pixels; 14,302 bytes | Visually shows a pair of white devices with external antennas and baked-in red “Router 2 ตัว” copy. High confidence that this is a router reference; exact manufacturer/model cannot be established from this small image or current source copy. |
| `public/assets/HomeInternet/newCustomer/ico-trueid-tv.webp` | 124×124 WebP, RGBA with transparent pixels; 2,916 bytes | Visually shows a black TrueID TV set-top box and handheld remote. High confidence device category; exact generation/model is unverified. This is a TV box, not a home internet router. |
| `public/assets/HomeInternet/oldcustomer/ico-trueid-tv.webp` | 124×124 WebP, RGBA with transparent pixels; 2,916 bytes | Byte-identical to the new-customer TV-box icon, verified by SHA-256. |
| `public/assets/HomeInternet/oldcustomer/TrueIDTV_pro.webp` | 500×500 WebP, RGB without alpha; 35,080 bytes | Associated in source with “TrueID TV + TrueID Package” (`src/datas/Boardband/Boardband-old.data.ts:84-91`). Category established from source; this larger promotional image was not visually inspected in this follow-up. |

- The router icon is used in the 799-baht / 1Gbps / 24-month package record (`src/datas/home/WifiHome.data.ts:176-186`). That record supplies no manufacturer, device SKU, antenna specification, Wi-Fi generation or dimensions; blank benefit titles provide no additional model identification.
- Searching `src/datas` and component copy found no identified router manufacturer/model. Huawei text belongs to solar inverters, so it must not be used to identify the router.
- Unlabelled benefit icons (`public/assets/tol-ico/tol-icon-1.png` through `tol-icon-5.png`) are 106×106 transparent PNGs. `image 352.png` is 49×49 and `image 354.png` is 141×136. Their blank source titles and filenames do not establish hardware identity; they were not visually inspected.
- Larger existing banner candidates are `public/assets/HomeInternet/Desktops/BannerHomeInternet1.webp` (3840×1236 RGB) and `public/assets/HomeInternet/newCustomer/truebanner.webp` (2256×848 RGB). These dimensions are verified, but this follow-up does not claim they contain an identifiable router.
- No `.glb`, `.gltf`, `.obj`, `.fbx`, `.stl`, `.usd`, `.usdz` or `.blend` asset was found in the repository outside dependency/Git/build directories. `src/assets` contains the previously inventoried promotional images rather than 3D models.
- Current local router imagery is sufficient to establish a broad white antenna-router composition, but cannot establish an accurate, high-detail True hardware model. Choose/confirm the actual router model and obtain adequate product reference views before a faithful 3D reconstruction. Keep the TrueID TV box and router as separate products in content and model selection.
