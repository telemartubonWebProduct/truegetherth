"use server";

import { z } from "zod";

import { getAdminAccess } from "@/lib/auth/access";
import { isDocumentId, type DocumentId } from "@/lib/content/documents";
import { discardDraft, saveDraft, type DiscardOutcome, type SaveOutcome } from "@/lib/content/drafts";
import { getPublishedContent } from "@/lib/content/published";
import { createClient } from "@/lib/supabase/server";

// Autosave and discard for the Mirror editor. Server Actions are public
// endpoints: each call checks the input, then the caller's Admin membership,
// and runs the write with the caller's session so RLS applies as well.

const documentId = z.string().max(96).refine(isDocumentId);
const revision = z.number().int().min(0).max(2_147_483_647);

const saveInput = z.strictObject({ documentId, expectedRevision: revision, body: z.unknown() });
const discardInput = z.strictObject({ documentId, expectedRevision: revision.min(1) });

const denied = {
  ok: false,
  reason: "denied",
  message: "บัญชีนี้ไม่มีสิทธิ์แก้ไขเนื้อหา หรือหมดเวลาเข้าสู่ระบบ ให้เข้าสู่ระบบใหม่",
} as const;
const failed = { ok: false, reason: "error", message: "บันทึกไม่สำเร็จ ลองอีกครั้ง" } as const;

export async function saveDraftAction(input: { documentId: string; expectedRevision: number; body: unknown }): Promise<SaveOutcome> {
  const parsed = saveInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid", messages: ["คำขอบันทึกไม่ถูกต้อง"], issues: [] };
  const access = await getAdminAccess();
  if (access.status !== "active") return denied;
  try {
    const supabase = await createClient();
    return await saveDraft(supabase, await getPublishedContent(), parsed.data.documentId as DocumentId, parsed.data.expectedRevision, parsed.data.body);
  } catch (error) {
    console.error("Saving a draft failed", { documentId: parsed.data.documentId, error: error instanceof Error ? error.message : "unknown" });
    return failed;
  }
}

export async function discardDraftAction(input: { documentId: string; expectedRevision: number }): Promise<DiscardOutcome> {
  const parsed = discardInput.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "error", message: "คำขอไม่ถูกต้อง" };
  const access = await getAdminAccess();
  if (access.status !== "active") return denied;
  try {
    const supabase = await createClient();
    return await discardDraft(supabase, parsed.data.documentId as DocumentId, parsed.data.expectedRevision);
  } catch (error) {
    console.error("Discarding a draft failed", { documentId: parsed.data.documentId, error: error instanceof Error ? error.message : "unknown" });
    return failed;
  }
}
