# R20: the old domains move here, and the page for Ubon Ratchathani

12 November 2026, on the owner's word.

## The old domains

The company had two older sites that were still live and indexed: `telemartubon.com` (the repository `telemartUbon`) and `truetechservice.com` (the repository `true-tech-service`). Google listed them for searches of the company's name and for "เน็ตบ้านทรู อุบล", and listed this site for neither. The owner's earlier word (11 October) was to leave the old domain to expire without a redirect; on 12 November the owner reversed it.

- Every path of both domains now answers 308 to the matching page of `www.truegetherth.com` (`next.config.ts` of each repository). `telemartubon.com` shared this site's URLs, so the path is kept; on `truetechservice.com`, `/home` goes to `/`, `/boardband` to `/broadband`, `/monthly` to `/monthy` and `/about` to `/service`.
- `/google*.html` is not redirected: Google's ownership file (the same one this site has) is in both repositories, and both domains are verified in Search Console in the owner's account.
- The change of address to `www.truegetherth.com` was filed and accepted for `telemartubon.com`. For `truetechservice.com` Search Console refused it four times ("could not fetch the page") although its own live test of that home page passed; it is not filed. Not known why.
- Not changed: Vercel and DNS settings of any project. `truetechservice.com` without `www` still answers 307 (temporary) to `www`, which is a setting of that Vercel project.

## The page `/ubon`

A search for True home internet in Ubon Ratchathani had nothing to land on: the town was named only in the footer. `/ubon` (`/en/ubon`) is that page: the head office with its postal address, hours and map, and four questions. It says only what the site already said elsewhere (who runs the site, that an address is checked before anything is confirmed, that requests come from every province). It does not name the districts the team installs in, an installation time, or a customer: the owner has not given those, and they are the page's next content.

- The address is `site.contact.address` (street, subdistrict, district, province, postcode), as the owner gave it. With it, the business in every page's structured data is a `LocalBusiness` with a full `PostalAddress` and a telephone number; without it, the `Organization` of before. No coordinates and no opening hours in machine form: the content has neither.
- The page is the document `page:ubon` (`localPage` in the schema, `src/content/pages/local.ts`, `LocalPageView.tsx`), editable in the Mirror editor like the others. The footer's Help group links to it.
- `address` and `pages.ubon` are optional, so the schema version stays at 10 and a release published before them still reads; `published.ts` gives such a release the repository's address and page.
- It is one page for the one town the office is in. Pages for other provinces or districts are not to be made from this one by changing the name: Google treats those as doorway pages.

## The provinces and the map position (later the same day)

The owner said the team looks after Si Sa Ket and Amnat Charoen as well as Ubon Ratchathani, and confirmed that the pin of `mapUrl` is the company's.

- `pages.ubon.serviceArea` (optional): a section of `/ubon` that lists the three provinces, a question about the two others, and the same three as `areaServed` of the business after the whole country. The page's title and heading still name Ubon Ratchathani only, and there is still one page: no page for each province.
- `site.contact.geo` (optional): the pin's latitude and longitude, given to search engines as `GeoCoordinates`.
- Still the owner's to add: districts, an installation time, customers.

## Checked

`npm run lint`, `npm run typecheck`, `npm test` (198), `npm run build`; `tests/e2e/local-page.spec.ts` reads the page without scripts in both languages.
