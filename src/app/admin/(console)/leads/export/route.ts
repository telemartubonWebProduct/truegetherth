import { getAdminAccess } from "@/lib/auth/access";
import { getPublishedContent } from "@/lib/content/published";
import { formatPhone } from "@/lib/content/render";
import { csvCell } from "@/lib/leads/csv";
import { filterLeads, leadFilters } from "@/lib/leads/filters";
import { areaCheckLabels, labelOf, outcomeLabels, serviceLabels, statusLabels, timeLabels } from "@/lib/leads/labels";
import { provinceName } from "@/lib/leads/provinces";
import { createClient } from "@/lib/supabase/server";

// CSV of the request list as filtered on screen, for the sales team's own
// spreadsheet (M5). Active Admins only; every download is in the audit log,
// since it carries personal data out of the system.

const MAX_ROWS = 5000;

const bangkok = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" });

export async function GET(request: Request) {
  const access = await getAdminAccess();
  if (access.status !== "active") return new Response("Forbidden", { status: 403 });

  const filters = leadFilters(Object.fromEntries(new URL(request.url).searchParams));
  const supabase = await createClient();
  const { data: leads, error } = await filterLeads(
    supabase
      .from("leads")
      .select("created_at, name, phone, province, area, service, package_id, preferred_time, note, status, area_check, outcome, follow_up_on, source_path, utm, anonymised_at")
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS),
    filters,
  );
  if (error) return new Response("Could not read requests", { status: 500 });

  const content = await getPublishedContent();
  const packageNames = new Map(content.catalog.map((item) => [item.id, item.name.th]));
  const header = ["ได้รับเมื่อ", "ชื่อ", "เบอร์โทร", "จังหวัด", "พื้นที่", "บริการ", "แพ็กเกจ", "เวลาที่สะดวก", "รายละเอียด", "สถานะ", "ผลตรวจพื้นที่", "ผล", "นัดติดตาม", "ส่งจากหน้า", "แคมเปญ (utm_source)"];
  const rows = (leads ?? []).map((lead) => {
    const utm = lead.utm && typeof lead.utm === "object" ? (lead.utm as Record<string, string>) : {};
    return [
      bangkok.format(new Date(lead.created_at)),
      lead.anonymised_at ? "(ลบข้อมูลส่วนบุคคลแล้ว)" : lead.name,
      lead.phone ? formatPhone(lead.phone) : "",
      provinceName(lead.province, "th"),
      lead.area,
      labelOf(serviceLabels, lead.service),
      lead.package_id ? (packageNames.get(lead.package_id) ?? lead.package_id) : "",
      labelOf(timeLabels, lead.preferred_time),
      lead.note,
      labelOf(statusLabels, lead.status),
      labelOf(areaCheckLabels, lead.area_check),
      lead.outcome ? labelOf(outcomeLabels, lead.outcome) : "",
      lead.follow_up_on,
      lead.source_path,
      utm.utm_source,
    ];
  });

  const { error: auditError } = await supabase.from("audit_log").insert({
    action: "lead.export",
    target_type: "lead",
    metadata: { rows: rows.length, ...filters },
  });
  if (auditError) return new Response("Could not record the download", { status: 500 });

  // Byte order mark: Excel then reads the Thai text as UTF-8.
  const csv = `﻿${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="truegetherth-leads-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}
