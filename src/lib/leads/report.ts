import type { LeadService } from "./form";
import type { LeadOutcome, LeadStatus } from "./labels";

// The back office's request report (M5): counts from the requests themselves,
// the source of truth for contact and sign-up. Visits and clicks come from
// GA4, which the report keeps separate. Pure, so it is tested on its own.

export type ReportLead = {
  created_at: string;
  status: string;
  service: string;
  province: string;
  package_id: string | null;
  outcome: string | null;
  source_path: string | null;
  utm: unknown;
};

export type Count = { key: string; count: number };

export type LeadReport = {
  total: number;
  byStatus: Record<LeadStatus, number>;
  /** Talked to: contacted, or closed with an outcome that needed a conversation. */
  reached: number;
  signedUp: number;
  byService: Record<LeadService, number>;
  byProvince: Count[];
  byPackage: Count[];
  /** utm_source of the page the form was sent from; "" when there was none. */
  bySource: Count[];
  byPage: Count[];
  /** One entry per day of the period, oldest first, in Bangkok time. */
  perDay: Count[];
};

const unreachedOutcomes = new Set<string>(["unreachable", "duplicate", "spam"] satisfies LeadOutcome[]);

const bangkokDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });

/** YYYY-MM-DD of an instant in Bangkok. */
export function dayInBangkok(instant: Date): string {
  return bangkokDay.format(instant);
}

function ranked(counts: Map<string, number>, limit: number): Count[] {
  return [...counts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)).slice(0, limit);
}

function bump(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

export function buildLeadReport(leads: ReportLead[], days: number, now: Date): LeadReport {
  const byStatus: Record<LeadStatus, number> = { new: 0, pending: 0, contacted: 0, closed: 0 };
  const byService: Record<LeadService, number> = { broadband: 0, mobile: 0, solar: 0, other: 0 };
  const provinces = new Map<string, number>();
  const packages = new Map<string, number>();
  const sources = new Map<string, number>();
  const pages = new Map<string, number>();
  const perDay = new Map<string, number>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    perDay.set(dayInBangkok(new Date(now.getTime() - offset * 86_400_000)), 0);
  }

  let reached = 0;
  let signedUp = 0;
  for (const lead of leads) {
    if (lead.status in byStatus) byStatus[lead.status as LeadStatus] += 1;
    if (lead.service in byService) byService[lead.service as LeadService] += 1;
    if (lead.status === "contacted" || (lead.status === "closed" && lead.outcome && !unreachedOutcomes.has(lead.outcome))) reached += 1;
    if (lead.outcome === "signed_up") signedUp += 1;
    bump(provinces, lead.province);
    if (lead.package_id) bump(packages, lead.package_id);
    const utm = lead.utm && typeof lead.utm === "object" ? (lead.utm as Record<string, unknown>) : {};
    bump(sources, typeof utm.utm_source === "string" ? utm.utm_source : "");
    bump(pages, lead.source_path ?? "");
    const day = dayInBangkok(new Date(lead.created_at));
    if (perDay.has(day)) perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  return {
    total: leads.length,
    byStatus,
    reached,
    signedUp,
    byService,
    byProvince: ranked(provinces, 10),
    byPackage: ranked(packages, 10),
    bySource: ranked(sources, 10),
    byPage: ranked(pages, 10),
    perDay: [...perDay].map(([key, count]) => ({ key, count })),
  };
}

/** Share of a total as a whole percent, for display ("–" when there is nothing to divide). */
export function percent(part: number, total: number): string {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "–";
}
