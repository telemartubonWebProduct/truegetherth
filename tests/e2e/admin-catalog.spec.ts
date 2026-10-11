import AxeBuilder from "@axe-core/playwright";
import { expect, test, type FrameLocator, type Page } from "@playwright/test";

import { groupsIn } from "@/components/catalog/catalog-edit";
import { content } from "@/lib/content";
import { todayInThailand } from "@/lib/content/dates";
import { featuredIn, isShown } from "@/lib/content/lookup";
import type { CatalogPackage, PackagePage } from "@/lib/content/schema";

import { createConfirmedUser, deleteUsers, localStackConfigured, localStackSkipReason, serviceClient, setMembership, type TestUser } from "./support/local-supabase";
import { settle } from "./support/network";

// "Packages and promos" (docs/renovation/R7-CATALOG.md), against the local
// Supabase stack: an Admin adds, prices, copies, moves, recommends, schedules
// and removes packages and makes groups for them on one page; every change is
// a draft that the Mirror editor's preview shows and visitors do not; and only
// active Admins get in. Desktop project only.

test.skip(!localStackConfigured, localStackSkipReason);
test.describe.configure({ mode: "serial" });

let admin: TestUser;
let member: TestUser;
const today = todayInThailand();
const monthly = groupsIn(content, "mobile-monthly");
const newCustomer = groupsIn(content, "broadband-new")[0];

async function clearDrafts() {
  const { error } = await serviceClient().from("content_drafts").delete().neq("document_id", "");
  if (error) throw error;
}

async function draftIds() {
  const { data, error } = await serviceClient().from("content_drafts").select("document_id");
  if (error) throw error;
  return data.map((row) => row.document_id);
}

async function stored<T>(documentId: string): Promise<T | null> {
  const { data, error } = await serviceClient().from("content_drafts").select("body").eq("document_id", documentId).maybeSingle();
  if (error) throw error;
  return (data?.body as T | undefined) ?? null;
}

