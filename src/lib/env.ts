import { z } from "zod";

// Public Supabase settings. Both values are safe to expose to the browser; the
// secret/service-role key must never use a NEXT_PUBLIC_ name.
const supabasePublicEnvSchema = z.object({
  url: z.url({ protocol: /^https?$/ }),
  publishableKey: z.string().min(20),
});

export type SupabasePublicEnv = z.infer<typeof supabasePublicEnvSchema>;

export function readSupabasePublicEnv(): SupabasePublicEnv | null {
  const parsed = supabasePublicEnvSchema.safeParse({
    // Literal property access so Next.js can inline the values at build time.
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const env = readSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see .env.example).",
    );
  }
  return env;
}
