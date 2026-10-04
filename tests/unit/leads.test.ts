import { describe, expect, it } from "vitest";

import { consentFromCookies, parseConsent, serializeConsent, withdrawsConsent } from "@/lib/analytics/consent";
import { contactEventFor } from "@/lib/analytics/contact-channel";
import { content } from "@/lib/content";
import { csvCell } from "@/lib/leads/csv";
import { containsPattern, filterLeads, leadFilters } from "@/lib/leads/filters";
import { fieldErrors, formValues, leadInput, normalizePhone, requestSource } from "@/lib/leads/form";
import { requestablePackages, serviceOf } from "@/lib/leads/packages";
import { provinceName, provinceOptions, provinces } from "@/lib/leads/provinces";
import { buildLeadReport, percent } from "@/lib/leads/report";

// M5: the call-back form's rules (shared by the browser and the Server
// Action), the cookie choice, the GA4 contact events, and the back office's
// list filters, CSV and report.

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const valid = {
  idempotencyKey: "0b0f6a52-5f43-4a4e-9d43-2f8b6c1d2e3f",
  name: "  สมหญิง ใจดี ",
  phone: "081-234-5678",
  province: "TH-34",
  area: "",
  service: "broadband",
  packageId: "",
  preferredTime: "evening",
  message: "",
  consent: "yes",
  locale: "th",
  source: "/service?utm_source=facebook",
};

describe("provinces", () => {
  it("lists the 77 provinces once each, with codes the database accepts", () => {
    expect(provinces).toHaveLength(77);
    expect(new Set(provinces.map((province) => province.code)).size).toBe(77);
    expect(new Set(provinces.map((province) => province.th)).size).toBe(77);
    for (const province of provinces) expect(province.code).toMatch(/^TH-[1-9][0-9]$/);
    expect(provinceName("TH-34", "th")).toBe("อุบลราชธานี");
    expect(provinceName("TH-10", "en")).toBe("Bangkok");
  });

  it("sorts the choices by the language shown", () => {
    const names = provinceOptions("en").map((option) => option.name);
    expect(names[0]).toBe("Amnat Charoen");
    expect([...names].sort((a, b) => a.localeCompare(b, "en"))).toEqual(names);
    expect(provinceOptions("th")[0].name).toBe("กระบี่");
  });
});

describe("the call-back form", () => {
  it("accepts Thai numbers as people type them", () => {
    expect(normalizePhone("081-234-5678")).toBe("0812345678");
    expect(normalizePhone("+66 81 234 5678")).toBe("0812345678");
    expect(normalizePhone("66812345678")).toBe("0812345678");
    expect(normalizePhone("(045) 123 456")).toBe("045123456");
  });

  it("cleans a valid request", () => {
    const parsed = leadInput.parse(formValues(form(valid)));
    expect(parsed).toMatchObject({ name: "สมหญิง ใจดี", phone: "0812345678", area: undefined, packageId: undefined, message: undefined });
  });

  it("names each problem with a code the page turns into words", () => {
    const result = leadInput.safeParse(formValues(form({ ...valid, name: " ", phone: "12345", province: "TH-99", service: "", consent: "", message: "ก".repeat(1001) })));
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual({ name: "required", phone: "phone", province: "required", service: "required", consent: "consent", message: "tooLong" });
    for (const code of ["required", "phone", "consent", "tooLong"] as const) expect(content.site.leadForm.errors[code].th).not.toBe("");
  });

  it("treats a missing field as an empty one, and works without a key from the browser", () => {
    const values = formValues(form({ ...valid, idempotencyKey: "" }));
    expect(leadInput.parse(values).idempotencyKey).toBeUndefined();
    expect(formValues(new FormData()).name).toBe("");
  });

  it("keeps only the path and campaign tags of the page it came from", () => {
    expect(requestSource("/en/service?package=x&utm_source=line&utm_campaign=Oct&email=a@b.c")).toEqual({
      path: "/en/service",
      utm: { utm_source: "line", utm_campaign: "Oct" },
    });
    expect(requestSource("https://evil.example/x?utm_source=a")).toEqual({ path: undefined, utm: {} });
  });

  it("offers the packages that have a page, under the right service", () => {
    const items = requestablePackages(content);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.review.status !== "hidden")).toBe(true);
    expect(new Set(items.map(serviceOf))).toEqual(new Set(["broadband", "mobile", "solar"]));
  });
});

