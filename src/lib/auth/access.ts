import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClientIfConfigured } from "@/lib/supabase/server";

export type AdminAccess =
  | { status: "signed-out" }
  | { status: "denied"; reason: "no-membership" | "inactive"; userId: string; email: string | null }
  | { status: "active"; userId: string; email: string | null };

/**
 * Resolves the caller's back-office access for this request.
 *
 * Identity comes from a verified JWT (`getClaims`), never from unverified cookie
 * contents. Membership is read through RLS with the caller's own token, so a
 * revoked Admin loses access on their next request rather than when the token
 * expires. Call this in every page, layout and Server Action that needs it;
 * the proxy only refreshes sessions and redirects signed-out visitors.
 */
export const getAdminAccess = cache(async (): Promise<AdminAccess> => {
  const supabase = await createClientIfConfigured();
  // Unconfigured deployments: the admin layout shows the setup notice.
  if (!supabase) return { status: "signed-out" };

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (claimsError || !claims?.sub) return { status: "signed-out" };

  const userId = claims.sub;
  const email = typeof claims.email === "string" ? claims.email : null;

  const { data: membership, error } = await supabase
    .from("admin_memberships")
    .select("is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Fail closed: an unreadable membership never grants access.
    throw new Error(`Could not verify Admin membership (${error.code ?? "unknown"})`);
  }
  if (!membership) return { status: "denied", reason: "no-membership", userId, email };
  if (!membership.is_active) return { status: "denied", reason: "inactive", userId, email };
  return { status: "active", userId, email };
});

export async function requireActiveAdmin(nextPath = "/admin") {
  const access = await getAdminAccess();
  if (access.status === "signed-out") {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (access.status === "denied") redirect("/admin/denied");
  return access;
}
