import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { CONTENT_SCHEMA_VERSION, validateDraft } from "@/lib/content/draft-model";

import { createConfirmedUser, deleteUsers, localStackConfigured, localStackSkipReason, serviceClient, setMembership, type TestUser } from "./support/local-supabase";
import { settle } from "./support/network";

// M4 acceptance (docs/renovation/M4-PUBLISH.md), against the local Supabase
// stack: publishing puts the reviewed drafts live on the public pages at once,
// every publish is in the history with who and when, and rolling back brings
// back text, prices, theme colours and pictures exactly. The suite leaves the
// site showing the repository content again, as the other suites expect.

test.skip(!localStackConfigured, localStackSkipReason);
test.describe.configure({ mode: "serial" });

let admin: TestUser;
const home = content.pages.home;
const card = home.promos.tabs[0].items[0];
const priced = content.catalog.find((item) => item.id === card.packageId)!;

type Edition = { heading: string; price: number; accent: string; picture: string; file: string };
const first: Edition = { heading: "คำถามฉบับหนึ่ง", price: priced.price.amount + 11, accent: "#c8102e", picture: "flow-s7-support", file: "s7-support.webp" };
const second: Edition = { heading: "คำถามฉบับสอง", price: priced.price.amount + 22, accent: "#a3000f", picture: "flow-s8-fibre", file: "s8-fibre.webp" };

async function clearHistory() {
  const db = serviceClient();
  for (const query of [db.from("content_drafts").delete().neq("document_id", ""), db.from("content_publication").delete().eq("singleton", true), db.from("content_releases").delete().gte("number", 0)]) {
    const { error } = await query;
    if (error) throw error;
  }
}

/** Saves an edition as drafts, checked like the editor checks them. */
async function draftEdition(edition: Edition) {
  const page = structuredClone(home);
  page.faq.heading.th = edition.heading;
  page.promos.tabs[0].items[0].image = edition.picture;
  const item = { ...priced, price: { ...priced.price, amount: edition.price } };
  const site = { ...content.site, theme: { ...content.site.theme, accent: edition.accent } };
  const bodies: [string, unknown][] = [
    ["page:home", page],
    [`package:${priced.id}`, item],
    ["site", site],
  ];
  for (const [documentId, body] of bodies) {
    expect(validateDraft(content, documentId as never, body).ok, documentId).toBe(true);
    const { error } = await serviceClient().from("content_drafts").insert({ document_id: documentId, schema_version: CONTENT_SCHEMA_VERSION, body: body as never });
    if (error) throw error;
  }
}

/**
 * What visitors get now: the home page and the package page, as served. The home page's
 * headings are split into words for their entrance, so its words are also given without markup.
 */
async function live(request: APIRequestContext) {
  const homeHtml = await (await request.get("/")).text();
  const homeText = homeHtml.replace(/<[^>]+>/g, "");
  const packageHtml = await (await request.get(`/packages/${priced.id}`)).text();
  return { homeHtml, homeText, packageHtml };
}

async function expectLive(request: APIRequestContext, edition: Edition, others: Edition[]) {
  await expect.poll(async () => (await live(request)).homeText.includes(edition.heading), { timeout: 15_000 }).toBe(true);
  const { homeHtml, homeText, packageHtml } = await live(request);
  expect(homeHtml).toContain(edition.accent);
  expect(homeHtml).toContain(edition.file);
  expect(packageHtml).toContain(new Intl.NumberFormat("th-TH").format(edition.price));
  for (const other of others) {
    expect(homeText).not.toContain(other.heading);
    expect(homeHtml).not.toContain(other.accent);
  }
}

