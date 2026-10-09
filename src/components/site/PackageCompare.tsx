import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { downloadMbps, packageDetailPath } from "@/lib/content/package-facts";
import { formatNumber } from "@/lib/content/render";
import type { CatalogPackage, Cta, Price } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";

import type { RenderContext } from "./context";
import { ComparePick, ExplorableCard } from "./explorer/PackageExplorer";
import { CtaLink, TargetLink } from "./links";

type Speed = NonNullable<CatalogPackage["speed"]>["download"];
type Binding = { "data-edit"?: string };

export function speedText({ download, upload }: NonNullable<CatalogPackage["speed"]>, locale: Locale) {
  const value = (speed: Speed) => formatNumber(speed.value, locale);
  return download.unit === upload.unit
    ? { figure: `${value(download)}/${value(upload)}`, unit: upload.unit }
    : { figure: `${value(download)} ${download.unit}/${value(upload)}`, unit: upload.unit };
}

export function PriceBlock({ ctx, price, size }: { ctx: RenderContext; price: Price; size: "large" | "medium" }) {
  const { ui } = ctx.site;
  const unit = price.per === "month" ? ui.perMonth : ui.baht;
  const vat = price.vat === "excluded" ? ui.vatExcluded : price.vat === "included" ? ui.vatIncluded : null;
  return (
    <div>
      {price.regularAmount !== undefined ? (
        <p className="text-tm-small text-tm-muted">
          {ctx.t(ui.regularPrice)} <s className="tm-num">{formatNumber(price.regularAmount, ctx.locale)}</s> {ctx.t(ui.baht)}
        </p>
      ) : null}
      <p className="flex flex-wrap items-baseline gap-x-2">
        {price.regularAmount !== undefined ? <span className="sr-only">{ctx.t(ui.offerPrice)}</span> : null}
        <span className={`tm-num font-light leading-none tracking-tight text-tm-red ${size === "large" ? "text-[3rem]" : "text-[2.25rem]"}`}>
          {formatNumber(price.amount, ctx.locale)}
        </span>
        <span className="text-tm-small font-medium">{ctx.t(unit)}</span>
      </p>
      {vat ? <p className="mt-1 text-tm-caption text-tm-muted">{ctx.t(vat)}</p> : null}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-tm-caption font-medium text-tm-muted">{children}</p>;
}

/**
 * What comes with a package, each with its picture: the picture sits in a tile
 * of one size, so a product photo, a logo and an icon line up whatever their
 * shapes. `dense` is the row of tiles alone (the home page's cards): the first
 * few show, the rest are counted, and every name is still read out.
 */
export function BenefitList({ ctx, ids, dense = false, className = "" }: { ctx: RenderContext; ids: readonly string[]; dense?: boolean; className?: string }) {
  const shown = dense ? 4 : ids.length;
  return (
    <ul role="list" className={`tm-benefits ${className}`.trim()} data-dense={dense ? "" : undefined} aria-label={dense ? ctx.t(ctx.site.ui.benefits) : undefined}>
      {ids.map((id, index) => {
        const benefit = ctx.benefit(id);
        const icon = ctx.media(benefit.icon);
        return (
          <li key={id} className={index >= shown ? "sr-only" : undefined} {...ctx.bind(`benefit:${id}`)}>
            <span className="tm-benefit-tile">
              <Image src={icon.src} width={icon.width} height={icon.height} alt="" sizes="48px" />
            </span>
            <span className={dense ? "sr-only" : undefined}>{ctx.t(benefit.label)}</span>
          </li>
        );
      })}
      {ids.length > shown ? (
        <li aria-hidden="true" className="tm-benefit-more tm-num">
          +{ids.length - shown}
        </li>
      ) : null}
    </ul>
  );
}

/** One row of the card: which package field it shows, and how. */
type Row = { key: string; field: (item: CatalogPackage) => string; cell: (item: CatalogPackage) => ReactNode };

type PackageCompareProps = {
  ctx: RenderContext;
  items: CatalogPackage[];
  cta: Cta;
  /** Editor binding of the page's package button. */
  ctaBind?: Binding;
  /** "compare" is the roomy card; "compact" suits long lists of add-ons. */
  variant: "compare" | "compact";
  /** Level of the package names, one below the heading above the cards. */
  headingLevel?: 3 | 4;
  /** Extra classes on the grid, such as a fixed column count. */
  className?: string;
};

/**
 * Package cards as slips (docs/renovation/R8-PROMO-CARDS.md): what the package
 * gives leads, in figures, then its name, its terms and what comes with it,
 * each with its picture; the price is on the stub below the perforation, with
 * the way to ask for it. A card needs no picture of its own. Fields sit in the
 * same order and, on wide screens, on the same row lines (CSS subgrid), so
 * speed and price compare at a glance; a row appears only when at least one
 * package in the list has that field.
 */
export function PackageCompare({ ctx, items, cta, ctaBind, variant, headingLevel = 3, className = "" }: PackageCompareProps) {
  const { ui } = ctx.site;
  const Heading = headingLevel === 3 ? "h3" : "h4";
  const some = (pick: (item: CatalogPackage) => unknown) =>
    items.some((item) => {
      const value = pick(item);
      return Array.isArray(value) ? value.length > 0 : value !== undefined;
    });
  const compact = variant === "compact";
  const fixed = (name: string) => () => name;
  const recommended = new Set(ctx.content.featured);
  // The meter under a speed is its share of the fastest in this list.
  const fastest = Math.max(0, ...items.map((item) => downloadMbps(item) ?? 0));

  const rows: Row[] = [];
  if (some((item) => item.speed ?? item.allowance) || items.some((item) => recommended.has(item.id))) {
    rows.push({
      key: "figure",
      field: (item) => (item.speed ? "speed" : item.allowance ? "allowance" : ""),
      cell: (item) => {
        const speed = item.speed ? speedText(item.speed, ctx.locale) : null;
        const mark = recommended.has(item.id);
        if (!speed && !item.allowance && !mark) return null;
        const mbps = downloadMbps(item);
        return (
          <div className="tm-slip-head">
            <p className="tm-slip-kicker">
              {speed ? <span>{ctx.t(ui.speed)}</span> : item.allowance ? <span>{ctx.t(ui.allowance)}</span> : null}
              {mark ? <span className="tm-slip-mark">{ctx.t(ui.recommended)}</span> : null}
            </p>
            {speed ? (
              <p className="tm-slip-figure">
                <span className="tm-num">{speed.figure}</span>
                <span>{speed.unit}</span>
              </p>
            ) : item.allowance ? (
              <p className="tm-slip-lead">{ctx.t(item.allowance)}</p>
            ) : null}
            {speed && mbps && fastest > 0 ? (
              <div className="tm-slip-meter" aria-hidden="true">
                <span style={{ width: `${Math.round((mbps / fastest) * 100)}%` }} />
              </div>
            ) : null}
            {speed && item.allowance ? <p className="mt-3 text-tm-small">{ctx.t(item.allowance)}</p> : null}
          </div>
        );
      },
    });
  }
  rows.push({
    key: "name",
    field: fixed("name"),
    cell: (item) => {
      const image = item.image ? ctx.media(item.image) : null;
      return (
        <div className="tm-slip-name">
          <div className="min-w-0">
            <Heading className={`${compact ? "text-tm-body" : "text-tm-lead"} font-medium leading-snug`}>{ctx.t(item.name)}</Heading>
            {item.audience ? (
              <p className="mt-1 text-tm-small text-tm-muted" {...ctx.bind(`package:${item.id}`, "audience")}>
                {ctx.t(ui.audience)} {ctx.t(item.audience)}
              </p>
            ) : null}
          </div>
          {/* The package's own picture, when it has one, rides along small: the card never waits for one. */}
          {image ? <Image src={image.src} width={104} height={104} alt="" sizes="52px" className="tm-slip-thumb" {...ctx.bind(`package:${item.id}`, "image")} /> : null}
        </div>
      );
    },
  });
  if (some((item) => item.contract ?? item.validity)) {
    rows.push({
      key: "term",
      field: (item) => (item.contract ? "contract" : "validity"),
      cell: (item) => {
        const term = item.contract ?? item.validity;
        if (!term) return null;
        return (
          <p className="tm-slip-line tm-slip-pair">
            <span>{ctx.t(item.contract ? ui.contract : ui.validity)}</span>
            <span>{ctx.t(term)}</span>
          </p>
        );
      },
    });
  }
  if (some((item) => item.benefits)) {
    rows.push({
      key: "benefits",
      field: fixed("benefits"),
      cell: (item) =>
        item.benefits.length > 0 ? (
          <div className="tm-slip-line">
            <Label>{ctx.t(ui.benefits)}</Label>
            <BenefitList ctx={ctx} ids={item.benefits} className="mt-2.5" />
          </div>
        ) : null,
    });
  }
  if (some((item) => item.details)) {
    rows.push({
      key: "details",
      field: fixed("details"),
      cell: (item) =>
        item.details.length > 0 ? (
          <div className="tm-slip-line">
            <Label>{ctx.t(ui.details)}</Label>
            <ul className="mt-1.5 grid list-disc gap-1 pl-5 text-tm-small marker:text-tm-muted">
              {item.details.map((detail, index) => (
                <li key={index}>{ctx.t(detail)}</li>
              ))}
            </ul>
          </div>
        ) : null,
    });
  }
  if (some((item) => item.conditions)) {
    rows.push({
      key: "conditions",
      field: fixed("conditions"),
      cell: (item) =>
        item.conditions.length > 0 ? (
          <div className="tm-slip-line">
            <Label>{ctx.t(ui.conditions)}</Label>
            <ul className="mt-1.5 grid list-disc gap-1 pl-5 text-tm-small text-tm-muted">
              {item.conditions.map((condition, index) => (
                <li key={index}>{ctx.t(condition)}</li>
              ))}
            </ul>
          </div>
        ) : null,
    });
  }
  if (some((item) => item.dialCode)) {
    rows.push({
      key: "dial",
      field: fixed("dialCode"),
      cell: (item) =>
        item.dialCode ? (
          <div className="tm-slip-line tm-slip-pair">
            <span>{ctx.t(ui.dialCode)}</span>
            <a href={`tel:${encodeURIComponent(item.dialCode)}`} className="tm-link tm-num text-tm-body font-semibold">
              {item.dialCode}
            </a>
          </div>
        ) : null,
    });
  }
  rows.push({
    key: "stub",
    field: fixed(""),
    cell: (item) => (
      <div className="tm-slip-stub">
        <div {...ctx.bind(`package:${item.id}`, "price")}>
          <PriceBlock ctx={ctx} price={item.price} size={compact ? "medium" : "large"} />
        </div>
        <CtaLink ctx={ctx} cta={cta} context={ctx.t(item.name)} className="w-full" bind={ctaBind} />
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ComparePick packageId={item.id} name={ctx.t(item.name)} />
          <TargetLink ctx={ctx} target={{ kind: "page", path: packageDetailPath(item.id) }} className="tm-link ml-auto text-tm-small font-semibold">
            {ctx.t(ui.packageDetails)}
            <span className="sr-only">: {ctx.t(item.name)}</span>
          </TargetLink>
        </div>
      </div>
    ),
  });

  return (
    <ul role="list" className={`tm-compare ${compact ? "tm-compare-compact" : ""} ${className}`}>
      {items.map((item) => (
        <ExplorableCard key={item.id} packageId={item.id} data-package={item.id} className="tm-compare-card tm-slip" style={{ "--tm-rows": rows.length } as CSSProperties} {...ctx.bind(`package:${item.id}`)}>
          {rows.map((row) => {
            const field = row.field(item);
            return (
              <div key={row.key} data-row={row.key} {...(field ? ctx.bind(`package:${item.id}`, field) : {})}>
                {row.cell(item)}
              </div>
            );
          })}
        </ExplorableCard>
      ))}
    </ul>
  );
}
