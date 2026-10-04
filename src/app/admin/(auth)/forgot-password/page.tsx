import type { Metadata } from "next";
import Link from "next/link";

import { pageTitle, textLink } from "@/components/admin/styles";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "ลืมรหัสผ่าน" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className={pageTitle}>ลืมรหัสผ่าน</h1>
      <p className="mt-2 text-tm-muted">
        กรอกอีเมลที่ใช้เข้าหลังบ้าน ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลนั้น
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-tm-small">
        <Link href="/admin/login" className={textLink}>
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </p>
    </>
  );
}
