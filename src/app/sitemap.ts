import type { MetadataRoute } from "next";

import { publicPages } from "@/content/routes";
import { detailPackagesIn } from "@/lib/content/lookup";
import { packageDetailPath } from "@/lib/content/package-facts";
import { getPublishedContent } from "@/lib/content/published";
import { localizePath, locales } from "@/lib/i18n/locales";
import { languageAlternates, siteUrl } from "@/lib/seo/metadata";

// Every public page and package page in both languages, each listing its alternates.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const absolute = (path: string) => new URL(path, origin).href;
  const content = await getPublishedContent();
  const paths = [...publicPages.map((entry) => entry.path), ...detailPackagesIn(content).map((item) => packageDetailPath(item.id))];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: absolute(localizePath(path, locale)),
      alternates: {
        languages: Object.fromEntries(Object.entries(languageAlternates(path)).map(([lang, href]) => [lang, absolute(href)])),
      },
    })),
  );
}
