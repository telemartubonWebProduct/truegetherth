"use client";

import { useEffect } from "react";

import { CONSENT_CHANGE_EVENT, readConsent, type ConsentChoice, type StoredConsent } from "@/lib/analytics/consent";
import { contactEventFor } from "@/lib/analytics/contact-channel";
import { applyGoogleTags, loadChat, trackEvent } from "@/lib/analytics/tags";

type SiteTagsProps = {
  googleAdsId: string;
  ga4MeasurementId?: string;
  productionHost: string;
  tawkSrc: string;
  policyVersion: string;
};

function whenIdle(callback: () => void) {
  if ("requestIdleCallback" in window) window.requestIdleCallback(callback, { timeout: 4000 });
  else setTimeout(callback, 1500);
}

/**
 * Loads the third-party tags the visitor agreed to, now and whenever they
 * agree to more, and reports clicks on LINE, phone, email and Facebook links
 * to GA4 as separate events (with the link's stable CTA id, no personal data).
 */
export function SiteTags({ googleAdsId, ga4MeasurementId, productionHost, tawkSrc, policyVersion }: SiteTagsProps) {
  useEffect(() => {
    const apply = (choice: ConsentChoice | null) => {
      if (!choice) return;
      applyGoogleTags({ googleAdsId, ga4MeasurementId, productionHost, tawkSrc }, choice);
      if (choice.chat) whenIdle(() => loadChat(tawkSrc));
    };
    apply(readConsent(policyVersion));
    const onChange = (event: Event) => apply((event as CustomEvent<StoredConsent>).detail);
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, [googleAdsId, ga4MeasurementId, productionHost, tawkSrc, policyVersion]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      const name = anchor ? contactEventFor(anchor.href) : null;
      if (!anchor || !name) return;
      trackEvent(name, { cta_id: anchor.dataset.cta ?? "none", page_path: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
