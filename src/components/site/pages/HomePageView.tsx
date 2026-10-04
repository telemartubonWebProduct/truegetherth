import type { RenderContext } from "../context";
import { Landing } from "../home/Landing";
import { ScrollDriver } from "../home/ScrollDriver";
import { PageShell } from "../PageShell";

/**
 * The home page: the scroll landing (docs/renovation/R5-LANDING.md). In the
 * Mirror editor's preview its stages lie flat, so every field can be clicked.
 */
export function HomePageView({ ctx }: { ctx: RenderContext }) {
  return (
    <PageShell ctx={ctx} path={ctx.content.pages.home.path} flush>
      <ScrollDriver locked={ctx.edit} />
      <Landing ctx={ctx} />
    </PageShell>
  );
}
