"use client";

import { useEffect } from "react";

import { CONSENT_CHANGE_EVENT, readConsent, type ConsentChoice, type StoredConsent } from "@/lib/analytics/consent";
import { contactEventFor } from "@/lib/analytics/contact-channel";
import { applyGoogleTags, trackEvent, trackLeadConversion } from "@/lib/analytics/tags";

type SiteTagsProps = {
  googleAdsId: string;
  ga4MeasurementId?: string;
  adsLeadConversion: string;
  productionHost: string;
  policyVersion: string;
};

/**
 * Loads the third-party tags the visitor agreed to, now and whenever they
 * agree to more, and reports clicks on LINE, phone, email and Facebook links
 * to GA4 as separate events (with the link's stable CTA id, no personal data).
 * A click on LINE or a phone number is also the Google Ads conversion: the
 * visitor is asking to be contacted.
 */
export function SiteTags({ googleAdsId, ga4MeasurementId, adsLeadConversion, productionHost, policyVersion }: SiteTagsProps) {
  useEffect(() => {
    const apply = (choice: ConsentChoice | null) => {
      if (choice) applyGoogleTags({ googleAdsId, ga4MeasurementId, productionHost, adsLeadConversion }, choice);
    };
    apply(readConsent(policyVersion));
    const onChange = (event: Event) => apply((event as CustomEvent<StoredConsent>).detail);
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, [googleAdsId, ga4MeasurementId, adsLeadConversion, productionHost, policyVersion]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      const name = anchor ? contactEventFor(anchor.href) : null;
      if (!anchor || !name) return;
      trackEvent(name, { cta_id: anchor.dataset.cta ?? "none", page_path: location.pathname });
      if (name === "contact_line" || name === "contact_phone") trackLeadConversion();
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
