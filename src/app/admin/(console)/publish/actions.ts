"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { pendingPublish } from "@/components/admin/release-diff";
import { getAdminAccess } from "@/lib/auth/access";
import { isDocumentId } from "@/lib/content/documents";
import { CONTENT_SCHEMA_VERSION } from "@/lib/content/draft-model";
import { readDrafts } from "@/lib/content/drafts";
import { CONTENT_TAG, getPublishedFresh } from "@/lib/content/published";
import { usableRelease } from "@/lib/content/releases";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Publishing drafts and rolling back (M4). Server Actions are public
// endpoints: each checks the input and the caller's Admin membership, runs
// with the caller's session so RLS applies, and the database function does
// the publish in one transaction. After it, updateTag makes the next request
// render the new release.

export type ActionState = { ok: false; message: string } | null;

type Json = Database["public"]["Tables"]["content_releases"]["Insert"]["content"];

const denied: ActionState = { ok: false, message: "บัญชีนี้ไม่มีสิทธิ์เผยแพร่ หรือหมดเวลาเข้าสู่ระบบ ให้เข้าสู่ระบบใหม่" };
const conflict: ActionState = { ok: false, message: "มีการเผยแพร่หรือแก้ร่างหลังจากเปิดหน้านี้ โหลดหน้าใหม่ ตรวจความต่างอีกครั้ง แล้วจึงเผยแพร่" };

const shownDocuments = z.array(z.strictObject({ documentId: z.string().max(96).refine(isDocumentId), revision: z.number().int().min(1) })).min(1).max(500);
const publishInput = z.strictObject({
  basedOn: z.coerce.number().int().min(0),
  documents: z.string().max(100_000).transform((value, context) => {
    try {
      return shownDocuments.parse(JSON.parse(value));
    } catch {
      context.addIssue({ code: "custom", message: "invalid" });
      return z.NEVER;
    }
  }),
  note: z.string().trim().max(500).optional(),
});

export async function publishAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  const parsed = publishInput.safeParse({ basedOn: form.get("basedOn"), documents: form.get("documents"), note: form.get("note") ?? undefined });
  if (!parsed.success) return { ok: false, message: "คำขอเผยแพร่ไม่ถูกต้อง โหลดหน้าใหม่แล้วลองอีกครั้ง" };
  const access = await getAdminAccess();
  if (access.status !== "active") return denied;

  const { basedOn, documents, note } = parsed.data;
  const supabase = await createClient();
  const published = await getPublishedFresh();
  if ((published.release ?? 0) !== basedOn) return conflict;

  // Publish exactly the drafts the Admin reviewed, at the revisions they saw.
  const drafts = await readDrafts(supabase);
  const shown = new Map(documents.map((entry) => [entry.documentId, entry.revision]));
  const reviewed = drafts.filter((draft) => shown.has(draft.documentId));
  if (reviewed.length !== shown.size || reviewed.some((draft) => draft.revision !== shown.get(draft.documentId))) return conflict;
  const pending = pendingPublish(published.content, reviewed);
  if (pending.problems.length > 0) return { ok: false, message: `ร่างบางเอกสารเผยแพร่ไม่ได้: ${pending.problems.map((problem) => problem.messages[0]).join("; ")}` };

  const { data, error } = await supabase.rpc("publish_content", {
    p_content: pending.content as unknown as Json,
    p_schema_version: CONTENT_SCHEMA_VERSION,
    p_based_on: basedOn,
    p_documents: documents.map((entry) => ({ document_id: entry.documentId, revision: entry.revision })) as unknown as Json,
    p_note: note || undefined,
  });
  if (error) {
    if (error.code === "PT409") return conflict;
    if (error.code === "42501") return denied;
    console.error("Publishing failed", { code: error.code });
    return { ok: false, message: "เผยแพร่ไม่สำเร็จ ลองอีกครั้ง (ถ้ายังไม่ได้ ตรวจว่า migration ของ M4 ถูก apply แล้ว)" };
  }
  updateTag(CONTENT_TAG);
  redirect(`/admin/releases?published=${data}`);
}

const rollbackInput = z.strictObject({ release: z.coerce.number().int().min(1), basedOn: z.coerce.number().int().min(0) });

export async function rollbackAction(_previous: ActionState, form: FormData): Promise<ActionState> {
  const parsed = rollbackInput.safeParse({ release: form.get("release"), basedOn: form.get("basedOn") });
  if (!parsed.success) return { ok: false, message: "คำขอไม่ถูกต้อง" };
  const access = await getAdminAccess();
  if (access.status !== "active") return denied;

  const { release, basedOn } = parsed.data;
  const supabase = await createClient();
  const { data: row, error: readError } = await supabase.from("content_releases").select("number, schema_version, content").eq("number", release).maybeSingle();
  if (readError || !row) return { ok: false, message: "ไม่พบฉบับนี้" };
  // A release made for an older version of the site would not show; refuse instead of falling back silently.
  if (!usableRelease({ number: row.number, schemaVersion: row.schema_version, content: row.content })) {
    return { ok: false, message: `ฉบับที่ ${release} ใช้รูปแบบเนื้อหาที่เว็บรุ่นนี้ไม่รองรับแล้ว ย้อนกลับไม่ได้` };
  }

  const { data, error } = await supabase.rpc("rollback_content", { p_release: release, p_based_on: basedOn, p_note: `ย้อนกลับไปฉบับที่ ${release}` });
  if (error) {
    if (error.code === "PT409") return conflict;
    if (error.code === "42501") return denied;
    console.error("Rolling back failed", { code: error.code });
    return { ok: false, message: "ย้อนกลับไม่สำเร็จ ลองอีกครั้ง" };
  }
  updateTag(CONTENT_TAG);
  redirect(`/admin/releases?published=${data}`);
}
