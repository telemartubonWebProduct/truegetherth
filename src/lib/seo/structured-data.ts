import { mediaIn } from "@/lib/content/lookup";
import { tx } from "@/lib/content/render";
import type { SiteContent } from "@/lib/content/schema";
import { localizePath, locales, type Locale } from "@/lib/i18n/locales";

import { siteUrl } from "./metadata";

// Structured data (schema.org, JSON-LD) for search engines: who runs the site,
// what the site is, where a page sits in it, and the questions a page answers.
// Everything is read from the content, so it says what the pages say. No
// price is given here: package prices are imported and not yet verified.

type Node = Record<string, unknown>;

const absolute = (path: string) => new URL(path, siteUrl()).href;

/** A Thai number (0XXXXXXXXX) in international form. */
const international = (number: string) => `+66${number.slice(1)}`;

/**
 * The business behind the site: its trading and legal names, what it is (the
 * footer's statement that it is an appointed dealer and not True itself), how
 * to reach it and where its head office is.
 */
export function organizationData(content: SiteContent, locale: Locale): Node {
  const { brand, contact, footer } = content.site;
  const logo = mediaIn(content, brand.logo);
  return {
    "@type": "Organization",
    "@id": absolute("/#organization"),
    name: tx(brand.name, locale),
    legalName: tx(brand.legalName, locale),
    url: absolute(localizePath("/", locale)),
    logo: absolute(logo.src),
    description: tx(footer.about, locale),
    email: contact.email,
    areaServed: { "@type": "Country", name: "TH" },
    address: { "@type": "PostalAddress", addressLocality: tx(contact.office, locale), addressCountry: "TH" },
    hasMap: contact.mapUrl,
    contactPoint: contact.phones.map((phone) => ({
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: international(phone.number),
      areaServed: "TH",
      availableLanguage: [...locales],
      description: tx(contact.hours, locale),
    })),
    sameAs: [contact.facebook, contact.lineSales],
  };
}

export function websiteData(content: SiteContent, locale: Locale): Node {
  return {
    "@type": "WebSite",
    "@id": absolute("/#website"),
    name: tx(content.site.seo.siteName, locale),
    url: absolute(localizePath("/", locale)),
    inLanguage: locale,
    publisher: { "@id": absolute("/#organization") },
  };
}

/** The way from the home page to a page: each step's name and its path in the site. */
export function breadcrumbData(trail: { name: string; path: string }[], locale: Locale): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: step.name,
      item: absolute(localizePath(step.path, locale)),
    })),
  };
}

/** The questions a page answers, with their answers as the page gives them. */
export function faqData(items: { question: string; answer: string }[]): Node {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
  };
}

/** One JSON-LD document of several nodes, safe to put inside a script element. */
export function jsonLd(nodes: Node[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
