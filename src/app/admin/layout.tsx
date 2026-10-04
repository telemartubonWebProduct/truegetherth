import type { Metadata } from "next";

import { fontVariables } from "@/fonts";
import { readSupabasePublicEnv } from "@/lib/env";

import "@/styles/tokens.css";
import "../globals.css";

// Root layout of the back office. The public site has its own root layouts in
// src/app/(th) and src/app/(en), so neither loads the other's tags or scripts;
// moving between them is a full page load. All use the fonts in src/fonts.

export const metadata: Metadata = {
  title: {
    default: "หลังบ้าน truegetherth",
    template: "%s · หลังบ้าน truegetherth",
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <div className={`${fontVariables} tm-admin`}>
          {readSupabasePublicEnv() ? children : <SupabaseNotConfigured />}
        </div>
      </body>
    </html>
  );
}

function SupabaseNotConfigured() {
  return (
    <main className="px-tm-gutter py-16">
      <div className="mx-auto max-w-[34rem]">
        <h1 className="text-tm-h3 font-semibold">หลังบ้านยังไม่ได้เชื่อมต่อ Supabase</h1>
        <p className="mt-3 text-tm-muted">
          ตั้งค่า <code>NEXT_PUBLIC_SUPABASE_URL</code> และ <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
          ใน environment ของเว็บไซต์ แล้ว build ใหม่ ดูตัวอย่างใน <code>.env.example</code>
        </p>
      </div>
    </main>
  );
}
