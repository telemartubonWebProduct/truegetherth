import type { ConsentChoice } from "./consent";

// The Meta Pixel of the public site (Facebook and Instagram ads), loaded in the
// browser only after the visitor agrees to advertising cookies, the same
// choice as Google Ads, and only on the production domain, so previews and
// development send nothing. Off while NEXT_PUBLIC_META_PIXEL_ID is unset. A
// request to be contacted is Meta's `Lead` (the call-back form, also sent from
// the server with the same event id: src/lib/analytics/meta-capi.ts) and a
// click on LINE or a phone number is `Contact`. The editor loads none of this.

export type MetaPixelConfig = {
  /** Meta dataset (pixel) id, digits only; empty leaves the pixel off. */
  pixelId?: string;
  /** Host whose visits count: the site's own domain. */
  productionHost: string;
};

const PIXEL_ID = /^[0-9]{6,20}$/;

/** Whether the pixel may load for this choice on this host. */
export function metaPixelAllowed(config: MetaPixelConfig, choice: ConsentChoice, hostname: string): boolean {
  return Boolean(config.pixelId && PIXEL_ID.test(config.pixelId) && choice.ads && hostname === config.productionHost);
}

/** Loads the pixel and counts the page view, at most once per page; fbevents.js counts later client-side navigations itself. */
export function applyMetaPixel(config: MetaPixelConfig, choice: ConsentChoice): void {
  if (!metaPixelAllowed(config, choice, location.hostname) || window.fbq) return;
  const queue: unknown[][] = [];
  // Calls wait in the queue until fbevents.js arrives and replays them, as in Meta's base code
  // (a method call, so callMethod sees the queue function as `this`, like its .apply there).
  const fbq: MetaFbq = Object.assign(
    (...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else queue.push(args);
    },
    { queue, loaded: true, version: "2.0" },
  ) as MetaFbq;
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = fbq;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  fbq("init", config.pixelId);
  fbq("track", "PageView");
}

/**
 * Reports one standard event when the pixel is on for this page, and nothing
 * otherwise. `eventId` is shared with the server's copy so Meta keeps one.
 * Never pass personal data (names, numbers, free text).
 */
export function trackMetaEvent(name: "Lead" | "Contact", params: Record<string, string | undefined>, eventId?: string): void {
  if (!window.fbq) return;
  const defined = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
  window.fbq("track", name, defined, ...(eventId ? [{ eventID: eventId }] : []));
}

/** fbevents.js's queue function, as Meta's own base code shapes it. */
export type MetaFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaFbq;
  loaded: boolean;
  version: string;
};
