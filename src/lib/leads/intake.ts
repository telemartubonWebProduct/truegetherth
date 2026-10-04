import "server-only";

import { createHmac } from "node:crypto";

import { createServiceClient } from "@/lib/supabase/service";

/** True when this deployment can store requests (Supabase and the secret key are set). */
export function leadIntakeEnabled(): boolean {
  return createServiceClient() !== null;
}

/** The visitor's address as the platform reports it; Vercel sets x-forwarded-for itself. */
export function clientAddress(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip")?.trim() || "unknown";
}

/** Keyed hash of the address, for the rate limit; the address itself is not stored. */
export function clientHash(address: string, key: string): string {
  return createHmac("sha256", key).update(address).digest("hex");
}
