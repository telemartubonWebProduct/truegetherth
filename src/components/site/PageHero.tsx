import type { ReactNode } from "react";

import type { DocumentId } from "@/lib/content/documents";
import type { LocalizedText } from "@/lib/content/schema";
import type { Tone } from "@/lib/content/theme";

import type { RenderContext } from "./context";

type Binding = { "data-edit"?: string };

type PageHeroProps = {
  ctx: RenderContext;
  heading: LocalizedText;
  description: LocalizedText;
  tone?: Tone;
  /** Editor bindings of the hero, its heading and its paragraph. */
  binds?: { section?: Binding; heading?: Binding; description?: Binding };
  /** Calls to action under the text. */
  actions?: ReactNode;
  /** Image or other media beside the text on wide screens, below it on phones. */
  media?: ReactNode;
  /** Small print under the actions, such as the service provider. */
  note?: ReactNode;
};

/** Opening block of an interior page: one heading, one paragraph, optional media. */
export function PageHero({ ctx, heading, description, tone = "canvas", binds = {}, actions, media, note }: PageHeroProps) {
  return (
    <section data-tone={tone} {...binds.section}>
      <div
        className={`tm-container grid gap-10 pb-10 pt-12 lg:pb-14 lg:pt-20 ${media ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-14" : ""}`}
      >
        <div className="max-w-[44rem]">
          <h1 className="text-balance text-tm-h1 font-semibold lg:text-tm-display" {...binds.heading}>
            {ctx.t(heading)}
          </h1>
          <p className="mt-4 text-tm-lead text-tm-muted" {...binds.description}>
            {ctx.t(description)}
          </p>
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
          {note ? <div className="mt-5 text-tm-small text-tm-muted">{note}</div> : null}
        </div>
        {media}
      </div>
    </section>
  );
}

/** Bindings of a hero object `{ heading, description, tone }` at `base` in a document. */
export function heroBinds(ctx: RenderContext, doc: DocumentId, ...base: string[]) {
  return {
    section: ctx.bind(doc, ...base),
    heading: ctx.bind(doc, ...base, "heading"),
    description: ctx.bind(doc, ...base, "description"),
  };
}
