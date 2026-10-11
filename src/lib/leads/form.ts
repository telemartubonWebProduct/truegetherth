import { z } from "zod";

import { locales } from "@/lib/i18n/locales";

import { leadFieldErrors, leadFields, leadLimits, leadServices, normalizePhone, packageIdPattern, preferredTimes, thaiPhone, type LeadField, type LeadFieldError } from "./fields";
import { isProvinceCode } from "./provinces";

// The call-back form's rules as the Server Action decides them. The fields,
// and the same rules as the browser checks them without this library, are in
// fields.ts (re-exported here); a unit test holds the two to the same answers.

export * from "./fields";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: "tooLong" })
    .transform((value) => value || undefined);

export const leadInput = z.object({
  // Made in the browser for each filled-in form; without JavaScript the server makes one.
  idempotencyKey: z.union([z.uuid(), z.literal("").transform(() => undefined)]),
  name: z.string().trim().min(1, { error: "required" }).max(leadLimits.name, { error: "tooLong" }),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().min(1, { error: "required" }).regex(thaiPhone, { error: "phone" })),
  province: z.string().refine(isProvinceCode, { error: "required" }),
  area: optionalText(leadLimits.area),
  service: z.enum(leadServices, { error: "required" }),
  packageId: z.union([z.string().max(leadLimits.packageId).regex(packageIdPattern), z.literal("").transform(() => undefined)]),
  preferredTime: z.enum(preferredTimes, { error: "required" }),
  message: optionalText(leadLimits.message),
  consent: z.literal("yes", { error: "consent" }),
  locale: z.enum(locales),
  // The page's path and query, for the source and campaign of the request.
  source: z.string().max(500),
});
export type LeadInput = z.infer<typeof leadInput>;

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
