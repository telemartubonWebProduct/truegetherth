import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LeadAnonymiseForm, LeadUpdateForm } from "@/components/admin/LeadForms";
import { pageTitle, textLink } from "@/components/admin/styles";
import { requireActiveAdmin } from "@/lib/auth/access";
import { packageDetailPath } from "@/lib/content/package-facts";
import { getPublishedContent } from "@/lib/content/published";
import { formatPhone, telHref } from "@/lib/content/render";
import { areaCheckLabels, bangkokDate, bangkokDateTime, labelOf, outcomeLabels, serviceLabels, statusLabels, timeLabels } from "@/lib/leads/labels";
import { provinceName } from "@/lib/leads/provinces";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "คำขอติดต่อกลับ" };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Change = { from: string | null; to: string | null };

const changeNames: Record<string, { name: string; labels?: Record<string, string> }> = {
  status: { name: "สถานะ", labels: statusLabels },
  area_check: { name: "ผลตรวจพื้นที่", labels: areaCheckLabels },
  outcome: { name: "ผลของคำขอ", labels: outcomeLabels },
  follow_up_on: { name: "นัดติดตาม" },
};

function describeChanges(changes: unknown): string[] {
  if (!changes || typeof changes !== "object") return [];
  return Object.entries(changes as Record<string, Change>).flatMap(([key, change]) => {
    const meta = changeNames[key];
    if (!meta || typeof change !== "object" || change === null) return [];
    const show = (value: string | null) => (value === null ? "ไม่ระบุ" : meta.labels ? labelOf(meta.labels, value) : value);
    return [`${meta.name}: ${show(change.from)} → ${show(change.to)}`];
  });
}

const eventTitles: Record<string, string> = {
  received: "ได้รับคำขอจากเว็บ",
  resubmitted: "ผู้ติดต่อส่งคำขอเดิมอีกครั้ง",
  update: "อัปเดตคำขอ",
  anonymised: "ลบข้อมูลส่วนบุคคล",
};

const anonymiseReasons: Record<string, string> = { request: "เจ้าของข้อมูลขอให้ลบ", spam: "สแปม", retention: "ครบระยะเวลาเก็บข้อมูล" };

