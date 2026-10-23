import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { metaLeadPayload, metaPhone } from "@/lib/analytics/meta-capi";
import { metaPixelAllowed } from "@/lib/analytics/meta";
import { content } from "@/lib/content";
import { parseConsent } from "@/lib/analytics/consent";

// The Meta Pixel and the server's Lead (Conversions API): the pixel loads only
// with consent to advertising on the production domain, and the Lead carries
// the phone number only as Meta's SHA-256 of 66XXXXXXXX(X).

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const host = "www.truegetherth.com";

describe("Meta Pixel", () => {
  it("loads only with a pixel id, consent to advertising and the production host", () => {
    const config = { pixelId: "123456789012345", productionHost: host };
    expect(metaPixelAllowed(config, { analytics: true, ads: true }, host)).toBe(true);
    expect(metaPixelAllowed(config, { analytics: true, ads: false }, host)).toBe(false);
    expect(metaPixelAllowed(config, { analytics: false, ads: true }, "truegetherth-git-x.vercel.app")).toBe(false);
    expect(metaPixelAllowed({ productionHost: host }, { analytics: true, ads: true }, host)).toBe(false);
    expect(metaPixelAllowed({ pixelId: "abc", productionHost: host }, { analytics: true, ads: true }, host)).toBe(false);
  });

  it("asks everyone again: a choice under the policy before the pixel no longer counts", () => {
    const version = content.site.consent.policyVersion;
    expect(version).toBe("2026-10-23");
    expect(parseConsent("2026-10-02.11.1759390000", version)).toBeNull();
    expect(parseConsent(`${version}.01.1761190000`, version)).toMatchObject({ analytics: false, ads: true });
  });
});

describe("Meta Conversions API Lead", () => {
  it("turns a Thai number into country code and digits", () => {
    expect(metaPhone("0812345678")).toBe("66812345678");
    expect(metaPhone("021234567")).toBe("6621234567");
    expect(metaPhone("66812345678")).toBe("66812345678");
    expect(metaPhone("12345")).toBeNull();
  });

  it("sends the phone only hashed, with the browser's event id and Meta's cookies", () => {
    const body = metaLeadPayload(
      {
        eventId: "8f14e45f-ceea-467f-a8c4-1f2c3d4e5f60",
        eventSourceUrl: "https://www.truegetherth.com/broadband",
        phone: "0812345678",
        clientIp: "203.0.113.9",
        userAgent: "Mozilla/5.0",
        fbp: "fb.1.1761190000.123",
        fbc: null,
        service: "broadband",
        packageId: "fiber-1000",
      },
      1_761_190_000_000,
      "TEST123",
    );
    const [event] = body.data;
    expect(event).toMatchObject({
      event_name: "Lead",
      event_time: 1_761_190_000,
      event_id: "8f14e45f-ceea-467f-a8c4-1f2c3d4e5f60",
      action_source: "website",
      event_source_url: "https://www.truegetherth.com/broadband",
      custom_data: { content_category: "broadband", content_name: "fiber-1000" },
    });
    expect(event.user_data).toEqual({
      country: [sha256("th")],
      ph: [sha256("66812345678")],
      client_ip_address: "203.0.113.9",
      client_user_agent: "Mozilla/5.0",
      fbp: "fb.1.1761190000.123",
    });
    expect(JSON.stringify(body)).not.toContain("0812345678");
    expect(body.test_event_code).toBe("TEST123");
  });

  it("leaves out an address the platform did not give", () => {
    const body = metaLeadPayload(
      { eventId: "e", eventSourceUrl: "https://www.truegetherth.com/", phone: "0812345678", clientIp: "unknown", userAgent: null, fbp: null, fbc: null, service: "mobile" },
      0,
    );
    expect(body.data[0].user_data).not.toHaveProperty("client_ip_address");
    expect(body).not.toHaveProperty("test_event_code");
  });
});
