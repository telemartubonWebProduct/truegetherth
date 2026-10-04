import type { Metadata } from "next";
import Link from "next/link";

import { pageTitle, textLink } from "@/components/admin/styles";
import { requireActiveAdmin } from "@/lib/auth/access";
import { getPublishedContent } from "@/lib/content/published";
import { leadServices } from "@/lib/leads/form";
import { bangkokDateTime, leadStatuses, serviceLabels, statusLabels } from "@/lib/leads/labels";
import { provinceName } from "@/lib/leads/provinces";
import { buildLeadReport, percent, type Count } from "@/lib/leads/report";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "รายงาน" };

const periods = [7, 30, 90, 365] as const;
const MAX_ROWS = 10_000;

/** GA4 events the site sends (src/lib/analytics), for the owner to find in GA4. */
const ga4Events = [
  ["contact_line", "คลิกลิงก์ LINE"],
  ["contact_phone", "คลิกโทร"],
  ["contact_email", "คลิกอีเมล"],
  ["contact_facebook", "คลิกเฟซบุ๊ก"],
  ["lead_form_start", "เริ่มกรอกแบบฟอร์มขอให้ติดต่อกลับ"],
  ["generate_lead", "ส่งแบบฟอร์มสำเร็จ (หลังระบบบันทึกคำขอแล้ว)"],
] as const;

