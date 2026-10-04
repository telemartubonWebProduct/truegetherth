import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the back office uses sessions; public pages never run the proxy.
export const config = {
  matcher: ["/admin/:path*"],
};
