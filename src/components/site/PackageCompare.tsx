import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { packageDetailPath } from "@/lib/content/package-facts";
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

/** One row of the card: which package field it shows, and how. */
type Row = { key: string; field: (item: CatalogPackage) => string; cell: (item: CatalogPackage) => ReactNode };

type PackageCompareProps = {
  ctx: RenderContext;
  items: CatalogPackage[];
  cta: Cta;
  /** Editor binding of the page's package button. */
  ctaBind?: Binding;
  /** "compare" lines fields up in roomy cards; "compact" suits long lists of add-ons. */
  variant: "compare" | "compact";
  /** Level of the package names, one below the heading above the cards. */
  headingLevel?: 3 | 4;
  /** Extra classes on the grid, such as a fixed column count. */
  className?: string;
};

/**
 * Package cards whose fields sit in the same order and, on wide screens, on
 * the same row lines (CSS subgrid), so speed and price compare at a glance.
 * A row appears only when at least one package in the list has that field.
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

  const rows: Row[] = [];
  if (some((item) => item.image)) {
    rows.push({
      key: "image",
      field: fixed("image"),
      cell: (item) => {
        if (!item.image) return null;
        const image = ctx.media(item.image);
        return (
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={ctx.t(image.alt)}
            sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
            className="mx-auto aspect-square w-full max-w-[14rem] rounded-tm-control object-contain"
          />
        );
      },
    });
  }
  rows.push({
    key: "name",
    field: fixed("name"),
    cell: (item) => (
      <>
        <Heading className={`${compact ? "text-tm-body" : "text-tm-h4"} font-medium`}>{ctx.t(item.name)}</Heading>
        {item.audience ? (
          <p className="mt-1 text-tm-small text-tm-muted" {...ctx.bind(`package:${item.id}`, "audience")}>
            {ctx.t(ui.audience)} {ctx.t(item.audience)}
          </p>
        ) : null}
      </>
    ),
  });
  if (some((item) => item.speed)) {
    rows.push({
      key: "speed",
      field: fixed("speed"),
      cell: (item) => {
        if (!item.speed) return null;
        const speed = speedText(item.speed, ctx.locale);
        return (
          <>
            <Label>{ctx.t(ui.speed)}</Label>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className={`tm-num font-medium leading-tight ${compact ? "text-tm-h4" : "text-tm-h3"}`}>{speed.figure}</span>
              <span className="text-tm-small font-medium">{speed.unit}</span>
            </p>
          </>
        );
      },
    });
  }
  if (some((item) => item.allowance)) {
    rows.push({
      key: "allowance",
      field: fixed("allowance"),
      cell: (item) =>
        item.allowance ? (
          <>
            <Label>{ctx.t(ui.allowance)}</Label>
            <p className="mt-1 font-medium">{ctx.t(item.allowance)}</p>
          </>
        ) : null,
    });
  }
  rows.push({ key: "price", field: fixed("price"), cell: (item) => <PriceBlock ctx={ctx} price={item.price} size={compact ? "medium" : "large"} /> });
  if (some((item) => item.contract ?? item.validity)) {
    rows.push({
      key: "term",
      field: (item) => (item.contract ? "contract" : "validity"),
      cell: (item) => {
        const term = item.contract ?? item.validity;
        if (!term) return null;
        return (
          <>
            <Label>{ctx.t(item.contract ? ui.contract : ui.validity)}</Label>
            <p className="mt-1">{ctx.t(term)}</p>
          </>
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
          <>
            <Label>{ctx.t(ui.benefits)}</Label>
            <ul className="mt-2 grid gap-2">
              {item.benefits.map((id) => {
                const benefit = ctx.benefit(id);
                const icon = ctx.media(benefit.icon);
                return (
                  <li key={id} className="flex items-center gap-3 text-tm-small" {...ctx.bind(`benefit:${id}`)}>
                    <Image src={icon.src} width={icon.width} height={icon.height} alt="" className="h-9 w-9 shrink-0 object-contain" />
                    <span>{ctx.t(benefit.label)}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null,
    });
  }
  if (some((item) => item.details)) {
    rows.push({
      key: "details",
      field: fixed("details"),
      cell: (item) =>
        item.details.length > 0 ? (
          <>
            <Label>{ctx.t(ui.details)}</Label>
            <ul className="mt-1 grid list-disc gap-1 pl-5 text-tm-small marker:text-tm-muted">
              {item.details.map((detail, index) => (
                <li key={index}>{ctx.t(detail)}</li>
              ))}
            </ul>
          </>
        ) : null,
    });
  }
  if (some((item) => item.conditions)) {
    rows.push({
      key: "conditions",
      field: fixed("conditions"),
      cell: (item) =>
        item.conditions.length > 0 ? (
          <>
            <Label>{ctx.t(ui.conditions)}</Label>
            <ul className="mt-1 grid list-disc gap-1 pl-5 text-tm-small text-tm-muted">
              {item.conditions.map((condition, index) => (
                <li key={index}>{ctx.t(condition)}</li>
              ))}
            </ul>
          </>
        ) : null,
    });
  }
  if (some((item) => item.dialCode)) {
    rows.push({
      key: "dial",
      field: fixed("dialCode"),
      cell: (item) =>
        item.dialCode ? (
          <>
            <Label>{ctx.t(ui.dialCode)}</Label>
            <a href={`tel:${encodeURIComponent(item.dialCode)}`} className="tm-link tm-num mt-1 inline-block text-tm-lead font-semibold">
              {item.dialCode}
            </a>
          </>
        ) : null,
    });
  }
  rows.push({
    key: "cta",
    field: fixed(""),
    cell: (item) => (
      <div className="grid gap-3">
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
        <ExplorableCard
          key={item.id}
          packageId={item.id}
          data-package={item.id}
          className="tm-compare-card rounded-tm-panel border border-tm-line bg-tm-canvas"
          style={{ "--tm-rows": rows.length } as CSSProperties}
          {...ctx.bind(`package:${item.id}`)}
        >
          {rows.map((row) => {
            const field = row.field(item);
            return (
              <div key={row.key} data-row={row.key} className={compact ? "px-4 py-3" : "px-5 py-4"} {...(field ? ctx.bind(`package:${item.id}`, field) : {})}>
                {row.cell(item)}
              </div>
            );
          })}
        </ExplorableCard>
      ))}
    </ul>
  );
}
