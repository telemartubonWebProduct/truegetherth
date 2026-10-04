import type { LeadService, PreferredTime } from "./form";

// Names the back office shows for a request's fixed values (Thai, like the
// rest of the back office). The database checks the same lists.

export const leadStatuses = ["new", "pending", "contacted", "closed"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const areaChecks = ["unchecked", "available", "unavailable"] as const;
export type AreaCheck = (typeof areaChecks)[number];

export const leadOutcomes = ["signed_up", "not_interested", "no_coverage", "unreachable", "duplicate", "spam", "other"] as const;
export type LeadOutcome = (typeof leadOutcomes)[number];

export const statusLabels: Record<LeadStatus, string> = {
  new: "ใหม่",
  pending: "รอติดต่อ",
  contacted: "ติดต่อแล้ว",
  closed: "ปิดคำขอ",
};

export const areaCheckLabels: Record<AreaCheck, string> = {
  unchecked: "ยังไม่ตรวจ",
  available: "ติดตั้งได้",
  unavailable: "ติดตั้งไม่ได้",
};

export const outcomeLabels: Record<LeadOutcome, string> = {
  signed_up: "สมัครแล้ว",
  not_interested: "ไม่สนใจ",
  no_coverage: "พื้นที่ไม่รองรับ",
  unreachable: "ติดต่อไม่ได้",
  duplicate: "คำขอซ้ำ",
  spam: "สแปม",
  other: "อื่นๆ",
};

export const serviceLabels: Record<LeadService, string> = {
  broadband: "เน็ตบ้าน",
  mobile: "เน็ตมือถือ",
  solar: "โซลาร์เซลล์",
  other: "อื่นๆ / ไม่แน่ใจ",
};

export const timeLabels: Record<PreferredTime, string> = {
  anytime: "เวลาใดก็ได้",
  morning: "ช่วงเช้า",
  afternoon: "ช่วงบ่าย",
  evening: "ช่วงเย็น",
};

/** Bangkok time, as the team works. */
export const bangkokDateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });
export const bangkokDate = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" });

export function labelOf<T extends string>(labels: Record<T, string>, value: string | null | undefined): string {
  return value && value in labels ? labels[value as T] : (value ?? "");
}
