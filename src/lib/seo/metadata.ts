import type { Metadata } from "next";

import { mediaIn } from "@/lib/content/lookup";
import { tx } from "@/lib/content/render";
import type { Seo, SiteContent } from "@/lib/content/schema";
import { defaultLocale, localizePath, locales, type Locale } from "@/lib/i18n/locales";

/** Public origin for canonical URLs, sitemaps and social cards. */
export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.telemartubon.com");
}

const ogLocale: Record<Locale, string> = { th: "th_TH", en: "en_GB" };

/** Language alternates of one page: each language's URL plus x-default (Thai). */
export function languageAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizePath(path, locale)])),
    "x-default": localizePath(path, defaultLocale),
  };
}

export function pageMetadata({ locale, path, seo, content }: { locale: Locale; path: string; seo: Seo; content: SiteContent }): Metadata {
  const { site } = content;
  const image = mediaIn(content, seo.image ?? site.seo.image);
  const title = tx(seo.title, locale);
  const description = tx(seo.description, locale);
  const url = localizePath(path, locale);

  return {
    // Absolute, because a layout's title template does not reach the page of
    // its own segment (the home page).
    title: { absolute: `${title} | ${tx(site.seo.siteName, locale)}` },
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: tx(site.seo.siteName, locale),
      title,
      description,
      url,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((entry) => entry !== locale).map((entry) => ogLocale[entry]),
      images: [{ url: image.src, width: image.width, height: image.height, alt: tx(image.alt, locale) }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.src] },
    robots: seo.noindex ? { index: false, follow: true } : undefined,
  };
}
