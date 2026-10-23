import "server-only";

import { createHash } from "node:crypto";

// The server's copy of a call-back request for Meta (the Conversions API):
// sent after the request is stored, only when the visitor agreed to
// advertising cookies and only from the production domain, with the event id
// the browser's pixel used, so Meta keeps one of the two. The phone number
// goes as Meta asks, SHA-256 of the number with the country code, never in
// clear. Off unless NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_TOKEN are set
// (Events Manager → the dataset → Settings → Conversions API → Generate
// access token); META_CAPI_TEST_EVENT_CODE shows the events under Test events.

const GRAPH_VERSION = "v26.0";

export type MetaLeadEvent = {
  eventId: string;
  /** The page the request was sent from, on the site's domain. */
  eventSourceUrl: string;
  /** 0XXXXXXXX(X), as the form stores it. */
  phone: string;
  clientIp: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
  service: string;
  packageId?: string;
};

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** A Thai number as Meta matches it: country code and digits, no leading 0 or +. */
export function metaPhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  if (/^0[0-9]{8,9}$/.test(digits)) return `66${digits.slice(1)}`;
  if (/^66[0-9]{8,9}$/.test(digits)) return digits;
  return null;
}

export function metaCapiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() && process.env.META_CAPI_TOKEN?.trim());
}

/** The request body Meta expects for one Lead. */
export function metaLeadPayload(event: MetaLeadEvent, now: number, testEventCode?: string) {
  const phone = metaPhone(event.phone);
  const userData: Record<string, string | string[]> = { country: [sha256("th")] };
  if (phone) userData.ph = [sha256(phone)];
  if (event.clientIp && event.clientIp !== "unknown") userData.client_ip_address = event.clientIp;
  if (event.userAgent) userData.client_user_agent = event.userAgent;
  if (event.fbp) userData.fbp = event.fbp;
  if (event.fbc) userData.fbc = event.fbc;
  return {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(now / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: { content_category: event.service, ...(event.packageId ? { content_name: event.packageId } : {}) },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };
}

/** Sends one Lead; a failure is logged without the token and never reaches the visitor. */
export async function sendMetaLead(event: MetaLeadEvent): Promise<void> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_TOKEN?.trim();
  if (!pixelId || !token) return;
  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...metaLeadPayload(event, Date.now(), process.env.META_CAPI_TEST_EVENT_CODE?.trim() || undefined), access_token: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) console.error("Meta Conversions API refused a Lead", { status: response.status, body: (await response.text().catch(() => "")).slice(0, 300) });
  } catch (error) {
    console.error("Meta Conversions API failed", { message: error instanceof Error ? error.message : String(error) });
  }
}
