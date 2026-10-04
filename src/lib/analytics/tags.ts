import type { ConsentChoice } from "./consent";

// Google tags and Tawk chat of the public site, loaded in the browser only
// after the visitor agrees (src/lib/analytics/consent.ts, PDPA): one gtag.js
// for Google Ads (advertising) and Google Analytics 4 (analytics), with Google
// consent mode set from the same choice. GA4 is configured on the production
// domain only, so previews and development add nothing to the reports; the
// home page's Ads conversion also counts there only (AdsConversion). The
// editor and its preview load none of this.

/** Dispatched on window each time a Google tag is configured. */
export const GTAG_READY_EVENT = "tm:gtag-ready";

export type TagConfig = {
  googleAdsId: string;
  /** GA4 Measurement ID (G-…); absent leaves Analytics off. */
  ga4MeasurementId?: string;
  /** Host whose visits count in Analytics: the site's own domain. */
  productionHost: string;
  tawkSrc: string;
};

function consentModes(choice: ConsentChoice) {
  const ads = choice.ads ? "granted" : "denied";
  return { analytics_storage: choice.analytics ? "granted" : "denied", ad_storage: ads, ad_user_data: ads, ad_personalization: ads };
}

/** Configures the Google tags the visitor agreed to, each at most once per page. */
export function applyGoogleTags(config: TagConfig, choice: ConsentChoice): void {
  const ads = choice.ads;
  const analytics = choice.analytics && Boolean(config.ga4MeasurementId) && location.hostname === config.productionHost;
  if (!ads && !analytics) return;

  if (!window.__tmTags || !window.gtag) {
    const dataLayer = (window.dataLayer = window.dataLayer ?? []);
    window.gtag = function gtag() {
      // gtag.js reads the arguments object itself, as in Google's own snippet.
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    window.gtag("consent", "default", consentModes(choice));
    window.gtag("js", new Date());
    window.__tmTags = { ads: false, analytics: false, ga4MeasurementId: config.ga4MeasurementId };
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ads ? config.googleAdsId : (config.ga4MeasurementId ?? ""))}`;
    document.head.appendChild(script);
  } else {
    window.gtag("consent", "update", consentModes(choice));
  }

  const tags = window.__tmTags;
  if (ads && !tags.ads) {
    window.gtag("config", config.googleAdsId);
    tags.ads = true;
  }
  if (analytics && !tags.analytics) {
    window.gtag("config", config.ga4MeasurementId);
    tags.analytics = true;
  }
  window.dispatchEvent(new Event(GTAG_READY_EVENT));
}

/** Calls back once the given Google tag is configured on this page; returns a cleanup. */
export function whenTagReady(tag: "ads" | "analytics", callback: () => void): () => void {
  if (window.__tmTags?.[tag]) {
    callback();
    return () => undefined;
  }
  const check = () => {
    if (!window.__tmTags?.[tag]) return;
    window.removeEventListener(GTAG_READY_EVENT, check);
    callback();
  };
  window.addEventListener(GTAG_READY_EVENT, check);
  return () => window.removeEventListener(GTAG_READY_EVENT, check);
}

/**
 * Sends a GA4 event when Analytics is on for this page, and nothing
 * otherwise. Never pass personal data (names, numbers, free text).
 */
export function trackEvent(name: string, params: Record<string, string | number | undefined> = {}): void {
  const tags = window.__tmTags;
  if (!tags?.analytics || !window.gtag) return;
  const defined = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  window.gtag("event", name, { ...defined, send_to: tags.ga4MeasurementId });
}

/** Loads Tawk live chat once, as the old site's snippet did. */
export function loadChat(src: string): void {
  if (window.Tawk_LoadStart) return;
  window.Tawk_API = window.Tawk_API ?? {};
  window.Tawk_LoadStart = new Date();
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.charset = "UTF-8";
  script.setAttribute("crossorigin", "*");
  document.body.appendChild(script);
}