async function signIn(page: Page, next: string) {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("อีเมล").fill(admin.email);
  await page.getByLabel("รหัสผ่าน").fill(admin.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await page.waitForURL((url) => url.pathname === next);
}

test.beforeAll(async () => {
  admin = await createConfirmedUser("publisher");
  await setMembership(admin.id, "active");
  await clearHistory();
});

test.afterAll(async () => {
  await clearHistory();
  await deleteUsers([admin.id]);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

test("publishing puts the reviewed drafts live, and the history says who and when", async ({ page, request }) => {
  // The audit log is append-only: earlier runs left their own "release 1".
  const startedAt = new Date().toISOString();
  await draftEdition(first);
  await signIn(page, "/admin/publish");
  await expect(page.locator("[data-live-release]")).toHaveAttribute("data-live-release", "0");
  const list = page.locator("[data-publish-list]");
  await expect(list.locator("[data-document]")).toHaveCount(3);
  await expect(list.locator('[data-document="page:home"]')).toContainText("คำถามที่พบบ่อย › หัวเรื่อง › ไทย");
  await page.getByLabel(/บันทึกสั้นๆ/).fill("ฉบับหนึ่ง");
  await page.getByRole("button", { name: "เผยแพร่ 3 เอกสาร" }).click();

  await expect(page).toHaveURL(/\/admin\/releases\?published=1$/);
  await expect(page.getByRole("status").filter({ hasText: "เผยแพร่ฉบับที่ 1 แล้ว" })).toBeVisible();
  const row = page.locator('[data-release="1"]');
  await expect(row).toContainText("แสดงอยู่");
  await expect(row).toContainText(admin.email);
  await expect(row).toContainText("ฉบับหนึ่ง");

  await expectLive(request, first, []);
  const { data: drafts } = await serviceClient().from("content_drafts").select("document_id");
  expect(drafts).toEqual([]);
  const { data: audit } = await serviceClient().from("audit_log").select("action").eq("target_type", "content_release").eq("target_id", "1").gte("occurred_at", startedAt);
  expect(audit).toEqual([{ action: "content.publish" }]);
});

test("rolling back brings back the text, price, theme colour and picture of an earlier release", async ({ page, request }) => {
  await draftEdition(second);
  await signIn(page, "/admin/publish");
  await page.getByRole("button", { name: "เผยแพร่ 3 เอกสาร" }).click();
  await expect(page).toHaveURL(/published=2$/);
  await expectLive(request, second, [first]);

  await page.goto("/admin/releases?compare=1");
  await expect(page.getByRole("heading", { name: "ถ้าย้อนกลับไปฉบับที่ 1 จะเปลี่ยน" })).toBeVisible();
  await page.locator('[data-release="1"]').getByRole("button", { name: "ย้อนกลับไปฉบับที่ 1" }).click();
  await page.locator('[data-release="1"]').getByRole("button", { name: "ยืนยันย้อนกลับ" }).click();
  await expect(page).toHaveURL(/published=3$/);
  await expect(page.locator('[data-release="3"]')).toContainText("ย้อนกลับไปฉบับที่ 1");
  await expectLive(request, first, [second]);
});

test("putting the repository content back live leaves the site as the other suites expect", async ({ page, request }) => {
  // A release holding src/content, put live through the history like any rollback.
  const { error } = await serviceClient().from("content_releases").insert({ number: 4, schema_version: CONTENT_SCHEMA_VERSION, content: content as never, kind: "publish", note: "ตั้งต้น" });
  if (error) throw error;
  await signIn(page, "/admin/releases");
  await page.locator('[data-release="4"]').getByRole("button", { name: "ย้อนกลับไปฉบับที่ 4" }).click();
  await page.locator('[data-release="4"]').getByRole("button", { name: "ยืนยันย้อนกลับ" }).click();
  await expect(page).toHaveURL(/published=5$/);
  await expect.poll(async () => (await live(request)).homeText.includes(home.faq.heading.th), { timeout: 15_000 }).toBe(true);
  const { homeHtml, homeText } = await live(request);
  expect(homeText).not.toContain(first.heading);
  expect(homeHtml).not.toContain(first.accent);
});
