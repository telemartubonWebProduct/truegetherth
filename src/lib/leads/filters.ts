import { leadServices } from "./form";
import { leadStatuses, statusLabels } from "./labels";

// Filters of the request list, read from the address, shared by the list and
// its CSV download so both show the same requests.

export const leadFilterOptions = [
  { value: "open", label: "ยังไม่ปิด" },
  ...leadStatuses.map((value) => ({ value, label: statusLabels[value] })),
  { value: "all", label: "ทั้งหมด" },
] as const;

export type LeadFilters = { status: string; service: string; q: string };

/** Unknown values fall back to the defaults: open requests of every service. */
export function leadFilters(params: Record<string, string | string[] | undefined>): LeadFilters {
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const status = leadFilterOptions.some((filter) => filter.value === one("status")) ? one("status") : "open";
  const service = (leadServices as readonly string[]).includes(one("service")) ? one("service") : "";
  return { status, service, q: one("q").trim().slice(0, 60) };
}

type Filterable<Q> = {
  eq(column: string, value: string): Q;
  neq(column: string, value: string): Q;
  like(column: string, pattern: string): Q;
  ilike(column: string, pattern: string): Q;
};

/** LIKE pattern matching the text anywhere, with its own % and _ taken literally. */
export function containsPattern(text: string): string {
  return `%${text.replace(/[%_\\]/g, "\\$&")}%`;
}

/** Applies the filters to a Supabase query of leads. A search of 3+ digits looks in phone numbers, otherwise in names. */
export function filterLeads<Q extends Filterable<Q>>(query: Q, { status, service, q }: LeadFilters): Q {
  let result = query;
  if (status === "open") result = result.neq("status", "closed");
  else if (status !== "all") result = result.eq("status", status);
  if (service) result = result.eq("service", service);
  if (q) {
    const digits = q.replace(/\D/g, "");
    result = digits.length >= 3 ? result.like("phone", containsPattern(digits)) : result.ilike("name", containsPattern(q));
  }
  return result;
}
