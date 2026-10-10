import type { Metadata } from "next";

import { renderContext } from "@/components/site/context";
import { PageView } from "@/components/site/pages/PageView";
import { readDocument, type PageDocumentId } from "@/lib/content/documents";
import { getPublishedContent } from "@/lib/content/published";
import { tx } from "@/lib/content/render";
import type { Seo } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";
import { leadIntakeEnabled } from "@/lib/leads/intake";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbData, faqData, jsonLd } from "@/lib/seo/structured-data";

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
    const page = readDocument(content, `page:${pageId}`) as { path: string; seo: Seo };
    // For search engines: the home page's questions and answers, and every other page's place under the home page.
    const data =
      pageId === "home"
        ? faqData(content.pages.home.faq.items.map((item) => ({ question: tx(item.question, locale), answer: tx(item.answer, locale) })))
        : breadcrumbData(
            [
              { name: tx(content.site.ui.homeLink, locale), path: "/" },
              { name: tx(page.seo.title, locale), path: page.path },
            ],
            locale,
          );
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([data]) }} />
        <PageView ctx={renderContext(content, locale, { leads })} pageId={pageId} />
      </>
    );
  }

  return { generateMetadata, Page };
}
