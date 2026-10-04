import Image from "next/image";

import type { RenderContext } from "../context";
import { PlusIcon } from "../icons";
import { CtaLink } from "../links";
import { EmptyGroup } from "../PackageSections";
import { PackageCompare } from "../PackageCompare";
import { PageHero } from "../PageHero";
import { Steps } from "../Steps";

const doc = "page:solar" as const;
type Binding = { "data-edit"?: string };

function Figure({ ctx, id, className, sizes, bind }: { ctx: RenderContext; id: string; className?: string; sizes: string; bind?: Binding }) {
  const image = ctx.media(id);
  return (
    <Image
      src={image.src}
      width={image.width}
      height={image.height}
      alt={ctx.t(image.alt)}
      sizes={sizes}
      className={`w-full rounded-tm-panel ${className ?? ""}`}
      {...bind}
    />
  );
}

export function SolarHero({ ctx }: { ctx: RenderContext }) {
  const { hero } = ctx.content.pages.solar;
  const image = ctx.media(hero.image);
  return (
    <PageHero
      ctx={ctx}
      heading={hero.heading}
      description={hero.description}
      tone={hero.tone}
      binds={{ section: ctx.bind(doc, "hero"), heading: ctx.bind(doc, "hero", "heading"), description: ctx.bind(doc, "hero", "description") }}
      actions={<CtaLink ctx={ctx} cta={hero.cta} bind={ctx.bind(doc, "hero", "cta")} />}
      note={
        <p className="font-semibold text-tm-ink" {...ctx.bind(doc, "hero", "provider")}>
          {ctx.t(hero.provider)}
        </p>
      }
      media={
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={ctx.t(image.alt)}
          preload
          sizes="(min-width: 1024px) 36rem, 100vw"
          className="aspect-[4/3] w-full rounded-tm-panel object-cover"
          {...ctx.bind(doc, "hero", "image")}
        />
      }
    />
  );
}

