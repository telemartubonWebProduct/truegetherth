import type { RenderContext } from "../context";
import { PlusIcon } from "../icons";
import { CtaLink, TargetLink } from "../links";
import { heroBinds, PageHero } from "../PageHero";
import { PageShell } from "../PageShell";

const doc = "page:ubon" as const;

/**
 * The page for a search for True home internet in Ubon Ratchathani: the head
 * office with its postal address, map and hours, the provinces the team
 * looks after, then the questions such a
 * visitor asks. The channels to reach the team are the shell's contact band.
 */
export function LocalPageView({ ctx }: { ctx: RenderContext }) {
  const page = ctx.content.pages.ubon;
  if (!page) return null;
  const { contact } = ctx.content.site;
  const { address } = contact;
  return (
    <PageShell ctx={ctx} path={page.path}>
      <PageHero
        ctx={ctx}
        heading={page.hero.heading}
        description={page.hero.description}
        tone={page.hero.tone}
        binds={heroBinds(ctx, doc, "hero")}
        actions={
          <>
            <CtaLink ctx={ctx} cta={page.hero.primaryCta} bind={ctx.bind(doc, "hero", "primaryCta")} />
            <CtaLink ctx={ctx} cta={page.hero.secondaryCta} bind={ctx.bind(doc, "hero", "secondaryCta")} />
          </>
        }
      />
      <section aria-labelledby="office-heading" id="office" className="border-t border-tm-line py-12 lg:py-16" data-tone={page.office.tone} {...ctx.bind(doc, "office")}>
        <div className="tm-container grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
          <h2 id="office-heading" className="text-tm-h2 font-semibold" {...ctx.bind(doc, "office", "heading")}>
            {ctx.t(page.office.heading)}
          </h2>
          <div className="max-w-[46rem]">
            {address ? (
              <address className="text-tm-lead not-italic" {...ctx.bind("site", "contact", "address")}>
                <span className="block">
                  {ctx.t(address.street)}
                  {ctx.locale === "th" ? " " : ", "}
                  {ctx.t(address.subdistrict)}
                </span>
                <span className="block">
                  {ctx.t(address.district)}
                  {ctx.locale === "th" ? " " : ", "}
                  {ctx.t(address.province)} {address.postalCode}
                </span>
              </address>
            ) : null}
            <p className="mt-3 text-tm-muted" {...ctx.bind("site", "contact", "hours")}>
              {ctx.t(contact.hours)}
            </p>
            <p className="mt-3 text-tm-muted" {...ctx.bind(doc, "office", "description")}>
              {ctx.t(page.office.description)}
            </p>
            <p className="mt-5">
              <TargetLink ctx={ctx} target={{ kind: "external", url: contact.mapUrl }} className="tm-link" bind={ctx.bind(doc, "office", "mapLabel")}>
                {ctx.t(page.office.mapLabel)}
              </TargetLink>
            </p>
          </div>
        </div>
      </section>
      {page.serviceArea ? (
        <section aria-labelledby="area-heading" id="area" className="border-t border-tm-line py-12 lg:py-16" data-tone={page.serviceArea.tone} {...ctx.bind(doc, "serviceArea")}>
          <div className="tm-container grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
            <h2 id="area-heading" className="text-tm-h2 font-semibold" {...ctx.bind(doc, "serviceArea", "heading")}>
              {ctx.t(page.serviceArea.heading)}
            </h2>
            <div className="max-w-[46rem]">
              <ul className="text-tm-lead" {...ctx.bind(doc, "serviceArea", "provinces")}>
                {page.serviceArea.provinces.map((province, index) => (
                  <li key={index}>{ctx.t(province)}</li>
                ))}
              </ul>
              <p className="mt-3 text-tm-muted" {...ctx.bind(doc, "serviceArea", "description")}>
                {ctx.t(page.serviceArea.description)}
              </p>
            </div>
          </div>
        </section>
      ) : null}
      <section aria-labelledby="faq-heading" id="faq" className="border-t border-tm-line py-12 lg:py-16" data-tone="canvas" {...ctx.bind(doc, "faq")}>
        <div className="tm-container grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
          <h2 id="faq-heading" className="text-tm-h2 font-semibold" {...ctx.bind(doc, "faq", "heading")}>
            {ctx.t(page.faq.heading)}
          </h2>
          <div className="tm-faq divide-y divide-tm-line border-y border-tm-line">
            {page.faq.items.map((item) => (
              <details key={item.id} id={`faq-${item.id}`} {...ctx.bind(doc, "faq", "items", item.id)}>
                <summary className="flex min-h-tm-control items-center justify-between gap-6 py-5 text-tm-lead font-medium">
                  <span {...ctx.bind(doc, "faq", "items", item.id, "question")}>{ctx.t(item.question)}</span>
                  <PlusIcon data-open-icon="" className="shrink-0 text-[1.35em]" />
                </summary>
                <p className="max-w-[46rem] pb-6 text-tm-muted" {...ctx.bind(doc, "faq", "items", item.id, "answer")}>
                  {ctx.t(item.answer)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
