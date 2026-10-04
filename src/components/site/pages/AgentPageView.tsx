import Image from "next/image";

import type { RenderContext } from "../context";
import { CtaLink } from "../links";
import { heroBinds, PageHero } from "../PageHero";
import { PageShell } from "../PageShell";
import { Steps } from "../Steps";

const doc = "page:apply-with-agent" as const;

export function AgentPageView({ ctx }: { ctx: RenderContext }) {
  const page = ctx.content.pages.agent;
  const image = ctx.media(page.hero.image);
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
        media={
          <Image
            src={image.src}
            width={image.width}
            height={image.height}
            alt={ctx.t(image.alt)}
            preload
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="aspect-[16/9] w-full rounded-tm-panel object-cover"
            {...ctx.bind(doc, "hero", "image")}
          />
        }
      />
      <Steps
        ctx={ctx}
        id="agent-steps"
        doc={doc}
        base={["steps"]}
        itemsKey="items"
        heading={page.steps.heading}
        items={page.steps.items}
        tone={page.steps.tone}
      />
    </PageShell>
  );
}
