# R13 — Search results, AI answers, and the True Online partner badge

Date: 2026-11-03. Branch `feat/seo-partner-badge`.

The owner asked, before running ads, for the code to be reviewed and fixed so that the site is found by search engines and its answers are taken up by AI assistants (Gemini and the like) with the site named. During the work the owner added: put True's logo on the site with "Authorized Partner by Telemart" written under it, beside our logo in the top bar on computers and tablets and in the footer on every screen (the owner chose this of three placements offered), and say in the privacy document and elsewhere that we are a partner of True Online. This is what was found and done.

## 1. The live site as found

Read from https://www.truegetherth.com on 2026-11-03:

- `robots.txt` lets every crawler in except `/admin`, `/auth`, `/api`, and names the sitemap. The sitemap lists 178 addresses (9 pages and 80 package pages, each in both languages) with their language alternates. Every page has its canonical address, `hreflang` for Thai, English and x-default, one `h1`, and JSON-LD (the organization and the website everywhere; the questions on the home page; the breadcrumb elsewhere). An unknown address is a 404 with `noindex`. `http://` and the bare domain reach `https://www.` in two permanent redirects (Vercel's own).
- Googlebot, Bingbot and the AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-SearchBot) all get the pages (200); nothing in Vercel blocks them.
- **Bing knows the home page only**: it is found for "truegetherth", and `site:truegetherth.com` returns nothing of the site. Bing's index is what Copilot uses, and much of ChatGPT's web search.
- Google's own search answered with its check for robots, so what Google has indexed was not read; Search Console (the owner's account) shows it.
- **The package pages were the weakest**: a page's title was the package's name alone, which is often a campaign's ("M Pack 5 kWp" says nothing of solar; "แพ็กเกจเน็ตบ้านสุดคุ้ม" says neither True nor its speed), and its description was the name and the price.
- On Bing, "สมัครเน็ตบ้านทรู" brings True's own pages and then a row of other dealers' sites, whose titles use สมัคร, ติด, โปร, เช็คพื้นที่ and ราคา. Ours used none of them.

## 2. Package pages

`src/lib/seo/package-seo.ts` makes each package page's title and description from the package (`package-route.tsx` uses it):

- the title is the name, then the speed when the name does not already give it, then the heading of the page that lists the package: "แพ็กเกจเน็ตบ้านสุดคุ้ม 500/500 Mbps – เน็ตบ้านทรูไฟเบอร์ สำหรับลูกค้าใหม่", "M Pack 5 kWp – บริการติดตั้งโซลาร์เซลล์";
- the description gives what the page leads with, in the page's words: speed, data, validity, contract, price (with its VAT line and regular price), the first three benefits, the code to dial, and the page's line that the team checks the area and confirms;
- a package with a picture of its own is shown with it when its page is shared.

The price is where it was before (the description) and no price was added to the structured data: package prices are imported and not verified (R9, section 3).

### Benefit-choice qualifications (11 November 2026)

New-customer broadband descriptions now include the package's existing localized conditions immediately before the named benefits, when there are visible benefits. The 500 Mbps package previously named multiple options without its “choose one” condition in the meta, Open Graph and Twitter descriptions, despite that condition being visible on the detail page. These descriptions and the Thai package facts in `/llms.txt` share `packageFactLines`, so both now retain the qualification. Hidden benefits still come only from `shownBenefits`; when all are hidden no benefit-choice line is advertised. Other categories, titles, price/VAT, confirmation wording, package facts and visible layout are unchanged.

