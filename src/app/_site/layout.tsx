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
import { jsonLd, organizationData, websiteData } from "@/lib/seo/structured-data";

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
 * data-consent when the visitor has already made a cookie choice for this
 * version of the policy: the banner, which is in the page's HTML, then stays
 * out of sight (ConsentBanner removes the mark once it has read the cookie).
 */
const flags = (policyVersion: string) =>
  `(function(){var d=document.documentElement;d.setAttribute("data-js","");if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&matchMedia("(min-height: 560px)").matches)d.setAttribute("data-motion","");var c=/(?:^|; )tm_consent=([^;]*)/.exec(document.cookie);if(c&&/^[01]{2,3}\\.[0-9]{1,12}$/.test(decodeURIComponent(c[1]).replace(${JSON.stringify(`${policyVersion}.`)},"")))d.setAttribute("data-consent","")})()`;

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
  const content = await getPublishedContent();
  const { site } = content;
  const { googleAdsId, ga4MeasurementId, googleAdsLeadConversion } = site.integrations;
  const { policyVersion, ...consentCopy } = site.consent;
  const consentText = Object.fromEntries(Object.entries(consentCopy).map(([key, text]) => [key, tx(text, locale)])) as ConsentText;
  const policyHref = resolveLink({ kind: "page", path: "/termsAndPrivacy", hash: "cookies" }, locale, site).href;

  return (
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: flags(policyVersion) }} />
        {/* For search engines: who runs the site (an appointed dealer, not True itself) and what the site is. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([organizationData(content, locale), websiteData(content, locale)]) }} />
      </head>
      {/* Theme colours from site settings; the default theme adds nothing. */}
      <body className="tm-site" style={themeVariables(site.theme)}>
        {/* First, so keyboard and screen-reader users meet the choice before the page. */}
        <ConsentBanner text={consentText} policyHref={policyHref} policyVersion={policyVersion} />
        {children}
        {/* Google Ads and Google Analytics 4 on the production domain, each only after consent; a request to be contacted is the Ads conversion. */}
        <SiteTags googleAdsId={googleAdsId} ga4MeasurementId={ga4MeasurementId} adsLeadConversion={googleAdsLeadConversion} productionHost={siteUrl().hostname} policyVersion={policyVersion} />
      </body>
    </html>
  );
}
