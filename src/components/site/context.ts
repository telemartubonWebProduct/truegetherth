import type { DocumentId } from "@/lib/content/documents";
import { todayInThailand } from "@/lib/content/dates";
import { benefitIn, featuredIn, mediaIn, packageIn, publicPackagesIn } from "@/lib/content/lookup";
import { encodeBinding, type Segment } from "@/lib/content/paths";
import type { Benefit, CatalogPackage, CategoryId, LocalizedText, MediaAsset, SiteContent, SiteSettings } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";

/**
 * What every site component renders from: one version of the content
 * (published for visitors, a draft in the Mirror editor), the language, and
 * whether edit bindings are drawn. Components never import content themselves,
 * so the editor preview renders exactly the markup visitors get.
 */
export type RenderContext = {
  content: SiteContent;
  site: SiteSettings;
  locale: Locale;
  /** True only inside the Mirror editor preview. */
  edit: boolean;
  /** The day in Thailand the page is rendered on: packages set to show on certain days follow it. */
  today: string;
  /**
   * The call-back form (M5): "live" on public pages of a deployment that can
   * store requests, "preview" in the Mirror editor (shown, never sends), "off"
   * otherwise (visitors get LINE and the phone instead).
   */
  leads: "live" | "preview" | "off";
  t: (text: LocalizedText) => string;
  /**
   * Attributes that mark an element as the view of one field. Empty outside
   * the editor, so public HTML carries no editor markup.
   */
  bind: (documentId: DocumentId, ...path: Segment[]) => { "data-edit"?: string };
  media: (id: string) => MediaAsset;
  benefit: (id: string) => Benefit;
  packageById: (id: string) => CatalogPackage;
  /** Packages visitors may see (hidden ones and ones outside their days stay out, in the editor too). */
  packages: (category: CategoryId, group: string) => CatalogPackage[];
  /** The home page's recommended packages of these categories, in the order of their cards. */
  featured: (categories: readonly CategoryId[]) => CatalogPackage[];
};

export function renderContext(content: SiteContent, locale: Locale, options: { edit?: boolean; leads?: RenderContext["leads"]; today?: string } = {}): RenderContext {
  const edit = options.edit ?? false;
  const today = options.today ?? todayInThailand();
  return {
    content,
    site: content.site,
    locale,
    edit,
    today,
    leads: options.leads ?? "off",
    t: (text) => text[locale],
    bind: edit ? (documentId, ...path) => ({ "data-edit": encodeBinding(documentId, path) }) : () => ({}),
    media: (id) => mediaIn(content, id),
    benefit: (id) => benefitIn(content, id),
    packageById: (id) => packageIn(content, id),
    packages: (category, group) => publicPackagesIn(content, category, group, today),
    featured: (categories) => featuredIn(content, categories, today),
  };
}
