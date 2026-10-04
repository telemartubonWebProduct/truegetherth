import { expect, test, type Page } from "@playwright/test";

import {
  confirmLink,
  createConfirmedUser,
  deleteUsers,
  localStackConfigured,
  localStackSkipReason,
  publicClient,
  serviceClient,
  setMembership,
  strongPassword,
  uniqueEmail,
  waitForEmail,
  type TestUser,
} from "./support/local-supabase";
import { settle } from "./support/network";

// M1 acceptance: sign-in, sign-out, password recovery, invitations and denied
// access, exercised against a real Supabase Auth, Data API and Postgres (local
// stack). Runs on the desktop project only; see playwright.config.ts.

test.skip(!localStackConfigured, localStackSkipReason);
test.describe.configure({ mode: "serial" });

let admin: TestUser;
let member: TestUser;
let inactive: TestUser;
const createdUserIds: string[] = [];

test.beforeAll(async () => {
  admin = await createConfirmedUser("admin");
  member = await createConfirmedUser("member");
  inactive = await createConfirmedUser("inactive");
  createdUserIds.push(admin.id, member.id, inactive.id);
  await setMembership(admin.id, "active");
  await setMembership(inactive.id, "inactive");
});

test.afterAll(async () => {
  await deleteUsers(createdUserIds);
});

test.afterEach(async ({ page }) => {
  await settle(page);
});

// Next's route announcer is also role="alert"; page messages live in <main>.
function inMain(page: Page) {
  return page.getByRole("main");
}

async function signIn(page: Page, user: { email: string; password: string }, path = "/admin/login") {
  await page.goto(path);
  await page.getByLabel("อีเมล").fill(user.email);
  await page.getByLabel("รหัสผ่าน").fill(user.password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(page).toHaveURL(/\/admin\/login\?notice=signed-out$/);
}

async function setNewPassword(page: Page, password: string) {
  await page.getByLabel("รหัสผ่านใหม่", { exact: true }).fill(password);
  await page.getByLabel("ยืนยันรหัสผ่านใหม่").fill(password);
  await page.getByRole("button", { name: "บันทึกรหัสผ่านใหม่" }).click();
  await expect(page).toHaveURL(/\/admin\/login\?notice=password-updated$/);
}

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("เข้าสู่ระบบหลังบ้าน");

  await page.goto("/admin/update-password");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fupdate-password$/);
});

