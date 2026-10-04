import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { requestablePackages, serviceOf } from "@/lib/leads/packages";
import { siteUrl } from "@/lib/seo/metadata";

import { consentState } from "./support/consent";
import { localStackConfigured, localStackSkipReason, serviceClient } from "./support/local-supabase";
import { blockThirdParty, serveAt, settle } from "./support/network";

// M5 acceptance for visitors, against the local Supabase stack: the contact
// page's call-back form checks what is typed, stores a request once however
// often it is sent, fills in the package a visitor came from, folds a repeat
// into the open request, rate limits, ignores bots, and reports generate_lead
// to GA4 only after the request is stored. The back office is in
// admin-leads.spec.ts.

test.skip(!localStackConfigured, localStackSkipReason);

const form = content.site.leadForm;
const used: string[] = [];

/** A phone number no other test uses. */
function uniquePhone(): string {
  const phone = `08${String(randomInt(0, 100_000_000)).padStart(8, "0")}`;
  used.push(phone);
  return phone;
}

test.beforeEach(async ({ context, baseURL }) => {
  await blockThirdParty(context, baseURL!);
  // Each test starts with a fresh rate limit: every request here comes from one address.
  const { error } = await serviceClient().from("lead_intake_log").delete().gte("id", 0);
  if (error) throw error;
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

test.afterAll(async () => {
  if (used.length > 0) await serviceClient().from("leads").delete().in("phone", used);
  await serviceClient().from("lead_intake_log").delete().gte("id", 0);
});

async function leadsFor(phone: string) {
  const { data, error } = await serviceClient().from("leads").select("*, lead_events(*)").eq("phone", phone);
  if (error) throw error;
  return data;
}

async function fill(page: Page, { name, phone, message }: { name: string; phone: string; message?: string }, locale: "th" | "en" = "th") {
  const region = page.locator("form[data-lead-form]");
  await region.getByLabel(form.name[locale], { exact: true }).fill(name);
  await region.getByLabel(form.phone[locale]).fill(phone);
  await region.getByLabel(form.province[locale]).selectOption("TH-34");
  await region.getByLabel(form.area[locale]).fill("อำเภอวารินชำราบ");
  const broadband = region.getByRole("radio", { name: form.services.broadband[locale] });
  if (!(await broadband.isChecked())) await broadband.check();
  await region.getByRole("radio", { name: form.times.evening[locale] }).check();
  if (message) await region.getByLabel(form.message[locale]).fill(message);
  await region.getByRole("checkbox").check();
}

const sent = (page: Page, locale: "th" | "en" = "th") => page.getByRole("status").filter({ hasText: form.successHeading[locale] });

test("the form says what is missing, beside each field, before sending anything", async ({ page }) => {
  await page.goto("/service#callback");
  const region = page.locator("form[data-lead-form]");
  await expect(region).toBeVisible();
  await region.getByRole("button", { name: form.submit.th }).click();

  await expect(region.getByLabel(form.name.th, { exact: true })).toBeFocused();
  await expect(region.getByLabel(form.name.th, { exact: true })).toHaveAttribute("aria-invalid", "true");
  // Name, phone, province and service; the time has a default.
  await expect(region.getByText(form.errors.required.th)).toHaveCount(4);
  await expect(region.getByText(form.errors.consent.th)).toBeVisible();

  await region.getByLabel(form.phone.th).fill("12345");
  await region.getByRole("button", { name: form.submit.th }).click();
  await expect(region.getByText(form.errors.phone.th)).toBeVisible();
  await expect(region.getByText(form.errors.required.th)).toHaveCount(3);
  // Typing in a field clears its message.
  await region.getByLabel(form.name.th, { exact: true }).fill("ทดสอบ");
  await expect(region.getByText(form.errors.required.th)).toHaveCount(2);
});

test("a request is stored once, however often it is sent", async ({ page }) => {
  const phone = uniquePhone();
  await page.goto("/service?utm_source=e2e&utm_campaign=m5#callback");
  await fill(page, { name: "ทดสอบ ส่งครั้งเดียว", phone: `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`, message: "อยากได้ 1 Gbps" });
  const submit = page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.th });
  await submit.dblclick();
  await expect(sent(page)).toBeVisible();
  await expect(sent(page).getByRole("heading", { name: form.successHeading.th })).toBeFocused();

  const leads = await leadsFor(phone);
  expect(leads).toHaveLength(1);
  expect(leads[0]).toMatchObject({
    name: "ทดสอบ ส่งครั้งเดียว",
    province: "TH-34",
    area: "อำเภอวารินชำราบ",
    service: "broadband",
    preferred_time: "evening",
    note: "อยากได้ 1 Gbps",
    locale: "th",
    status: "new",
    source_path: "/service",
    utm: { utm_source: "e2e", utm_campaign: "m5" },
    consent_version: content.site.consent.policyVersion,
  });
  expect(leads[0].lead_events.map((event: { kind: string }) => event.kind)).toEqual(["received"]);
});