describe("cookie consent", () => {
  const version = content.site.consent.policyVersion;

  it("round-trips a choice and ignores one made under another policy version", () => {
    const stored = { version, analytics: true, ads: false, chat: true, at: 1_759_390_000 };
    expect(parseConsent(serializeConsent(stored), version)).toEqual(stored);
    expect(parseConsent(serializeConsent(stored), "2099-01-01")).toBeNull();
    expect(consentFromCookies(`a=1; tm_consent=${serializeConsent(stored)}; b=2`, version)).toEqual(stored);
    expect(consentFromCookies("a=1", version)).toBeNull();
    expect(parseConsent("garbage", version)).toBeNull();
  });

  it("knows when a choice withdraws consent", () => {
    const all = { analytics: true, ads: true, chat: true };
    expect(withdrawsConsent(all, { ...all, ads: false })).toBe(true);
    expect(withdrawsConsent({ ...all, ads: false }, all)).toBe(false);
    expect(withdrawsConsent(null, { analytics: false, ads: false, chat: false })).toBe(false);
  });
});

describe("GA4 contact events", () => {
  it("tells LINE, phone, email and Facebook links apart", () => {
    expect(contactEventFor("tel:0910192552")).toBe("contact_phone");
    expect(contactEventFor(new URL("tel:*900*1234#", "https://x.test").href)).toBeNull();
    expect(contactEventFor(content.site.contact.lineSales)).toBe("contact_line");
    expect(contactEventFor("https://line.me/R/ti/p/@341tmfte")).toBe("contact_line");
    expect(contactEventFor("mailto:Truetelemart@hotmail.com")).toBe("contact_email");
    expect(contactEventFor(content.site.contact.facebook)).toBe("contact_facebook");
    expect(contactEventFor("https://www.telemartubon.com/broadband")).toBeNull();
    expect(contactEventFor("https://notline.me.example.com")).toBeNull();
  });
});

describe("the request list", () => {
  it("reads filters from the address, with safe defaults", () => {
    expect(leadFilters({})).toEqual({ status: "open", service: "", q: "" });
    expect(leadFilters({ status: "closed", service: "solar", q: " 081 " })).toEqual({ status: "closed", service: "solar", q: "081" });
    expect(leadFilters({ status: "drop table", service: "x" })).toEqual({ status: "open", service: "", q: "" });
  });

  it("searches phone numbers by digits and names by text, taking % and _ literally", () => {
    const calls: string[] = [];
    const query = {
      eq: (column: string, value: string) => (calls.push(`eq ${column} ${value}`), query),
      neq: (column: string, value: string) => (calls.push(`neq ${column} ${value}`), query),
      like: (column: string, value: string) => (calls.push(`like ${column} ${value}`), query),
      ilike: (column: string, value: string) => (calls.push(`ilike ${column} ${value}`), query),
    };
    filterLeads(query, { status: "open", service: "mobile", q: "081-23" });
    filterLeads(query, { status: "new", service: "", q: "50%_off" });
    expect(calls).toEqual(["neq status closed", "eq service mobile", "like phone %08123%", "eq status new", `ilike name ${containsPattern("50%_off")}`]);
    expect(containsPattern("50%_off")).toBe("%50\\%\\_off%");
  });

  it("writes CSV cells a spreadsheet will not run", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("-1+2")).toBe("'-1+2");
    expect(csvCell("ชื่อ, นามสกุล")).toBe('"ชื่อ, นามสกุล"');
    expect(csvCell(null)).toBe("");
  });
});

describe("the request report", () => {
  const now = new Date("2026-10-02T05:00:00Z");
  const lead = (overrides: Partial<Parameters<typeof buildLeadReport>[0][number]>) => ({
    created_at: "2026-10-02T02:00:00Z",
    status: "new",
    service: "broadband",
    province: "TH-34",
    package_id: null,
    outcome: null,
    source_path: "/service",
    utm: {},
    ...overrides,
  });

  it("counts requests, who was reached and who signed up", () => {
    const report = buildLeadReport(
      [
        lead({}),
        lead({ status: "contacted", service: "solar", province: "TH-10" }),
        lead({ status: "closed", outcome: "signed_up", package_id: "x", utm: { utm_source: "facebook" } }),
        lead({ status: "closed", outcome: "unreachable", created_at: "2026-09-30T20:00:00Z" }),
      ],
      7,
      now,
    );
    expect(report.total).toBe(4);
    expect(report.reached).toBe(2);
    expect(report.signedUp).toBe(1);
    expect(report.byStatus).toEqual({ new: 1, pending: 0, contacted: 1, closed: 2 });
    expect(report.byService).toEqual({ broadband: 3, mobile: 0, solar: 1, other: 0 });
    expect(report.byProvince[0]).toEqual({ key: "TH-34", count: 3 });
    expect(report.bySource).toEqual([
      { key: "", count: 3 },
      { key: "facebook", count: 1 },
    ]);
    expect(report.perDay).toHaveLength(7);
    // 20:00 UTC on 30 September is 1 October in Bangkok.
    expect(report.perDay.slice(-2)).toEqual([
      { key: "2026-10-01", count: 1 },
      { key: "2026-10-02", count: 3 },
    ]);
    expect(percent(1, 4)).toBe("25%");
    expect(percent(0, 0)).toBe("–");
  });
});
