import type { ReactNode } from "react";

import type { DocumentId } from "@/lib/content/documents";
import type { LocalizedText } from "@/lib/content/schema";
import type { Tone } from "@/lib/content/theme";

import type { RenderContext } from "./context";

type StepsProps = {
  ctx: RenderContext;
  /** Prefix for the heading id; unique on the page. */
  id: string;
  /** The steps object in its document, and the name of its list of steps. */
  doc: DocumentId;
  base: string[];
  itemsKey: "items" | "steps";
  heading: LocalizedText;
  description?: LocalizedText;
  items: { id: string; title: LocalizedText; description: LocalizedText }[];
  tone?: Tone;
  /** Image or note beside the heading on wide screens. */
  aside?: ReactNode;
};

/** Numbered steps: used only where the content really is a sequence. */
export function Steps({ ctx, id, doc, base, itemsKey, heading, description, items, tone = "canvas", aside }: StepsProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="border-t border-tm-line py-14 lg:py-20" data-tone={tone} {...ctx.bind(doc, ...base)}>
      <div className="tm-container">
        <div className={aside ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14" : ""}>
          <div className="max-w-[40rem]">
            <h2 id={`${id}-heading`} className="text-tm-h2 font-semibold" {...ctx.bind(doc, ...base, "heading")}>
              {ctx.t(heading)}
            </h2>
            {description ? (
              <p className="mt-2 text-tm-muted" {...ctx.bind(doc, ...base, "description")}>
                {ctx.t(description)}
              </p>
            ) : null}
          </div>
          {aside}
        </div>
        <ol className={`mt-10 grid gap-x-6 gap-y-10 ${items.length > 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-3"}`}>
          {items.map((item, index) => (
            <li key={item.id} className="border-t-2 border-tm-ink pt-5" {...ctx.bind(doc, ...base, itemsKey, item.id)}>
              <p aria-hidden="true" className="tm-num text-tm-h1 font-semibold leading-none">
                {index + 1}
              </p>
              <h3 className="mt-4 text-tm-h4 font-semibold" {...ctx.bind(doc, ...base, itemsKey, item.id, "title")}>
                {ctx.t(item.title)}
              </h3>
              <p className="mt-2 text-tm-muted" {...ctx.bind(doc, ...base, itemsKey, item.id, "description")}>
                {ctx.t(item.description)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
