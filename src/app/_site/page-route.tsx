import type { Metadata } from "next";

import { renderContext } from "@/components/site/context";
import { PageView } from "@/components/site/pages/PageView";
import { readDocument, type PageDocumentId } from "@/lib/content/documents";
import { getPublishedContent } from "@/lib/content/published";
import { tx } from "@/lib/content/render";
import type { LocalizedText, Seo } from "@/lib/content/schema";
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
    const page = readDocument(content, `page:${pageId}`) as {
      path: string;
      seo: Seo;
      faq?: { items: { question: LocalizedText; answer: LocalizedText }[] };
    };
    // For search engines: every page but the home page has its place under the home page, and a page
    // with questions and answers (the home page, a package page that has them) gives them as an FAQPage.
    const questions = page.faq?.items.map((item) => ({ question: tx(item.question, locale), answer: tx(item.answer, locale) })) ?? [];
    const data = [
      ...(pageId === "home"
        ? []
        : [
            breadcrumbData(
              [
                { name: tx(content.site.ui.homeLink, locale), path: "/" },
                { name: tx(page.seo.title, locale), path: page.path },
              ],
              locale,
            ),
          ]),
      ...(questions.length > 0 ? [faqData(questions)] : []),
    ];
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
        <PageView ctx={renderContext(content, locale, { leads })} pageId={pageId} />
      </>
    );
  }

  return { generateMetadata, Page };
}
