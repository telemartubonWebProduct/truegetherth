import type { RenderContext } from "../context";
import { PageShell } from "../PageShell";
import { SolarAbout, SolarBundle, SolarHero, SolarKnowledge, SolarPackages, SolarProcess } from "../solar/SolarSections";

export function SolarPageView({ ctx }: { ctx: RenderContext }) {
  return (
    <PageShell ctx={ctx} path={ctx.content.pages.solar.path}>
      <SolarHero ctx={ctx} />
      <SolarAbout ctx={ctx} />
      <SolarProcess ctx={ctx} />
      <SolarPackages ctx={ctx} />
      <SolarBundle ctx={ctx} />
      <SolarKnowledge ctx={ctx} />
    </PageShell>
  );
}
