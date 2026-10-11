# R9 — One domain, search data, speed on phones, and what an Ads conversion is

Date: 2026-10-11. Branch `feat/promo-cards` (the same pull request as R7 and R8).

The owner asked for the site to be looked at as a whole (theme, speed on desktop and phone, search, cheap advertising), then said: the main domain is truegetherth.com and telemartubon.com is no longer used; say on the site that Telemart is True's official partner and not True itself, for when Google checks the business; take the company's details from its other site (truefiberhome.com); and do everything on the list. This is what was done and what was not.

## 1. One domain

`siteUrl()` (`src/lib/seo/metadata.ts`) fell back to `https://www.telemartubon.com`. Production has no `NEXT_PUBLIC_SITE_URL`, so on truegetherth.com every canonical address, the language alternates, the share card, `robots.txt` and the sitemap named the old domain, which still serves the old site: two sites telling Google the same pages are the other's. The same host decided where Google Analytics and the Ads conversion count, so neither ran on truegetherth.com at all. The fallback is now `https://www.truegetherth.com`.

The redirect is in `next.config.ts`: any address on telemartubon.com or www.telemartubon.com goes permanently to the same address on `https://www.truegetherth.com`, so what the old domain has earned in search moves over. It takes effect once those two domains are attached to this Vercel project (they belong to the former site's project now), which is done in Vercel; then Search Console for truegetherth.com with its sitemap. In Supabase Auth, Site URL and Redirect URLs must name truegetherth.com for the back office's e-mails (`M6-LAUNCH.md` still lists the old domain).

## 2. Who runs the site

The footer of every page, section 4 of the terms and the structured data say: truegetherth is run by Telemart Communication Co., Ltd., an officially appointed partner and Authorized Dealer of True; it is not the main website of True Corporation Public Company Limited, and Telemart is not the network operator. "Official partner" is the owner's word (2026-10-11); "Authorized Dealer" and "not the main website of True Corporation" are how the company's other site words it. Neither was checked against a document from True.

From the same site (read 2026-10-11): the head office is in Ubon Ratchathani, with a map link, and the team answers Monday to Saturday, 9:00 to 18:00. These are new contact fields (`site.contact.office`, `mapUrl`, `hours`), shown in the footer. No street address is published there, so none is here.

The phone numbers, the LINE links and ID, the e-mail address and the Facebook page were at first left as they were. Later the same day the owner said that this site follows the other one, so they are now the ones truefiberhome.com shows: 063-927-4977 and 063-923-4798, telemartcommu@gmail.com, LINE ID @truefiberhome. That site uses two LINE links, and so does this one: package buttons open `lineSales` (lin.ee/vWV2aFT, which leads to the same LINE account this site's package buttons opened before), and every other LINE button opens `lineService` (lin.ee/V4hnwC4), the account of the ID and the QR picture shown. The QR picture was made from that link and read back. Whether "@truefiberhome" resolves as a LINE ID by itself was not established; the links are the ones the other site uses.

The owner also said to forget the site's former name and domain: its domain is redirected (see §1), the code and the project notes no longer name it, and a 3.6 MB remote-desktop installer and the former LINE QR, both left in `public/assets/etc` from that site and used by nothing, were removed (an executable on a site that advertises is something Google's reviewers act on).

## 3. Structured data

`src/lib/seo/structured-data.ts`, JSON-LD, read from the content so it says what the pages say:

- every page: the organization (trading and legal name, the dealer statement, phones in international form, e-mail, head office, hours, Facebook and LINE) and the website;
- the home page: its questions and answers;
- every other page and every package page: its place under the home page (breadcrumb).

No price is given: package prices are imported and not verified. Product and offer data can follow once they are.

The home page's main heading now names what is sold: "เลือกเน็ตบ้านทรูที่เหมาะ กับทุกวันของคุณ". The share picture is the painting with the logo (`public/media/og-image-v2.png`, from `scripts/brand/logo.mjs`); it was the 3D router of the hero before last.

## 4. Speed on phones

Measured with Lighthouse 12 on this machine against the production build (`.claude/launch.json` has `truegetherth-start`, port 3210), phone profile. Google's PageSpeed service was over its daily quota, and a preview deployment is behind Vercel's sign-in, so there are no numbers from Google's own machines; expect them to differ. Two ways of slowing the phone down were used: Lighthouse's estimate, and the slow network and processor really applied. Accessibility, best practices and SEO were 100 on every page in every run.

| Page, phone | Before | After (estimated) | After (applied) |
| --- | --- | --- | --- |
| Home | 79 | 85 to 88 | 86 |
| /broadband | 93 | 97 | 98 |
| /monthy | 89 | 93 | 96 |

Desktop: home 98 before, 99 after; /broadband 100. The live site, which is still the version of 4 October, measured 51 on the home page (phone) from here.

What changed:

- **The headline is in the first paint.** The opening's entrance was run by script: navigation, picture and words started invisible and appeared once the scripts had loaded. It is CSS now (`landing.css`, under `data-motion`), and the headline is not part of it.
- **The largest layer of the painting is asked for with the page.** The sky fills the screen, which a browser takes for a background, so it times the layer that covers most of the picture instead; lazily loaded, that one was found last. `Hero.tsx` preloads it for the arrangement the screen will show. Measured on the live site after the first deploy, that layer on a phone was the cloud bank, not the goddess as first assumed; the choice now goes by the area that shows.
- **The cookie banner is in the page's HTML.** It appeared after the scripts, and on a page of small text it was the largest thing painted. For a visitor who has already chosen, a script in the head marks the document before first paint and CSS keeps the banner out of sight.
- **The call-back form no longer brings the validation library** (83 kB compressed, on every page with the form). The browser's checks are plain code (`src/lib/leads/fields.ts`); the server decides with the schema as before, and a unit test holds the two to the same answers.
- Phones take the smaller file of each figure, and the logo is asked for at the size it shows (it was asked for at 3840 pixels wide).

Tried and left off: `experimental.inlineCss`. It brought the first paint 0.1 s forward and added 200 to 370 ms of blocked main thread on every page measured.

What keeps the home page under 90 on a slow phone: it is a long page (five stages, twenty cards in four tabs, two arrangements of the painting), so its first layout and React's start-up take about a second on a processor slowed four times. Getting further means rendering less at first (the tabs that are not open, the arrangement that is not shown), which is a change to how the page is built, not a setting.

## 5. What an Ads conversion is

It was every opening of the home page, as on the old site, and only on the old domain. Now it is a visitor asking to be contacted: a sent call-back form, or a click on LINE or on a phone number, each one conversion (`trackLeadConversion` in `src/lib/analytics/tags.ts`); on the production domain only, and only after the visitor agreed to advertising cookies. The setting is renamed `googleAdsLeadConversion` and uses the same conversion action of the account as before. E-mail and Facebook clicks stay Analytics events.

In the Google Ads account, for the owner: the action's category should be a lead, counting one per click; a separate action for each kind (form, LINE, call) would let bids tell them apart, and needs its own label from the account.

## 6. Content schema

`CONTENT_SCHEMA_VERSION` is 10: the contact details gained the head office, its map and the hours, and the conversion setting was renamed.

## 7. Not done

- **Pages written for particular searches** (a province, checking coverage, moving from another provider, this month's offers). Each needs facts that are true and specific; pages made of one template with the place name changed are what search engines call doorway pages. The owner's material is needed first.
- **An About page.** The footer, the terms and the structured data carry the statement; a page of its own would help when Google reviews the business.
- **The theme between the home page and the rest.** The painting is on the home page only; the package pages are black on white, and the photographs on the home page's cards are not in the painting's manner. Bringing a figure of the painting to each category's page, and new card pictures, need pictures from the owner.
- **In the accounts**: the redirect of the old domain, Search Console, a Google Business Profile, the conversion action's settings, negative keywords and campaign structure.
- The name "truegetherth" contains "true". Whether True's agreement with a partner allows that in a name and a domain is for the owner to confirm with True; Google's reviewers look at it too.

## 7b. The live site after the deploy (2026-10-11)

Pull request 4 was merged and deployed. Lighthouse from this machine against https://www.truegetherth.com, phone profile: home 84 (it was 51), /broadband 99, /monthy 100; desktop home 99, /broadband 100; SEO, accessibility and best practices 100 on each. The read-only smoke suite against production: 51 passed, 1 passed on a second try (the first request to every package page, just after the deploy, took longer than the test allows).

## 8. Checks

`npm run lint`, `npm run typecheck`, `npm test` (177), `npm run build`. The browser suites against the production build: 181 passed, 68 skipped (the ones that need the database). The back-office, call-back form, conversion and consent suites against the local Supabase stack: 79 passed, 3 skipped, 1 failed, 4 did not run; the failure is the password-recovery test, which fails on this machine only (the local stack mails links to port 3000, where another app runs), and the four that did not run follow it in the same file. New or changed: `tests/unit/seo.test.ts` (the domain, the organization's data, breadcrumbs, no price), the parity of the form's two validations in `tests/unit/leads.test.ts`, `tests/e2e/ads-conversion.spec.ts` (no conversion for opening a page; one for LINE, one for a call, none for e-mail or Facebook; none on another host; nothing at all without advertising cookies), and in `tests/e2e/leads.spec.ts` a stored request is one conversion.
