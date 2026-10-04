import { randomBytes, randomInt, randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { outcomeLabels, statusLabels } from "@/lib/leads/labels";

import { createConfirmedUser, deleteUsers, localStackConfigured, localStackSkipReason, serviceClient, setMembership, type TestUser } from "./support/local-supabase";
import { settle } from "./support/network";

// M5 acceptance for the back office, against the local Supabase stack: active
// Admins find new requests in the inbox (the notification the owner chose),
// work on them with a recorded history, download them as CSV and remove a
// visitor's personal data on request; others read nothing. Requests are made
// through submit_lead() as the site's server does (leads.spec.ts covers the form).

test.skip(!localStackConfigured, localStackSkipReason);
test.describe.configure({ mode: "serial" });

let admin: TestUser;
let member: TestUser;
const phones: string[] = [];
const ids: string[] = [];

async function request(name: string, overrides: { service?: string; note?: string } = {}) {
  const phone = `09${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
  phones.push(phone);
  const { data, error } = await serviceClient()
    .rpc("submit_lead", {
      p_idempotency_key: randomUUID(),
      p_name: name,
      p_phone: phone,
      p_province: "TH-34",
      p_service: overrides.service ?? "broadband",
      p_preferred_time: "morning",
      p_locale: "th",
      p_consent_version: content.site.consent.policyVersion,
      // A different address each time, so the suite never meets the rate limit.
      p_client_hash: randomBytes(32).toString("hex"),
      p_area: "วารินชำราบ",
      p_note: overrides.note,
      p_source_path: "/service",
      p_utm: { utm_source: "facebook" },
    })
    .single();
  if (error) throw error;
  ids.push(data!.lead_id);
  return { id: data!.lead_id, phone };
}

async function signIn(page: Page, user: TestUser, next: string) {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("อีเมล").fill(user.email);
  await page.getByLabel("รหัสผ่าน").fill(user.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
}

test.beforeAll(async () => {
  admin = await createConfirmedUser("leads-admin");
  member = await createConfirmedUser("leads-member");
  await setMembership(admin.id, "active");
  await setMembership(member.id, "inactive");
  await serviceClient().from("lead_intake_log").delete().gte("id", 0);
});

test.afterAll(async () => {
  // By id: an anonymised request has no phone left.
  if (ids.length > 0) await serviceClient().from("leads").delete().in("id", ids);
  await serviceClient().from("lead_intake_log").delete().gte("id", 0);
  await deleteUsers([admin.id, member.id]);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

test("someone who is not an active Admin cannot open the requests", async ({ page }) => {
  await request("ห้ามเห็น");
  await signIn(page, member, "/admin/leads");
  await page.waitForURL((url) => url.pathname === "/admin/denied");
  const response = await page.request.get("/admin/leads/export?status=all");
  expect(response.status()).toBe(403);
});

test("a new request is in the inbox, and an Admin works it through to closed with a history", async ({ page }) => {
  const lead = await request("สมศรี ทดสอบ", { note: "อยากได้เน็ต 1 Gbps" });
  await signIn(page, admin, "/admin/leads");
  await page.waitForURL((url) => url.pathname === "/admin/leads");
  await expect(page.locator("[data-new-leads]").first()).toBeVisible();
  const row = page.locator(`[data-lead="${lead.id}"]`);
  await expect(row).toContainText("สมศรี ทดสอบ");
  await expect(row).toContainText("อุบลราชธานี · วารินชำราบ · เน็ตบ้าน");
  await expect(row.locator("[data-lead-status]")).toHaveText(statusLabels.new);

  await row.getByRole("link").click();
  await page.waitForURL(`**/admin/leads/${lead.id}`);
  const facts = page.locator("[data-lead-facts]");
  await expect(facts).toContainText("อยากได้เน็ต 1 Gbps");
  await expect(facts).toContainText("utm_source=facebook");

  const update = page.locator("[data-lead-update]");
  await update.getByLabel("สถานะ").selectOption("contacted");
  await update.getByLabel("ผลตรวจพื้นที่").selectOption("available");
  await update.getByLabel("นัดติดตาม (ไม่บังคับ)").fill("2026-10-09");
  await update.getByLabel("บันทึกการติดตาม (ไม่บังคับ)").fill("โทรแล้ว สะดวกติดตั้งเสาร์นี้");
  await update.getByRole("button", { name: "บันทึก" }).click();
  await expect(page.getByRole("status").filter({ hasText: "บันทึกแล้ว" })).toBeVisible();
  const history = page.locator("[data-lead-history]");
  await expect(history).toContainText(`สถานะ: ${statusLabels.new} → ${statusLabels.contacted}`);
  await expect(history).toContainText("โทรแล้ว สะดวกติดตั้งเสาร์นี้");
  await expect(history).toContainText(admin.email);

  // Closing needs an outcome.
  await page.locator("[data-lead-update]").getByLabel("สถานะ").selectOption("closed");
  await page.locator("[data-lead-update]").getByLabel(/ผลของคำขอ/).selectOption("signed_up");
  await page.locator("[data-lead-update]").getByRole("button", { name: "บันทึก" }).click();
  await expect(page.locator("main header [data-lead-status]")).toHaveText(statusLabels.closed);
  await expect(page.locator("main header")).toContainText(outcomeLabels.signed_up);
  const { data } = await serviceClient().from("leads").select("status, outcome, closed_at, area_check, follow_up_on").eq("id", lead.id).single();
  expect(data).toMatchObject({ status: "closed", outcome: "signed_up", area_check: "available", follow_up_on: "2026-10-09" });
  expect(data!.closed_at).not.toBeNull();
});

test("a change made by someone else since the page opened is not overwritten", async ({ page }) => {
  const lead = await request("ชนกัน ทดสอบ");
  await signIn(page, admin, `/admin/leads/${lead.id}`);
  await page.waitForURL((url) => url.pathname === `/admin/leads/${lead.id}`);
  await serviceClient().from("leads").update({ updated_at: new Date().toISOString() }).eq("id", lead.id);
  await page.locator("[data-lead-update]").getByLabel("สถานะ").selectOption("pending");
  await page.locator("[data-lead-update]").getByRole("button", { name: "บันทึก" }).click();
  await expect(page.locator("[data-lead-update]").getByRole("alert")).toContainText("มีคนแก้คำขอนี้");
  const { data } = await serviceClient().from("leads").select("status").eq("id", lead.id).single();
  expect(data!.status).toBe("new");
});

test("an Admin removes a visitor's personal data at their request", async ({ page }) => {
  const lead = await request("ขอลบ ข้อมูล", { note: "บ้านเลขที่ 99" });
  await signIn(page, admin, `/admin/leads/${lead.id}`);
  await page.waitForURL((url) => url.pathname === `/admin/leads/${lead.id}`);
  await page.getByRole("button", { name: "ลบข้อมูลส่วนบุคคลของคำขอนี้…" }).click();
  const confirm = page.locator("[data-lead-anonymise]");
  await confirm.getByRole("checkbox").check();
  await confirm.getByRole("button", { name: "ลบข้อมูลส่วนบุคคล" }).click();
  await expect(page.getByRole("status").filter({ hasText: "ลบข้อมูลส่วนบุคคลของคำขอนี้แล้ว" })).toBeVisible();
  await expect(page.locator("[data-lead-facts]")).not.toContainText("บ้านเลขที่ 99");
  await expect(page.locator("[data-lead-update]")).toHaveCount(0);

  const { data } = await serviceClient().from("leads").select("name, phone, area, note, province, anonymised_at").eq("id", lead.id).single();
  expect(data).toMatchObject({ name: null, phone: null, area: null, note: null, province: "TH-34" });
  const { data: audit } = await serviceClient().from("audit_log").select("action").eq("target_type", "lead").eq("target_id", lead.id);
  expect(audit).toEqual([{ action: "lead.anonymise" }]);
});

test("the list downloads as CSV for Excel, and the download is in the audit log", async ({ page }) => {
  const lead = await request("=สูตร ทดสอบ");
  await signIn(page, admin, "/admin/leads");
  await page.waitForURL((url) => url.pathname === "/admin/leads");
  const startedAt = new Date().toISOString();
  const response = await page.request.get("/admin/leads/export?status=all");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  const body = await response.text();
  expect(body.charCodeAt(0)).toBe(0xfeff);
  expect(body).toContain("ได้รับเมื่อ,ชื่อ,เบอร์โทร");
  // A name that looks like a formula is kept as text.
  expect(body).toContain(`'=สูตร ทดสอบ,${lead.phone.slice(0, 3)}-${lead.phone.slice(3, 6)}-${lead.phone.slice(6)}`);
  const { data: audit } = await serviceClient().from("audit_log").select("action, metadata").eq("action", "lead.export").gte("occurred_at", startedAt);
  expect(audit).toHaveLength(1);
});

test("the report counts requests from the database and points to GA4 for visits and clicks", async ({ page }) => {
  await signIn(page, admin, "/admin/reports");
  await page.waitForURL((url) => url.pathname === "/admin/reports");
  const funnel = page.locator("[data-report-funnel]");
  await expect(funnel).toContainText("คำขอที่ได้รับ");
  const total = Number((await funnel.locator("dd").first().innerText()).trim().split(/\s/)[0]);
  expect(total).toBeGreaterThanOrEqual(phones.length);
  await expect(page.getByText(content.site.integrations.ga4MeasurementId!)).toBeVisible();
  await expect(page.getByRole("cell", { name: "generate_lead" })).toBeVisible();
});

test("the inbox, a request and the report pass the automated WCAG checks", async ({ page }) => {
  const lead = await request("ตรวจ การเข้าถึง", { note: "ทดสอบ" });
  await signIn(page, admin, "/admin/leads");
  await page.waitForURL((url) => url.pathname === "/admin/leads");
  for (const path of ["/admin/leads", `/admin/leads/${lead.id}`, "/admin/reports"]) {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`), path).toEqual([]);
  }
});