export function SolarAbout({ ctx }: { ctx: RenderContext }) {
  const { about, stats } = ctx.content.pages.solar;
  return (
    <section aria-labelledby="solar-about-heading" className="py-14 lg:py-20" data-tone={about.tone} {...ctx.bind(doc, "about")}>
      <div className="tm-container grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
        <div className="max-w-[36rem]">
          <h2 id="solar-about-heading" className="text-tm-h2 font-semibold" {...ctx.bind(doc, "about", "heading")}>
            {ctx.t(about.heading)}
          </h2>
          {about.body.map((paragraph, index) => (
            <p key={index} className="mt-4 text-tm-muted" {...ctx.bind(doc, "about", "body", index)}>
              {ctx.t(paragraph)}
            </p>
          ))}
        </div>
        <Figure ctx={ctx} id={about.image} sizes="(min-width: 1024px) 36rem, 100vw" bind={ctx.bind(doc, "about", "image")} />
      </div>
      <div className="tm-container mt-14" {...ctx.bind(doc, "stats")}>
        <h3 className="text-tm-h4 font-semibold" {...ctx.bind(doc, "stats", "heading")}>
          {ctx.t(stats.heading)}
        </h3>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-tm-line pt-6 lg:grid-cols-4">
          {stats.items.map((item) => (
            <div key={item.id} className="flex flex-col" {...ctx.bind(doc, "stats", "items", item.id)}>
              <dt className="order-2 text-tm-small text-tm-muted">{ctx.t(item.label)}</dt>
              <dd className="tm-num order-1 text-tm-h1 font-semibold leading-tight">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function SolarProcess({ ctx }: { ctx: RenderContext }) {
  const { process } = ctx.content.pages.solar;
  return (
    <Steps
      ctx={ctx}
      id="solar-process"
      doc={doc}
      base={["process"]}
      itemsKey="steps"
      heading={process.heading}
      description={process.description}
      items={process.steps}
      tone={process.tone}
      aside={
        <Figure
          ctx={ctx}
          id={process.image}
          sizes="(min-width: 1024px) 36rem, 100vw"
          className="aspect-[16/9] object-cover"
          bind={ctx.bind(doc, "process", "image")}
        />
      }
    />
  );
}

export function SolarPackages({ ctx }: { ctx: RenderContext }) {
  const { packages } = ctx.content.pages.solar;
  const items = ctx.packages("solar", packages.group);
  return (
    <section
      id={packages.id}
      aria-labelledby={`${packages.id}-heading`}
      className="py-14 lg:py-20"
      data-tone={packages.tone}
      {...ctx.bind(doc, "packages")}
    >
      <div className="tm-container">
        <h2 id={`${packages.id}-heading`} className="text-tm-h2 font-semibold" {...ctx.bind(doc, "packages", "heading")}>
          {ctx.t(packages.heading)}
        </h2>
        <div className="mt-8">
          {items.length > 0 ? (
            <PackageCompare
              ctx={ctx}
              items={items}
              cta={packages.packageCta}
              ctaBind={ctx.bind(doc, "packages", "packageCta")}
              variant="compare"
              className="lg:grid-cols-3"
            />
          ) : (
            <EmptyGroup ctx={ctx} />
          )}
        </div>
        {packages.notes.length > 0 ? (
          <ul className="mt-8 grid max-w-[48rem] list-disc gap-1 pl-5 text-tm-small text-tm-muted" {...ctx.bind(doc, "packages", "notes")}>
            {packages.notes.map((note, index) => (
              <li key={index} {...ctx.bind(doc, "packages", "notes", index)}>
                {ctx.t(note)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function SolarBundle({ ctx }: { ctx: RenderContext }) {
  const { bundle } = ctx.content.pages.solar;
  const logo = ctx.media(bundle.image);
  return (
    <section aria-labelledby="solar-bundle-heading" className="py-14 lg:py-20" data-tone={bundle.tone} {...ctx.bind(doc, "bundle")}>
      <div className="tm-container">
        <div className="grid gap-8 rounded-tm-panel border border-tm-line p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:p-10">
          <div>
            <h2 id="solar-bundle-heading" className="max-w-[40rem] text-tm-h3 font-semibold" {...ctx.bind(doc, "bundle", "heading")}>
              {ctx.t(bundle.heading)}
            </h2>
            <p className="mt-2 text-tm-muted" {...ctx.bind(doc, "bundle", "description")}>
              {ctx.t(bundle.description)}
            </p>
            <ul className="mt-5 grid gap-2" {...ctx.bind(doc, "bundle", "items")}>
              {bundle.items.map((item, index) => (
                <li key={index} className="flex gap-3" {...ctx.bind(doc, "bundle", "items", index)}>
                  <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-tm-red" />
                  {ctx.t(item)}
                </li>
              ))}
            </ul>
          </div>
          <Image
            src={logo.src}
            width={logo.width}
            height={logo.height}
            alt={ctx.t(logo.alt)}
            className="h-auto w-56 md:w-64"
            {...ctx.bind(doc, "bundle", "image")}
          />
        </div>
      </div>
    </section>
  );
}

export function SolarKnowledge({ ctx }: { ctx: RenderContext }) {
  const { knowledge } = ctx.content.pages.solar;
  return (
    <section
      aria-labelledby="solar-knowledge-heading"
      className="border-t border-tm-line py-14 lg:py-20"
      data-tone={knowledge.tone}
      {...ctx.bind(doc, "knowledge")}
    >
      <div className="tm-container grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
        <h2 id="solar-knowledge-heading" className="text-tm-h2 font-semibold" {...ctx.bind(doc, "knowledge", "heading")}>
          {ctx.t(knowledge.heading)}
        </h2>
        <div className="tm-faq divide-y divide-tm-line border-y border-tm-line">
          {knowledge.articles.map((article) => {
            const bind = (...path: (string | number)[]) => ctx.bind(doc, "knowledge", "articles", article.id, ...path);
            return (
              <details key={article.id} id={`knowledge-${article.id}`} {...bind()}>
                <summary className="flex min-h-tm-control items-center justify-between gap-6 py-5 text-tm-lead font-medium">
                  <span {...bind("title")}>{ctx.t(article.title)}</span>
                  <PlusIcon data-open-icon="" className="shrink-0 text-[1.35em]" />
                </summary>
                <div className="grid max-w-[46rem] gap-4 pb-6 text-tm-muted">
                  {article.body.map((paragraph, index) => (
                    <p key={index} {...bind("body", index)}>
                      {ctx.t(paragraph)}
                    </p>
                  ))}
                  {article.list.length > 0 ? (
                    <ol className="grid list-decimal gap-2 pl-6" {...bind("list")}>
                      {article.list.map((entry, index) => (
                        <li key={index} {...bind("list", index)}>
                          {ctx.t(entry)}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {article.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {article.images.map((id, index) => (
                        <Figure
                          key={id}
                          ctx={ctx}
                          id={id}
                          sizes="(min-width: 1024px) 22rem, 45vw"
                          className="aspect-[16/10] object-cover"
                          bind={bind("images", index)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