function Bars({ rows, label }: { rows: { key: string; name: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  if (rows.length === 0) return <p className="mt-3 text-tm-small text-tm-muted">ยังไม่มีข้อมูล</p>;
  return (
    <table className="mt-3 w-full text-tm-small" aria-label={label}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row" className="w-[40%] py-1 pr-3 text-left font-normal">
              {row.name}
            </th>
            <td className="py-1">
              <span className="flex items-center gap-2">
                <span className="h-2.5 rounded-tm-pill bg-tm-red" style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }} aria-hidden="true" />
                <span className="tm-num font-semibold">{row.count}</span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Reports (M5). Requests, contact and sign-ups come from the requests stored
// by the site, the source of truth; visits and LINE/phone clicks are GA4's,
// shown separately and never compared one to one with requests.
export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireActiveAdmin("/admin/reports");
  const { days: daysParam } = await searchParams;
  const days = periods.find((value) => String(value) === daysParam) ?? 30;
  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000);
  const supabase = await createClient();
  const content = await getPublishedContent();
  const [{ data: leads, error }, { data: releases }] = await Promise.all([
    supabase
      .from("leads")
      .select("created_at, status, service, province, package_id, outcome, source_path, utm")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    supabase.from("content_releases").select("number, created_at, created_by_email").gte("created_at", since.toISOString()).order("number", { ascending: false }),
  ]);
  const report = buildLeadReport(leads ?? [], days, now);
  const packageNames = new Map(content.catalog.map((item) => [item.id, item.name.th]));
  const named = (rows: Count[], name: (key: string) => string) => rows.map((row) => ({ ...row, name: name(row.key) }));
  const ga4Id = content.site.integrations.ga4MeasurementId;
  const maxDay = Math.max(1, ...report.perDay.map((day) => day.count));

  return (
    <>
      <header className="border-b border-tm-line pb-6">
        <h1 className={pageTitle}>รายงาน</h1>
        <p className="mt-2 max-w-[44rem] text-tm-muted">
          คำขอติดต่อกลับ ผลการติดต่อ และการเผยแพร่ จากข้อมูลในระบบ นับตามเวลาประเทศไทย อัปเดตเมื่อ {bangkokDateTime.format(now)} ผู้เข้าชมและการคลิก LINE หรือโทรอยู่ใน Google Analytics (ด้านล่าง)
        </p>
        <nav aria-label="ช่วงเวลา" className="mt-4 flex flex-wrap gap-2">
          {periods.map((value) => (
            <Link
              key={value}
              href={`/admin/reports?days=${value}`}
              aria-current={value === days ? "page" : undefined}
              className="rounded-tm-pill border border-tm-line px-3 py-1 text-tm-small font-semibold aria-[current=page]:border-tm-ink aria-[current=page]:bg-tm-ink aria-[current=page]:text-tm-on-ink"
            >
              {value === 365 ? "1 ปี" : `${value} วัน`}
            </Link>
          ))}
        </nav>
      </header>

      {error ? (
        <p className="mt-8 text-tm-danger">อ่านคำขอไม่ได้: ตรวจว่า migration ของ M5 ถูก apply แล้ว</p>
      ) : (
        <>
          <section aria-labelledby="funnel-heading" className="mt-8">
            <h2 id="funnel-heading" className="text-tm-h4 font-semibold">
              คำขอใน {days === 365 ? "1 ปี" : `${days} วัน`}ที่ผ่านมา
            </h2>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-tm-panel border border-tm-line bg-tm-line sm:grid-cols-3" data-report-funnel="">
              {[
                ["คำขอที่ได้รับ", report.total, ""],
                ["ติดต่อได้แล้ว", report.reached, percent(report.reached, report.total)],
                ["สมัครแล้ว", report.signedUp, percent(report.signedUp, report.total)],
              ].map(([term, value, share]) => (
                <div key={term} className="bg-tm-canvas p-5">
                  <dt className="text-tm-small font-semibold text-tm-muted">{term}</dt>
                  <dd className="tm-num mt-1 text-tm-h2 font-semibold">
                    {value} {share ? <span className="text-tm-small font-normal text-tm-muted">{share}</span> : null}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-tm-small text-tm-muted">
              ติดต่อได้ = สถานะ “ติดต่อแล้ว” หรือปิดคำขอด้วยผลที่ได้คุยกัน (ไม่นับ ติดต่อไม่ได้ ซ้ำ และสแปม) · สมัครแล้ว = ปิดคำขอด้วยผล “สมัครแล้ว”
            </p>
          </section>

          <section aria-labelledby="days-heading" className="mt-10">
            <h2 id="days-heading" className="text-tm-h4 font-semibold">
              คำขอรายวัน
            </h2>
            <div className="mt-4 flex h-32 items-end gap-px" role="img" aria-label={`คำขอรายวัน รวม ${report.total} คำขอ`}>
              {report.perDay.map((day) => (
                <span key={day.key} className="flex-1 rounded-t-sm bg-tm-red" style={{ height: `${(day.count / maxDay) * 100}%`, minHeight: day.count > 0 ? "4px" : "1px" }} title={`${day.key}: ${day.count}`} />
              ))}
            </div>
            <p className="mt-1 flex justify-between text-tm-caption text-tm-muted">
              <span>{report.perDay[0]?.key}</span>
              <span>{report.perDay.at(-1)?.key}</span>
            </p>
          </section>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <section aria-labelledby="status-heading">
              <h2 id="status-heading" className="text-tm-h4 font-semibold">
                สถานะตอนนี้
              </h2>
              <Bars label="สถานะ" rows={leadStatuses.map((status) => ({ key: status, name: statusLabels[status], count: report.byStatus[status] }))} />
            </section>
            <section aria-labelledby="service-heading">
              <h2 id="service-heading" className="text-tm-h4 font-semibold">
                บริการที่สนใจ
              </h2>
              <Bars label="บริการ" rows={leadServices.map((service) => ({ key: service, name: serviceLabels[service], count: report.byService[service] }))} />
            </section>
            <section aria-labelledby="province-heading">
              <h2 id="province-heading" className="text-tm-h4 font-semibold">
                จังหวัด (10 อันดับ)
              </h2>
              <Bars label="จังหวัด" rows={named(report.byProvince, (code) => provinceName(code, "th"))} />
            </section>
            <section aria-labelledby="package-heading">
              <h2 id="package-heading" className="text-tm-h4 font-semibold">
                แพ็กเกจที่ระบุมา (10 อันดับ)
              </h2>
              <Bars label="แพ็กเกจ" rows={named(report.byPackage, (id) => packageNames.get(id) ?? id)} />
            </section>
            <section aria-labelledby="source-heading">
              <h2 id="source-heading" className="text-tm-h4 font-semibold">
                แคมเปญ (utm_source)
              </h2>
              <Bars label="แคมเปญ" rows={named(report.bySource, (source) => source || "ไม่มีแท็กแคมเปญ")} />
            </section>
            <section aria-labelledby="page-heading">
              <h2 id="page-heading" className="text-tm-h4 font-semibold">
                ส่งจากหน้า
              </h2>
              <Bars label="หน้า" rows={named(report.byPage, (path) => path || "ไม่ทราบ")} />
            </section>
          </div>
          <p className="mt-6 text-tm-small">
            <Link href="/admin/leads?status=all" className={textLink}>
              ดูคำขอทั้งหมด
            </Link>
          </p>
        </>
      )}

      <section aria-labelledby="ga4-heading" className="mt-12 border-t border-tm-line pt-8">
        <h2 id="ga4-heading" className="text-tm-h4 font-semibold">
          ผู้เข้าชมและการคลิก (Google Analytics 4)
        </h2>
        <p className="mt-2 max-w-[44rem] text-tm-muted">
          {ga4Id ? `เว็บส่งข้อมูลไปที่ ${ga4Id} เฉพาะจากโดเมนจริง และเฉพาะผู้ชมที่ยินยอมคุกกี้วิเคราะห์การใช้งาน` : "ยังไม่ได้ใส่ Measurement ID ของ GA4"} ตัวเลขใน GA4 จึงน้อยกว่าผู้ชมจริงและไม่ควรเทียบกับจำนวนคำขอแบบหนึ่งต่อหนึ่ง
          หน้านี้ยังไม่ดึงตัวเลขจาก GA4 (ต้องมี Property ID และบัญชีบริการที่มีสิทธิ์ Viewer ก่อน) ดูได้ที่{" "}
          <a href="https://analytics.google.com/analytics/web/" className={textLink} target="_blank" rel="noopener noreferrer">
            Google Analytics
          </a>{" "}
          ใต้ Reports › Engagement › Events
        </p>
        <table className="mt-4 w-full max-w-[44rem] text-tm-small">
          <thead>
            <tr className="border-b border-tm-line text-left">
              <th scope="col" className="py-2 pr-4 font-semibold">
                ชื่อ event ใน GA4
              </th>
              <th scope="col" className="py-2 font-semibold">
                เกิดเมื่อ
              </th>
            </tr>
          </thead>
          <tbody>
            {ga4Events.map(([name, meaning]) => (
              <tr key={name} className="border-b border-tm-line">
                <td className="py-2 pr-4 font-mono">{name}</td>
                <td className="py-2">{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="releases-heading" className="mt-12 border-t border-tm-line pt-8">
        <h2 id="releases-heading" className="text-tm-h4 font-semibold">
          การเผยแพร่หน้าเว็บในช่วงนี้
        </h2>
        <p className="mt-2 text-tm-muted">
          {(releases ?? []).length > 0
            ? `${(releases ?? []).length} ครั้ง ล่าสุดฉบับที่ ${releases![0].number} โดย ${releases![0].created_by_email ?? "ระบบ"} เมื่อ ${bangkokDateTime.format(new Date(releases![0].created_at))}`
            : "ไม่มีการเผยแพร่ในช่วงนี้"}{" "}
          ·{" "}
          <Link href="/admin/releases" className={textLink}>
            ประวัติการเผยแพร่
          </Link>
        </p>
      </section>
    </>
  );
}
