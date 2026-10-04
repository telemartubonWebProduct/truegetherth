import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { pageTitle } from "@/components/admin/styles";
import { createClientIfConfigured } from "@/lib/supabase/server";

import { UpdatePasswordForm } from "./UpdatePasswordForm";

export const metadata: Metadata = { title: "ตั้งรหัสผ่านใหม่" };

// Reached from an invite or recovery link (via /auth/confirm) or by a signed-in
// account. It needs a session but not Admin membership: invited people set a
// password before their access is granted.
export default async function UpdatePasswordPage() {
  const supabase = await createClientIfConfigured();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };
  if (!data?.claims?.sub) redirect("/admin/login?notice=session-required");

  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  return (
    <>
      <h1 className={pageTitle}>ตั้งรหัสผ่านใหม่</h1>
      <p className="mt-2 text-tm-muted">
        {email ? (
          <>
            สำหรับบัญชี <span className="font-medium text-tm-ink">{email}</span>{" "}
          </>
        ) : null}
        เมื่อบันทึกแล้ว ระบบจะออกจากระบบทุกอุปกรณ์ แล้วให้เข้าสู่ระบบด้วยรหัสผ่านใหม่
      </p>
      <div className="mt-8">
        <UpdatePasswordForm />
      </div>
    </>
  );
}
