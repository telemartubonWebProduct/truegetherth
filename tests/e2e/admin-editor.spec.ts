import { expect, test, type Browser, type FrameLocator, type Page } from "@playwright/test";

import { content } from "@/lib/content";
import { todayInThailand } from "@/lib/content/dates";
import { featuredIn } from "@/lib/content/lookup";

import {
  createConfirmedUser,
  deleteUsers,
  localStackConfigured,
  localStackSkipReason,
  serviceClient,
  setMembership,
  type TestUser,
} from "./support/local-supabase";
import { blockThirdParty, settle } from "./support/network";

// M3 acceptance for the Mirror editor, against the local Supabase stack:
// edits show in the preview at once and autosave as drafts, drafts survive a
// reload and never reach the public site, concurrent edits are caught,
// invalid values are not saved, and only active Admins get in. Desktop
// project only; the phone preview is checked inside the editor.

test.skip(!localStackConfigured, localStackSkipReason);
test.describe.configure({ mode: "serial" });

let admin: TestUser;
let member: TestUser;
const createdUserIds: string[] = [];
const publishedHeading = content.pages.home.promos.heading;
/** The heading the tests edit: the recommended packages' (the hero's is a list of lines). */
const HEADING = "#rail-heading";

/** Every draft goes: the tests write pages, settings, packages, pictures and the package order. */
async function clearDrafts() {
  const { error } = await serviceClient().from("content_drafts").delete().neq("document_id", "");
  if (error) throw error;
}

async function draftIds() {
  const { data, error } = await serviceClient().from("content_drafts").select("document_id");
  if (error) throw error;
  return data.map((row) => row.document_id);
}

async function storedDraft(documentId: string) {
  const { data, error } = await serviceClient().from("content_drafts").select("body, revision").eq("document_id", documentId).maybeSingle();
  if (error) throw error;
  return data as { body: { promos?: { heading: { th: string; en: string } } }; revision: number } | null;
}

test.beforeAll(async () => {
  admin = await createConfirmedUser("editor");
  member = await createConfirmedUser("editor-member");
  createdUserIds.push(admin.id, member.id);
  await setMembership(admin.id, "active");
  await clearDrafts();
});

