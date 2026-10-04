import type { Metadata } from "next";
import Link from "next/link";

import { pageTitle, secondaryButton, textInput, textLink } from "@/components/admin/styles";
import { requireActiveAdmin } from "@/lib/auth/access";
import { getPublishedContent } from "@/lib/content/published";
import { formatPhone } from "@/lib/content/render";
import { filterLeads, leadFilterOptions, leadFilters } from "@/lib/leads/filters";
import { leadServices } from "@/lib/leads/form";
import { bangkokDate, bangkokDateTime, labelOf, serviceLabels, statusLabels, timeLabels } from "@/lib/leads/labels";
import { provinceName } from "@/lib/leads/provinces";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "คำขอติดต่อกลับ" };

const PAGE_SIZE = 50;

// The inbox of call-back requests (M5): newest first, with the request's
// status, follow-up date and whether the visitor sent it again. Notifications
// are this page (the owner chose the back office only, 2026-10-01).
export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireActiveAdmin("/admin/leads");
  const params = await searchParams;
  const { status, service, q } = leadFilters(params);
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);
  const supabase = await createClient();
  const content = await getPublishedContent();
  const packageNames = new Map(content.catalog.map((item) => [item.id, item.name.th]));

  const { data: leads, count, error } = await filterLeads(
    supabase
      .from("leads")
      .select("id, created_at, name, phone, province, area, service, package_id, preferred_time, status, follow_up_on, resubmitted_at, anonymised_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    { status, service, q },
  );

  const exportParams = new URLSearchParams({ status, ...(service ? { service } : {}), ...(q ? { q } : {}) });
  const pageHref = (target: number) => `/admin/leads?${new URLSearchParams({ ...Object.fromEntries(exportParams), page: String(target) })}`;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());

  return (
    <>
      <header className="border-b border-tm-line pb-6">
        <h1 className={pageTitle}>คำขอติดต่อกลับ</h1>
        <p className="mt-2 max-w-[44rem] text-tm-muted">
          คำขอจากแบบฟอร์มในหน้าติดต่อเรา ใหม่สุดก่อน เปิดคำขอเพื่อเปลี่ยนสถานะ บันทึกการติดตาม หรือลบข้อมูลส่วนบุคคล ข้อมูลส่วนบุคคลถูกลบอัตโนมัติเมื่อปิดคำขอครบ 1 ปี
        </p>
      </header>

      <form className="mt-6 grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end" role="search" aria-label="ค้นหาคำขอ">
        <label className="grid gap-1.5 text-tm-small font-semibold">
          สถานะ
          <select name="status" defaultValue={status} className={textInput}>
            {leadFilterOptions.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-tm-small font-semibold">
          บริการ
          <select name="service" defaultValue={service} className={textInput}>
            <option value="">ทุกบริการ</option>
            {leadServices.map((value) => (
              <option key={value} value={value}>
                {serviceLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-tm-small font-semibold">
          ชื่อหรือเบอร์โทร
          <input name="q" defaultValue={q} className={textInput} type="search" />
        </label>
        <button type="submit" className={secondaryButton}>
          แสดง
        </button>
      </form>

      {error ? (
        <p className="mt-8 text-tm-danger">อ่านคำขอไม่ได้: ตรวจว่า migration ของ M5 ถูก apply แล้ว</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-tm-small text-tm-muted" data-lead-count={count ?? 0}>
              {count ?? 0} คำขอ
            </p>
            <a href={`/admin/leads/export?${exportParams}`} className={`${textLink} text-tm-small`}>
              ดาวน์โหลด CSV ของรายการนี้
            </a>
          </div>
          {(leads ?? []).length === 0 ? (
            <p className="mt-4 text-tm-muted">ไม่มีคำขอที่ตรงกับตัวกรอง</p>
          ) : (
            <ul className="mt-3 divide-y divide-tm-line border-y border-tm-line" data-lead-list="">
              {(leads ?? []).map((lead) => {
                const due = lead.follow_up_on && lead.status !== "closed" && lead.follow_up_on <= today;
                return (
                  <li key={lead.id} data-lead={lead.id}>
                    <Link href={`/admin/leads/${lead.id}`} className="grid gap-1 py-4 hover:bg-tm-surface sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 sm:px-2">
                      <span>
                        <span className="font-semibold">{lead.anonymised_at ? "(ลบข้อมูลส่วนบุคคลแล้ว)" : lead.name}</span>
                        {lead.phone ? <span className="tm-num ml-2 text-tm-muted">{formatPhone(lead.phone)}</span> : null}
                        <span className="block text-tm-small text-tm-muted">
                          {provinceName(lead.province, "th")}
                          {lead.area ? ` · ${lead.area}` : ""} · {labelOf(serviceLabels, lead.service)}
                          {lead.package_id ? ` · ${packageNames.get(lead.package_id) ?? lead.package_id}` : ""} · {labelOf(timeLabels, lead.preferred_time)}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2 text-tm-small sm:justify-end">
                        <span className="rounded-tm-pill border border-tm-line px-2 py-0.5 font-semibold" data-lead-status={lead.status}>
                          {labelOf(statusLabels, lead.status)}
                        </span>
                        {lead.resubmitted_at ? <span className="rounded-tm-pill bg-tm-surface px-2 py-0.5">ส่งซ้ำ</span> : null}
                        {lead.follow_up_on && lead.status !== "closed" ? (
                          <span className={due ? "font-semibold text-tm-danger" : "text-tm-muted"}>นัด {bangkokDate.format(new Date(`${lead.follow_up_on}T00:00:00+07:00`))}</span>
                        ) : null}
                        <span className="text-tm-muted">{bangkokDateTime.format(new Date(lead.created_at))}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          {(count ?? 0) > PAGE_SIZE ? (
            <nav aria-label="หน้าของรายการ" className="mt-4 flex gap-4 text-tm-small">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className={textLink}>
                  ก่อนหน้า
                </Link>
              ) : null}
              <span>
                หน้า {page} จาก {Math.ceil((count ?? 0) / PAGE_SIZE)}
              </span>
              {page * PAGE_SIZE < (count ?? 0) ? (
                <Link href={pageHref(page + 1)} className={textLink}>
                  ถัดไป
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
