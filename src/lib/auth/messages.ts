// Maps Supabase Auth error codes to messages an Admin can act on. Sign-in and
// password-reset responses never reveal whether an account exists.

type AuthErrorLike = { code?: string | null; status?: number | null } | null | undefined;

const RATE_LIMITED = "มีการลองหลายครั้งเกินไป รอสักครู่แล้วลองใหม่";

export function signInErrorMessage(error: AuthErrorLike): string {
  if (isRateLimited(error)) return RATE_LIMITED;
  switch (error?.code) {
    case "email_not_confirmed":
      return "บัญชีนี้ยังไม่ได้ยืนยันอีเมล เปิดลิงก์ในอีเมลคำเชิญก่อนเข้าสู่ระบบ";
    case "user_banned":
      return "บัญชีนี้ถูกระงับการเข้าสู่ระบบ ติดต่อผู้ดูแลระบบ";
    default:
      return "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
  }
}

export function passwordResetErrorMessage(error: AuthErrorLike): string | null {
  // Unknown addresses are reported as success on purpose (no account discovery).
  if (isRateLimited(error)) return RATE_LIMITED;
  return null;
}

export function passwordUpdateErrorMessage(error: AuthErrorLike): string {
  if (isRateLimited(error)) return RATE_LIMITED;
  switch (error?.code) {
    case "same_password":
      return "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม";
    case "weak_password":
      return "รหัสผ่านยังไม่ผ่านเงื่อนไขความปลอดภัยของระบบ ลองใช้รหัสที่ยาวและคาดเดายากขึ้น";
    case "session_not_found":
    case "session_expired":
    case "refresh_token_not_found":
      return "เซสชันหมดอายุ ขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง";
    case "reauthentication_needed":
      return "ต้องยืนยันตัวตนอีกครั้งก่อนเปลี่ยนรหัสผ่าน ขอลิงก์ตั้งรหัสผ่านใหม่";
    default:
      return "บันทึกรหัสผ่านไม่สำเร็จ ลองใหม่อีกครั้ง";
  }
}

function isRateLimited(error: AuthErrorLike): boolean {
  return error?.status === 429 || /rate_limit/.test(error?.code ?? "");
}

// Notices shown on the sign-in page, keyed by the `notice` query value.
export const signInNotices = {
  "signed-out": { tone: "success", text: "ออกจากระบบแล้ว" },
  "password-updated": { tone: "success", text: "บันทึกรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย" },
  "link-invalid": {
    tone: "danger",
    text: "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่จากหน้า “ลืมรหัสผ่าน” หรือขอคำเชิญใหม่จากผู้ดูแลระบบ",
  },
  "session-required": { tone: "danger", text: "เข้าสู่ระบบก่อนเพื่อทำรายการต่อ" },
} as const;

export type SignInNotice = keyof typeof signInNotices;

export function signInNotice(value: unknown) {
  return typeof value === "string" && Object.hasOwn(signInNotices, value)
    ? signInNotices[value as SignInNotice]
    : null;
}
