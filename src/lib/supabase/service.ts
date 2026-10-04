import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

// The site server's own Supabase client, with the secret key: it bypasses Row
// Level Security, so it is used only for the one job that needs it, storing
// call-back requests through submit_lead() after the Server Action validated
// them (ARCHITECTURE.md §4). SUPABASE_SECRET_KEY is a server-only, sensitive
// environment variable; it never gets a NEXT_PUBLIC_ name and is not in the
// repository.

export function createServiceClient() {
  const env = readSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!env || !secretKey || secretKey.length < 20) return null;
  return {
    client: createClient<Database>(env.url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } }),
    secretKey,
  };
}
