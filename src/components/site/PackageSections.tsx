import type { DocumentId } from "@/lib/content/documents";
import type { PackagePage } from "@/lib/content/schema";

import type { RenderContext } from "./context";
import { ExplorableGroup, NoMatches } from "./explorer/PackageExplorer";
import { ContactLink } from "./links";
import { PackageCompare } from "./PackageCompare";

/** Shown where every package of a group is still hidden for review. */
export function EmptyGroup({ ctx }: { ctx: RenderContext }) {
  const { ui } = ctx.site;
  return (
    <div className="rounded-tm-panel bg-tm-surface px-5 py-6 sm:px-6">
      <p className="max-w-[40rem]" {...ctx.bind("site", "ui", "emptyGroup")}>
        {ctx.t(ui.emptyGroup)}
      </p>
      <ContactLink ctx={ctx} channel="line-sales" ctaId="empty-group-line" className="tm-button tm-button-secondary mt-4">
        {ctx.t(ui.chatOnLine)}
      </ContactLink>
    </div>
  );
}

/** In-page links to each section; the section ids are the old site's anchors. */
function JumpNav({ ctx, page }: { ctx: RenderContext; page: PackagePage }) {
  const labelId = `${page.id}-jump`;
  const doc = `page:${page.id}` as DocumentId;
  return (
    <nav aria-labelledby={labelId} className="border-b border-tm-line">
      <div className="tm-container flex items-center gap-3 overflow-x-auto py-3">
        <p id={labelId} className="shrink-0 text-tm-small text-tm-muted" {...ctx.bind("site", "ui", "jumpTo")}>
          {ctx.t(ctx.site.ui.jumpTo)}
        </p>
        <ul className="flex gap-2">
          {page.sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex min-h-tm-control items-center whitespace-nowrap rounded-tm-pill border border-tm-line px-4 text-tm-small font-medium hover:border-tm-ink"
                {...ctx.bind(doc, "sections", section.id, "heading")}
              >
                {ctx.t(section.heading)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function PackageSections({ ctx, page }: { ctx: RenderContext; page: PackagePage }) {
  const doc = `page:${page.id}` as DocumentId;
  return (
    <>
      {page.sections.length > 1 ? <JumpNav ctx={ctx} page={page} /> : null}
      {page.sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-heading`}
          className={`py-12 lg:py-16 ${index > 0 ? "border-t border-tm-line" : ""}`}
          data-tone={section.tone}
          {...ctx.bind(doc, "sections", section.id)}
        >
          <div className="tm-container">
            <h2 id={`${section.id}-heading`} className="text-tm-h2 font-semibold" {...ctx.bind(doc, "sections", section.id, "heading")}>
              {ctx.t(section.heading)}
            </h2>
            {section.description ? (
              <p className="mt-2 max-w-[42rem] text-tm-muted" {...ctx.bind(doc, "sections", section.id, "description")}>
                {ctx.t(section.description)}
              </p>
            ) : null}
            <div className="mt-8 grid gap-12">
              <NoMatches packageIds={section.groups.flatMap((group) => ctx.packages(group.category, group.group).map((item) => item.id))} />
              {section.groups.map((group) => {
                const items = ctx.packages(group.category, group.group);
                return (
                  <ExplorableGroup key={group.id} packageIds={items.map((item) => item.id)}>
                    {group.heading ? (
                      <h3 className="text-tm-h4 font-semibold" {...ctx.bind(doc, "sections", section.id, "groups", group.id, "heading")}>
                        {ctx.t(group.heading)}
                      </h3>
                    ) : null}
                    {group.description ? (
                      <p className="mt-1 max-w-[42rem] text-tm-muted" {...ctx.bind(doc, "sections", section.id, "groups", group.id, "description")}>
                        {ctx.t(group.description)}
                      </p>
                    ) : null}
                    <div className={group.heading || group.description ? "mt-4" : ""}>
                      {items.length > 0 ? (
                        <PackageCompare
                          ctx={ctx}
                          items={items}
                          cta={page.packageCta}
                          ctaBind={ctx.bind(doc, "packageCta")}
                          variant={page.layout}
                          headingLevel={group.heading ? 4 : 3}
                        />
                      ) : (
                        <EmptyGroup ctx={ctx} />
                      )}
                    </div>
                  </ExplorableGroup>
                );
              })}
            </div>
            {section.notes.length > 0 ? (
              <ul className="mt-8 grid max-w-[48rem] list-disc gap-1 pl-5 text-tm-small text-tm-muted" {...ctx.bind(doc, "sections", section.id, "notes")}>
                {section.notes.map((note, noteIndex) => (
                  <li key={noteIndex} {...ctx.bind(doc, "sections", section.id, "notes", noteIndex)}>
                    {ctx.t(note)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </>
  );
}
