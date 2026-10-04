import type { Metadata } from "next";
import Link from "next/link";

import { pageTitle, textLink } from "@/components/admin/styles";
import { requireActiveAdmin } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ภาพรวม" };

export default async function AdminOverviewPage() {
  const access = await requireActiveAdmin();
  const { count: newLeads } = await (await createClient()).from("leads").select("id", { count: "exact", head: true }).eq("status", "new");

  return (
    <>
      <header className="border-b border-tm-line pb-6">
        <h1 className={pageTitle}>ภาพรวม</h1>
        <p className="mt-2 text-tm-muted">
          เข้าสู่ระบบในชื่อ <span className="font-medium text-tm-ink">{access.email}</span>
        </p>
      </header>

      <section aria-labelledby="access-heading" className="mt-10">
        <h2 id="access-heading" className="text-tm-h4 font-semibold">
          สิทธิ์ของบัญชีนี้
        </h2>
        <dl className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <dt className="text-tm-small font-semibold text-tm-muted">บทบาท</dt>
          <dd>ผู้ดูแล (Admin) — ใช้งานอยู่</dd>
          <dt className="text-tm-small font-semibold text-tm-muted">การตรวจสิทธิ์</dt>
          <dd>
            ตรวจกับฐานข้อมูลทุกครั้งที่เปิดหน้าและทุกคำสั่งบันทึก หากสิทธิ์ถูกปิด
            การเข้าถึงจะหยุดในคำขอถัดไปทันที
          </dd>
        </dl>
      </section>

      <section aria-labelledby="tools-heading" className="mt-12">
        <h2 id="tools-heading" className="text-tm-h4 font-semibold">
          เครื่องมือ
        </h2>
        <ul className="mt-4 divide-y divide-tm-line border-y border-tm-line">
          <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <Link href="/admin/editor" className={textLink}>
              แก้ไขหน้าเว็บ (Mirror Editor)
            </Link>
            <span className="text-tm-small text-tm-muted">
              แก้ข้อความ รูป ปุ่ม สี แพ็กเกจ และอัปโหลดรูป บันทึกเป็นร่างอัตโนมัติ หน้าเว็บจริงยังไม่เปลี่ยนจนกว่าจะเผยแพร่
            </span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <Link href="/admin/publish" className={textLink}>
              เผยแพร่
            </Link>
            <span className="text-tm-small text-tm-muted">ดูความต่างของร่างทั้งหมดกับหน้าเว็บ แล้วเผยแพร่ในครั้งเดียว</span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <Link href="/admin/releases" className={textLink}>
              ประวัติการเผยแพร่
            </Link>
            <span className="text-tm-small text-tm-muted">ใครเผยแพร่เมื่อไร และย้อนกลับไปฉบับก่อนได้</span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <Link href="/admin/leads" className={textLink}>
              คำขอติดต่อกลับ
            </Link>
            <span className="text-tm-small text-tm-muted">
              {newLeads ? `มีคำขอใหม่ ${newLeads} รายการ · ` : ""}คำขอจากแบบฟอร์มในหน้าติดต่อเรา เปลี่ยนสถานะ บันทึกการติดตาม ดาวน์โหลด CSV
            </span>
          </li>
          <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
            <Link href="/admin/reports" className={textLink}>
              รายงาน
            </Link>
            <span className="text-tm-small text-tm-muted">คำขอ ผลการติดต่อ แหล่งที่มา และ event ที่ส่งไป Google Analytics</span>
          </li>
        </ul>
      </section>
    </>
  );
}
