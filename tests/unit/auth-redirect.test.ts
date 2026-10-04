import { describe, expect, it } from "vitest";

import { ADMIN_HOME, safeAdminPath } from "@/lib/auth/redirect";

describe("safeAdminPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/update-password", "/admin/update-password"],
    ["/admin/update-password?tab=security", "/admin/update-password?tab=security"],
    ["/admin/denied", "/admin/denied"],
  ])("keeps back-office path %s", (input, expected) => {
    expect(safeAdminPath(input)).toBe(expected);
  });

  it.each([
    ["missing value", undefined],
    ["null", null],
    ["non-string", 42],
    ["empty string", ""],
    ["absolute URL", "https://evil.example/admin"],
    ["protocol-relative URL", "//evil.example/admin"],
    ["backslash trick", "/\\evil.example"],
    ["javascript URL", "javascript:alert(1)"],
    ["dot segments leaving /admin", "/admin/../../evil"],
    ["encoded slashes", "/admin/%2F%2Fevil.example"],
    ["encoded backslash", "/admin/%5Cevil.example"],
    ["control characters", "/admin\n/x"],
    ["public page", "/broadband"],
    ["look-alike prefix", "/administrator"],
    ["sign-in page (loop)", "/admin/login?next=/admin"],
    ["forgot-password page (loop)", "/admin/forgot-password"],
    ["oversized value", `/admin/${"a".repeat(2100)}`],
  ])("falls back for %s", (_label, input) => {
    expect(safeAdminPath(input)).toBe(ADMIN_HOME);
  });

  it("uses a custom fallback when given", () => {
    expect(safeAdminPath("https://evil.example", "/admin/denied")).toBe("/admin/denied");
  });
});
