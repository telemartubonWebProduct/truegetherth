import type { RenderContext } from "../context";
import { LegalText } from "../LegalText";
import { PageHero } from "../PageHero";
import { PageShell } from "../PageShell";

export function TermsPageView({ ctx }: { ctx: RenderContext }) {
  const page = ctx.content.pages.terms;
  return (
    <PageShell ctx={ctx} path={page.path}>
      <PageHero
        ctx={ctx}
        heading={page.heading}
        description={page.intro}
        binds={{ heading: ctx.bind("page:terms", "heading"), description: ctx.bind("page:terms", "intro") }}
      />
      <LegalText ctx={ctx} page={page} />
    </PageShell>
  );
}
