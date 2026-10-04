import type { Metadata } from "next";
import Link from "next/link";

import { FormAlert } from "@/components/admin/FormAlert";
import { pageTitle, textLink } from "@/components/admin/styles";
import { signInNotice } from "@/lib/auth/messages";
import { safeAdminPath } from "@/lib/auth/redirect";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next, notice } = await searchParams;
  const message = signInNotice(notice);

  return (
    <>
      <h1 className={pageTitle}>เข้าสู่ระบบหลังบ้าน</h1>
      <p className="mt-2 text-tm-muted">สำหรับผู้ดูแลที่ได้รับเชิญเท่านั้น</p>
      {message ? (
        <FormAlert tone={message.tone} className="mt-6">
          {message.text}
        </FormAlert>
      ) : null}
      <div className="mt-8">
        <LoginForm next={safeAdminPath(next)} />
      </div>
      <p className="mt-8 text-tm-small">
        <Link href="/admin/forgot-password" className={textLink}>
          ลืมรหัสผ่าน
        </Link>
      </p>
    </>
  );
}
