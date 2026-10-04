"use client";

import { useEffect, useRef } from "react";

import { whenTagReady } from "@/lib/analytics/tags";

type AdsConversionProps = {
  sendTo: string;
  /** Only pages opened on this host count; previews and development machines do not. */
  productionHost: string;
};

/**
 * Reports one Google Ads conversion each time the page that renders it opens
 * on the production domain, once the Ads tag is configured: that happens only
 * after the visitor agrees to advertising cookies (src/lib/analytics/tags.ts),
 * before or after this effect runs. Only public routes render it; the editor
 * preview shares the page views but not this.
 */
export function AdsConversion({ sendTo, productionHost }: AdsConversionProps) {
  // Development runs effects twice; the page still opened once.
  const sent = useRef(false);

  useEffect(() => {
    if (window.location.hostname !== productionHost) return;
    return whenTagReady("ads", () => {
      if (sent.current || !window.gtag) return;
      sent.current = true;
      window.gtag("event", "conversion", { send_to: sendTo, value: 1.0, currency: "THB" });
    });
  }, [sendTo, productionHost]);

  return null;
}
