import type { DocumentId } from "@/lib/content/documents";
import type { PackagePage } from "@/lib/content/schema";

import type { RenderContext } from "./context";
import { explorerProps } from "./explorer/explorer-data";
import { PackageExplorer } from "./explorer/PackageExplorer";
import { PackageSections } from "./PackageSections";
import { heroBinds, PageHero } from "./PageHero";
import { PageShell } from "./PageShell";

/** One template for every package page: hero, filters and comparison, section links, sections. */
export function PackagePageView({ ctx, page }: { ctx: RenderContext; page: PackagePage }) {
  const items = page.sections.flatMap((section) => section.groups.flatMap((group) => ctx.packages(group.category, group.group)));
  const unique = items.filter((item, index) => items.findIndex((entry) => entry.id === item.id) === index);
  return (
    <PageShell ctx={ctx} path={page.path}>
      <PageHero
        ctx={ctx}
        heading={page.hero.heading}
        description={page.hero.description}
        tone={page.hero.tone}
        binds={heroBinds(ctx, `page:${page.id}` as DocumentId, "hero")}
      />
      <PackageExplorer {...explorerProps(ctx, unique, page.packageCta)}>
        <PackageSections ctx={ctx} page={page} />
      </PackageExplorer>
    </PageShell>
  );
}
