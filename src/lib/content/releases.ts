import { CONTENT_SCHEMA_VERSION } from "./draft-model";
import { siteContent, type SiteContent } from "./schema";
import { contentProblems } from "./validate";

// A published release as read from content_releases (M4), and the check it
// passes before it reaches visitors or is put back live.

export type ReleaseRow = { number: number; schemaVersion: number; content: unknown };

/** The release's content if this version of the site can show it; null otherwise. */
export function usableRelease(row: ReleaseRow): SiteContent | null {
  if (row.schemaVersion !== CONTENT_SCHEMA_VERSION) return null;
  const parsed = siteContent.safeParse(row.content);
  if (!parsed.success || contentProblems(parsed.data).length > 0) return null;
  return parsed.data;
}
