import { benefitOptions, packageDetailPath, packageFacts, priceLimits, speedOptions } from "@/lib/content/package-facts";
import { formatNumber, resolveLink } from "@/lib/content/render";
import type { CatalogPackage, Cta } from "@/lib/content/schema";
import { localizePath } from "@/lib/i18n/locales";

import type { RenderContext } from "../context";
import { speedText } from "../PackageCompare";
import type { CompareEntry, ExplorerLabels, Option } from "./PackageExplorer";

/** "500 Mbps", "1 Gbps", "1.5 Gbps" for a download speed in Mbps. */
function speedLabel(mbps: number, ctx: RenderContext): string {
  return mbps >= 1000 ? `${formatNumber(mbps / 1000, ctx.locale)} Gbps` : `${formatNumber(mbps, ctx.locale)} Mbps`;
}

function compareEntry(ctx: RenderContext, item: CatalogPackage, cta: Cta): CompareEntry {
  const { ui } = ctx.site;
  const { price } = item;
  const link = resolveLink(cta.target, ctx.locale, ctx.site);
  const term = item.contract ?? item.validity;
  const speed = item.speed ? speedText(item.speed, ctx.locale) : null;
  return {
    id: item.id,
    name: ctx.t(item.name),
    href: localizePath(packageDetailPath(item.id), ctx.locale),
    price: formatNumber(price.amount, ctx.locale),
    unit: ctx.t(price.per === "month" ? ui.perMonth : ui.baht),
    regular: price.regularAmount !== undefined ? `${formatNumber(price.regularAmount, ctx.locale)} ${ctx.t(ui.baht)}` : undefined,
    vat: price.vat === "excluded" ? ctx.t(ui.vatExcluded) : price.vat === "included" ? ctx.t(ui.vatIncluded) : undefined,
    speed: speed ? `${speed.figure} ${speed.unit}` : undefined,
    term: term ? { label: ctx.t(item.contract ? ui.contract : ui.validity), value: ctx.t(term) } : undefined,
    allowance: item.allowance ? ctx.t(item.allowance) : undefined,
    benefits: item.benefits.map((id) => ctx.t(ctx.benefit(id).label)),
    conditions: item.conditions.map((line) => ctx.t(line)),
    dialCode: item.dialCode,
    cta: { id: cta.id, label: ctx.t(cta.label), href: link.href, external: link.external },
    unverified: item.review.status === "unverified",
  };
}

/** Everything the explorer of one page needs, worked out on the server in the page's language. */
export function explorerProps(ctx: RenderContext, items: CatalogPackage[], cta: Cta) {
  const { ui } = ctx.site;
  const t = ctx.t;
  const labels: ExplorerLabels = {
    findPackage: t(ui.findPackage),
    speed: t(ui.filterSpeed),
    price: t(ui.filterPrice),
    benefit: t(ui.filterBenefit),
    any: t(ui.filterAny),
    sortBy: t(ui.sortBy),
    sorts: { recommended: t(ui.sortRecommended), "price-low": t(ui.sortPriceLow), "price-high": t(ui.sortPriceHigh), speed: t(ui.sortSpeed) },
    resultCount: t(ui.resultCount),
    clearFilters: t(ui.clearFilters),
    noMatches: t(ui.noMatches),
    compareAdd: t(ui.compareAdd),
    compareChosen: t(ui.compareChosen),
    compareOpen: t(ui.compareOpen),
    compareMore: t(ui.compareMore),
    compareLimit: t(ui.compareLimit),
    compareClear: t(ui.compareClear),
    close: t(ui.close),
    details: t(ui.packageDetails),
    rows: {
      price: t(ui.offerPrice),
      speed: t(ui.speed),
      allowance: t(ui.allowance),
      benefits: t(ui.benefits),
      conditions: t(ui.conditions),
      dialCode: t(ui.dialCode),
      regular: t(ui.regularPrice),
    },
    unverifiedNote: t(ui.unverifiedNote),
    opensInNewTab: t(ui.opensInNewTab),
  };
  const speeds: Option<number>[] = speedOptions(items).map((value) => ({ value, label: speedLabel(value, ctx) }));
  const prices: Option<number>[] = priceLimits(items).map((value) => ({ value, label: `${formatNumber(value, ctx.locale)} ${t(ui.baht)}` }));
  const benefits: Option<string>[] = benefitOptions(items).map((value) => ({ value, label: t(ctx.benefit(value).label) }));
  return {
    facts: items.map(packageFacts),
    speeds,
    prices,
    benefits,
    compare: items.map((item) => compareEntry(ctx, item, cta)),
    labels,
  };
}
