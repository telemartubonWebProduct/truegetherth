import { readDocument, TOMBSTONE, writeDocument, type DocumentId } from "@/lib/content/documents";
import { parseDocument, validateDraft, type DraftRecord, type FieldIssue } from "@/lib/content/draft-model";
import type { DiscardOutcome, SaveOutcome } from "@/lib/content/drafts";
import { setAt } from "@/lib/content/paths";
import type { SiteContent } from "@/lib/content/schema";

// The editor's working content and the autosave of each document
// (ARCHITECTURE.md §4): every edit renders at once, then the document is saved
// after a pause in typing, starting from the revision the editor last saw. The
// status only says "saved" once the server has confirmed it, and a revision
// conflict stops that document's autosave until the Admin chooses a version.
// Plain TypeScript with an external-store API (useSyncExternalStore), so the
// timing and conflict rules are unit-tested without a browser.

export type DocStatus = "saved" | "pending" | "saving" | "invalid" | "error" | "conflict";

export type DocMeta = {
  /** Server revision the next save starts from; 0 when the document has no draft. */
  revision: number;
  /** The body the server holds (the published body when there is no draft). */
  saved: unknown;
  status: DocStatus;
  /** Why the document is invalid or failed to save, in Thai. */
  messages: string[];
  issues: FieldIssue[];
  /** The server's version when status is "conflict"; null when the draft was discarded meanwhile. */
  conflict?: DraftRecord | null;
  savedAt?: string;
};

export type DraftState = {
  content: SiteContent;
  meta: Readonly<Partial<Record<DocumentId, DocMeta>>>;
  lastSavedAt: string | null;
};

export type DraftRevision = { documentId: DocumentId; revision: number };

export type SaveAction = (input: { documentId: DocumentId; expectedRevision: number; body: unknown }) => Promise<SaveOutcome>;
export type DiscardAction = (input: { documentId: DocumentId; expectedRevision: number }) => Promise<DiscardOutcome>;

export type DraftStoreOptions = {
  published: SiteContent;
  /** Published content with the valid drafts applied, as the server loaded it. */
  working: SiteContent;
  /** Every stored draft, including ones the server could not apply. */
  drafts: readonly DraftRevision[];
  save: SaveAction;
  discard: DiscardAction;
  /** Pause after the last change before a document is saved. */
  delay?: number;
};

const unsavedStatuses: ReadonlySet<DocStatus> = new Set(["pending", "saving", "invalid", "error", "conflict"]);

const offline = "เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ หรือหมดเวลาเข้าสู่ระบบ: ตรวจอินเทอร์เน็ต หรือเข้าสู่ระบบใหม่ในแท็บอื่น แล้วกด “ลองอีกครั้ง”";

export class DraftStore {
  private state: DraftState;
  private readonly listeners = new Set<() => void>();
  private readonly timers = new Map<DocumentId, ReturnType<typeof setTimeout>>();
  private readonly inflight = new Set<DocumentId>();
  private readonly published: SiteContent;
  private readonly saveAction: SaveAction;
  private readonly discardAction: DiscardAction;
  private readonly delay: number;
  /** Called with every document whose body changed, for the preview. */
  onDocument: ((documentId: DocumentId, body: unknown) => void) | null = null;

  /** Sets the listener for changed documents; returns a function that removes it. */
  watchDocuments(listener: (documentId: DocumentId, body: unknown) => void): () => void {
    this.onDocument = listener;
    return () => {
      if (this.onDocument === listener) this.onDocument = null;
    };
  }

  constructor(options: DraftStoreOptions) {
    this.published = options.published;
    this.saveAction = options.save;
    this.discardAction = options.discard;
    this.delay = options.delay ?? 800;
    const meta: Partial<Record<DocumentId, DocMeta>> = {};
    for (const draft of options.drafts) {
      // Drafts the server could not apply keep their revision, so the next
      // save replaces them instead of conflicting with them.
      const shown = readDocument(options.working, draft.documentId);
      if (shown === undefined) continue;
      meta[draft.documentId] = { revision: draft.revision, saved: shown, status: "saved", messages: [], issues: [] };
    }
    this.state = { content: options.working, meta, lastSavedAt: null };
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): DraftState => this.state;

  /** The published body of a document, for "reset to published" and discards. */
  publishedBody(documentId: DocumentId): unknown {
    return readDocument(this.published, documentId);
  }

