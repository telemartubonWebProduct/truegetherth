import type { DocumentId } from "@/lib/content/documents";
import type { PackagePage } from "@/lib/content/schema";
import { localizePath } from "@/lib/i18n/locales";

import type { RenderContext } from "./context";
import { PlusIcon } from "./icons";

/** Questions and answers under a package page's cards, folded like the solar page's. */
export function PackageFaq({ ctx, page }: { ctx: RenderContext; page: PackagePage }) {
  const faq = page.faq;
  if (!faq) return null;
  const doc = `page:${page.id}` as DocumentId;
  return (
    <section aria-labelledby="faq-heading" id="faq" className="border-t border-tm-line py-12 lg:py-16" data-tone="canvas" {...ctx.bind(doc, "faq")}>
      <div className="tm-container grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
        <h2 id="faq-heading" className="text-tm-h2 font-semibold" {...ctx.bind(doc, "faq", "heading")}>
          {ctx.t(faq.heading)}
        </h2>
        <div className="tm-faq divide-y divide-tm-line border-y border-tm-line">
          {faq.items.map((item) => (
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
        {page.id === "broadband-new" ? (
          <div className="flex flex-wrap gap-3 lg:col-start-2">
            {[ctx.content.pages.contact, ctx.content.pages.agent].map((destination) => (
              <a key={destination.id} href={localizePath(destination.path, ctx.locale)} className="tm-button tm-button-secondary">
                {ctx.t(destination.hero.heading)}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
