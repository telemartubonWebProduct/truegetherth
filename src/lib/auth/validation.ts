import { z } from "zod";

// Mirrors the Auth password policy in supabase/config.toml (12+ characters with
// lower case, upper case and digits). The Auth server stays authoritative.
export const PASSWORD_MIN_LENGTH = 12;

const email = z
  .string({ error: "กรอกอีเมล" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "รูปแบบอีเมลไม่ถูกต้อง" }));

export const signInSchema = z.object({
  email,
  password: z
    .string({ error: "กรอกรหัสผ่าน" })
    .min(1, { error: "กรอกรหัสผ่าน" })
    .max(256, { error: "รหัสผ่านยาวเกินไป" }),
});

export const passwordResetRequestSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: z
      .string({ error: "กรอกรหัสผ่านใหม่" })
      .min(PASSWORD_MIN_LENGTH, { error: `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร` })
      .max(256, { error: "รหัสผ่านยาวเกินไป" })
      .regex(/[a-z]/, { error: "ต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็กอย่างน้อย 1 ตัว" })
      .regex(/[A-Z]/, { error: "ต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว" })
      .regex(/[0-9]/, { error: "ต้องมีตัวเลขอย่างน้อย 1 ตัว" }),
    confirmPassword: z.string({ error: "กรอกรหัสผ่านอีกครั้ง" }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
  });

export type FieldErrors = Partial<Record<string, string>>;

/** First message per field, for rendering next to each input. */
export function firstFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return errors;
}

export function formValues(formData: FormData, fields: readonly string[]) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : undefined];
    }),
  );
}
