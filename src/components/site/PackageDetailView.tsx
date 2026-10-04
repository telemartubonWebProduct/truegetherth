import Image from "next/image";

import { packageHomeIn, packageImageIn } from "@/lib/content/lookup";
import { packageDetailPath } from "@/lib/content/package-facts";
import type { CatalogPackage } from "@/lib/content/schema";
import { localizePath } from "@/lib/i18n/locales";

import type { RenderContext } from "./context";
import { ContactLink, CtaLink, SmartLink, TargetLink } from "./links";
import { PriceBlock, speedText } from "./PackageCompare";
import { PageShell } from "./PageShell";

/**
 * A package's own page: the comparison figures first, the ways to get in
 * touch beside them, then everything the card has no room for. Built from the
 * catalog entry; the notes of the page section that lists the package apply here too.
 */
export function PackageDetailView({ ctx, item }: { ctx: RenderContext; item: CatalogPackage }) {
  const { ui } = ctx.site;
  const home = packageHomeIn(ctx.content, item);
  const imageId = packageImageIn(ctx.content, item);
  const image = imageId ? ctx.media(imageId) : null;
  const term = item.contract ?? item.validity;
  const own = (field: string) => ctx.bind(`package:${item.id}`, field);
  const notes = home?.notes ?? [];

  return (
    <PageShell ctx={ctx} path={packageDetailPath(item.id)}>
      <nav aria-label={ctx.t(ui.breadcrumb)} className="border-b border-tm-line">
        <ol className="tm-container flex flex-wrap items-center gap-x-2 gap-y-1 py-3 text-tm-small text-tm-muted">
          <li>
            <TargetLink ctx={ctx} target={{ kind: "page", path: "/" }} className="tm-link">
              {ctx.t(ui.homeLink)}
            </TargetLink>
          </li>
          {home ? (
            <li className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              <TargetLink ctx={ctx} target={{ kind: "page", path: home.path, hash: home.hash }} className="tm-link">
                {ctx.t(home.pageTitle)}
              </TargetLink>
            </li>
          ) : null}
          <li className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-tm-ink">
              {ctx.t(item.name)}
            </span>
          </li>
        </ol>
      </nav>

      <section className="py-10 lg:py-16" data-package={item.id} {...ctx.bind(`package:${item.id}`)}>
        <div className={`tm-container grid gap-10 ${image ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start lg:gap-14" : ""}`}>
          <div className="max-w-[40rem]">
            {home ? <p className="text-tm-small font-semibold text-tm-muted">{ctx.t(home.sectionHeading)}</p> : null}
            <h1 className="mt-2 text-balance text-tm-h1 font-semibold" {...own("name")}>
              {ctx.t(item.name)}
            </h1>
            {item.audience ? (
              <p className="mt-2 text-tm-lead text-tm-muted" {...own("audience")}>
                {ctx.t(ui.audience)} {ctx.t(item.audience)}
              </p>
            ) : null}
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {item.speed ? (
                <div {...own("speed")}>
                  <dt className="text-tm-small text-tm-muted">{ctx.t(ui.speed)}</dt>
                  <dd className="mt-1">
                    <span className="tm-num text-[2.5rem] font-light leading-none tracking-tight">{speedText(item.speed, ctx.locale).figure}</span>{" "}
                    <span className="text-tm-small font-medium">{speedText(item.speed, ctx.locale).unit}</span>
                  </dd>
                </div>
              ) : null}
              <div {...own("price")}>
                <dt className="sr-only">{ctx.t(ui.offerPrice)}</dt>
                <dd>
                  <PriceBlock ctx={ctx} price={item.price} size="large" />
                </dd>
              </div>
              {item.allowance ? (
                <div {...own("allowance")}>
                  <dt className="text-tm-small text-tm-muted">{ctx.t(ui.allowance)}</dt>
                  <dd className="mt-1 text-tm-lead font-medium">{ctx.t(item.allowance)}</dd>
                </div>
              ) : null}
              {term ? (
                <div {...own(item.contract ? "contract" : "validity")}>
                  <dt className="text-tm-small text-tm-muted">{ctx.t(item.contract ? ui.contract : ui.validity)}</dt>
                  <dd className="mt-1 text-tm-lead font-medium">{ctx.t(term)}</dd>
                </div>
              ) : null}
              {item.dialCode ? (
                <div {...own("dialCode")}>
                  <dt className="text-tm-small text-tm-muted">{ctx.t(ui.dialCode)}</dt>
                  <dd className="mt-1">
                    <a href={`tel:${encodeURIComponent(item.dialCode)}`} className="tm-link tm-num text-tm-lead font-semibold">
                      {item.dialCode}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-10 rounded-tm-panel border border-tm-line p-5 sm:p-6">
              <p>{ctx.t(ui.packageContactNote)}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {home ? <CtaLink ctx={ctx} cta={home.cta} context={ctx.t(item.name)} /> : null}
                <ContactLink ctx={ctx} channel="phone-sales" ctaId={`package-call-${item.id}`} className="tm-button tm-button-secondary">
                  {ctx.t(ui.callSales)}
                </ContactLink>
                {/* The contact page's call-back form, with this package filled in. */}
                <SmartLink
                  link={{ href: `${localizePath("/service", ctx.locale)}?package=${encodeURIComponent(item.id)}#callback`, external: false }}
                  ctaId={`package-callback-${item.id}`}
                  newTabLabel={ctx.t(ui.opensInNewTab)}
                  className="tm-button tm-button-secondary"
                >
                  {ctx.t(ui.requestCallback)}
                </SmartLink>
              </div>
            </div>
          </div>

          {image ? (
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt={ctx.t(image.alt)}
              sizes="(min-width: 1024px) 34rem, 100vw"
              className="aspect-[4/3] w-full rounded-tm-panel object-cover"
              priority
            />
          ) : null}
        </div>
      </section>

      {item.benefits.length > 0 || item.details.length > 0 || item.conditions.length > 0 ? (
        <section className="border-t border-tm-line py-10 lg:py-14" data-tone="surface">
          <div className="tm-container grid gap-10 lg:grid-cols-2 lg:gap-14">
            {item.benefits.length > 0 ? (
              <div {...own("benefits")}>
                <h2 className="text-tm-h3 font-semibold">{ctx.t(ui.benefits)}</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {item.benefits.map((id) => {
                    const benefit = ctx.benefit(id);
                    const icon = ctx.media(benefit.icon);
                    return (
                      <li key={id} className="flex items-center gap-3 rounded-tm-control bg-tm-canvas p-3">
                        <Image src={icon.src} width={icon.width} height={icon.height} alt="" className="h-11 w-11 shrink-0 object-contain" />
                        <span>{ctx.t(benefit.label)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <div className="grid content-start gap-8">
              {item.details.length > 0 ? (
                <div {...own("details")}>
                  <h2 className="text-tm-h3 font-semibold">{ctx.t(ui.details)}</h2>
                  <ul className="mt-4 grid list-disc gap-2 pl-5">
                    {item.details.map((line, index) => (
                      <li key={index}>{ctx.t(line)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {item.conditions.length > 0 ? (
                <div {...own("conditions")}>
                  <h2 className="text-tm-h3 font-semibold">{ctx.t(ui.conditions)}</h2>
                  <ul className="mt-4 grid list-disc gap-2 pl-5 text-tm-muted">
                    {item.conditions.map((line, index) => (
                      <li key={index}>{ctx.t(line)}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {item.review.status === "unverified" || notes.length > 0 ? (
        <section className="border-t border-tm-line py-8">
          <div className="tm-container">
            <ul className="grid max-w-[52rem] list-disc gap-1 pl-5 text-tm-small text-tm-muted" data-package-notes="">
              {item.review.status === "unverified" ? <li>{ctx.t(ui.unverifiedNote)}</li> : null}
              {notes.map((note, index) => (
                <li key={index}>{ctx.t(note)}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
