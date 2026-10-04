import { AdminNav } from "@/components/admin/AdminNav";
import { BrandMark } from "@/components/admin/BrandMark";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { requireActiveAdmin } from "@/lib/auth/access";
import { createClient } from "@/lib/supabase/server";

// Every console page is behind an active Admin membership. Pages and Server
// Actions repeat the check themselves; this layout only guards rendering.
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const access = await requireActiveAdmin();
  // New call-back requests (M5); before the M5 migration the count is just absent.
  const { count: newLeads } = await (await createClient()).from("leads").select("id", { count: "exact", head: true }).eq("status", "new");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--tm-admin-nav-width)_minmax(0,1fr)]">
      <header className="flex items-center justify-between gap-4 border-b border-tm-line px-tm-gutter py-3 lg:hidden">
        <BrandMark />
        <SignOutButton />
      </header>

      <aside className="tm-on-ink bg-tm-ink py-2 text-tm-on-ink lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:py-0">
        <div className="hidden px-5 py-6 lg:block">
          <BrandMark onInk />
        </div>
        <AdminNav newLeads={newLeads ?? 0} />
        <div className="mt-auto hidden border-t border-white/15 px-5 py-5 lg:block">
          <p className="text-tm-caption text-white/70">เข้าสู่ระบบในชื่อ</p>
          <p className="truncate text-tm-small font-semibold" title={access.email ?? undefined}>
            {access.email}
          </p>
          <SignOutButton onInk className="mt-3" />
        </div>
      </aside>

      <main className="px-tm-gutter py-8 lg:py-12">
        <div className="mx-auto max-w-tm-content">{children}</div>
      </main>
    </div>
  );
}
