import { documentSchema, isCollectionDocument, isDocumentId, isTombstone, readDocument, writeDocument, type DocumentId } from "./documents";
import type { SiteContent } from "./schema";
import { thaiErrorMap } from "./messages";
import { contentProblems } from "./validate";

// How drafts become content: pure functions shared by the server (loading the
// editor, validating a save) and the unit tests. Database access lives in
// drafts.ts.

/**
 * Version of the content schema that drafts are written for. 2: the home
 * opening became a scroll film with beats, and the router moved to its own
 * section. 3: the home page's featured packages became tabs of picture cards
 * (promos), and service tiles have pictures. 4: site settings gained the
 * call-back form's copy and the cookie banner (M5), and the contact page's
 * call-back band became a form section. 5: the home page became the scroll
 * landing (hero with the 3D router, manifesto, package rail, the slip of
 * steps, services, a price table), the film is gone, and the theme turned
 * black and white. 6: Tawk live chat is gone, with its script in the site's
 * integrations and its group in the cookie banner. 7: the home page's opening
 * is a painting in layers: hero.visual names its sky, which the page lays the
 * figures over (a release naming the router's still would get them too).
 */
export const CONTENT_SCHEMA_VERSION = 7;
// R4 added documents (catalog order, new packages/media/benefits, tombstones)
// without changing any document's shape, so drafts of version 3 still read.

export type DraftRecord = {
  documentId: DocumentId;
  schemaVersion: number;
  body: unknown;
  revision: number;
  updatedAt: string;
  updatedBy: string | null;
};

/** A stored draft that cannot be applied, with the reasons in Thai for the editor. */
export type DraftProblem = { documentId: string; messages: string[] };

/** One schema problem inside a document; list items are addressed by index. */
export type FieldIssue = { path: (string | number)[]; message: string };

export type Parsed = { ok: true; value: unknown } | { ok: false; messages: string[]; issues: FieldIssue[] };

function issueMessages(issues: FieldIssue[]): string[] {
  return issues.map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message));
}

/**
 * Parses one document body against its schema, with Thai messages. A
 * tombstone of a package, picture or benefit parses to undefined: the
 * document is removed.
 */
export function parseDocument(documentId: DocumentId, body: unknown): Parsed {
  if (isTombstone(body)) {
    return isCollectionDocument(documentId) ? { ok: true, value: undefined } : { ok: false, messages: ["ลบเอกสารนี้ไม่ได้"], issues: [] };
  }
  const result = documentSchema(documentId).safeParse(body, { error: thaiErrorMap });
  if (result.success) return { ok: true, value: result.data };
  const issues: FieldIssue[] = [];
  const seen = new Set<string>();
  for (const issue of result.error.issues) {
    const path = issue.path.map((segment) => (typeof segment === "number" ? segment : String(segment)));
    // One check can fail in several ways (a URL's scheme and host): say it once.
    const key = JSON.stringify([path, issue.message]);
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({ path, message: issue.message });
  }
  return { ok: false, messages: issueMessages(issues), issues };
}

/** Whether a draft can apply to this content: the document exists, or it is a package, picture or benefit (added). */
function canApply(content: SiteContent, documentId: string): documentId is DocumentId {
  return isDocumentId(documentId) && (isCollectionDocument(documentId) || readDocument(content, documentId) !== undefined);
}

/**
 * The content an Admin sees in the editor: the published content with every
 * valid draft applied. Drafts that no longer fit (an unknown document, another
 * schema version, a body the schema rejects, or references that break) are
 * left out and reported, so one bad draft cannot break the whole preview.
 * New documents are added before the package order applies, so a new package
 * can be ordered too.
 */
export function applyDrafts(published: SiteContent, drafts: readonly DraftRecord[]): { content: SiteContent; problems: DraftProblem[] } {
  let content = published;
  const problems: DraftProblem[] = [];
  const ordered = [...drafts.filter((draft) => draft.documentId !== "catalog"), ...drafts.filter((draft) => draft.documentId === "catalog")];
  for (const draft of ordered) {
    if (!canApply(published, draft.documentId)) {
      problems.push({ documentId: draft.documentId, messages: ["ไม่มีเอกสารนี้ในเนื้อหาที่เผยแพร่แล้ว"] });
      continue;
    }
    if (draft.schemaVersion !== CONTENT_SCHEMA_VERSION) {
      problems.push({ documentId: draft.documentId, messages: [`ร่างนี้เขียนด้วยโครงสร้างรุ่น ${draft.schemaVersion}`] });
      continue;
    }
    const parsed = parseDocument(draft.documentId, draft.body);
    if (!parsed.ok) {
      problems.push({ documentId: draft.documentId, messages: parsed.messages });
      continue;
    }
    // Removing a document that is already gone changes nothing.
    if (parsed.value === undefined && readDocument(content, draft.documentId) === undefined) continue;
    const next = writeDocument(content, draft.documentId, parsed.value);
    const broken = contentProblems(next);
    if (broken.length > 0) {
      problems.push({ documentId: draft.documentId, messages: broken });
      continue;
    }
    content = next;
  }
  return { content, problems };
}

/**
 * Checks a document the editor wants to save, in the context of every other
 * draft: the schema of the document, then the references across the site.
 */
export function validateDraft(current: SiteContent, documentId: DocumentId, body: unknown): Parsed {
  if (!canApply(current, documentId)) return { ok: false, messages: ["ไม่มีเอกสารนี้ในเนื้อหาของเว็บ"], issues: [] };
  const parsed = parseDocument(documentId, body);
  if (!parsed.ok) return parsed;
  // Removed already (the editor's own content): check nothing still points at it.
  const next = parsed.value === undefined && readDocument(current, documentId) === undefined ? current : writeDocument(current, documentId, parsed.value);
  const broken = contentProblems(next);
  return broken.length > 0 ? { ok: false, messages: broken, issues: [] } : parsed;
}
