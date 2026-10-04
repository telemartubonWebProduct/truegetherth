"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/admin/FormAlert";
import { SubmitButton, TextField } from "@/components/admin/FormControls";
import { signIn, type FormState } from "@/lib/auth/actions";

const initialState: FormState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={next} />
      {state.message ? <FormAlert tone="danger">{state.message}</FormAlert> : null}
      <TextField
        key={`email-${state.email ?? ""}`}
        label="อีเมล"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        required
      />
      <TextField
        label="รหัสผ่าน"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <SubmitButton pendingLabel="กำลังเข้าสู่ระบบ…">เข้าสู่ระบบ</SubmitButton>
    </form>
  );
}
