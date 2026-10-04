"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormAlert } from "@/components/admin/FormAlert";
import { SubmitButton, TextField } from "@/components/admin/FormControls";
import { textLink } from "@/components/admin/styles";
import { requestPasswordReset, type FormState } from "@/lib/auth/actions";

const initialState: FormState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  if (state.status === "success") {
    return (
      <div className="space-y-6">
        <FormAlert tone="success">{state.message}</FormAlert>
        <p className="text-tm-small">
          <Link href="/admin/login" className={textLink}>
            กลับไปหน้าเข้าสู่ระบบ
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.message ? <FormAlert tone="danger">{state.message}</FormAlert> : null}
      <TextField
        key={`email-${state.email ?? ""}`}
        label="อีเมลของบัญชีผู้ดูแล"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        required
      />
      <SubmitButton pendingLabel="กำลังส่งลิงก์…">ส่งลิงก์ตั้งรหัสผ่านใหม่</SubmitButton>
    </form>
  );
}
