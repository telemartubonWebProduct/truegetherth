import { CallbackSection } from "../CallbackSection";
import { ContactChannels } from "../ContactChannels";
import type { RenderContext } from "../context";
import { TargetLink } from "../links";
import { heroBinds, PageHero } from "../PageHero";
import { PageShell } from "../PageShell";

// The old page's email form is replaced by the call-back request of M5, which
// stores requests in Supabase (CallbackSection).
export function ContactPageView({ ctx }: { ctx: RenderContext }) {
  const page = ctx.content.pages.contact;
  return (
    <PageShell ctx={ctx} path={page.path} contactBand={false}>
      <PageHero
        ctx={ctx}
        heading={page.hero.heading}
        description={page.hero.description}
        tone={page.hero.tone}
        binds={heroBinds(ctx, "page:contact", "hero")}
      />
      <ContactChannels ctx={ctx} page={page} />
      <CallbackSection ctx={ctx} page={page} />
      <div className="tm-container border-t border-tm-line py-8">
        <TargetLink ctx={ctx} target={{ kind: "page", path: ctx.content.pages.agent.path }} className="tm-link">
          {ctx.t(ctx.content.pages.agent.steps.heading)}
        </TargetLink>
      </div>
    </PageShell>
  );
}
