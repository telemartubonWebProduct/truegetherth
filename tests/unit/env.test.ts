import { afterEach, describe, expect, it, vi } from "vitest";

import { getSupabasePublicEnv, readSupabasePublicEnv } from "@/lib/env";

describe("Supabase public environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the project URL and publishable key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://wdcbbjvxrcxuaabcipqo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_0123456789abcdef");
    expect(readSupabasePublicEnv()).toEqual({
      url: "https://wdcbbjvxrcxuaabcipqo.supabase.co",
      publishableKey: "sb_publishable_0123456789abcdef",
    });
  });

  it("treats missing or malformed values as not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(readSupabasePublicEnv()).toBeNull();
    expect(() => getSupabasePublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);

    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "ftp://example.test");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_0123456789abcdef");
    expect(readSupabasePublicEnv()).toBeNull();
  });
});
