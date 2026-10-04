import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ConsentBanner, type ConsentText } from "@/components/site/consent/ConsentBanner";
import { SiteTags } from "@/components/site/consent/SiteTags";
import { fontVariables } from "@/fonts";
import { getPublishedContent } from "@/lib/content/published";
import { resolveLink, tx } from "@/lib/content/render";
import { themeVariables } from "@/lib/content/theme";
import type { Locale } from "@/lib/i18n/locales";
import { siteUrl } from "@/lib/seo/metadata";

import "@/styles/tokens.css";
import "../globals.css";
import "@/styles/landing.css";

// The document every public page is drawn in. Thai and English each have a
// root layout of their own (src/app/(th), src/app/(en)), so Thai pages sit at
// the site's old, unprefixed URLs and English ones under /en without any
// rewrite; both layouts are this one, with the language filled in. Each page
// renders its own header and footer (PageShell) so the menu and the language
// switch know the page they are on. Fonts come from src/fonts, shared with the
// back office (whose preview must render the same faces).

/**
 * Marks the document before first paint: data-js when scripts run, and
 * data-motion when the visitor has not asked for reduced motion and the screen
 * is tall enough to pin a stage in (a phone on its side is not). The home
 * page's scroll choreography (src/styles/landing.css) is keyed on data-motion,
 * so without it every section simply lies in the page, fully visible.
 * ScrollDriver keeps the flag up to date when the screen turns.
 */
const flags = `(function(){var d=document.documentElement;d.setAttribute("data-js","");if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&matchMedia("(min-height: 560px)").matches)d.setAttribute("data-motion","")})()`;

export async function siteMetadata(locale: Locale): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).site;
  const siteName = tx(seo.siteName, locale);
  return {
    metadataBase: siteUrl(),
    title: { default: siteName, template: `%s | ${siteName}` },
    description: tx(seo.description, locale),
    applicationName: siteName,
  };
}

export const siteViewport: Viewport = {
  themeColor: "#ffffff",
};

export async function SiteLayout({ locale, children }: { locale: Locale; children: ReactNode }) {
  const { site } = await getPublishedContent();
  const { googleAdsId, ga4MeasurementId, tawkSrc } = site.integrations;
  const { policyVersion, ...consentCopy } = site.consent;
  const consentText = Object.fromEntries(Object.entries(consentCopy).map(([key, text]) => [key, tx(text, locale)])) as ConsentText;
  const policyHref = resolveLink({ kind: "page", path: "/termsAndPrivacy", hash: "cookies" }, locale, site).href;

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: flags }} />
        {/* The home page's entrance starts hidden and is revealed by script; without script it must simply show. */}
        <noscript>
          <style>{`.nav,.hero-art-inner,.hero-foot,.hero-foot *{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      {/* Theme colours from site settings; the default theme adds nothing. */}
      <body className="tm-site" style={themeVariables(site.theme)}>
        {/* First, so keyboard and screen-reader users meet the choice before the page. */}
        <ConsentBanner text={consentText} policyHref={policyHref} policyVersion={policyVersion} />
        {children}
        {/* Google Ads (as on the old site), Google Analytics 4 on the production domain and Tawk chat, each only after consent; the home page reports its Ads conversion (AdsConversion). */}
        <SiteTags googleAdsId={googleAdsId} ga4MeasurementId={ga4MeasurementId} productionHost={siteUrl().hostname} tawkSrc={tawkSrc} policyVersion={policyVersion} />
      </body>
    </html>
  );
}
