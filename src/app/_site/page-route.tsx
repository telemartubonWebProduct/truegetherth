import type { Metadata } from "next";

import { AdsConversion } from "@/components/site/AdsConversion";
import { renderContext } from "@/components/site/context";
import { PageView } from "@/components/site/pages/PageView";
import { readDocument, type PageDocumentId } from "@/lib/content/documents";
import { getPublishedContent } from "@/lib/content/published";
import type { Seo } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";
import { leadIntakeEnabled } from "@/lib/leads/intake";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";

// Every public page route renders the same way: the published content (M4),
// the page's template, and metadata from the page's SEO fields. The route
// files under (th) and (en) only say which page and which language.

export function pageRoute(pageId: PageDocumentId, locale: Locale) {
  async function generateMetadata(): Promise<Metadata> {
    const content = await getPublishedContent();
    const page = readDocument(content, `page:${pageId}`) as { path: string; seo: Seo };
    return pageMetadata({ locale, path: page.path, seo: page.seo, content });
  }

  async function Page() {
    const content = await getPublishedContent();
    const leads = leadIntakeEnabled() ? "live" : "off";
    return (
      <>
        <PageView ctx={renderContext(content, locale, { leads })} pageId={pageId} />
        {/* Every opening of the home page on the production domain counts as a Google Ads conversion, as on the old site. */}
        {pageId === "home" ? <AdsConversion sendTo={content.site.integrations.googleAdsHomeConversion} productionHost={siteUrl().hostname} /> : null}
      </>
    );
  }

  return { generateMetadata, Page };
}
