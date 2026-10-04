import { describe, expect, it } from "vitest";

import {
  passwordResetErrorMessage,
  passwordUpdateErrorMessage,
  signInErrorMessage,
  signInNotice,
} from "@/lib/auth/messages";

const GENERIC_SIGN_IN = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
const RATE_LIMITED = "มีการลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่";

describe("signInErrorMessage", () => {
  it("gives one generic message for wrong or unknown credentials", () => {
    expect(signInErrorMessage({ code: "invalid_credentials", status: 400 })).toBe(GENERIC_SIGN_IN);
    expect(signInErrorMessage({ code: "user_not_found", status: 400 })).toBe(GENERIC_SIGN_IN);
    expect(signInErrorMessage(null)).toBe(GENERIC_SIGN_IN);
  });

  it("explains rate limiting and unconfirmed accounts", () => {
    expect(signInErrorMessage({ code: "over_request_rate_limit", status: 429 })).toBe(RATE_LIMITED);
    expect(signInErrorMessage({ status: 429 })).toBe(RATE_LIMITED);
    expect(signInErrorMessage({ code: "email_not_confirmed", status: 400 })).toContain("ยังไม่ได้ยืนยันอีเมล");
  });
});

describe("passwordResetErrorMessage", () => {
  it("stays silent for errors that could reveal whether an account exists", () => {
    expect(passwordResetErrorMessage(null)).toBeNull();
    expect(passwordResetErrorMessage({ code: "unexpected_failure", status: 500 })).toBeNull();
  });

  it("reports rate limiting", () => {
    expect(passwordResetErrorMessage({ code: "over_email_send_rate_limit", status: 429 })).toBe(RATE_LIMITED);
  });
});

describe("passwordUpdateErrorMessage", () => {
  it.each([
    ["same_password", "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม"],
    ["session_not_found", "เซสชันหมดอายุ ขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง"],
    ["something_new", "บันทึกรหัสผ่านไม่สำเร็จ ลองใหม่อีกครั้ง"],
  ])("maps %s", (code, message) => {
    expect(passwordUpdateErrorMessage({ code, status: 422 })).toBe(message);
  });
});

describe("signInNotice", () => {
  it("returns known notices", () => {
    expect(signInNotice("signed-out")).toEqual({ tone: "success", text: "ออกจากระบบแล้ว" });
    expect(signInNotice("link-invalid")?.tone).toBe("danger");
  });

  it("ignores unknown, inherited and non-string values", () => {
    expect(signInNotice("anything")).toBeNull();
    expect(signInNotice("toString")).toBeNull();
    expect(signInNotice("__proto__")).toBeNull();
    expect(signInNotice(["signed-out"])).toBeNull();
    expect(signInNotice(undefined)).toBeNull();
  });
});
