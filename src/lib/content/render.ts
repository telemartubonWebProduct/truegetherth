import { intlLocale, localizePath, type Locale } from "@/lib/i18n/locales";

import type { LinkTarget, LocalizedText, SiteSettings } from "./schema";

// Helpers shared by the public renderer and, later, the Mirror editor preview.
// They are plain functions of their inputs so the same components can render
// on the server and in the browser.

export function tx(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

export type ResolvedLink = { href: string; external: boolean };

/** True when a link points at the page being rendered (not at a section of it). */
export function isCurrent(target: LinkTarget, path: string): boolean {
  return target.kind === "page" && target.path === path && !target.hash;
}

/** Local mobile number (0910192552) as an international tel: URL. */
export function telHref(number: string): string {
  return `tel:+66${number.replace(/^0/, "")}`;
}

/** 0910192552 -> 091-019-2552, 021234567 -> 02-123-4567 */
export function formatPhone(number: string): string {
  if (/^0[689]\d{8}$/.test(number)) return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  if (/^0\d{8}$/.test(number)) return `${number.slice(0, 2)}-${number.slice(2, 5)}-${number.slice(5)}`;
  return number;
}

export function resolveLink(target: LinkTarget, locale: Locale, site: SiteSettings): ResolvedLink {
  switch (target.kind) {
    case "page":
      return { href: localizePath(target.hash ? `${target.path}#${target.hash}` : target.path, locale), external: false };
    case "external":
      return { href: target.url, external: true };
    case "contact":
      switch (target.channel) {
        case "line-sales":
          return { href: site.contact.lineSales, external: true };
        case "line-service":
          return { href: site.contact.lineService, external: true };
        case "phone-sales":
          return { href: telHref(site.contact.phones[0].number), external: false };
        case "email":
          return { href: `mailto:${site.contact.email}`, external: false };
        case "facebook":
          return { href: site.contact.facebook, external: true };
      }
  }
}

/** Prices and speeds: 1199 -> "1,199", 31.03 -> "31.03", 1.5 -> "1.5". */
export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: 2 }).format(value);
}