test("from a package page, the package is filled in, and a repeat joins the open request", async ({ page }) => {
  const item = requestablePackages(content).find((entry) => serviceOf(entry) === "broadband")!;
  const phone = uniquePhone();
  await page.goto(`/packages/${item.id}`);
  await page.getByRole("link", { name: content.site.ui.requestCallback.th }).click();
  await expect(page).toHaveURL(new RegExp(`/service\\?package=${item.id}#callback$`));
  const region = page.locator("form[data-lead-form]");
  await expect(region.locator(`[data-lead-package="${item.id}"]`)).toContainText(item.name.th);
  await expect(region.getByRole("radio", { name: form.services.broadband.th })).toBeChecked();
  await fill(page, { name: "ทดสอบ จากแพ็กเกจ", phone });
  await region.getByRole("button", { name: form.submit.th }).click();
  await expect(sent(page)).toBeVisible();
  expect((await leadsFor(phone))[0].package_id).toBe(item.id);

  // Another request from the same phone for the same service while the first is open.
  await page.getByRole("button", { name: form.another.th }).click();
  await page.locator("form[data-lead-form]").getByRole("button", { name: form.packageRemove.th }).click();
  await expect(page.locator("[data-lead-package]")).toHaveCount(0);
  await fill(page, { name: "ทดสอบ จากแพ็กเกจ", phone, message: "โทรหลังหกโมงเย็น" });
  await page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.th }).click();
  await expect(sent(page)).toBeVisible();
  const leads = await leadsFor(phone);
  expect(leads).toHaveLength(1);
  expect(leads[0].resubmitted_at).not.toBeNull();
  const repeat = leads[0].lead_events.find((event: { kind: string }) => event.kind === "resubmitted");
  expect(repeat?.details).toMatchObject({ note: "โทรหลังหกโมงเย็น" });
});

test("the English form works the same", async ({ page }) => {
  const phone = uniquePhone();
  await page.goto("/en/service#callback");
  await fill(page, { name: "Test English", phone }, "en");
  await page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.en }).click();
  await expect(sent(page, "en")).toBeVisible();
  expect((await leadsFor(phone))[0]).toMatchObject({ locale: "en", source_path: "/en/service" });
});

test("a bot that fills the hidden field is told it worked, and nothing is stored", async ({ page }) => {
  const phone = uniquePhone();
  await page.goto("/service#callback");
  await fill(page, { name: "Bot", phone });
  await page.locator('input[name="hp_extra_7"]').evaluate((input: HTMLInputElement) => (input.value = "http://spam.example"));
  await page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.th }).click();
  await expect(sent(page)).toBeVisible();
  expect(await leadsFor(phone)).toEqual([]);
});

test.describe("on desktop", () => {
  test.skip(({ isMobile }) => isMobile, "Same server rules; once is enough.");

  test("too many requests from one address are refused, and the visitor is told what to do", async ({ page }) => {
    const first = uniquePhone();
    await page.goto("/service#callback");
    await fill(page, { name: "ทดสอบ อัตรา", phone: first });
    await page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.th }).click();
    await expect(sent(page)).toBeVisible();
    // This address has sent five in ten minutes.
    const { data: log } = await serviceClient().from("lead_intake_log").select("client_hash").limit(1).single();
    await serviceClient().from("lead_intake_log").insert(Array.from({ length: 4 }, () => ({ client_hash: log!.client_hash })));

    const sixth = uniquePhone();
    await page.getByRole("button", { name: form.another.th }).click();
    await fill(page, { name: "ทดสอบ อัตรา", phone: sixth });
    await page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.th }).click();
    await expect(page.locator("form[data-lead-form]").getByRole("alert")).toHaveText(form.errors.rateLimited.th);
    expect(await leadsFor(sixth)).toEqual([]);
  });

  test("GA4 hears generate_lead only once the request is stored, without personal data", async ({ page, context, baseURL }) => {
    const production = siteUrl().origin;
    await serveAt(context, baseURL!, production);
    await context.addCookies(consentState({ analytics: true, ads: false, chat: false }).cookies);
    const phone = uniquePhone();
    await page.goto(`${production}/service#callback`);
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __tmTags?: { analytics: boolean } }).__tmTags?.analytics ?? false))
      .toBe(true);
    await fill(page, { name: "ทดสอบ GA4", phone });
    const events = () =>
      page.evaluate(() =>
        Array.from((window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer, (entry) => Array.from(entry)).filter(([command]) => command === "event"),
      );
    expect((await events()).map(([, name]) => name)).toEqual(["lead_form_start"]);
    await page.locator("form[data-lead-form]").getByRole("button", { name: form.submit.th }).click();
    await expect(sent(page)).toBeVisible();
    const all = await events();
    expect(all.map(([, name]) => name)).toEqual(["lead_form_start", "generate_lead"]);
    expect(all[1][2]).toEqual({ form_id: "contact-callback", lead_service: "broadband", send_to: content.site.integrations.ga4MeasurementId });
    expect(JSON.stringify(all)).not.toContain(phone.slice(-4));
    expect(await leadsFor(phone)).toHaveLength(1);
  });
});
