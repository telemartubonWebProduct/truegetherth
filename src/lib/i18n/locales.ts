// Thai is the default language and keeps the site's existing URLs (/broadband).
// English lives under /en with the same paths (/en/broadband).
export const locales = ["th", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "th";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Intl locale for numbers and dates. */
export const intlLocale: Record<Locale, string> = { th: "th-TH", en: "en-GB" };

/** Public URL of a site path ("/", "/broadband", "/broadband#cctv") in a language. */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/")) throw new Error(`Site paths start with "/": ${path}`);
  if (locale === defaultLocale) return path;
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** Splits a public pathname into its language and the unprefixed site path. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  for (const locale of locales) {
    if (locale === defaultLocale) continue;
    if (pathname === `/${locale}`) return { locale, path: "/" };
    if (pathname.startsWith(`/${locale}/`)) return { locale, path: pathname.slice(locale.length + 1) };
  }
  return { locale: defaultLocale, path: pathname };
}
