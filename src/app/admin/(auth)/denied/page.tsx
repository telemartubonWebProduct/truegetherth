import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/admin/SignOutButton";
import { pageTitle } from "@/components/admin/styles";
import { getAdminAccess } from "@/lib/auth/access";

export const metadata: Metadata = { title: "ไม่มีสิทธิ์เข้าหลังบ้าน" };

export default async function AccessDeniedPage() {
  const access = await getAdminAccess();
  if (access.status === "signed-out") redirect("/admin/login");
  if (access.status === "active") redirect("/admin");

  const inactive = access.reason === "inactive";

  return (
    <>
      <h1 className={pageTitle}>
        {inactive ? "สิทธิ์ผู้ดูแลของบัญชีนี้ถูกปิดใช้งาน" : "บัญชีนี้ยังไม่มีสิทธิ์เข้าหลังบ้าน"}
      </h1>
      <p className="mt-3 text-tm-muted">
        คุณเข้าสู่ระบบในชื่อ{" "}
        <span className="font-medium text-tm-ink">{access.email ?? "บัญชีนี้"}</span>{" "}
        {inactive
          ? "หากต้องการใช้งานอีกครั้ง ติดต่อผู้ดูแลระบบเพื่อเปิดสิทธิ์"
          : "ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ผู้ดูแล หรือออกจากระบบแล้วเข้าด้วยบัญชีอื่น"}
      </p>
      <SignOutButton className="mt-8 max-w-[16rem]" />
    </>
  );
}
