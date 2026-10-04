import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeAdminPath } from "@/lib/auth/redirect";
import { createClientIfConfigured } from "@/lib/supabase/server";

// Only the email links this site sends: Admin invitations and password recovery.
const ACCEPTED_TYPES: ReadonlySet<string> = new Set<EmailOtpType>(["invite", "recovery"]);

/**
 * Target of invite and recovery emails. Accepts the token-hash links from
 * supabase/templates (valid in any browser) and PKCE `code` links from the
 * default templates, then continues to a back-office path.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeAdminPath(searchParams.get("next"));
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClientIfConfigured();
  if (!supabase) redirect("/admin/login");
  let verified = false;

  if (tokenHash && type && ACCEPTED_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    verified = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = !error;
  }

  redirect(verified ? next : "/admin/login?notice=link-invalid");
}
