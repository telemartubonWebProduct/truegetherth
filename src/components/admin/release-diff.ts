import { documentLabel, pathLabel } from "@/components/editor/labels";
import { documentIds, readDocument, type DocumentId } from "@/lib/content/documents";
import { applyDrafts, type DraftProblem, type DraftRecord } from "@/lib/content/draft-model";
import { diffPaths } from "@/lib/content/paths";
import type { SiteContent } from "@/lib/content/schema";

// What publishing would change, and what differs between two releases (M4),
// in the Thai names the editor uses. Pure functions over content versions.

export type DocumentChange = {
  documentId: DocumentId;
  label: string;
  kind: "new" | "removed" | "changed";
  /** Thai paths of the changed fields (the first few). */
  fields: string[];
};

/** One document's change between two versions; null when it is the same. */
function changeOf(before: SiteContent, after: SiteContent, documentId: DocumentId): DocumentChange | null {
  const a = readDocument(before, documentId);
  const b = readDocument(after, documentId);
  if (a === undefined && b === undefined) return null;
  if (a === undefined) return { documentId, label: documentLabel(after, documentId), kind: "new", fields: [] };
  if (b === undefined) return { documentId, label: documentLabel(before, documentId), kind: "removed", fields: [] };
  const paths = diffPaths(a, b);
  if (paths.length === 0) return null;
  return { documentId, label: documentLabel(after, documentId), kind: "changed", fields: paths.map((path) => pathLabel(b, path)) };
}

export type PendingPublish = {
  /** The content publishing would put live. */
  content: SiteContent;
  /** Every draft that applies, with what it changes (an empty change list is a draft equal to the live version). */
  drafts: { documentId: DocumentId; revision: number; change: DocumentChange | null }[];
  /** Drafts that cannot be published as they are; they stay drafts. */
  problems: DraftProblem[];
};

export function pendingPublish(published: SiteContent, drafts: readonly DraftRecord[]): PendingPublish {
  const { content, problems } = applyDrafts(published, drafts);
  const blocked = new Set(problems.map((problem) => problem.documentId));
  return {
    content,
    drafts: drafts
      .filter((draft) => !blocked.has(draft.documentId))
      .map((draft) => ({ documentId: draft.documentId, revision: draft.revision, change: changeOf(published, content, draft.documentId) })),
    problems,
  };
}

/** Documents that differ between two releases, for the history page. */
export function changesBetween(before: SiteContent, after: SiteContent): DocumentChange[] {
  const ids = new Set<DocumentId>([...documentIds(before), ...documentIds(after)]);
  return [...ids].flatMap((documentId) => changeOf(before, after, documentId) ?? []);
}