async function signIn(page: Page, user: TestUser, next = "/admin/catalog") {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("อีเมล").fill(user.email);
  await page.getByLabel("รหัสผ่าน").fill(user.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await page.waitForURL((url) => url.pathname !== "/admin/login");
}

const saveStatus = (page: Page) => page.locator("[data-save-status]");
// A save is a pause after the change plus a round trip to Supabase; CI runners can be slow.
const saving = { timeout: 15_000 };
const saved = (page: Page) => expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
const groupsNav = (page: Page) => page.getByRole("navigation", { name: "กลุ่มในหมวดนี้" });
const form = (page: Page) => page.getByRole("dialog");
const row = (page: Page, id: string) => page.locator(`[data-catalog-item="${id}"]`);

function preview(page: Page): FrameLocator {
  return page.frameLocator('iframe[title^="ตัวอย่างหน้า"]');
}

test.beforeAll(async () => {
  admin = await createConfirmedUser("catalog");
  member = await createConfirmedUser("catalog-member");
  await setMembership(admin.id, "active");
  await clearDrafts();
});

test.afterAll(async () => {
  await clearDrafts();
  await deleteUsers([admin.id, member.id]);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

test("only active Admins reach Packages and promos, which the back office's menu leads to", async ({ page }) => {
  await page.goto("/admin/catalog");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fcatalog$/);
  await signIn(page, member);
  await expect(page).toHaveURL(/\/admin\/denied$/);

  await page.context().clearCookies();
  await signIn(page, admin, "/admin");
  await page.getByRole("navigation", { name: "เมนูหลังบ้าน" }).getByRole("link", { name: "แพ็กเกจและโปร" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "แพ็กเกจและโปร" })).toBeVisible();
  // Every category of the catalog is a tab, with its packages counted.
  const count = (category: CatalogPackage["category"]) => content.catalog.filter((item) => item.category === category).length;
  await expect(page.getByRole("tab", { name: new RegExp(`^เน็ตบ้าน ลูกค้าใหม่ ${count("broadband-new")}$`) })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tab", { name: new RegExp(`^มือถือรายเดือน ${count("mobile-monthly")}$`) })).toBeVisible();
  await expect(page.getByRole("list", { name: "รายการแพ็กเกจ" }).getByRole("listitem")).toHaveCount(count("broadband-new"));
});

test("a package is added, priced, shown, copied and removed, as drafts visitors do not see", async ({ page, request }) => {
  await signIn(page, admin);
  await groupsNav(page).getByRole("button", { name: new RegExp(`^${newCustomer.name}`) }).click();
  await page.getByRole("button", { name: "+ เพิ่มแพ็กเกจ" }).click();
  // Named first: the English name gives the package its address, which stays.
  const naming = page.getByRole("dialog", { name: /^แพ็กเกจใหม่ในกลุ่ม/ });
  await expect(naming.getByRole("button", { name: "สร้างแพ็กเกจ" })).toBeDisabled();
  await naming.getByLabel("ชื่อแพ็กเกจใหม่ ไทย").fill("โปรทดสอบ");
  await naming.getByLabel("ชื่อแพ็กเกจใหม่ English").fill("Test promo 555");
  const id = "test-promo-555";
  await expect(naming).toContainText(`/packages/${id}`);
  await naming.getByRole("button", { name: "สร้างแพ็กเกจ" }).click();
  await expect(form(page).getByRole("heading", { level: 2, name: "โปรทดสอบ" })).toBeVisible();
  await saved(page);
  expect(await draftIds()).toEqual(expect.arrayContaining([`package:${id}`, "catalog"]));
  // New: hidden, and with no price.
  expect(await stored<CatalogPackage>(`package:${id}`)).toMatchObject({ name: { th: "โปรทดสอบ", en: "Test promo 555" }, category: "broadband-new", group: newCustomer.group, price: { amount: 0 }, review: { status: "hidden" } });

  // Shown with no price: refused until a price is typed.
  await form(page).getByRole("radio", { name: "ยังไม่ยืนยัน (แสดงบนเว็บ)" }).click();
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "invalid", saving);
  await expect(form(page).getByRole("alert")).toContainText("แพ็กเกจที่แสดงบนเว็บต้องมีราคา");
  await form(page).getByLabel("ราคาเสนอ (บาท)").fill("555");
  await saved(page);
  expect(await stored<CatalogPackage>(`package:${id}`)).toMatchObject({ price: { amount: 555 }, review: { status: "unverified" } });
  // The card at the top of the form is the one visitors would get.
  await expect(form(page).getByLabel("ตัวอย่างการ์ดที่ลูกค้าเห็น")).toContainText("555");
  await form(page).getByRole("button", { name: "เสร็จ" }).click();
  await expect(row(page, id)).toContainText("โปรทดสอบ");
  await expect(row(page, id)).toContainText("แสดง · ยังไม่ยืนยัน");
  // After the group's last package.
  await expect(page.getByRole("list", { name: "รายการแพ็กเกจ" }).getByRole("listitem").last()).toHaveAttribute("data-catalog-item", id);

  // A copy has the price and the terms, but starts hidden, right after its original.
  await page.getByRole("button", { name: "ทำสำเนา: โปรทดสอบ" }).click();
  const copying = page.getByRole("dialog", { name: /^ทำสำเนา/ });
  await expect(copying.getByLabel("ชื่อแพ็กเกจใหม่ ไทย")).toHaveValue("โปรทดสอบ (สำเนา)");
  const copy = `${id}-copy`;
  await expect(copying).toContainText(`/packages/${copy}`);
  await copying.getByRole("button", { name: "สร้างแพ็กเกจ" }).click();
  await expect(form(page).getByRole("heading", { level: 2, name: "โปรทดสอบ (สำเนา)" })).toBeVisible();
  await saved(page);
  expect(await stored<CatalogPackage>(`package:${copy}`)).toMatchObject({ price: { amount: 555 }, review: { status: "hidden" }, group: newCustomer.group });
  await form(page).getByRole("button", { name: "เสร็จ" }).click();
  await expect(row(page, copy)).toContainText("ซ่อน");
  await expect(page.getByRole("list", { name: "รายการแพ็กเกจ" }).getByRole("listitem").last()).toHaveAttribute("data-catalog-item", copy);

  // Search and the status filter narrow the list.
  await page.getByRole("searchbox", { name: "ค้นหาแพ็กเกจ" }).fill("โปรทดสอบ");
  await expect(page.getByRole("list", { name: "รายการแพ็กเกจ" }).getByRole("listitem")).toHaveCount(2);
  await page.getByRole("combobox", { name: "กรองตามสถานะ" }).selectOption("hidden");
  await expect(page.getByRole("list", { name: "รายการแพ็กเกจ" }).getByRole("listitem")).toHaveCount(1);
  await page.getByRole("combobox", { name: "กรองตามสถานะ" }).selectOption("all");

  // Several at once: both chosen, both removed.
  await page.getByRole("checkbox", { name: "เลือก: โปรทดสอบ", exact: true }).check();
  await page.getByRole("checkbox", { name: "เลือก: โปรทดสอบ (สำเนา)" }).check();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("group", { name: "ทำกับที่เลือก" }).getByRole("button", { name: "ลบ", exact: true }).click();
  await expect(row(page, id)).toHaveCount(0);
  await expect(row(page, copy)).toHaveCount(0);
  await saved(page);

  // None of it reached visitors.
  expect(await (await request.get("/broadband")).text()).not.toContain("โปรทดสอบ");
  await clearDrafts();
});

test("a group is made, named and filled, and its page shows it once it has a package to show", async ({ page }) => {
  const mover = content.catalog.find((item) => item.category === "mobile-monthly" && isShown(item, today) && !content.featured.includes(item.id))!;
  await signIn(page, admin);
  await page.getByRole("tab", { name: /^มือถือรายเดือน/ }).click();
  await expect(groupsNav(page).getByRole("button")).toHaveCount(monthly.length + 2);

  await page.getByRole("button", { name: "+ เพิ่มกลุ่ม" }).click();
  await page.getByLabel("กลุ่มใหม่ ไทย").fill("คอมโบทดสอบ");
  await page.getByLabel("กลุ่มใหม่ English").fill("Test combo");
  await page.getByRole("button", { name: "เพิ่มกลุ่ม", exact: true }).click();
  await saved(page);
  const pageDraft = await stored<PackagePage>("page:mobile-monthly");
  expect(pageDraft!.sections[0].groups.at(-1)).toEqual({ id: "test-combo", heading: { th: "คอมโบทดสอบ", en: "Test combo" }, category: "mobile-monthly", group: "test-combo" });
  // The new group is open, and empty.
  await expect(page.getByRole("heading", { level: 2, name: "คอมโบทดสอบ" })).toBeVisible();
  await expect(page.getByText("กลุ่มนี้ยังไม่มีแพ็กเกจ")).toBeVisible();

  // Renamed: the heading visitors will read.
  await page.getByRole("button", { name: "เปลี่ยนชื่อ" }).click();
  await page.getByLabel("ชื่อกลุ่ม (หัวข้อที่ลูกค้าเห็นบนหน้าเว็บ) ไทย").fill("คอมโบใหม่ล่าสุด");
  await page.getByRole("button", { name: "บันทึกชื่อ" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "คอมโบใหม่ล่าสุด" })).toBeVisible();

  // A package of another group moves in from its own form.
  await groupsNav(page).getByRole("button", { name: /^ทุกกลุ่ม/ }).click();
  await row(page, mover.id).getByRole("button", { name: /^แก้ไข:/ }).click();
  await form(page).getByRole("combobox", { name: "กลุ่มของแพ็กเกจ" }).selectOption("mobile-monthly/test-combo");
  await saved(page);
  expect(await stored<CatalogPackage>(`package:${mover.id}`)).toMatchObject({ category: "mobile-monthly", group: "test-combo" });
  await form(page).getByRole("button", { name: "เสร็จ" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "คอมโบใหม่ล่าสุด" })).toBeVisible();
  await expect(page.getByRole("list", { name: "รายการแพ็กเกจ" }).getByRole("listitem")).toHaveCount(1);
  // A group with a package in it cannot be removed.
  await expect(page.getByRole("button", { name: "ลบกลุ่ม" })).toBeDisabled();

  // The Mirror editor's preview of the page shows the group under its new name, with the package in it.
  await page.getByRole("link", { name: "ดูบนหน้าเว็บ" }).click();
  await expect(page).toHaveURL(/\/admin\/editor\?page=mobile-monthly/);
  const frame = preview(page);
  await expect(frame.getByRole("heading", { level: 3, name: "คอมโบใหม่ล่าสุด" })).toBeVisible();
  await expect(frame.locator(`[data-package="${mover.id}"]`)).toBeVisible();
  await clearDrafts();
});

