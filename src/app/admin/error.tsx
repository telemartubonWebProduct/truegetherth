"use client";

import { primaryButton } from "@/components/admin/styles";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="px-tm-gutter py-16">
      <div className="mx-auto max-w-[34rem]">
        <h1 className="text-tm-h3 font-semibold">เปิดหน้านี้ไม่สำเร็จ</h1>
        <p className="mt-3 text-tm-muted">
          ระบบตรวจสิทธิ์หรือเชื่อมต่อฐานข้อมูลไม่สำเร็จ ลองอีกครั้ง หากยังเปิดไม่ได้
          ให้แจ้งผู้ดูแลระบบพร้อมรหัสอ้างอิงด้านล่าง
        </p>
        {error.digest ? (
          <p className="mt-3 text-tm-small text-tm-muted">
            รหัสอ้างอิง: <code>{error.digest}</code>
          </p>
        ) : null}
        <div className="mt-6 max-w-[16rem]">
          <button type="button" className={primaryButton} onClick={() => retry()}>
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    </main>
  );
}