// One call-back request (M5): what the visitor sent, its status and history,
// and the controls to work on it or remove its personal data.
export default async function LeadPage({ params, searchParams }: PageProps<"/admin/leads/[leadId]">) {
  const { leadId } = await params;
  await requireActiveAdmin(`/admin/leads/${leadId}`);
  if (!uuidPattern.test(leadId)) notFound();
  const { saved, anonymised } = await searchParams;
  const supabase = await createClient();
  const [{ data: lead }, { data: events }, content] = await Promise.all([
    supabase.from("leads").select("*").eq("id", leadId).maybeSingle(),
    supabase.from("lead_events").select("*").eq("lead_id", leadId).order("occurred_at", { ascending: true }).order("id", { ascending: true }),
    getPublishedContent(),
  ]);
  if (!lead) notFound();
  const item = lead.package_id ? content.catalog.find((entry) => entry.id === lead.package_id) : undefined;
  const utm = lead.utm && typeof lead.utm === "object" ? Object.entries(lead.utm as Record<string, string>) : [];

  const facts: [string, React.ReactNode][] = [
    ["ได้รับเมื่อ", bangkokDateTime.format(new Date(lead.created_at))],
    ["ชื่อ", lead.name ?? "—"],
    [
      "เบอร์โทร",
      lead.phone ? (
        <a href={telHref(lead.phone)} className={`${textLink} tm-num`}>
          {formatPhone(lead.phone)}
        </a>
      ) : (
        "—"
      ),
    ],
    ["จังหวัด", provinceName(lead.province, "th")],
    ["พื้นที่", lead.area ?? "—"],
    ["บริการ", labelOf(serviceLabels, lead.service)],
    [
      "แพ็กเกจ",
      item ? (
        <Link href={packageDetailPath(item.id)} className={textLink} target="_blank">
          {item.name.th}
        </Link>
      ) : (
        (lead.package_id ?? "—")
      ),
    ],
    ["เวลาที่สะดวก", labelOf(timeLabels, lead.preferred_time)],
    ["รายละเอียด", lead.note ? <span className="whitespace-pre-line">{lead.note}</span> : "—"],
    ["ส่งจากหน้า", `${lead.source_path ?? "—"}${lead.locale === "en" ? " (ภาษาอังกฤษ)" : ""}`],
    ["แคมเปญ", utm.length > 0 ? utm.map(([key, value]) => `${key}=${value}`).join(" · ") : "—"],
    ["ยินยอมตามนโยบายฉบับ", lead.consent_version],
  ];

  return (
    <>
      <header className="border-b border-tm-line pb-6">
        <p className="text-tm-small">
          <Link href="/admin/leads" className={textLink}>
            คำขอติดต่อกลับ
          </Link>
        </p>
        <h1 className={`${pageTitle} mt-2`}>{lead.name ?? "คำขอที่ลบข้อมูลส่วนบุคคลแล้ว"}</h1>
        <p className="mt-2 flex flex-wrap gap-2 text-tm-small">
          <span className="rounded-tm-pill border border-tm-line px-2 py-0.5 font-semibold" data-lead-status={lead.status}>
            {labelOf(statusLabels, lead.status)}
          </span>
          <span className="rounded-tm-pill bg-tm-surface px-2 py-0.5">{labelOf(areaCheckLabels, lead.area_check)}</span>
          {lead.outcome ? <span className="rounded-tm-pill bg-tm-surface px-2 py-0.5">ผล: {labelOf(outcomeLabels, lead.outcome)}</span> : null}
          {lead.follow_up_on ? <span className="rounded-tm-pill bg-tm-surface px-2 py-0.5">นัด {bangkokDate.format(new Date(`${lead.follow_up_on}T00:00:00+07:00`))}</span> : null}
        </p>
        {saved ? (
          <p role="status" className="mt-4 rounded-tm-control bg-tm-success-wash px-3 py-2 text-tm-small text-tm-success">
            บันทึกแล้ว
          </p>
        ) : null}
        {anonymised ? (
          <p role="status" className="mt-4 rounded-tm-control bg-tm-success-wash px-3 py-2 text-tm-small text-tm-success">
            ลบข้อมูลส่วนบุคคลของคำขอนี้แล้ว
          </p>
        ) : null}
      </header>

      <dl className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-[11rem_minmax(0,1fr)]" data-lead-facts="">
        {facts.map(([term, value]) => (
          <div key={term} className="contents">
            <dt className="text-tm-small font-semibold text-tm-muted">{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {lead.anonymised_at ? (
        <p className="mt-10 rounded-tm-control bg-tm-surface px-4 py-3 text-tm-small">
          ข้อมูลส่วนบุคคลถูกลบเมื่อ {bangkokDateTime.format(new Date(lead.anonymised_at))} คำขอนี้เหลือไว้เฉพาะสำหรับรายงาน แก้ไขไม่ได้แล้ว
        </p>
      ) : (
        <section aria-labelledby="update-heading" className="mt-10">
          <h2 id="update-heading" className="text-tm-h4 font-semibold">
            อัปเดตคำขอ
          </h2>
          <div className="mt-4 max-w-[44rem]">
            <LeadUpdateForm
              leadId={lead.id}
              seen={lead.updated_at}
              status={lead.status}
              areaCheck={lead.area_check}
              outcome={lead.outcome}
              followUp={lead.follow_up_on}
            />
          </div>
        </section>
      )}

      <section aria-labelledby="history-heading" className="mt-12">
        <h2 id="history-heading" className="text-tm-h4 font-semibold">
          ประวัติ
        </h2>
        <ol className="mt-4 grid gap-4 border-l-2 border-tm-line pl-5" data-lead-history="">
          {(events ?? []).map((event) => {
            const details = event.details && typeof event.details === "object" ? (event.details as Record<string, string>) : null;
            const reason = event.kind === "anonymised" && event.changes && typeof event.changes === "object" ? (event.changes as Record<string, string>).reason : undefined;
            return (
              <li key={event.id} data-lead-event={event.kind}>
                <p className="font-semibold">{eventTitles[event.kind] ?? event.kind}</p>
                <p className="text-tm-small text-tm-muted">
                  {bangkokDateTime.format(new Date(event.occurred_at))}
                  {event.actor_email ? ` · ${event.actor_email}` : ""}
                  {reason ? ` · ${anonymiseReasons[reason] ?? reason}` : ""}
                </p>
                {describeChanges(event.kind === "update" ? event.changes : null).map((line) => (
                  <p key={line} className="text-tm-small">
                    {line}
                  </p>
                ))}
                {details ? (
                  <p className="text-tm-small">
                    {[details.name && `ชื่อ: ${details.name}`, details.area && `พื้นที่: ${details.area}`, details.note && `รายละเอียด: ${details.note}`].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {event.note ? <p className="mt-1 whitespace-pre-line">{event.note}</p> : null}
              </li>
            );
          })}
        </ol>
      </section>

      {!lead.anonymised_at ? (
        <section aria-labelledby="privacy-heading" className="mt-12 border-t border-tm-line pt-8">
          <h2 id="privacy-heading" className="text-tm-h4 font-semibold">
            ข้อมูลส่วนบุคคล
          </h2>
          <p className="mt-2 max-w-[44rem] text-tm-small text-tm-muted">
            ระบบลบให้อัตโนมัติเมื่อปิดคำขอครบ 1 ปี ลบเองได้ทันทีเมื่อเจ้าของข้อมูลขอ (ตามนโยบายความเป็นส่วนตัว) หรือเป็นสแปม
          </p>
          <div className="mt-4">
            <LeadAnonymiseForm leadId={lead.id} />
          </div>
        </section>
      ) : null}
    </>
  );
}
