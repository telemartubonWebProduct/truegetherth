import { benefitIn, packageHomeIn } from "@/lib/content/lookup";
import { shownBenefits } from "@/lib/content/package-facts";
import { formatNumber } from "@/lib/content/render";
import type { CatalogPackage, LocalizedText, Seo, SiteContent } from "@/lib/content/schema";
import { locales, type Locale } from "@/lib/i18n/locales";

// What search results show for a package's own page (docs/renovation/R13-SEARCH-AND-PARTNER.md).
// A package's name is often a campaign's ("แพ็กเกจเน็ตบ้านสุดคุ้ม", "M Pack 5 kWp")
// and says neither the service nor its speed, which is what people search
// for. So the title adds the speed when the name does not give it, and the
// page that lists the package (its heading names the service); the
// description gives the facts the page leads with, in the page's own words.
// The price is where it was before (the description), followed by the line
// that the team confirms before anyone signs up.

/** How many benefits the description names; the page lists them all. */
const BENEFITS_NAMED = 3;

/** "500/500 Mbps", "1 Gbps/500 Mbps": the figures the package's page leads with. */
export function speedLabel({ download, upload }: NonNullable<CatalogPackage["speed"]>, locale: Locale): string {
  const value = (figure: number) => formatNumber(figure, locale);
  return download.unit === upload.unit
    ? `${value(download.value)}/${value(upload.value)} ${upload.unit}`
    : `${value(download.value)} ${download.unit}/${value(upload.value)} ${upload.unit}`;
}

/** Whether a package's name already gives its speed ("…PRO AI 1Gbps", "เพิ่มสปีด 1000/500 Mbps"). */
export function nameGivesSpeed(name: string, speed: NonNullable<CatalogPackage["speed"]>): boolean {
  const plain = name.toLowerCase().replace(/\s+/g, "");
  const { download, upload } = speed;
  return plain.includes(`${download.value}${download.unit.toLowerCase()}`) || plain.includes(`${download.value}/${upload.value}`);
}

function inEach(build: (locale: Locale) => string): LocalizedText {
  return Object.fromEntries(locales.map((locale) => [locale, build(locale)])) as LocalizedText;
}

/** What a package gives and costs, in the page's words: speed, data, term, price, the first benefits, the code to dial. */
export function packageFactLines(content: SiteContent, item: CatalogPackage, locale: Locale): string[] {
  const { ui } = content.site;
  const { price } = item;
  const unit = (price.per === "month" ? ui.perMonth : ui.baht)[locale];
  const vat = price.vat === "excluded" ? ui.vatExcluded[locale] : price.vat === "included" ? ui.vatIncluded[locale] : null;
  const benefits = shownBenefits(item)
    .slice(0, BENEFITS_NAMED)
    .map((id) => benefitIn(content, id).label[locale]);
  return [
    item.speed ? speedLabel(item.speed, locale) : null,
    item.allowance?.[locale],
    item.validity ? `${ui.validity[locale]} ${item.validity[locale]}` : null,
    item.contract ? `${ui.contract[locale]} ${item.contract[locale]}` : null,
    `${formatNumber(price.amount, locale)} ${unit}${vat ? ` (${vat})` : ""}`,
    price.regularAmount !== undefined ? `${ui.regularPrice[locale]} ${formatNumber(price.regularAmount, locale)} ${ui.baht[locale]}` : null,
    benefits.length > 0 ? `${ui.benefits[locale]}: ${benefits.join(", ")}` : null,
    item.dialCode ? `${ui.dialCode[locale]} ${item.dialCode}` : null,
  ].filter((line): line is string => Boolean(line));
}

export function packageSeo(content: SiteContent, item: CatalogPackage): Seo {
  const { ui } = content.site;
  const home = packageHomeIn(content, item);

  const title = inEach((locale) => {
    const name = item.name[locale];
    const figures = item.speed && !nameGivesSpeed(name, item.speed) ? ` ${speedLabel(item.speed, locale)}` : "";
    return `${name}${figures}${home ? ` – ${home.pageTitle[locale]}` : ""}`;
  });

  const description = inEach((locale) =>
    [item.name[locale], ...(home ? [home.pageTitle[locale]] : []), ...packageFactLines(content, item, locale), ui.packageContactNote[locale]].join(" · "),
  );

  // Its own picture, when it has one, is what a shared link shows.
  return { title, description, ...(item.image ? { image: item.image } : {}) };
}
