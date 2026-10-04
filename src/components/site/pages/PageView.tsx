import { pagePaths, type PageDocumentId } from "@/lib/content/documents";
import { packagePageIn } from "@/lib/content/lookup";

import type { RenderContext } from "../context";
import { PackagePageView } from "../PackagePageView";
import { AgentPageView } from "./AgentPageView";
import { ContactPageView } from "./ContactPageView";
import { HomePageView } from "./HomePageView";
import { SolarPageView } from "./SolarPageView";
import { TermsPageView } from "./TermsPageView";

/** The page template for a page document: what the public route and the editor preview render. */
export function PageView({ ctx, pageId }: { ctx: RenderContext; pageId: PageDocumentId }) {
  switch (pageId) {
    case "home":
      return <HomePageView ctx={ctx} />;
    case "solar":
      return <SolarPageView ctx={ctx} />;
    case "contact":
      return <ContactPageView ctx={ctx} />;
    case "apply-with-agent":
      return <AgentPageView ctx={ctx} />;
    case "terms":
      return <TermsPageView ctx={ctx} />;
    default:
      return <PackagePageView ctx={ctx} page={packagePageIn(ctx.content, pagePaths[pageId])} />;
  }
}
