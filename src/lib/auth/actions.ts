"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  passwordResetErrorMessage,
  passwordUpdateErrorMessage,
  signInErrorMessage,
} from "@/lib/auth/messages";
import { safeAdminPath } from "@/lib/auth/redirect";
import {
  firstFieldErrors,
  formValues,
  newPasswordSchema,
  passwordResetRequestSchema,
  signInSchema,
  type FieldErrors,
} from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

// Server Actions are public endpoints: each one validates its own input and
// relies on the caller's session, never on the page that rendered the form.

export type FormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
  /** Echoed back so the form keeps what was typed. Never includes passwords. */
  email?: string;
};

export async function signIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email", "password"]);
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), email: values.email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code !== "invalid_credentials") {
      // Configuration or availability problems look like bad credentials to
      // the visitor, so record the real cause (no personal data) for the operator.
      console.error("Sign-in failed", { code: error.code, status: error.status });
    }
    return { status: "error", message: signInErrorMessage(error), email: parsed.data.email };
  }

  redirect(safeAdminPath(formData.get("next")));
}

export async function requestPasswordReset(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = passwordResetRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error), email: values.email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    // Used by the default Supabase template; the repository templates link to
    // /auth/confirm on the project's Site URL. Auth only accepts allow-listed URLs.
    redirectTo: `${await requestOrigin()}/auth/confirm?next=/admin/update-password`,
  });

  const message = passwordResetErrorMessage(error);
  if (message) return { status: "error", message, email: parsed.data.email };
  if (error) {
    // Reported only to the server log so the response never reveals whether
    // an account exists.
    console.error("Password reset email was not sent", { code: error.code, status: error.status });
  }

  return {
    status: "success",
    message:
      "ถ้ามีบัญชีผู้ดูแลที่ใช้อีเมลนี้ ระบบได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว ลิงก์ใช้ได้ครั้งเดียวและมีอายุจำกัด",
  };
}

export async function updatePassword(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newPasswordSchema.safeParse(formValues(formData, ["password", "confirmPassword"]));
  if (!parsed.success) {
    return { status: "error", fieldErrors: firstFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/admin/login?notice=session-required");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", message: passwordUpdateErrorMessage(error) };

  // End every session for this account (including the one-time recovery or
  // invite session) so the new password is proven at the next sign-in.
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login?notice=password-updated");
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login?notice=signed-out");
}

async function requestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (origin) return origin;
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return `${protocol}://${host}`;
}
