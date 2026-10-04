"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/admin/FormAlert";
import { SubmitButton, TextField } from "@/components/admin/FormControls";
import { updatePassword, type FormState } from "@/lib/auth/actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";

const initialState: FormState = { status: "idle" };

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.message ? <FormAlert tone="danger">{state.message}</FormAlert> : null}
      <TextField
        label="รหัสผ่านใหม่"
        name="password"
        type="password"
        autoComplete="new-password"
        hint={`อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร มีตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ภาษาอังกฤษ และตัวเลข`}
        error={state.fieldErrors?.password}
        required
      />
      <TextField
        label="ยืนยันรหัสผ่านใหม่"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
        required
      />
      <SubmitButton pendingLabel="กำลังบันทึก…">บันทึกรหัสผ่านใหม่</SubmitButton>
    </form>
  );
}
