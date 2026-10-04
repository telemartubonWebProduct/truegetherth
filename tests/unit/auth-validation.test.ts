import { describe, expect, it } from "vitest";

import {
  firstFieldErrors,
  formValues,
  newPasswordSchema,
  passwordResetRequestSchema,
  signInSchema,
} from "@/lib/auth/validation";

describe("signInSchema", () => {
  it("normalises the email address", () => {
    const parsed = signInSchema.parse({ email: "  Admin@Example.TEST ", password: "x" });
    expect(parsed.email).toBe("admin@example.test");
  });

  it("reports missing and malformed fields in Thai", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstFieldErrors(result.error)).toEqual({
      email: "รูปแบบอีเมลไม่ถูกต้อง",
      password: "กรอกรหัสผ่าน",
    });
  });

  it("treats absent form fields as missing", () => {
    const result = signInSchema.safeParse(formValues(new FormData(), ["email", "password"]));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstFieldErrors(result.error)).toEqual({ email: "กรอกอีเมล", password: "กรอกรหัสผ่าน" });
  });
});

describe("passwordResetRequestSchema", () => {
  it("accepts a valid address", () => {
    expect(passwordResetRequestSchema.parse({ email: "owner@example.test" })).toEqual({
      email: "owner@example.test",
    });
  });
});

describe("newPasswordSchema", () => {
  const valid = "Telemart-Ubon-2026";

  it("accepts a policy-compliant password", () => {
    expect(newPasswordSchema.safeParse({ password: valid, confirmPassword: valid }).success).toBe(true);
  });

  it.each([
    ["too short", "Short1a", "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร"],
    ["no lower case", "TELEMART-UBON-2026", "ต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็กอย่างน้อย 1 ตัว"],
    ["no upper case", "telemart-ubon-2026", "ต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว"],
    ["no digit", "Telemart-Ubon-Office", "ต้องมีตัวเลขอย่างน้อย 1 ตัว"],
  ])("rejects a password with %s", (_label, password, message) => {
    const result = newPasswordSchema.safeParse({ password, confirmPassword: password });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstFieldErrors(result.error).password).toBe(message);
  });

  it("requires both entries to match", () => {
    const result = newPasswordSchema.safeParse({ password: valid, confirmPassword: `${valid}x` });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(firstFieldErrors(result.error)).toEqual({ confirmPassword: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" });
  });
});
