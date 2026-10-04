"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminAccess } from "@/lib/auth/access";
import { areaChecks, leadOutcomes, leadStatuses } from "@/lib/leads/labels";
import { createClient } from "@/lib/supabase/server";

// Working on a call-back request (M5). Server Actions are public endpoints:
// each checks its input and the caller's Admin membership, and runs with the
// caller's session; the database functions check the membership again and
// record the request's history.

export type LeadActionState = { message: string } | null;

const denied: LeadActionState = { message: "บัญชีนี้ไม่มีสิทธิ์ หรือหมดเวลาเข้าสู่ระบบ ให้เข้าสู่ระบบใหม่" };

const updateInput = z.strictObject({
  leadId: z.uuid(),
  seen: z.string().min(10).max(64),
  status: z.enum(leadStatuses),
  areaCheck: z.enum(areaChecks),
  outcome: z.union([z.enum(leadOutcomes), z.literal("")]),
  followUp: z.union([z.iso.date(), z.literal("")]),
  note: z.string().trim().max(2000),
});

export async function updateLeadAction(_previous: LeadActionState, form: FormData): Promise<LeadActionState> {
  const parsed = updateInput.safeParse({
    leadId: form.get("leadId"),
    seen: form.get("seen"),
    status: form.get("status"),
    areaCheck: form.get("areaCheck"),
    outcome: form.get("outcome") ?? "",
    followUp: form.get("followUp") ?? "",
    note: form.get("note") ?? "",
  });
  if (!parsed.success) return { message: "ข้อมูลไม่ถูกต้อง โหลดหน้าใหม่แล้วลองอีกครั้ง" };
  const input = parsed.data;
  if (input.status === "closed" && !input.outcome) return { message: "ปิดคำขอต้องเลือกผลของคำขอ" };
  const access = await getAdminAccess();
  if (access.status !== "active") return denied;

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_lead", {
    p_lead: input.leadId,
    p_seen_updated_at: input.seen,
    p_status: input.status,
    p_area_check: input.areaCheck,
    p_outcome: input.status === "closed" ? input.outcome : undefined,
    p_follow_up_on: input.followUp || undefined,
    p_note: input.note || undefined,
  });
  if (error) {
    if (error.code === "PT409") return { message: "มีคนแก้คำขอนี้หลังจากเปิดหน้านี้ โหลดหน้าใหม่ ดูประวัติ แล้วลองอีกครั้ง" };
    if (error.code === "PT410") return { message: "คำขอนี้ถูกลบข้อมูลส่วนบุคคลแล้ว แก้ไม่ได้" };
    if (error.code === "42501") return denied;
    console.error("Updating a call-back request failed", { code: error.code });
    return { message: "บันทึกไม่สำเร็จ ลองอีกครั้ง (ถ้ายังไม่ได้ ตรวจว่า migration ของ M5 ถูก apply แล้ว)" };
  }
  redirect(`/admin/leads/${input.leadId}?saved=1`);
}

const anonymiseInput = z.strictObject({ leadId: z.uuid(), reason: z.enum(["request", "spam"]), confirm: z.literal("yes") });

export async function anonymiseLeadAction(_previous: LeadActionState, form: FormData): Promise<LeadActionState> {
  const parsed = anonymiseInput.safeParse({ leadId: form.get("leadId"), reason: form.get("reason"), confirm: form.get("confirm") });
  if (!parsed.success) return { message: "เลือกเหตุผล และติ๊กยืนยันก่อนลบข้อมูล" };
  const access = await getAdminAccess();
  if (access.status !== "active") return denied;

  const supabase = await createClient();
  const { error } = await supabase.rpc("anonymise_lead", { p_lead: parsed.data.leadId, p_reason: parsed.data.reason });
  if (error) {
    if (error.code === "42501") return denied;
    if (error.code === "P0002") return { message: "คำขอนี้ไม่มีข้อมูลส่วนบุคคลให้ลบแล้ว" };
    console.error("Anonymising a call-back request failed", { code: error.code });
    return { message: "ลบข้อมูลไม่สำเร็จ ลองอีกครั้ง" };
  }
  redirect(`/admin/leads/${parsed.data.leadId}?anonymised=1`);
}
