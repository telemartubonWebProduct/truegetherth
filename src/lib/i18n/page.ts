import { notFound } from "next/navigation";

import { isLocale, type Locale } from "./locales";

/** The page's language from its route params; unknown values are a 404. */
export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