  metaOf(documentId: DocumentId): DocMeta {
    return (
      this.state.meta[documentId] ?? {
        revision: 0,
        saved: readDocument(this.state.content, documentId),
        status: "saved",
        messages: [],
        issues: [],
      }
    );
  }

  hasUnsaved(): boolean {
    return Object.values(this.state.meta).some((meta) => meta !== undefined && unsavedStatuses.has(meta.status));
  }

  /** Changes one value; the document is saved after the next pause. */
  edit(documentId: DocumentId, path: readonly string[], value: unknown) {
    const body = setAt(readDocument(this.state.content, documentId), path, value);
    this.replace(documentId, body);
  }

  /** Adds a package, picture or benefit; it saves like any other change. */
  create(documentId: DocumentId, body: unknown) {
    this.replace(documentId, body);
  }

  /** Removes a package, picture or benefit (a tombstone draft); discarding the draft brings it back. */
  remove(documentId: DocumentId) {
    this.replace(documentId, undefined);
  }

  /** Replaces a whole document body; undefined removes a package, picture or benefit. */
  replace(documentId: DocumentId, body: unknown) {
    const meta = this.metaOf(documentId);
    const status = meta.status === "conflict" ? "conflict" : "pending";
    this.update(writeDocument(this.state.content, documentId, body), documentId, { ...meta, status, messages: [], issues: [] });
    this.onDocument?.(documentId, body);
    if (status !== "conflict") this.schedule(documentId, this.delay);
  }

  /** Saves now instead of after the pause (the "save" button, leaving the page). */
  flushAll() {
    for (const [documentId, meta] of Object.entries(this.state.meta) as [DocumentId, DocMeta][]) {
      if (meta.status === "pending" || meta.status === "error" || meta.status === "invalid") this.schedule(documentId, 0);
    }
  }

  retry(documentId: DocumentId) {
    this.schedule(documentId, 0);
  }

  /** Conflict: save this editor's version over the one on the server. */
  keepMine(documentId: DocumentId) {
    const meta = this.metaOf(documentId);
    if (meta.status !== "conflict") return;
    this.setMeta(documentId, { ...meta, revision: meta.conflict?.revision ?? 0, conflict: undefined, status: "pending" });
    this.schedule(documentId, 0);
  }

  /** Conflict: drop this editor's changes and continue from the server's version. */
  takeTheirs(documentId: DocumentId) {
    const meta = this.metaOf(documentId);
    if (meta.status !== "conflict") return;
    const theirs = meta.conflict ? parseDocument(documentId, meta.conflict.body) : null;
    // A server version this editor cannot read shows as published; the next
    // save still replaces it, from its revision.
    const body = theirs?.ok ? theirs.value : this.publishedBody(documentId);
    this.update(writeDocument(this.state.content, documentId, body), documentId, {
      revision: meta.conflict?.revision ?? 0,
      saved: body,
      status: "saved",
      messages: [],
      issues: [],
      savedAt: meta.conflict?.updatedAt ?? meta.savedAt,
    });
    this.onDocument?.(documentId, body);
  }

  /** Throws away the draft of one document, so it shows the published content again. */
  async discard(documentId: DocumentId): Promise<DiscardOutcome> {
    if (this.inflight.has(documentId)) return { ok: false, reason: "error", message: "กำลังบันทึกเอกสารนี้ รอสักครู่แล้วลองอีกครั้ง" };
    this.cancel(documentId);
    const meta = this.metaOf(documentId);
    if (meta.revision > 0) {
      let outcome: DiscardOutcome;
      try {
        outcome = await this.discardAction({ documentId, expectedRevision: meta.revision });
      } catch {
        outcome = { ok: false, reason: "error", message: offline };
      }
      if (!outcome.ok) {
        const current = this.metaOf(documentId);
        if (outcome.reason === "conflict") this.setMeta(documentId, { ...current, status: "conflict", conflict: outcome.current });
        else this.setMeta(documentId, { ...current, status: "error", messages: [outcome.message] });
        return outcome;
      }
    }
    const body = this.publishedBody(documentId);
    const rest = { ...this.state.meta };
    delete rest[documentId];
    this.state = { ...this.state, content: writeDocument(this.state.content, documentId, body), meta: rest };
    this.emit();
    this.onDocument?.(documentId, body);
    return { ok: true };
  }

