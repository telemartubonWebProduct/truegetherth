import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { readSupabasePublicEnv } from "@/lib/env";

// Back-office pages a signed-out visitor may open.
const SIGNED_OUT_PATHS = ["/admin/login", "/admin/forgot-password"];

function matchesPath(pathname: string, paths: readonly string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refreshes the Supabase session cookie before back-office pages render and
 * sends signed-out visitors to the sign-in page. Authorization (active Admin
 * membership) is checked by the pages and Server Actions themselves.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = readSupabasePublicEnv();
  if (!env) return response; // The admin layout explains the missing configuration.

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Nothing may run between creating the client and this call: it refreshes
  // an expired access token and verifies the JWT.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  let redirectTo: URL | null = null;
  if (!signedIn && !matchesPath(pathname, SIGNED_OUT_PATHS)) {
    redirectTo = new URL("/admin/login", request.url);
    if (pathname !== "/admin") redirectTo.searchParams.set("next", `${pathname}${search}`);
  } else if (signedIn && matchesPath(pathname, ["/admin/login"])) {
    redirectTo = new URL("/admin", request.url);
  }

  const result = redirectTo ? NextResponse.redirect(redirectTo) : response;
  if (redirectTo) {
    // Keep any refreshed session cookies on the redirect.
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
  }
  // Back-office responses are per user and must never be cached by a CDN.
  result.headers.set("Cache-Control", "private, no-store");
  // Drafts and the back office never appear in search results.
  result.headers.set("X-Robots-Tag", "noindex, nofollow");
  // No framing by other sites (clickjacking); same-origin framing stays
  // available for the Mirror Editor preview.
  result.headers.set("Content-Security-Policy", "frame-ancestors 'self'");
  result.headers.set("X-Frame-Options", "SAMEORIGIN");
  return result;
}
