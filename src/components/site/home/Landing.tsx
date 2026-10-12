import Image from "next/image";
import type { CSSProperties } from "react";

import { packageDetailPath, shownBenefits } from "@/lib/content/package-facts";
import { formatNumber } from "@/lib/content/render";
import type { CatalogPackage, HomePage } from "@/lib/content/schema";

import type { RenderContext } from "../context";
import { CtaLink, TargetLink } from "../links";
import { BenefitList, speedText } from "../PackageCompare";
import CountUp from "./CountUp";
import { Hero } from "./Hero";
import { heroArt } from "./hero-art";
import { Plate } from "./Plate";
import { RailTabs } from "./RailTabs";
import { stepPictures } from "./step-pictures";
import { Words } from "./Words";

const doc = "page:home" as const;

type Variables = CSSProperties & Record<`--${string}`, string | number>;
type Tab = HomePage["promos"]["tabs"][number];

/** Stagger: each item of a row starts a little after the one before. */
const delay = (index: number, step = 70): Variables => ({ "--d": `${index * step}ms` });
/** How long a stage holds the screen, in screen heights (ScrollDriver reads how far through it the page is). */
const hold = (length: number): Variables => ({ "--len": length });

const two = (index: number) => String(index + 1).padStart(2, "0");

/**
 * The home page (docs/renovation/R5-LANDING.md): five pinned stages
 * choreographed by scroll (ScrollDriver writes their progress as CSS custom
 * properties), then a price table and the common questions. Without
 * JavaScript, with reduced motion and in the Mirror editor's preview the same
 * sections lie flat in the page and read top to bottom. Every word, picture
 * and link comes from the content (pages.home, the catalog, site settings).
 */
