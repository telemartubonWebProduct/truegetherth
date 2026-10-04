"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Sections appear here as their milestones ship; the shell stays the same.
const sections = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/editor", label: "แก้ไขหน้าเว็บ" },
  { href: "/admin/publish", label: "เผยแพร่" },
  { href: "/admin/releases", label: "ประวัติการเผยแพร่" },
  { href: "/admin/leads", label: "คำขอติดต่อกลับ" },
  { href: "/admin/reports", label: "รายงาน" },
] as const;

/** newLeads: requests nobody has worked on yet, shown on the inbox link (the back-office notification). */
export function AdminNav({ newLeads = 0 }: { newLeads?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูหลังบ้าน" className="overflow-x-auto lg:overflow-visible">
      <ul className="flex gap-1 px-tm-gutter lg:flex-col lg:px-3">
        {sections.map((section) => {
          const current =
            section.href === "/admin" ? pathname === "/admin" : pathname.startsWith(section.href);
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={current ? "page" : undefined}
                className="flex min-h-tm-control items-center whitespace-nowrap border-b-4 border-transparent px-3 text-tm-small font-medium text-white/75 transition-colors duration-tm-fast hover:text-white aria-[current=page]:border-tm-red aria-[current=page]:font-semibold aria-[current=page]:text-white lg:rounded-r-tm-control lg:border-b-0 lg:border-l-4 lg:hover:bg-white/10"
              >
                {section.label}
                {section.href === "/admin/leads" && newLeads > 0 ? (
                  <span className="ml-2 rounded-tm-pill bg-tm-red px-2 py-0.5 text-tm-caption font-semibold text-tm-on-red" data-new-leads={newLeads}>
                    {newLeads}
                    <span className="sr-only"> คำขอใหม่</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
