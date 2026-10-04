import { z, type ZodType } from "zod";

import {
  agentPage,
  benefit,
  catalogPackage,
  contactPage,
  homePage,
  legalPage,
  mediaAsset,
  packagePage,
  packageRef,
  siteSettings,
  solarPage,
  type SiteContent,
} from "./schema";

// The content is stored and edited as separate documents, so a draft of one
// package or one page never overwrites another's (ARCHITECTURE.md §4–§5):
//
//   site               site settings: brand, navigation, footer, contacts, copy, theme
//   page:<id>          one page template (home, broadband-new, …, terms)
//   package:<id>       one catalog package
//   media:<id>         one media asset (file, size, alt text, provenance)
//   benefit:<id>       one package benefit (label and icon)
//   catalog            the order of the packages
//
// Packages, media and benefits can also be added and removed (R4): a draft of
// one that the published content lacks adds it, and a tombstone removes it.

export const pageDocumentIds = [
  "home",
  "broadband-new",
  "broadband-existing",
  "mobile-monthly",
  "mobile-prepaid",
  "solar",
  "contact",
  "apply-with-agent",
  "terms",
] as const;
export type PageDocumentId = (typeof pageDocumentIds)[number];

export type DocumentId = "site" | "catalog" | `page:${PageDocumentId}` | CollectionDocumentId;
export type CollectionDocumentId = `package:${string}` | `media:${string}` | `benefit:${string}`;

const collectionPattern = /^(package|media|benefit):[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isDocumentId(value: string): value is DocumentId {
  if (value === "site" || value === "catalog") return true;
  if (value.startsWith("page:")) return (pageDocumentIds as readonly string[]).includes(value.slice(5));
  return collectionPattern.test(value);
}

/** Documents that can be added and removed: packages, media and benefits. */
export function isCollectionDocument(id: DocumentId): id is CollectionDocumentId {
  return collectionPattern.test(id);
}

/** The order of the packages, as its own document so reordering never rewrites a package. */
export const catalogOrder = z.strictObject({ order: z.array(packageRef) });

/** What a draft stores to remove a package, a picture or a benefit. */
export const TOMBSTONE = { $deleted: true } as const;

export function isTombstone(body: unknown): boolean {
  return typeof body === "object" && body !== null && (body as Record<string, unknown>).$deleted === true;
}

const packagePageIds = new Set<string>(["broadband-new", "broadband-existing", "mobile-monthly", "mobile-prepaid"]);

/** The schema one document must satisfy. */
export function documentSchema(id: DocumentId): ZodType {
  if (id === "site") return siteSettings;
  if (id === "catalog") return catalogOrder;
  const [kind, key] = id.split(":") as [string, string];
  switch (kind) {
    case "package":
      return catalogPackage;
    case "media":
      return mediaAsset;
    case "benefit":
      return benefit;
  }
  if (packagePageIds.has(key)) return packagePage;
  switch (key as PageDocumentId) {
    case "home":
      return homePage;
    case "solar":
      return solarPage;
    case "contact":
      return contactPage;
    case "apply-with-agent":
      return agentPage;
    default:
      return legalPage;
  }
}

// The catalog document is derived from the package list. One object per list,
// so it keeps its identity while the list does: the editor's autosave compares
// bodies by identity to tell whether a document changed since it was saved.
const catalogDocuments = new WeakMap<SiteContent["catalog"], { order: string[] }>();

function catalogDocument(catalog: SiteContent["catalog"]): { order: string[] } {
  let document = catalogDocuments.get(catalog);
  if (!document) {
    document = { order: catalog.map((item) => item.id) };
    catalogDocuments.set(catalog, document);
  }
  return document;
}

/** The current value of a document in one version of the content, or undefined if it does not exist. */
export function readDocument(content: SiteContent, id: DocumentId): unknown {
  if (id === "site") return content.site;
  if (id === "catalog") return catalogDocument(content.catalog);
  const [kind, key] = id.split(":") as [string, string];
  switch (kind) {
    case "package":
      return content.catalog.find((item) => item.id === key);
    case "media":
      return content.media[key];
    case "benefit":
      return content.benefits[key];
  }
  const pages = content.pages;
  switch (key as PageDocumentId) {
    case "home":
      return pages.home;
    case "solar":
      return pages.solar;
    case "contact":
      return pages.contact;
    case "apply-with-agent":
      return pages.agent;
    case "terms":
      return pages.terms;
    default:
      return pages.packages.find((doc) => doc.id === key);
  }
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([entry]) => entry !== key));
}