test.afterAll(async () => {
  await clearDrafts();
  await deleteUsers(createdUserIds);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

async function signIn(page: Page, user: TestUser, next = "/admin/editor") {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("อีเมล").fill(user.email);
  await page.getByLabel("รหัสผ่าน").fill(user.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
  await page.waitForURL((url) => url.pathname !== "/admin/login");
}

function preview(page: Page): FrameLocator {
  return page.frameLocator('iframe[title^="ตัวอย่างหน้า"]');
}

async function openEditor(page: Page, path = "/admin/editor") {
  await page.goto(path);
  await expect(preview(page).locator("h1").first()).toBeVisible();
  // The preview has received the working content once the panel reflects the page.
  await expect(page.getByRole("button", { name: /ส่วนเปิดหน้า/ })).toBeVisible();
}

const saveStatus = (page: Page) => page.locator("[data-save-status]");
// A save is a pause in typing plus a round trip to Supabase; CI runners can be slow.
const saving = { timeout: 15_000 };

async function editorSession(browser: Browser) {
  const context = await browser.newContext({ locale: "th-TH", viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await signIn(page, admin);
  await expect(page).toHaveURL(/\/admin\/editor(\?|$)/);
  await expect(preview(page).locator("h1").first()).toBeVisible();
  return { context, page };
}

test("only active Admins reach the editor and its preview", async ({ page }) => {
  await page.goto("/admin/editor");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Feditor$/);
  await page.goto("/admin/preview/th/home");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fpreview%2Fth%2Fhome$/);

  await signIn(page, member);
  await expect(page).toHaveURL(/\/admin\/denied$/);
  await page.goto("/admin/preview/th/home");
  await expect(page).toHaveURL(/\/admin\/denied$/);
  await page.goto("/admin/editor");
  await expect(page).toHaveURL(/\/admin\/denied$/);
});

test("an edit shows in the preview at once, autosaves, survives a reload and stays off the public site", async ({ page, request }) => {
  await signIn(page, admin);
  await openEditor(page);
  const frame = preview(page);
  const marker = `หัวเรื่องร่าง ${Date.now()}`;

  await frame.locator(HEADING).click();
  const thai = page.getByRole("textbox", { name: "หัวเรื่อง ไทย" });
  await expect(thai).toBeFocused();
  await thai.fill(marker);
  await expect(frame.locator(HEADING)).toHaveText(marker);
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
  expect((await storedDraft("page:home"))?.body.promos?.heading.th).toBe(marker);

  await page.reload();
  await expect(preview(page).locator(HEADING)).toHaveText(marker);

  // Visitors get the published page: no draft text, no editor markup.
  for (const path of ["/", "/en"]) {
    const html = await (await request.get(path)).text();
    expect(html).not.toContain(marker);
    expect(html).not.toContain("data-edit");
  }
  const previewResponse = await page.request.get("/admin/preview/th/home");
  expect(previewResponse.headers()["cache-control"]).toContain("no-store");
  expect(previewResponse.headers()["x-robots-tag"]).toContain("noindex");
});

test("a value the schema rejects is flagged and not saved", async ({ page }) => {
  await signIn(page, admin);
  await openEditor(page);
  const before = await storedDraft("page:home");

  await preview(page).locator(HEADING).click();
  await page.getByRole("textbox", { name: "หัวเรื่อง English" }).fill("");
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "invalid", saving);
  await expect(page.getByText("ต้องกรอกข้อความ")).toBeVisible();
  expect(await storedDraft("page:home")).toEqual(before);

  await page.getByRole("textbox", { name: "หัวเรื่อง English" }).fill(publishedHeading.en);
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
});

test("a save from another session is caught as a conflict instead of being overwritten", async ({ browser }) => {
  const first = await editorSession(browser);
  const second = await editorSession(browser);
  const theirs = `ฉบับของผู้ดูแลคนแรก ${Date.now()}`;

  await preview(first.page).locator(HEADING).click();
  await first.page.getByRole("textbox", { name: "หัวเรื่อง ไทย" }).fill(theirs);
  await expect(saveStatus(first.page)).toHaveAttribute("data-save-status", "saved", saving);

  await preview(second.page).locator(HEADING).click();
  await second.page.getByRole("textbox", { name: "หัวเรื่อง ไทย" }).fill("ฉบับที่สอง ซึ่งเปิดไว้ก่อนหน้า");
  await expect(saveStatus(second.page)).toHaveAttribute("data-save-status", "conflict", saving);
  await expect(second.page.getByRole("alert").filter({ hasText: "ผู้ดูแลอีกคนบันทึกเอกสารนี้" })).toBeVisible();
  expect((await storedDraft("page:home"))?.body.promos?.heading.th).toBe(theirs);

  await second.page.getByRole("button", { name: "ใช้ฉบับล่าสุดในระบบ (ทิ้งที่ฉันแก้)" }).click();
  await expect(second.page.getByRole("textbox", { name: "หัวเรื่อง ไทย" })).toHaveValue(theirs);
  await expect(preview(second.page).locator(HEADING)).toHaveText(theirs);
  await expect(saveStatus(second.page)).not.toHaveAttribute("data-save-status", "conflict", saving);

  await settle(first.page);
  await settle(second.page);
  await first.context.close();
  await second.context.close();
});

test("discarding a draft brings back the published page", async ({ page }) => {
  await signIn(page, admin);
  await openEditor(page);
  expect(await storedDraft("page:home")).not.toBeNull();

  await page.getByRole("button", { name: "ทิ้งร่างของเอกสารนี้" }).click();
  await page.getByRole("button", { name: "ทิ้งร่าง", exact: true }).click();
  await expect(preview(page).locator(HEADING)).toHaveText(publishedHeading.th);
  await expect.poll(() => storedDraft("page:home"), saving).toBeNull();
});

test("viewing follows links inside the site and never leaves it", async ({ page }) => {
  await signIn(page, admin);
  await openEditor(page);
  const frame = preview(page);

  await page.getByRole("button", { name: "ดูหน้าเว็บ" }).click();
  // The menu opens as on the site; its links stay inside the preview.
  await frame.getByRole("button", { name: "เมนู" }).click();
  await frame.getByRole("banner").getByRole("link", { name: "ติดต่อเรา" }).click();
  await expect(page).toHaveURL(/page=contact/);
  await expect(page.getByRole("combobox", { name: "หน้า" })).toHaveValue("contact");
  await expect(frame.locator("h1").first()).toHaveText(content.pages.contact.hero.heading.th);

  await frame.getByRole("link", { name: /แชตทาง LINE/ }).first().click();
  await expect(page.getByRole("status").filter({ hasText: "หน้าตัวอย่างไม่เปิดลิงก์ออกนอกเว็บ" })).toBeVisible();
  expect(page.frames().some((entry) => entry.url().startsWith("https://lin.ee"))).toBe(false);
});

test("the editor and its preview load no Google Ads tag and report no conversion", async ({ page }) => {
  const googleRequests: string[] = [];
  page.context().on("request", (request) => {
    if (/(^|\.)(googletagmanager|googleadservices|doubleclick)\.(com|net)$/.test(new URL(request.url()).hostname)) googleRequests.push(request.url());
  });
  const tagState = () =>
    Promise.all(
      page.frames().map((frame) =>
        frame.evaluate(() => {
          const scope = window as unknown as { gtag?: unknown; dataLayer?: unknown[] };
          return { url: location.pathname, gtag: typeof scope.gtag, queued: scope.dataLayer?.length ?? 0 };
        }),
      ),
    );

  // The preview URL opened on its own, outside the editor.
  await signIn(page, admin, "/admin/preview/th/home");
  await expect(page.locator("h1").first()).toBeVisible();
  await settle(page);
  expect(await tagState()).toEqual([{ url: "/admin/preview/th/home", gtag: "undefined", queued: 0 }]);

  // The editor, editing and then viewing the home page in its preview.
  await openEditor(page);
  await page.getByRole("button", { name: "ดูหน้าเว็บ" }).click();
  await settle(page);
  const frames = await tagState();
  expect(frames.map((frame) => frame.url)).toEqual(["/admin/editor", "/admin/preview/th/home"]);
  for (const frame of frames) expect(frame, frame.url).toMatchObject({ gtag: "undefined", queued: 0 });
  expect(googleRequests).toEqual([]);
});

test("the editor shows every tab of recommended packages, and a card leads to its package in Packages and promos", async ({ page }) => {
  const tab = content.pages.home.promos.tabs[1];
  const [card] = featuredIn(content, tab.categories, todayInThailand());
  await signIn(page, admin);
  await openEditor(page);
  const frame = preview(page);
  // Stacked, not tabbed, so every card can be clicked.
  for (const entry of content.pages.home.promos.tabs) {
    await expect(frame.locator("#packages .rail-panel-title").filter({ hasText: entry.title.th })).toBeVisible();
  }
  await expect(frame.getByRole("tablist")).toHaveCount(0);

  // A package is not edited here: the panel says what the card shows and leads to its form.
  await frame.locator(`[data-package="${card.id}"]`).getByRole("heading", { level: 3 }).click();
  await expect(page.getByRole("heading", { level: 2, name: `แพ็กเกจ ${card.name.th}` })).toBeVisible();
  await expect(page.getByLabel("ราคาเสนอ (บาท)")).toHaveCount(0);
  await page.getByRole("link", { name: "แก้แพ็กเกจนี้ในหน้าแพ็กเกจและโปร" }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/catalog\\?package=${card.id}$`));
  await expect(page.getByRole("dialog").getByRole("heading", { level: 2, name: card.name.th })).toBeVisible();
  await expect(page.getByRole("dialog").getByLabel("ราคาเสนอ (บาท)")).toHaveValue(String(card.price.amount));
  expect(await draftIds()).not.toContain(`package:${card.id}`);
});

test("a list grows, moves and shrinks from the editor, within the page's limits", async ({ page }) => {
  await clearDrafts();
  const items = content.pages.home.faq.items;
  await signIn(page, admin);
  await openEditor(page);
  const frame = preview(page);
  await frame.locator("#faq-heading").click();
  await page.getByRole("button", { name: /^รายการ/ }).click();
  await page.getByRole("button", { name: /^\+ เพิ่มรายการ/ }).click();
  await expect(frame.locator(".faq details")).toHaveCount(items.length + 1);
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
  let stored = (await storedDraft("page:home")) as unknown as { body: typeof content.pages.home } | null;
  const added = stored!.body.faq.items.at(-1)!;
  expect(added.id).not.toBe(items.at(-1)!.id);
  expect(added.question).toEqual(items.at(-1)!.question);

  // Back to the list: move the copy up one, then remove it.
  await page.getByRole("navigation", { name: "ตำแหน่งของช่องที่เลือก" }).getByRole("button", { name: "รายการ", exact: true }).click();
  await page.getByRole("button", { name: `เลื่อนขึ้น: ${items.at(-1)!.question.th}` }).last().click();
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
  stored = (await storedDraft("page:home")) as unknown as { body: typeof content.pages.home } | null;
  expect(stored!.body.faq.items.map((item) => item.id).at(-2)).toBe(added.id);
  await page.getByRole("button", { name: `ลบ: ${items.at(-1)!.question.th}` }).nth(0).click();
  await expect(frame.locator(".faq details")).toHaveCount(items.length);

  // The steps are exactly four (the slip prints four): they reorder but neither grow nor shrink.
  await frame.locator("#ticket-heading").click();
  await page.getByRole("button", { name: /^รายการ/ }).click();
  await expect(page.getByRole("button", { name: /^\+ เพิ่ม/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^ลบ:/ })).toHaveCount(0);
  await clearDrafts();
});

test("a picture uploaded from the editor joins the library and shows on the page", async ({ page }) => {
  await clearDrafts();
  await signIn(page, admin);
  await openEditor(page, "/admin/editor?page=solar");
  const frame = preview(page);
  const picture = frame.locator("main img[data-edit]").first();
  await picture.click();
  await page.getByRole("button", { name: /^เปลี่ยน/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "เลือกรูปจากคลังสื่อ" });
  await dialog.getByLabel(/ไฟล์รูป/).setInputFiles("public/assets/HomeInternet/home-tol-newcustomer.webp");
  await dialog.getByLabel("คำอธิบายรูป ไทย").fill("รูปทดสอบอัปโหลด");
  await dialog.getByLabel("คำอธิบายรูป English").fill("Uploaded test picture");
  await dialog.getByRole("button", { name: "อัปโหลดและเลือกรูปนี้" }).click();
  await expect(dialog).toBeHidden({ timeout: 20_000 });
  await expect(picture).toHaveAttribute("src", /storage%2Fv1%2Fobject%2Fpublic%2Fmedia%2Fuploads/);
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
  const ids = await draftIds();
  expect(ids.some((id) => id.startsWith("media:upload-"))).toBe(true);
  expect(ids).toContain("page:solar");
  await clearDrafts();
});

test("the lead conversion is edited in the site settings, only for the site's own Google Ads account", async ({ page }) => {
  const { googleAdsId, googleAdsLeadConversion } = content.site.integrations;
  const storedConversion = async () => {
    const { data, error } = await serviceClient().from("content_drafts").select("body").eq("document_id", "site").maybeSingle();
    if (error) throw error;
    return data && (data.body as { integrations: { googleAdsLeadConversion: string } }).integrations.googleAdsLeadConversion;
  };
  await signIn(page, admin);
  await openEditor(page);
  await page.getByRole("button", { name: "ตั้งค่าทั้งเว็บ" }).click();
  await page.getByRole("button", { name: /การเชื่อมต่อ/ }).click();
  const field = page.getByRole("textbox", { name: "Google Ads conversion เมื่อลูกค้าส่งฟอร์มหรือกดติดต่อ (send_to)" });
  await expect(field).toHaveValue(googleAdsLeadConversion);
  // The tag stays fixed.
  await expect(page.getByRole("textbox", { name: /Google Ads ID/ })).toHaveCount(0);

  await field.fill("AW-1/OtherAccount");
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "invalid", saving);
  await expect(page.getByText(`ต้องเป็นบัญชี Google Ads เดียวกับแท็กของเว็บ (${googleAdsId}/…)`)).toBeVisible();
  expect(await storedConversion()).toBeNull();

  await field.fill(`${googleAdsId}/E2eLabel`);
  await expect(saveStatus(page)).toHaveAttribute("data-save-status", "saved", saving);
  expect(await storedConversion()).toBe(`${googleAdsId}/E2eLabel`);

  await page.getByRole("button", { name: "ทิ้งร่างของเอกสารนี้" }).click();
  await page.getByRole("button", { name: "ทิ้งร่าง", exact: true }).click();
  await expect(field).toHaveValue(googleAdsLeadConversion);
  await expect.poll(storedConversion, saving).toBeNull();
});

test("the preview renders the phone layout at phone width", async ({ page }) => {
  await signIn(page, admin);
  await openEditor(page);
  await page.getByRole("button", { name: "มือถือ", exact: true }).click();
  const frameElement = page.locator('iframe[title^="ตัวอย่างหน้า"]');
  await expect(frameElement).toHaveCSS("width", "390px");
  const frame = preview(page);
  await expect(frame.getByRole("button", { name: "เมนู" })).toBeVisible();
  await expect(frame.getByRole("navigation", { name: "เมนูหลัก" }).first()).toBeHidden();
});

test("the preview is the public page, pixel for pixel", async ({ browser, baseURL }) => {
  // Six full-page shots of long pages and three comparisons take about half
  // the default timeout.
  test.setTimeout(60_000);
  // Reduced motion lays the home page's stages flat and holds the painting
  // still in both, so the shots are stable.
  const context = await browser.newContext({ locale: "th-TH", viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await blockThirdParty(context, baseURL!);
  const page = await context.newPage();
  await signIn(page, admin, "/admin");
  await expect(page).toHaveURL(/\/admin$/);

  const shot = async (path: string) => {
    await page.goto(path);
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      window.scrollTo(0, 0);
      // The navigation and the home page's opening fade in (also with reduced motion): wait until they are there.
      const fading = () => [...document.querySelectorAll(".nav, .hero-scene, .hero-foot, .hero-foot > * > *")].some((element) => getComputedStyle(element).opacity !== "1");
      for (let tries = 0; tries < 100 && fading(); tries++) await new Promise((resolve) => setTimeout(resolve, 50));
      // Lazy pictures in closed tabs, or scrolled sideways off screen in a row
      // of cards, load only when they come into view; neither page shows them.
      const shown = Array.from(document.images).filter((image) => {
        const box = image.getBoundingClientRect();
        return image.checkVisibility() && box.right > 0 && box.left < window.innerWidth;
      });
      await Promise.all(shown.map((image) => (image.complete ? null : new Promise((resolve) => (image.onload = image.onerror = resolve)))));
    });
    return (await page.screenshot({ fullPage: true, animations: "disabled" })).toString("base64");
  };
  const pairs = [
    ["/", "/admin/preview/th/home"],
    ["/en/broadband", "/admin/preview/en/broadband-new"],
    ["/wifiService", "/admin/preview/th/apply-with-agent"],
  ] as const;
  for (const [publicPath, previewPath] of pairs) {
    const publicShot = await shot(publicPath);
    const previewShot = await shot(previewPath);
    expect(await pixelDifference(page, publicShot, previewShot), `${previewPath} against ${publicPath}`).toBeLessThan(0.001);
  }
  await settle(page);
  await context.close();
});

/** Share of pixels that differ between two PNG screenshots (1 when the sizes differ). */
async function pixelDifference(page: Page, publicShot: string, previewShot: string): Promise<number> {
  return page.evaluate(
    async ([a, b]) => {
      const load = (src: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = `data:image/png;base64,${src}`;
        });
      const [left, right] = await Promise.all([load(a), load(b)]);
      if (left.width !== right.width || left.height !== right.height) return 1;
      const canvas = document.createElement("canvas");
      canvas.width = left.width;
      canvas.height = left.height;
      const context2d = canvas.getContext("2d")!;
      context2d.drawImage(left, 0, 0);
      const pixelsA = context2d.getImageData(0, 0, canvas.width, canvas.height).data;
      context2d.drawImage(right, 0, 0);
      const pixelsB = context2d.getImageData(0, 0, canvas.width, canvas.height).data;
      let changed = 0;
      for (let index = 0; index < pixelsA.length; index += 4) {
        if (Math.abs(pixelsA[index] - pixelsB[index]) + Math.abs(pixelsA[index + 1] - pixelsB[index + 1]) + Math.abs(pixelsA[index + 2] - pixelsB[index + 2]) > 30) changed += 1;
      }
      return changed / (pixelsA.length / 4);
    },
    [publicShot, previewShot],
  );
}
