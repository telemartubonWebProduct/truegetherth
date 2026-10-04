"use server";

import { randomUUID } from "node:crypto";

import { headers } from "next/headers";

import { getPublishedContent } from "@/lib/content/published";
import { createServiceClient } from "@/lib/supabase/service";

import { fieldErrors, formValues, HONEYPOT_FIELD, leadInput, requestSource, type LeadField, type LeadFieldError } from "./form";
import { clientAddress, clientHash } from "./intake";
import { requestablePackages } from "./packages";

// The call-back form's Server Action (M5). It is a public endpoint: it checks
// every field again, then stores the request through submit_lead(), which
// drops repeats, folds a new request into an open one from the same phone and
// rate limits. The visitor sees success only after the database said so.

export type LeadFormState =
  | null
  | { status: "sent"; duplicate: boolean }
  | { status: "invalid"; fields: Partial<Record<LeadField, LeadFieldError>> }
  | { status: "rate_limited" | "failed" | "unavailable" };

export async function submitLead(_previous: LeadFormState, form: FormData): Promise<LeadFormState> {
  // Bots that fill in the hidden field get the answer people get; nothing is stored.
  const trap = form.get(HONEYPOT_FIELD);
  if (typeof trap === "string" && trap.length > 0) return { status: "sent", duplicate: true };

  const parsed = leadInput.safeParse(formValues(form));
  if (!parsed.success) return { status: "invalid", fields: fieldErrors(parsed.error) };
  const service = createServiceClient();
  if (!service) return { status: "unavailable" };

  const input = parsed.data;
  const content = await getPublishedContent();
  const packageId = input.packageId && requestablePackages(content).some((item) => item.id === input.packageId) ? input.packageId : undefined;
  const { path, utm } = requestSource(input.source);

  const { data, error } = await service.client
    .rpc("submit_lead", {
      p_idempotency_key: input.idempotencyKey ?? randomUUID(),
      p_name: input.name,
      p_phone: input.phone,
      p_province: input.province,
      p_area: input.area,
      p_service: input.service,
      p_package_id: packageId,
      p_preferred_time: input.preferredTime,
      p_note: input.message,
      p_locale: input.locale,
      p_source_path: path,
      p_utm: utm,
      p_consent_version: content.site.consent.policyVersion,
      p_client_hash: clientHash(clientAddress(await headers()), service.secretKey),
    })
    .single();
  if (error || !data) {
    console.error("Storing a call-back request failed", { code: error?.code });
    return { status: "failed" };
  }
  if (data.outcome === "rate_limited") return { status: "rate_limited" };
  return { status: "sent", duplicate: data.outcome === "duplicate" };
}