test("recommending a package asks for its picture, orders its card, and the home page's preview shows it", async ({ page }) => {
  const [tab] = content.pages.home.promos.tabs.filter((entry) => entry.categories.includes("mobile-monthly"));
  const cards = featuredIn(content, tab.categories, today);
  const pick = content.catalog.find((item) => item.category === "mobile-monthly" && isShown(item, today) && !content.featured.includes(item.id) && item.image === undefined)!;
  await signIn(page, admin);
  await page.getByRole("tab", { name: /^มือถือรายเดือน/ }).click();

  const star = row(page, pick.id).getByRole("button", { name: /^แนะนำในหน้าแรก:/ });
  await expect(star).toHaveAttribute("aria-pressed", "false");
  await star.click();
  // No picture yet: the library opens, and the choice is the package's picture.
  const library = page.getByRole("dialog", { name: "เลือกรูปจากคลังสื่อ" });
  await library.getByRole("searchbox", { name: "ค้นหารูป" }).fill("flow-s7-support");
  await library.getByRole("listitem").getByRole("button").first().click();
  await expect(star).toHaveAttribute("aria-pressed", "true");
  await saved(page);
  expect(await stored<CatalogPackage>(`package:${pick.id}`)).toMatchObject({ image: "flow-s7-support" });
  expect((await stored<{ featured: string[] }>("catalog"))!.featured).toEqual([...content.featured, pick.id]);

  // Its card is the tab's last; here it moves to second to last.
  await page.getByRole("tab", { name: /^โปรแนะนำหน้าแรก/ }).click();
  const list = page.getByRole("region", { name: "โปรแนะนำหน้าแรก" });
  await expect(list.locator("[data-featured-item]")).toHaveCount(content.featured.length + 1);
  await list.locator(`[data-featured-item="${pick.id}"]`).getByRole("button", { name: /^เลื่อนการ์ดขึ้น:/ }).click();
  await saved(page);
  const order = (await stored<{ featured: string[] }>("catalog"))!.featured.filter((id) => id === pick.id || cards.some((card) => card.id === id));
  expect(order).toEqual([...cards.slice(0, -1).map((card) => card.id), pick.id, cards.at(-1)!.id]);

  // The home page's preview has the card, in that place.
  await page.goto("/admin/editor");
  const frame = preview(page);
  const railCards = frame.locator(`#packages [aria-label="${tab.title.th}"] .card`);
  await expect(railCards).toHaveCount(cards.length + 1);
  await expect(railCards.nth(cards.length - 1)).toHaveAttribute("data-package", pick.id);

  // Taken out again: the card goes, the package and its picture stay.
  await page.goto("/admin/catalog");
  await page.getByRole("tab", { name: /^โปรแนะนำหน้าแรก/ }).click();
  await page.locator(`[data-featured-item="${pick.id}"]`).getByRole("button", { name: /^เอาออกจากหน้าแรก:/ }).click();
  await saved(page);
  const left = (await stored<{ featured: string[] }>("catalog"))!.featured;
  expect(left.slice().sort()).toEqual(content.featured.slice().sort());
  expect(left.filter((id) => cards.some((card) => card.id === id))).toEqual(cards.map((card) => card.id));
  expect(await stored<CatalogPackage>(`package:${pick.id}`)).toMatchObject({ image: "flow-s7-support" });
  await clearDrafts();
});

