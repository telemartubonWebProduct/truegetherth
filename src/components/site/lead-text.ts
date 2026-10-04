import type { Segment } from "@/lib/content/paths";
import type { LocalizedText } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";

// Copy for client components: the same shape as the content, with each text
// in the page's language, and (in the editor preview) each text's edit
// binding, so a client component can be clicked to edit like any other.

export type Localized<T> = { [K in keyof T]: T[K] extends LocalizedText ? string : Localized<T[K]> };
export type Binding = { "data-edit"?: string };
export type Bound<T> = { [K in keyof T]: T[K] extends LocalizedText ? Binding : Bound<T[K]> };

function isLocalized(value: unknown): value is LocalizedText {
  return typeof value === "object" && value !== null && "th" in value && "en" in value;
}

export function localize<T extends object>(value: T, locale: Locale): Localized<T> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, isLocalized(entry) ? entry[locale] : localize(entry as object, locale)]),
  ) as Localized<T>;
}

export function bindAll<T extends object>(value: T, bind: (...path: Segment[]) => Binding, path: Segment[]): Bound<T> {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, isLocalized(entry) ? bind(...path, key) : bindAll(entry as object, bind, [...path, key])]),
  ) as Bound<T>;
}