/** Packages in the catalog's order; ids it does not name keep their place after the named ones. */
function reorder(catalog: SiteContent["catalog"], order: readonly string[]): SiteContent["catalog"] {
  const rank = new Map(order.map((id, index) => [id, index]));
  return catalog
    .map((item, index) => ({ item, key: rank.get(item.id) ?? order.length + index }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/**
 * A new version of the content with one document replaced. The body must
 * already satisfy documentSchema(id). Pages and settings can only be
 * replaced; packages, media and benefits are added when new and removed when
 * the body is undefined.
 */
export function writeDocument(content: SiteContent, id: DocumentId, body: unknown): SiteContent {
  const exists = readDocument(content, id) !== undefined;
  if (!exists && !isCollectionDocument(id)) throw new Error(`No document ${id} to replace`);
  if (body === undefined && !isCollectionDocument(id)) throw new Error(`Document ${id} cannot be removed`);
  if (id === "site") return { ...content, site: body as SiteContent["site"] };
  if (id === "catalog") return { ...content, catalog: reorder(content.catalog, (body as z.infer<typeof catalogOrder>).order) };
  const [kind, key] = id.split(":") as [string, string];
  switch (kind) {
    case "package": {
      const item = body as SiteContent["catalog"][number] | undefined;
      if (item === undefined) return { ...content, catalog: content.catalog.filter((entry) => entry.id !== key) };
      return exists
        ? { ...content, catalog: content.catalog.map((entry) => (entry.id === key ? item : entry)) }
        : { ...content, catalog: [...content.catalog, item] };
    }
    case "media":
      return { ...content, media: body === undefined ? without(content.media, key) : { ...content.media, [key]: body as SiteContent["media"][string] } };
    case "benefit":
      return { ...content, benefits: body === undefined ? without(content.benefits, key) : { ...content.benefits, [key]: body as SiteContent["benefits"][string] } };
  }
  const pages = content.pages;
  switch (key as PageDocumentId) {
    case "home":
      return { ...content, pages: { ...pages, home: body as typeof pages.home } };
    case "solar":
      return { ...content, pages: { ...pages, solar: body as typeof pages.solar } };
    case "contact":
      return { ...content, pages: { ...pages, contact: body as typeof pages.contact } };
    case "apply-with-agent":
      return { ...content, pages: { ...pages, agent: body as typeof pages.agent } };
    case "terms":
      return { ...content, pages: { ...pages, terms: body as typeof pages.terms } };
    default:
      return {
        ...content,
        pages: { ...pages, packages: pages.packages.map((doc) => (doc.id === key ? (body as (typeof pages.packages)[number]) : doc)) },
      };
  }
}

/** Every document in one version of the content. */
export function documentIds(content: SiteContent): DocumentId[] {
  return [
    "site",
    "catalog",
    ...pageDocumentIds.map((id) => `page:${id}` as const),
    ...content.catalog.map((item) => `package:${item.id}` as const),
    ...Object.keys(content.media).map((id) => `media:${id}` as const),
    ...Object.keys(content.benefits).map((id) => `benefit:${id}` as const),
  ];
}

/** Public path of each page document, for the editor's page picker and preview. */
export const pagePaths: Record<PageDocumentId, string> = {
  home: "/",
  "broadband-new": "/broadband",
  "broadband-existing": "/broadband-old",
  "mobile-monthly": "/monthy",
  "mobile-prepaid": "/topup",
  solar: "/wEnergy",
  contact: "/service",
  "apply-with-agent": "/wifiService",
  terms: "/termsAndPrivacy",
};

/** The page document shown at a public path ("/broadband"), if any. */
export function pageIdForPath(path: string): PageDocumentId | null {
  const entry = Object.entries(pagePaths).find(([, value]) => value === path);
  return entry ? (entry[0] as PageDocumentId) : null;
}

export function isPageDocumentId(value: string): value is PageDocumentId {
  return (pageDocumentIds as readonly string[]).includes(value);
}