test("a package set to show until yesterday leaves its page, and one set to start tomorrow waits", async ({ page }) => {
  const [first, second] = content.catalog.filter((item) => item.category === "broadband-new" && isShown(item, today));
  const day = (offset: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date(Date.now() + offset * 86_400_000));
  await signIn(page, admin);

  await row(page, first.id).getByRole("button", { name: /^แก้ไข:/ }).click();
  await form(page).getByLabel("แสดงถึงวันที่").fill(day(-1));
  await expect(form(page).getByText("พ้นช่วงแสดงแล้ว")).toBeVisible();
  // The days must be in order.
  await form(page).getByLabel("เริ่มแสดงวันที่").fill(day(0));
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "invalid", saving);
  await expect(form(page).getByRole("alert")).toContainText("วันสิ้นสุดการแสดงต้องไม่ก่อนวันเริ่ม");
  await form(page).getByLabel("เริ่มแสดงวันที่").fill("");
  await saved(page);
  await form(page).getByRole("button", { name: "เสร็จ" }).click();
  await expect(row(page, first.id)).toContainText("พ้นช่วงแสดง");

  await row(page, second.id).getByRole("button", { name: /^แก้ไข:/ }).click();
  await form(page).getByLabel("เริ่มแสดงวันที่").fill(day(1));
  await saved(page);
  await form(page).getByRole("button", { name: "เสร็จ" }).click();
  await expect(row(page, second.id)).toContainText(`รอแสดง ${day(1)}`);
  expect(await stored<CatalogPackage>(`package:${first.id}`)).toMatchObject({ showUntil: day(-1) });
  expect(await stored<CatalogPackage>(`package:${second.id}`)).toMatchObject({ showFrom: day(1) });

  // Neither is on the page's preview; the others are.
  await page.goto("/admin/editor?page=broadband-new");
  const frame = preview(page);
  await expect(frame.locator("[data-package]").first()).toBeVisible();
  await expect(frame.locator(`[data-package="${first.id}"]`)).toHaveCount(0);
  await expect(frame.locator(`[data-package="${second.id}"]`)).toHaveCount(0);
  await clearDrafts();
});

