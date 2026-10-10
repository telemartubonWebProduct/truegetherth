import { isProvinceCode } from "./provinces";

// The call-back form's fields, and their rules as the browser checks them to
// answer at once. This module carries no validation library, so the form adds
// almost nothing to what every page downloads; the Server Action decides with
// the schema in form.ts, and a unit test holds the two to the same answers.
// Errors are codes; the words for them are content (site.leadForm.errors).

export const leadServices = ["broadband", "mobile", "solar", "other"] as const;
export type LeadService = (typeof leadServices)[number];

export const preferredTimes = ["anytime", "morning", "afternoon", "evening"] as const;
export type PreferredTime = (typeof preferredTimes)[number];

/** Fields a visitor fills in, in the order of the form; also the FormData keys. */
export const leadFields = ["name", "phone", "province", "area", "service", "packageId", "preferredTime", "message", "consent"] as const;
export type LeadField = (typeof leadFields)[number];

export const leadFieldErrors = ["required", "phone", "consent", "tooLong"] as const;
export type LeadFieldError = (typeof leadFieldErrors)[number];

/** Honeypot: hidden from people and screen readers; some bots fill it in. A name no browser autofills. */
export const HONEYPOT_FIELD = "hp_extra_7";

/** The longest each free-text field may be, after trimming. */
export const leadLimits = { name: 100, area: 120, message: 1000, packageId: 64 } as const;

/** A Thai number once normalized: a leading 0, then 8 or 9 more digits. */
export const thaiPhone = /^0[2-9][0-9]{7,8}$/;
export const packageIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Thai numbers as people type them (spaces, dashes, +66) to 0XXXXXXXX(X). */
export function normalizePhone(raw: string): string {
  const compact = raw.replace(/[\s\-().]/g, "");
  if (compact.startsWith("+66")) return `0${compact.slice(3)}`;
  if (/^66[0-9]{8,9}$/.test(compact)) return `0${compact.slice(2)}`;
  return compact;
}

/** The form's values as strings; a missing field is an empty one. */
export function formValues(form: FormData): Record<string, string> {
  const keys = ["idempotencyKey", ...leadFields, "locale", "source"];
  return Object.fromEntries(keys.map((key) => [key, typeof form.get(key) === "string" ? (form.get(key) as string) : ""]));
}

/** The first problem of each field, as the schema would name it; empty when the request can be sent. */
export function checkLead(values: Record<string, string>): Partial<Record<LeadField, LeadFieldError>> {
  const errors: Partial<Record<LeadField, LeadFieldError>> = {};
  const text = (key: LeadField) => (values[key] ?? "").trim();
  const oneOf = (list: readonly string[], key: LeadField) => list.includes(values[key] ?? "");

  if (text("name") === "") errors.name = "required";
  else if (text("name").length > leadLimits.name) errors.name = "tooLong";

  const phone = normalizePhone(values.phone ?? "");
  if (phone === "") errors.phone = "required";
  else if (!thaiPhone.test(phone)) errors.phone = "phone";

  if (!isProvinceCode(values.province ?? "")) errors.province = "required";
  if (text("area").length > leadLimits.area) errors.area = "tooLong";
  if (!oneOf(leadServices, "service")) errors.service = "required";

  const packageId = values.packageId ?? "";
  if (packageId !== "" && (packageId.length > leadLimits.packageId || !packageIdPattern.test(packageId))) errors.packageId = "required";

  if (!oneOf(preferredTimes, "preferredTime")) errors.preferredTime = "required";
  if (text("message").length > leadLimits.message) errors.message = "tooLong";
  if (values.consent !== "yes") errors.consent = "consent";
  return errors;
}
