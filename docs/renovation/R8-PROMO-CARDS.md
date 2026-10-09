# R8 — The promo cards

Date: 2026-10-09. Branch `feat/promo-cards`, on top of `feat/catalog-admin` (R7).

The owner asked for better-looking promo cards and was shown three directions on real packages (`design/cards/proposals.html`): A, a slip led by the figure; B, a picture plate; C, one row per package. The owner chose **A and B together**, as recommended: B on the home page, where a recommended package always has a picture, and A on the package pages, where 77 of the 99 packages have none. Then one change to it, with a reference from another True reseller's site: **what comes with a package is shown with its picture**, not as a word on a chip, "like this, but fitting the site and better looking".

Nothing about a package's facts changed: every price, speed, term and benefit on a card is the catalog's own, and the note that prices are to be confirmed stays where it was.

## 1. Benefits with their pictures

Every benefit already had a picture (`Benefit.icon`, chosen in Packages and promos → สิทธิประโยชน์), some a product photo, some a logo, some a small icon, of different shapes. `BenefitList` (`src/components/site/PackageCompare.tsx`, styles under `.tm-benefits` in `src/app/globals.css`) puts each in a white tile of one size with a hairline edge, so they line up whatever their shape, with the name beside it. The tile is white in any tone, because the logos are drawn for white.

On the home page's cards, where the height is the screen's, the list is `dense`: the tiles alone in a row, the first four, then a count of the rest. Every name is still in the page for a screen reader (the list is labelled, the names are visually hidden), so nothing is told by picture alone.

## 2. Package pages: the slip (A)

`PackageCompare` keeps its job (cards whose fields share row lines through CSS subgrid, the filters, the comparison, a page per package) and its two sizes (`compare`, `compact`); the card became a slip (`.tm-slip`):

- **The figure leads**: the speed in light numerals with a red meter under it (its share of the fastest package in that list), or, for a package that is not a speed, what it includes as the card's lead line.
- **Recommended**: a package recommended on the home page (R7) carries a red dot and "แนะนำ" (`ui.recommended`, a new string, so `CONTENT_SCHEMA_VERSION` is 9).
- **The name**, with the package's own picture small beside it when it has one. A card never waits for a picture: before this, one package with a picture left a blank square on every other card of its list.
- **Ruled lines**: the term (label left, value right), the benefits with their pictures, details, conditions, the code to dial.
- **The stub**, under a perforation: the price in red, the button, "compare" and "details". On a row of cards the perforations line up.

Red stays rationed: the price, the meter, the dot.

## 3. The home page: the picture plate (B)

`PackageCard` in `Landing.tsx`, styles in `src/styles/landing.css`.

- What the package gives sits **over the foot of its picture**, on a shade that belongs to the picture: the speed as a figure, or the allowance as a phrase of two lines at most. It was a small chip in the corner (speed) or a grey line under the name (allowance).
- **A row of benefit pictures** between the term and the price.
- The pinned stage still fits one screen at every size (`node scripts/media/stage-sizes.mjs rail`): the picture is what gives way. On a short phone (narrower than 768px and lower than 700px) the row of benefit pictures is left out and the picture keeps 52px, enough for the figure over it.

The card in the back office that previews what visitors get (`PackageForm.tsx`) follows.

## 4. Not done, on purpose

- **A tag with a package's end day** ("until 31 Oct") was in the proposals as an example. The owner was asked and has not answered, so it is not shown: a package with an end day simply goes on that day.
- **Direction C** (a row per package) is not built.
- Filter chips by group, which the reference site has above its cards, are not added; the page's jump links and filters stand.

## 5. Checks

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and the browser suites; the results are in the pull request. New in the suites: a card leads with what the package gives, marks only the recommended, has its price on the stub and shows every benefit with a picture that loaded (`package-pages.spec.ts`); a home card shows the figure over its picture and a picture for each benefit, each named for a screen reader (`home-landing.spec.ts`). The accessibility suite runs axe over the pages with the new cards.

Looked at in screenshots of the dev server: `/broadband`, `/monthy`, `/topup`, `/broadband-old` and `/wEnergy` at 1440 and 390 wide, and the home page's rail at nine screen sizes.

Not checked: a real phone.

## 6. Left open

- Most broadband packages for new customers are recommended (6 of 7), so the mark says little on that page. Which packages are recommended is the owner's to set in Packages and promos.
- Some benefit pictures are small originals from the old site (106 pixels square). They are sharp at the size shown; larger ones can be uploaded in Packages and promos → สิทธิประโยชน์.
- One publish is needed after the deploy, as for R7 (the schema version changed again).
