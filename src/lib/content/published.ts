import "server-only";

import { createClient } from "@supabase/supabase-js";

import { readSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

import { content as repositoryContent } from "./index";
import { usableRelease, type ReleaseRow } from "./releases";
import type { SiteContent } from "./schema";

// The content visitors see (M4, docs/renovation/M4-PUBLISH.md): the release
// published from the Mirror editor, read from Supabase through
// published_content(), or the content in src/content when there is no
// release yet, Supabase is not configured or cannot be reached, or the
// release does not fit this version of the site. The read is a GET fetch
// cached under one tag (fetch `next.tags`, which updateTag clears; an
// unstable_cache entry would survive it): publishing and rolling back call
// updateTag(CONTENT_TAG), so the next request renders the new release.

export const CONTENT_TAG = "content";

/**
 * Even without a publish, the cached release is read again after a day. The
 * data cache outlives deployments (on Vercel too), so a database changed
 * outside the back office, such as a restored backup, still reaches visitors.
 */
const CONTENT_MAX_AGE_SECONDS = 86_400;

export type Published = {
  content: SiteContent;
  /** Release number visitors see; null while the repository content is shown. */
  release: number | null;
};

async function readRelease(cached: boolean): Promise<ReleaseRow | null> {
  const env = readSupabasePublicEnv();
  if (!env) return null;
  // The publishable key and no session: visitors' access, through the SECURITY DEFINER function.
  const supabase = createClient<Database>(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, cached ? { ...init, cache: "force-cache", next: { tags: [CONTENT_TAG], revalidate: CONTENT_MAX_AGE_SECONDS } } : { ...init, cache: "no-store" }),
    },
  });
  // GET, so the response can be cached (PostgREST serves stable functions over GET).
  const { data, error } = await supabase.rpc("published_content", undefined, { get: true }).maybeSingle();
  if (error) throw new Error(`published_content failed (${error.code ?? "unknown"})`);
  return data ? { number: data.number, schemaVersion: data.schema_version, content: data.content } : null;
}

/** The published content as visitors get it (cached until the next publish). */
export async function getPublished(): Promise<Published> {
  return resolve(() => readRelease(true));
}

/** The same, read now: the publish and history pages compare against what is really live. */
export async function getPublishedFresh(): Promise<Published> {
  return resolve(() => readRelease(false));
}

async function resolve(read: () => Promise<ReleaseRow | null>): Promise<Published> {
  try {
    const row = await read();
    if (row) {
      const usable = usableRelease(row);
      if (usable) return { content: usable, release: row.number };
      console.error("The published release does not fit this version of the site; showing the repository content", { release: row.number });
    }
  } catch (error) {
    console.error("Reading the published release failed; showing the repository content", { error: error instanceof Error ? error.message : "unknown" });
  }
  return { content: repositoryContent, release: null };
}

export async function getPublishedContent(): Promise<SiteContent> {
  return (await getPublished()).content;
}