This corrects an omitted offer qualification, rather than testing a new keyword/title hypothesis. [Google's snippet guidance](https://developers.google.com/search/docs/appearance/snippet) explains that Search may generate a different snippet or truncate the supplied description; release verification does not prove the displayed Google snippet or rankings changed. Tests cover both languages, hidden benefits and the rendered meta/share descriptions.

## 3. The pages' titles and descriptions

Worded as people search, in `src/content` (and so editable in the Mirror editor): the home page "สมัครเน็ตบ้านทรูออนไลน์ เน็ตมือถือ และโซลาร์เซลล์", new customers "โปรเน็ตบ้านทรูไฟเบอร์ สำหรับลูกค้าใหม่", current customers "เพิ่มสปีดเน็ตบ้านทรูออนไลน์ สำหรับลูกค้าปัจจุบัน", mobile "แพ็กเสริมทรูรายเดือน" and "แพ็กเสริมทรูเติมเงิน" (their dial codes are True's, `*900*`), solar "ติดตั้งโซลาร์เซลล์บนหลังคา โดย W&W Energy", contact "ติดต่อเจ้าหน้าที่ truegetherth", applying "สมัครเน็ตบ้านทรูผ่านเจ้าหน้าที่". Several descriptions now say who takes the application. The headings on the pages are unchanged.

These reach visitors because production shows the content in `src/content`: on 2026-11-03 the dev project had no published release (and two unpublished package drafts, `fiber-500-499` and `fiber-700-599`, of 12 October). Once a release is published, it is what visitors see.

## 4. `/llms.txt`

`src/app/llms.txt/route.ts` serves the site as one plain Markdown file for AI assistants and answer engines (the convention of llmstxt.org), made by `src/lib/seo/llms.ts` from the published content: who runs the site (the footer's statement, in Thai and English), every page with its description and English address, every package visitors may see under the page that lists it, with its facts and price after the line that prices are to be confirmed with the team, the home page's questions and answers, and every way to reach the team. It is made again at most every hour and on each publish, so packages come and go on their days. Google says its AI answers need no such file; other assistants read it.

## 5. Telling Bing: IndexNow

`public/78044193b3b9a5759dfd01ac4535ff1e.txt` is the site's IndexNow key (its name and its content; not a secret). After a deploy that adds or changes pages, or a publish that changes packages, `node scripts/seo/indexnow.mjs` submits every address of the live sitemap to Bing and the other IndexNow engines (`--dry-run` lists them). The key file must be live first, so the first submission waits for this branch to be deployed. The end-to-end suite checks that the file is served.

## 6. The partner badge and the statement

- **The badge** is `site.brand.partnerLogo` (the media `true-online-logo`: the owner's True Online file, `public/assets/wEnergy/trueonline.png`, never a drawn one) and `site.brand.partnerLabel` ("Authorized Partner by Telemart", the owner's words, in both languages). Both are optional, so every draft and release of version 10 still reads and the version stays 10 (as with `hiddenBenefits`); without a logo there is no badge.
- **In the top bar** (`Navbar.tsx`, `.nav-partner` in `landing.css`) it is a white pill of its own beside the logo, so True's mark never reads as part of ours, from 768px wide. A phone's bar has no room for it (its picture is lazy and hidden there, so a phone does not fetch it). Between 768 and 1023px the short links beside the menu give way to it (they are the menu's own). On the home page they give way up to 1535px: on a wide, short screen the painting's router, with True Online's mark, stands at the top near the middle (1280×720: x 606–709, y 7–29), where the badge would push them; `home-landing.spec.ts` now counts the badge among the pills that must stay clear of that mark.
- **In the footer** (`SiteFooter.tsx`) it is a white tile under the statement of who runs the site, on every screen.
- **The statement** now says that Telemart is an officially appointed partner of True Online (Authorized Partner) and an Authorized Dealer of True, and still that the site is not True's own and Telemart is not the network operator: in the footer (and so the organization's structured data), at the top of the terms and privacy page and in its section 4, in a new home-page question "truegetherth เป็นเว็บไซต์ของทรูหรือไม่", and in the descriptions of the home, new-customer and applying pages. A second new question gives the hours and the head office. The partnership is the owner's word; it was not checked against a document from True, nor whether True's terms for partners allow its logo beside this line.

## 6b. One LINE account and one Facebook page with the ads

The business advertises on the Facebook page **True Telemart** (`https://www.facebook.com/profile.php?id=61571963492436`, "True Telemart | Ubon Ratchathani"), whose cover and chat replies give LINE @594wrbvr. The site gave LINE @truefiberhome and linked to an older page (7 followers, last post April 2024), so a customer moving between an ad, the page and the site met two LINE accounts, and search engines met two pages for one business. On the owner's word (2026-11-03) the site now follows the page it advertises on: every LINE button opens `https://lin.ee/Tfnxc7q` (it redirects to `line.me/R/ti/p/@594wrbvr`, checked), the LINE ID shown is @594wrbvr, the QR picture is a new file made from that link and read back (`public/assets/etc/line-qr-594wrbvr.webp`; the old one is removed), and the Facebook link is True Telemart. The organization's structured data and `/llms.txt` follow, since they read the same contact details. The phone numbers and e-mail are unchanged; the page's own "About" still shows another number and e-mail, which is for the page, not the site.

## 7. Also

`tsconfig.json` and `eslint.config.mjs` leave out `.claude/`: Claude sessions make worktrees of other branches there (git already ignores them), and the checks here read their files.

## 8. Not done, for the owner

- **Bing Webmaster Tools**: add the site (it can import the property from Search Console) and submit the sitemap; then run the IndexNow script once.
- **Search Console**: read the Pages report (what is indexed and why not), and ask for indexing of the home page, `/broadband` and the most important package pages after the deploy.
- **Google Business Profile** for the head office in Ubon Ratchathani (needs the address and Google's verification).
- **Prices in search results**: once the business confirms prices (a package's review status "verified" in the back office), Product and Offer data for those packages can show the price in Google's results.
- **More to answer**: an About page, and questions on each category page (the documents to apply, how long installation takes, how the area is checked). They need the owner's facts.
- **Privacy**: if an application passes the customer's details to True for installation, the privacy text should say so; for the owner and a legal adviser.

## 9. Checks

See the pull request.