test("benefits are added, named and removed where the packages are", async ({ page }) => {
  await signIn(page, admin);
  await page.getByRole("tab", { name: /^สิทธิประโยชน์/ }).click();
  const list = page.getByRole("region", { name: "สิทธิประโยชน์" });
  await expect(list.locator("[data-benefit-item]")).toHaveCount(Object.keys(content.benefits).length);
  // One that packages list cannot be removed.
  const used = content.catalog.find((item) => item.benefits.length > 0)!.benefits[0];
  await expect(list.locator(`[data-benefit-item="${used}"]`).getByRole("button", { name: /^ลบ:/ })).toBeDisabled();

  await list.getByRole("button", { name: "+ เพิ่มสิทธิประโยชน์" }).click();
  await list.getByLabel("ชื่อสิทธิประโยชน์ ไทย").fill("ของแถมทดสอบ");
  await saved(page);
  const id = (await draftIds()).find((entry) => entry.startsWith("benefit:"))!;
  expect(await stored<{ label: { th: string } }>(id)).toMatchObject({ label: { th: "ของแถมทดสอบ" } });
  await list.getByRole("button", { name: "ลบ: ของแถมทดสอบ" }).click();
  await expect(list.locator("[data-benefit-item]")).toHaveCount(Object.keys(content.benefits).length);
  await clearDrafts();
});

test("the page, with a package open, passes the automated WCAG checks", async ({ page }) => {
  await signIn(page, admin);
  const check = async (where: string) => {
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`), where).toEqual([]);
  };
  await check("the list");
  await page.getByRole("button", { name: /^แก้ไข:/ }).first().click();
  await expect(form(page)).toBeVisible();
  await check("a package's form");
  await form(page).getByRole("button", { name: "ทำสำเนา" }).click();
  await expect(page.getByRole("dialog", { name: /^ทำสำเนา/ })).toBeVisible();
  await check("naming a copy");
  await page.getByRole("dialog", { name: /^ทำสำเนา/ }).getByRole("button", { name: "ยกเลิก" }).click();
  await form(page).getByRole("button", { name: "เสร็จ" }).click();
  await page.getByRole("tab", { name: /^โปรแนะนำหน้าแรก/ }).click();
  await check("the recommended packages");
  await page.getByRole("tab", { name: /^สิทธิประโยชน์/ }).click();
  await check("the benefits");
});