export function Landing({ ctx }: { ctx: RenderContext }) {
  const home = ctx.content.pages.home;
  const { ui } = ctx.site;
  const { hero, manifesto, promos, steps, services, prices, faq } = home;
  const bind = (...path: (string | number)[]) => ctx.bind(doc, ...path);
  const picture = ctx.media(hero.visual);

  // The slip's lines at each of its five moments: before any step, and after each of the four.
  const { slip } = steps;
  const blank = "—";
  const phases = slip.statuses.map((status, moment) => ({
    status: ctx.t(status),
    values: [
      moment >= 1 ? ctx.t(slip.service.value) : blank,
      moment >= 3 ? ctx.t(slip.area.done) : moment === 2 ? ctx.t(slip.area.waiting) : blank,
      moment >= 4 ? ctx.t(slip.booking.done) : moment === 3 ? ctx.t(slip.booking.waiting) : blank,
    ],
  }));
  const done = phases[phases.length - 1];
  const slipRows = [
    { label: slip.service.label, key: "service" },
    { label: slip.area.label, key: "area" },
    { label: slip.booking.label, key: "booking" },
  ] as const;

  const priced = ctx.packages(prices.category, prices.group);
  const unconfirmed = (items: CatalogPackage[]) => items.some((item) => item.review.status === "unverified");
  // Each tab's cards: the packages recommended in the catalog that belong to its categories. A tab with none is left out.
  const rails = promos.tabs.map((tab) => ({ tab, items: ctx.featured(tab.categories) })).filter((rail) => rail.items.length > 0);

  return (
    <>
      {/* 1. The opening */}
      <section className="stage stage-hero" data-stage="hero" style={hold(220)} {...bind("hero")}>
        <div className="pin">
          <Hero
            view={{
              eyebrow: { text: ctx.t(hero.eyebrow), bind: bind("hero", "eyebrow") },
              heading: hero.heading.map((line, index) => ({ text: ctx.t(line), bind: bind("hero", "heading", index) })),
              actions: (
                <>
                  <CtaLink ctx={ctx} cta={hero.primaryCta} bind={bind("hero", "primaryCta")} />
                  <CtaLink ctx={ctx} cta={hero.secondaryCta} bind={bind("hero", "secondaryCta")} />
                </>
              ),
              side: (
                <>
                  <ul className="hero-tags" role="list">
                    {hero.tags.map((tag) => (
                      <li key={tag.id}>
                        <TargetLink ctx={ctx} target={tag.target} bind={bind("hero", "tags", tag.id)}>
                          {ctx.t(tag.label)}
                        </TargetLink>
                      </li>
                    ))}
                  </ul>
                  <p className="hero-note" {...bind("hero", "visualNote")}>
                    {ctx.t(hero.visualNote)}
                  </p>
                </>
              ),
              picture: { src: picture.src, width: picture.width, height: picture.height, alt: ctx.t(picture.alt), bind: bind("hero", "visual") },
              art: heroArt,
              next: { href: "#manifesto", label: ctx.t(manifesto.label) },
            }}
          />
        </div>
      </section>

      {/* 2. One sentence, inked from the bottom up */}
      <section className="stage stage-manifesto" id="manifesto" data-stage="manifesto" style={hold(250)} aria-labelledby="manifesto-text" {...bind("manifesto")}>
        <div className="pin">
          <div className="manifesto">
            <p className="label" data-rev="" {...bind("manifesto", "label")}>
              {ctx.t(manifesto.label)}
            </p>
            <div className="manifesto-line">
              <p id="manifesto-text" className="manifesto-base" {...bind("manifesto", "sentence")}>
                {ctx.t(manifesto.sentence)}
              </p>
              {/* The same sentence in full ink, in the same box, uncovered by a clip. */}
              <p className="manifesto-fill" aria-hidden="true">
                {ctx.t(manifesto.sentence)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Recommended packages: scrolling down walks along the open tab's row */}
      {rails.length > 0 ? (
        <section className="stage stage-rail" id="packages" data-stage="rail" style={hold(340)} aria-labelledby="rail-heading" {...bind("promos")}>
          <div className="pin">
            <RailTabs
              label={ctx.t(promos.heading)}
              stacked={ctx.edit}
              head={
                <>
                  <p className="label" data-rev="" {...bind("promos", "label")}>
                    {ctx.t(promos.label)}
                  </p>
                  <Words as="h2" id="rail-heading" className="display" text={ctx.t(promos.heading)} locale={ctx.locale} bind={bind("promos", "heading")} />
                </>
              }
              hint={
                <p className="hint" data-rev="" style={delay(2)} {...bind("promos", "description")}>
                  {ctx.t(promos.description)}
                </p>
              }
              tabs={rails.map(({ tab }) => ({ id: tab.id, title: ctx.t(tab.title), bind: bind("promos", "tabs", tab.id, "title") }))}
              more={rails.map(({ tab }) => (
                <div key={tab.id} className="rail-more-row">
                  {tab.remark ? (
                    <p className="note" {...bind("promos", "tabs", tab.id, "remark")}>
                      {ctx.t(tab.remark)}
                    </p>
                  ) : (
                    <span />
                  )}
                  <CtaLink ctx={ctx} cta={tab.viewAll} className="tm-button-small" bind={bind("promos", "tabs", tab.id, "viewAll")} />
                </div>
              ))}
              note={
                unconfirmed(rails.flatMap((rail) => rail.items)) ? (
                  <p className="note" data-rev="" {...ctx.bind("site", "ui", "unverifiedNote")}>
                    {ctx.t(ui.unverifiedNote)}
                  </p>
                ) : null
              }
            >
              {rails.map(({ tab, items }) => (
                <ul key={tab.id} className="rail-track" role="list" data-rail-track="" aria-label={ctx.t(tab.title)} {...bind("promos", "tabs", tab.id)}>
                  {items.map((item, index) => (
                    <PackageCard key={item.id} ctx={ctx} tab={tab} item={item} index={index} />
                  ))}
                </ul>
              ))}
            </RailTabs>
          </div>
        </section>
      ) : null}

      {/* 4. How it works: the slip fills itself in, one step at a time */}
      <section
        className="stage stage-ticket"
        id="how"
        data-stage="ticket"
        data-tone="ink"
        data-phases={JSON.stringify(phases)}
        style={hold(420)}
        aria-labelledby="ticket-heading"
        {...bind("steps")}
      >
        <div className="pin">
          <div className="ticket">
            <div className="ticket-copy">
              <p className="label" data-rev="" {...bind("steps", "label")}>
                {ctx.t(steps.label)}
              </p>
              <Words as="h2" id="ticket-heading" className="display" text={ctx.t(steps.heading)} locale={ctx.locale} bind={bind("steps", "heading")} />
              <p className="lede" data-rev="" style={delay(2)} {...bind("steps", "description")}>
                {ctx.t(steps.description)}
              </p>
              <ol className="cues" role="list">
                {steps.items.map((step, index) => (
                  <li key={step.id} className="cue" data-cue={index} data-rev="" style={delay(index, 90)} {...bind("steps", "items", step.id)}>
                    <span className="cue-n">{two(index)}</span>
                    <div>
                      <h3 {...bind("steps", "items", step.id, "title")}>{ctx.t(step.title)}</h3>
                      <p {...bind("steps", "items", step.id, "description")}>{ctx.t(step.description)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="meter meter-ink" aria-hidden="true">
                <span />
              </div>
            </div>

            {/* An illustration of the steps, not a document: hidden from assistive technology, which reads the steps above. */}
            <div className="slip-wrap" aria-hidden="true" {...bind("steps", "slip")}>
              <div className="slip">
                <div className="slip-main">
                  <div className="slip-head">
                    <p className="slip-kicker">
                      {ctx.t(ctx.site.brand.name)} · <span {...bind("steps", "slip", "caption")}>{ctx.t(slip.caption)}</span>
                    </p>
                    <p className="slip-name" {...bind("steps", "slip", "title")}>
                      {ctx.t(slip.title)}
                    </p>
                  </div>
                  <div className="slip-plate">
                    <Plate kind="field" />
                    {/* A small painting for each step, over the plate: the scroll shows the one of the step just done
                        (ScrollDriver), and the flat page the last, like the slip's lines. Asked for when the stage comes near. */}
                    {stepPictures.slice(0, phases.length - 1).map((picture, index) => (
                      // eslint-disable-next-line @next/next/no-img-element -- already at the sizes the slip needs (scripts/media/step-pictures.mjs)
                      <img
                        key={picture.id}
                        className="slip-picture"
                        data-slip-picture={index}
                        data-shown={index === phases.length - 2 ? "" : undefined}
                        alt=""
                        src={picture.files[picture.files.length - 1].src}
                        srcSet={picture.files.map((file) => `${file.src} ${file.width}w`).join(", ")}
                        sizes="(min-width: 900px) 344px, 264px"
                        width={picture.width}
                        height={picture.height}
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                  <dl className="slip-rows">
                    {slipRows.map((row, index) => (
                      <div key={row.key} {...bind("steps", "slip", row.key)}>
                        <dt>{ctx.t(row.label)}</dt>
                        <dd data-slip-value={index} data-set="">
                          {done.values[index]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="slip-perforation">
                  <span>{ctx.t(slip.tear)}</span>
                </div>
                <div className="slip-stub">
                  <span>{ctx.t(slip.statusLabel)}</span>
                  <strong data-slip-status="">{done.status}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Services: the chapters take turns over a drifting contour plate */}
      <section className="stage stage-season" id="services" data-stage="season" style={hold(300)} aria-labelledby="season-heading" {...bind("services")}>
        <div className="pin">
          <div className="season-plate">
            <Plate kind="contour" />
          </div>
          <div className="season">
            <p className="label" data-rev="" {...bind("services", "label")}>
              {ctx.t(services.label)}
            </p>
            <Words as="h2" id="season-heading" className="display" text={ctx.t(services.heading)} locale={ctx.locale} bind={bind("services", "heading")} />
            <ol className="chapters" role="list" style={{ "--chapters": services.items.length } as Variables}>
              {services.items.map((item, index) => (
                <li key={item.id} className="chapter" data-chapter={index} data-rev="" style={delay(index, 100)} {...bind("services", "items", item.id)}>
                  <p className="chapter-n">{two(index)}</p>
                  <h3 {...bind("services", "items", item.id, "title")}>{ctx.t(item.title)}</h3>
                  <p className="chapter-body" {...bind("services", "items", item.id, "description")}>
                    {ctx.t(item.description)}
                  </p>
                  {item.provider ? (
                    <p className="chapter-provider" {...bind("services", "items", item.id, "provider")}>
                      {ctx.t(item.provider)}
                    </p>
                  ) : null}
                  <TargetLink ctx={ctx} target={item.target} className="chapter-link">
                    {ctx.t(ui.packageDetails)}
                    <span className="sr-only">: {ctx.t(item.title)}</span>
                  </TargetLink>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Price table: one group of the catalog, as it is */}
      <section className="band" id="prices" aria-labelledby="prices-heading" {...bind("prices")}>
        <div className="wrap">
          <p className="label" data-rev="" {...bind("prices", "label")}>
            {ctx.t(prices.label)}
          </p>
          <Words as="h2" id="prices-heading" className="display" text={ctx.t(prices.heading)} locale={ctx.locale} bind={bind("prices", "heading")} />
          <table className="ruled">
            <thead>
              <tr>
                <th scope="col" {...bind("prices", "columns", "package")}>
                  {ctx.t(prices.columns.package)}
                </th>
                <th scope="col">{ctx.t(ui.filterSpeed)}</th>
                <th scope="col" className="col-contract">
                  {ctx.t(ui.contract)}
                </th>
                <th scope="col" className="col-price" {...bind("prices", "columns", "price")}>
                  {ctx.t(prices.columns.price)}
                </th>
              </tr>
            </thead>
            <tbody>
              {priced.map((item, index) => {
                const speed = item.speed ? speedText(item.speed, ctx.locale) : null;
                const term = item.contract ?? item.validity;
                return (
                  <tr key={item.id} data-rev="" style={delay(index, 60)} data-package={item.id}>
                    <th scope="row">
                      <TargetLink ctx={ctx} target={{ kind: "page", path: packageDetailPath(item.id) }} className="ruled-link" bind={ctx.bind(`package:${item.id}`, "name")}>
                        {ctx.t(item.name)}
                      </TargetLink>
                      {term ? <span className="cell-sub">{ctx.t(term)}</span> : null}
                    </th>
                    <td className="num">{speed ? `${speed.figure} ${speed.unit}` : item.allowance ? ctx.t(item.allowance) : blank}</td>
                    <td className="col-contract">{term ? ctx.t(term) : blank}</td>
                    <td className="col-price" {...ctx.bind(`package:${item.id}`, "price")}>
                      <CountUp to={item.price.amount} separator="," className="num" duration={1.2} />
                      <span className="cell-unit">{ctx.t(item.price.per === "month" ? ui.perMonth : ui.baht)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="band-foot">
            <p className="note" data-rev="">
              {priced.some((item) => item.price.vat === "excluded") ? `${ctx.t(ui.vatExcluded)} · ` : ""}
              {unconfirmed(priced) ? ctx.t(ui.unverifiedNote) : ""}
            </p>
            <CtaLink ctx={ctx} cta={prices.viewAll} bind={bind("prices", "viewAll")} />
          </div>
        </div>
      </section>

      {/* Common questions */}
      <section className="band band-pill" id="faq" aria-labelledby="faq-heading" {...bind("faq")}>
        <div className="wrap wrap-split">
          <div>
            <p className="label" data-rev="" {...bind("faq", "label")}>
              {ctx.t(faq.label)}
            </p>
            <Words as="h2" id="faq-heading" className="display" text={ctx.t(faq.heading)} locale={ctx.locale} bind={bind("faq", "heading")} />
          </div>
          <div className="faq">
            {faq.items.map((item, index) => (
              // Open in the editor, so the answers can be clicked and edited.
              <details key={item.id} data-rev="" style={delay(index, 80)} open={ctx.edit || undefined} {...bind("faq", "items", item.id)}>
                <summary>
                  <span {...bind("faq", "items", item.id, "question")}>{ctx.t(item.question)}</span>
                  <span className="faq-mark" aria-hidden="true" />
                </summary>
                <p {...bind("faq", "items", item.id, "answer")}>{ctx.t(item.answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/** One recommended package: its picture with what it gives over it, what comes with it, its price as the catalog has it, and how to ask for it. */
function PackageCard({ ctx, tab, item, index }: { ctx: RenderContext; tab: Tab; item: CatalogPackage; index: number }) {
  const { ui } = ctx.site;
  // A recommended package always has a picture (ctx.featured leaves out the ones without).
  const image = ctx.media(item.image!);
  const speed = item.speed ? speedText(item.speed, ctx.locale) : null;
  const term = item.contract ?? item.validity;
  const own = (field: string) => ctx.bind(`package:${item.id}`, field);
  const vat = item.price.vat === "excluded" ? ui.vatExcluded : item.price.vat === "included" ? ui.vatIncluded : null;
  return (
    <li className="card" data-rev="" style={delay(index)} data-package={item.id} {...ctx.bind(`package:${item.id}`)}>
      <div className="card-plate">
        <Image
          src={image.src}
          alt={ctx.t(image.alt)}
          fill
          sizes="(min-width: 1270px) 330px, (min-width: 885px) 26vw, 230px"
          {...own("image")}
        />
        {speed ? (
          <p className="card-figure" {...own("speed")}>
            <span className="sr-only">{ctx.t(ui.speed)} </span>
            <span className="num">{speed.figure}</span>
            <span className="card-figure-unit">{speed.unit}</span>
          </p>
        ) : item.allowance ? (
          <p className="card-figure card-figure-text" {...own("allowance")}>
            {ctx.t(item.allowance)}
          </p>
        ) : null}
      </div>
      <div className="card-body">
        <h3 className="card-title" {...own("name")}>
          {ctx.t(item.name)}
        </h3>
        <p className="card-meta">
          {term ? (
            <span {...own(item.contract ? "contract" : "validity")}>
              {ctx.t(item.contract ? ui.contract : ui.validity)} {ctx.t(term)}
            </span>
          ) : null}
        </p>
        {shownBenefits(item).length > 0 ? <BenefitList ctx={ctx} ids={shownBenefits(item)} dense className="card-perks" /> : null}
        <p className="card-price" {...own("price")}>
          <CountUp to={item.price.amount} separator="," className="num" duration={1.4} />
          <span className="card-unit">{ctx.t(item.price.per === "month" ? ui.perMonth : ui.baht)}</span>
          {item.price.regularAmount !== undefined ? (
            <span className="card-vat">
              {ctx.t(ui.regularPrice)} <s className="num">{formatNumber(item.price.regularAmount, ctx.locale)}</s> {ctx.t(ui.baht)}
            </span>
          ) : null}
          {vat ? <span className="card-vat">{ctx.t(vat)}</span> : null}
        </p>
        <div className="card-actions">
          <CtaLink ctx={ctx} cta={tab.packageCta} context={ctx.t(item.name)} className="tm-button-small" bind={ctx.bind(doc, "promos", "tabs", tab.id, "packageCta")} />
          <TargetLink ctx={ctx} target={{ kind: "page", path: packageDetailPath(item.id) }} className="card-link">
            {ctx.t(ui.packageDetails)}
            <span className="sr-only">: {ctx.t(item.name)}</span>
          </TargetLink>
        </div>
      </div>
    </li>
  );
}
