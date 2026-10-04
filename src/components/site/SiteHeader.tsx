import { isCurrent, resolveLink } from "@/lib/content/render";
import type { LinkTarget, LocalizedText } from "@/lib/content/schema";
import { localizePath, locales, type Locale } from "@/lib/i18n/locales";

import type { RenderContext } from "./context";
import { Navbar, type NavGroupView, type NavLinkView } from "./home/Navbar";

const languageNames: Record<Locale, string> = { th: "ไทย", en: "English" };

function linkView(ctx: RenderContext, entry: { id: string; label: LocalizedText; target: LinkTarget }, path: string, binding: string | undefined): NavLinkView {
  return {
    id: entry.id,
    label: ctx.t(entry.label),
    ...resolveLink(entry.target, ctx.locale, ctx.site),
    current: isCurrent(entry.target, path),
    binding,
  };
}

/**
 * The navigation of every public page, from site settings: the menu, the
 * button on the right and the logo. It only prepares what the floating pills
 * (Navbar, a client component) show.
 */
export function SiteHeader({ ctx, path }: { ctx: RenderContext; path: string }) {
  const { site } = ctx;
  const logo = ctx.media(site.brand.logo);
  const groups: NavGroupView[] = site.navigation.flatMap((item): NavGroupView[] => {
    const binding = ctx.bind("site", "navigation", item.id)["data-edit"];
    if (item.children) {
      const children = item.children.map((child) => linkView(ctx, child, path, ctx.bind("site", "navigation", item.id, "children", child.id)["data-edit"]));
      return [{ id: item.id, label: ctx.t(item.label), binding, children }];
    }
    return item.target ? [{ id: item.id, label: ctx.t(item.label), binding, link: linkView(ctx, { id: item.id, label: item.label, target: item.target }, path, binding), children: [] }] : [];
  });
  // Beside the menu: each part of the menu by its name, leading to its first page. The last one is the button on the right already.
  const shortcuts = groups.flatMap((group): NavLinkView[] => {
    const first = group.link ?? group.children[0];
    return first && first.id !== site.headerCta.id && first.href !== resolveLink(site.headerCta.target, ctx.locale, site).href ? [{ ...first, id: group.id, label: group.label }] : [];
  });
  const other = locales.find((entry) => entry !== ctx.locale) ?? ctx.locale;

  return (
    <Navbar
      view={{
        brand: { href: localizePath("/", ctx.locale), name: ctx.t(site.brand.name), logo: { src: logo.src, width: logo.width, height: logo.height }, binding: ctx.bind("site", "brand", "logo")["data-edit"] },
        labels: {
          menu: ctx.t(site.ui.menu),
          navigation: ctx.t(site.ui.mainNavigation),
          newTab: ctx.t(site.ui.opensInNewTab),
        },
        shortcuts: shortcuts.slice(0, 3),
        groups,
        cta: linkView(ctx, site.headerCta, path, ctx.bind("site", "headerCta")["data-edit"]),
        languages: { locale: other, name: languageNames[other], href: localizePath(path, other), current: false, label: ctx.t(site.ui.languageSwitch) },
      }}
    />
  );
}