  /** Stops pending autosaves (the editor is closing). */
  dispose() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  private schedule(documentId: DocumentId, delay: number) {
    this.cancel(documentId);
    this.timers.set(
      documentId,
      setTimeout(() => {
        this.timers.delete(documentId);
        void this.flush(documentId);
      }, delay),
    );
  }

  private cancel(documentId: DocumentId) {
    const timer = this.timers.get(documentId);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(documentId);
  }

  private async flush(documentId: DocumentId) {
    // One save per document at a time; a later change waits for it.
    if (this.inflight.has(documentId)) return;
    const meta = this.metaOf(documentId);
    if (meta.status === "conflict" || meta.status === "saving") return;
    const body = readDocument(this.state.content, documentId);
    if (body === meta.saved) {
      if (meta.status !== "saved") this.setMeta(documentId, { ...meta, status: "saved", messages: [], issues: [] });
      return;
    }
    const checked = validateDraft(this.state.content, documentId, body === undefined ? TOMBSTONE : body);
    if (!checked.ok) {
      this.setMeta(documentId, { ...meta, status: "invalid", messages: checked.messages, issues: checked.issues });
      return;
    }

    this.inflight.add(documentId);
    this.setMeta(documentId, { ...meta, status: "saving", messages: [], issues: [] });
    let outcome: SaveOutcome;
    try {
      outcome = await this.saveAction({ documentId, expectedRevision: meta.revision, body: body === undefined ? TOMBSTONE : body });
    } catch {
      outcome = { ok: false, reason: "error", message: offline };
    } finally {
      this.inflight.delete(documentId);
    }

    const current = this.metaOf(documentId);
    const changedSince = readDocument(this.state.content, documentId) !== body;
    if (outcome.ok) {
      this.state = { ...this.state, lastSavedAt: outcome.updatedAt };
      this.setMeta(documentId, {
        revision: outcome.revision,
        saved: body,
        status: changedSince ? "pending" : "saved",
        messages: [],
        issues: [],
        savedAt: outcome.updatedAt,
      });
      if (changedSince) this.schedule(documentId, Math.min(this.delay, 300));
      // A document that was blocked by this one (a featured package that was
      // hidden, say) may be valid now: check it again.
      for (const [other, otherMeta] of Object.entries(this.state.meta) as [DocumentId, DocMeta][]) {
        if (other !== documentId && otherMeta.status === "invalid" && !this.timers.has(other)) this.schedule(other, 0);
      }
      return;
    }
    switch (outcome.reason) {
      case "conflict":
        this.setMeta(documentId, { ...current, status: "conflict", conflict: outcome.current, messages: [] });
        return;
      case "invalid":
        this.setMeta(documentId, { ...current, status: "invalid", messages: outcome.messages, issues: outcome.issues });
        return;
      default:
        this.setMeta(documentId, { ...current, status: "error", messages: [outcome.message] });
    }
  }

  private setMeta(documentId: DocumentId, meta: DocMeta) {
    this.state = { ...this.state, meta: { ...this.state.meta, [documentId]: meta } };
    this.emit();
  }

  private update(content: SiteContent, documentId: DocumentId, meta: DocMeta) {
    this.state = { ...this.state, content, meta: { ...this.state.meta, [documentId]: meta } };
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}

export type SummaryStatus = "clean" | "saved" | DocStatus;

/** One status for the toolbar: the most urgent document status wins. */
export function summarize(state: DraftState): { status: SummaryStatus; documents: DocumentId[] } {
  const order: DocStatus[] = ["conflict", "error", "invalid", "saving", "pending"];
  const entries = Object.entries(state.meta) as [DocumentId, DocMeta][];
  for (const status of order) {
    const documents = entries.filter(([, meta]) => meta.status === status).map(([documentId]) => documentId);
    if (documents.length > 0) return { status, documents };
  }
  return { status: state.lastSavedAt ? "saved" : "clean", documents: [] };
}

/** Documents that have a draft on the server or changes in this editor. */
export function draftedDocuments(state: DraftState): DocumentId[] {
  return (Object.entries(state.meta) as [DocumentId, DocMeta][])
    .filter(([, meta]) => meta.revision > 0 || meta.status !== "saved")
    .map(([documentId]) => documentId);
}
