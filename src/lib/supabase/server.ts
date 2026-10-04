import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { readSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * A new client per request: it carries the caller's session cookies, so every
 * query runs under that user's JWT and Row Level Security. Returns null when
 * Supabase is not configured, so pages can show the setup notice instead.
 */
export async function createClientIfConfigured() {
  // Reading cookies first makes every caller render at request time, so no
  // back-office page is ever prerendered or cached with someone's session.
  const cookieStore = await cookies();
  const env = readSupabasePublicEnv();
  if (!env) return null;

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session before rendering, so skipping the write here is safe.
        }
      },
    },
  });
}

/** For Server Actions, which only run from pages that exist when Supabase is configured. */
export async function createClient() {
  const client = await createClientIfConfigured();
  if (!client) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
  }
  return client;
}
