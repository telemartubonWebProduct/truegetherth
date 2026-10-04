import { z } from "zod";

import { locales } from "@/lib/i18n/locales";

import { isProvinceCode } from "./provinces";

// The call-back form's fields and their rules, shared by the browser (to
// answer at once) and the Server Action (which decides). Errors are codes;
// the words for them are content (site.leadForm.errors).

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

/** Thai numbers as people type them (spaces, dashes, +66) to 0XXXXXXXX(X). */
export function normalizePhone(raw: string): string {
  const compact = raw.replace(/[\s\-().]/g, "");
  if (compact.startsWith("+66")) return `0${compact.slice(3)}`;
  if (/^66[0-9]{8,9}$/.test(compact)) return `0${compact.slice(2)}`;
  return compact;
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "tooLong" })
    .transform((value) => value || undefined);

export const leadInput = z.object({
  // Made in the browser for each filled-in form; without JavaScript the server makes one.
  idempotencyKey: z.union([z.uuid(), z.literal("").transform(() => undefined)]),
  name: z.string().trim().min(1, { error: "required" }).max(100, { error: "tooLong" }),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().min(1, { error: "required" }).regex(/^0[2-9][0-9]{7,8}$/, { error: "phone" })),
  province: z.string().refine(isProvinceCode, { error: "required" }),
  area: optionalText(120),
  service: z.enum(leadServices, { error: "required" }),
  packageId: z.union([z.string().max(64).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), z.literal("").transform(() => undefined)]),
  preferredTime: z.enum(preferredTimes, { error: "required" }),
  message: optionalText(1000),
  consent: z.literal("yes", { error: "consent" }),
  locale: z.enum(locales),
  // The page's path and query, for the source and campaign of the request.
  source: z.string().max(500),
});
export type LeadInput = z.infer<typeof leadInput>;

/** The form's values as strings; a missing field is an empty one. */
export function formValues(form: FormData): Record<string, string> {
  const keys = ["idempotencyKey", ...leadFields, "locale", "source"];
  return Object.fromEntries(keys.map((key) => [key, typeof form.get(key) === "string" ? (form.get(key) as string) : ""]));
}

/** First problem of each field, as an error code. */
export function fieldErrors(error: z.ZodError): Partial<Record<LeadField, LeadFieldError>> {
  const result: Partial<Record<LeadField, LeadFieldError>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !(leadFields as readonly string[]).includes(field)) continue;
    const key = field as LeadField;
    if (result[key]) continue;
    result[key] = (leadFieldErrors as readonly string[]).includes(issue.message) ? (issue.message as LeadFieldError) : "required";
  }
  return result;
}

/** The page a request came from and the campaign tags in its address (no other query values). */
export function requestSource(source: string): { path: string | undefined; utm: Record<string, string> } {
  let url: URL;
  try {
    url = new URL(source, "https://site.invalid");
  } catch {
    return { path: undefined, utm: {} };
  }
  if (url.origin !== "https://site.invalid") return { path: undefined, utm: {} };
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const value = url.searchParams.get(key)?.trim();
    if (value) utm[key] = value.slice(0, 100);
  }
  const path = /^\/[A-Za-z0-9/_-]*$/.test(url.pathname) ? url.pathname.slice(0, 200) : undefined;
  return { path, utm };
}