test("back-office pages are private: not cached, not indexed, not framed", async ({ page }) => {
  const response = await page.goto("/admin/login");
  const headers = response?.headers() ?? {};
  expect(headers["cache-control"]).toContain("no-store");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("wrong credentials get one generic message", async ({ page }) => {
  await signIn(page, { email: admin.email, password: "Wrong-password-123" });
  await expect(inMain(page).getByRole("alert")).toHaveText("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  await expect(page.getByLabel("อีเมล")).toHaveValue(admin.email);

  await signIn(page, { email: uniqueEmail("nobody"), password: "Wrong-password-123" });
  await expect(inMain(page).getByRole("alert")).toHaveText("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
});

test("an active Admin signs in, reaches the console and signs out", async ({ page }) => {
  await signIn(page, admin);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ภาพรวม");
  await expect(page.getByText("ผู้ดูแล (Admin) — ใช้งานอยู่")).toBeVisible();

  await signOut(page);
  await expect(inMain(page).getByRole("status")).toHaveText("ออกจากระบบแล้ว");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("sign-in only returns to back-office paths on this site", async ({ page }) => {
  await signIn(page, admin, `/admin/login?next=${encodeURIComponent("https://evil.example/steal")}`);
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/admin$/);
  await signOut(page);

  await signIn(page, admin, `/admin/login?next=${encodeURIComponent("//evil.example")}`);
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/admin$/);
  await signOut(page);

  await signIn(page, admin, `/admin/login?next=${encodeURIComponent("/admin/update-password")}`);
  await expect(page).toHaveURL(/\/admin\/update-password$/);
});

test("an account without membership is denied, in the UI and in the Data API", async ({ page }) => {
  await signIn(page, member);
  await expect(page).toHaveURL(/\/admin\/denied$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("บัญชีนี้ยังไม่มีสิทธิ์เข้าหลังบ้าน");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/denied$/);
  await signOut(page);

  const client = publicClient();
  const { error: signInError } = await client.auth.signInWithPassword(member);
  expect(signInError).toBeNull();
  const memberships = await client.from("admin_memberships").select("user_id");
  expect(memberships.data).toEqual([]);
  const audit = await client.from("audit_log").select("id");
  expect(audit.data).toEqual([]);
  const selfEnroll = await client.from("admin_memberships").insert({ user_id: member.id });
  expect(selfEnroll.error?.code).toBe("42501");
  await client.auth.signOut();
});

test("a deactivated Admin is denied", async ({ page }) => {
  await signIn(page, inactive);
  await expect(page).toHaveURL(/\/admin\/denied$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "สิทธิ์ผู้ดูแลของบัญชีนี้ถูกปิดใช้งาน",
  );
  await signOut(page);
});

test("revoking an Admin takes effect on the next request", async ({ page }) => {
  await signIn(page, admin);
  await expect(page).toHaveURL(/\/admin$/);

  await setMembership(admin.id, "inactive");
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/denied$/);

  await setMembership(admin.id, "active");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ภาพรวม");
  await signOut(page);
});

test("password recovery by email sets a new password once", async ({ page, baseURL }) => {
  // Unknown addresses get the same answer, so accounts cannot be discovered.
  await page.goto("/admin/forgot-password");
  await page.getByLabel("อีเมลของบัญชีผู้ดูแล").fill(uniqueEmail("nobody"));
  await page.getByRole("button", { name: "ส่งลิงก์ตั้งรหัสผ่านใหม่" }).click();
  const genericAnswer = await inMain(page).getByRole("status").textContent();

  const since = new Date();
  await page.goto("/admin/forgot-password");
  await page.getByLabel("อีเมลของบัญชีผู้ดูแล").fill(admin.email);
  await page.getByRole("button", { name: "ส่งลิงก์ตั้งรหัสผ่านใหม่" }).click();
  await expect(inMain(page).getByRole("status")).toHaveText(genericAnswer ?? "");

  const link = confirmLink(await waitForEmail(admin.email, since));
  expect(new URL(link).origin).toBe(new URL(baseURL!).origin);
  await page.goto(link);
  await expect(page).toHaveURL(/\/admin\/update-password$/);

  const newPassword = strongPassword();
  await setNewPassword(page, newPassword);

  // One-time link: a second use is rejected.
  await page.goto(link);
  await expect(page).toHaveURL(/\/admin\/login\?notice=link-invalid$/);

  await signIn(page, admin);
  await expect(inMain(page).getByRole("alert")).toHaveText("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  admin = { ...admin, password: newPassword };
  await signIn(page, admin);
  await expect(page).toHaveURL(/\/admin$/);
  await signOut(page);
});

test("new passwords must meet the policy and match", async ({ page }) => {
  await signIn(page, admin, `/admin/login?next=${encodeURIComponent("/admin/update-password")}`);
  await expect(page).toHaveURL(/\/admin\/update-password$/);

  await page.getByLabel("รหัสผ่านใหม่", { exact: true }).fill("short");
  await page.getByLabel("ยืนยันรหัสผ่านใหม่").fill("short");
  await page.getByRole("button", { name: "บันทึกรหัสผ่านใหม่" }).click();
  await expect(page.getByText("รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร")).toBeVisible();

  await page.getByLabel("รหัสผ่านใหม่", { exact: true }).fill(strongPassword());
  await page.getByLabel("ยืนยันรหัสผ่านใหม่").fill(strongPassword());
  await page.getByRole("button", { name: "บันทึกรหัสผ่านใหม่" }).click();
  await expect(page.getByText("รหัสผ่านทั้งสองช่องไม่ตรงกัน")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/update-password$/);
});

test("an invited person sets a password and waits for Admin access", async ({ page }) => {
  const email = uniqueEmail("invitee");
  const since = new Date();
  const { data, error } = await serviceClient().auth.admin.inviteUserByEmail(email);
  expect(error).toBeNull();
  createdUserIds.push(data.user!.id);

  await page.goto(confirmLink(await waitForEmail(email, since)));
  await expect(page).toHaveURL(/\/admin\/update-password$/);
  const invitee = { email, password: strongPassword() };
  await setNewPassword(page, invitee.password);

  await signIn(page, invitee);
  await expect(page).toHaveURL(/\/admin\/denied$/);

  await setMembership(data.user!.id, "active");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("ภาพรวม");
  await signOut(page);
});

test("tampered or unsupported email links are rejected", async ({ page }) => {
  for (const query of [
    "token_hash=not-a-real-token&type=recovery",
    "token_hash=not-a-real-token&type=signup",
    "code=not-a-real-code",
    `token_hash=x&type=recovery&next=${encodeURIComponent("https://evil.example")}`,
  ]) {
    await page.goto(`/auth/confirm?${query}`);
    await expect(page).toHaveURL(/\/admin\/login\?notice=link-invalid$/);
  }
  await expect(inMain(page).getByRole("alert")).toContainText("ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว");
});

test.describe("console on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps navigation and sign-out reachable", async ({ page }) => {
    await signIn(page, admin);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("navigation", { name: "เมนูหลังบ้าน" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ภาพรวม" })).toHaveAttribute("aria-current", "page");
    await signOut(page);
  });
});
