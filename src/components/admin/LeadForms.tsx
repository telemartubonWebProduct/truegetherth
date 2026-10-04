"use client";

import { useActionState, useState } from "react";

import { anonymiseLeadAction, updateLeadAction, type LeadActionState } from "@/app/admin/(console)/leads/actions";
import { areaCheckLabels, areaChecks, leadOutcomes, leadStatuses, outcomeLabels, statusLabels } from "@/lib/leads/labels";

import { primaryButton, secondaryButton, textInput } from "./styles";

// The forms of a call-back request's page: its status and notes, and removing
// its personal data. Each posts to its Server Action, which reloads the page
// on success or says why it failed.

type LeadUpdateProps = {
  leadId: string;
  seen: string;
  status: string;
  areaCheck: string;
  outcome: string | null;
  followUp: string | null;
};

const selectClass = `${textInput} pr-8`;

export function LeadUpdateForm({ leadId, seen, status, areaCheck, outcome, followUp }: LeadUpdateProps) {
  const [state, action, pending] = useActionState<LeadActionState, FormData>(updateLeadAction, null);
  const [nextStatus, setNextStatus] = useState(status);
  return (
    <form action={action} className="grid gap-4" data-lead-update="">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="seen" value={seen} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-tm-small font-semibold">
          สถานะ
          <select name="status" className={selectClass} value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
            {leadStatuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-tm-small font-semibold">
          ผลตรวจพื้นที่
          <select name="areaCheck" className={selectClass} defaultValue={areaCheck}>
            {areaChecks.map((value) => (
              <option key={value} value={value}>
                {areaCheckLabels[value]}
              </option>
            ))}
          </select>
        </label>
        {nextStatus === "closed" ? (
          <label className="grid gap-1.5 text-tm-small font-semibold">
            ผลของคำขอ (ต้องเลือกเมื่อปิด)
            <select name="outcome" className={selectClass} defaultValue={outcome ?? ""} required>
              <option value="" disabled>
                เลือกผล
              </option>
              {leadOutcomes.map((value) => (
                <option key={value} value={value}>
                  {outcomeLabels[value]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-1.5 text-tm-small font-semibold">
          นัดติดตาม (ไม่บังคับ)
          <input type="date" name="followUp" className={textInput} defaultValue={followUp ?? ""} />
        </label>
      </div>
      <label className="grid gap-1.5 text-tm-small font-semibold">
        บันทึกการติดตาม (ไม่บังคับ)
        <textarea name="note" rows={3} maxLength={2000} className={`${textInput} py-2`} placeholder="เช่น โทรแล้วไม่รับ นัดโทรใหม่ช่วงเย็น" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={`${primaryButton} sm:w-auto`} disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </button>
        {state ? (
          <p role="alert" className="text-tm-small font-medium text-tm-danger">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

export function LeadAnonymiseForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState<LeadActionState, FormData>(anonymiseLeadAction, null);
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className={secondaryButton} onClick={() => setOpen(true)}>
        ลบข้อมูลส่วนบุคคลของคำขอนี้…
      </button>
    );
  }
  return (
    <form action={action} className="grid max-w-[36rem] gap-3 rounded-tm-control border border-tm-danger p-4" data-lead-anonymise="">
      <input type="hidden" name="leadId" value={leadId} />
      <p className="text-tm-small">
        ชื่อ เบอร์โทร พื้นที่ หมายเหตุ และบันทึกการติดตามของคำขอนี้จะถูกลบถาวร เหลือเฉพาะจังหวัด บริการ วันที่ และสถานะสำหรับรายงาน ย้อนกลับไม่ได้
      </p>
      <label className="grid gap-1.5 text-tm-small font-semibold">
        เหตุผล
        <select name="reason" className={selectClass} defaultValue="request">
          <option value="request">เจ้าของข้อมูลขอให้ลบ</option>
          <option value="spam">สแปม หรือข้อมูลปลอม</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-tm-small font-semibold">
        <input type="checkbox" name="confirm" value="yes" className="h-5 w-5 accent-tm-red" />
        ยืนยันว่าต้องการลบข้อมูลส่วนบุคคล
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={`${primaryButton} w-auto`} disabled={pending}>
          {pending ? "กำลังลบ…" : "ลบข้อมูลส่วนบุคคล"}
        </button>
        <button type="button" className={secondaryButton} onClick={() => setOpen(false)}>
          ยกเลิก
        </button>
      </div>
      {state ? (
        <p role="alert" className="text-tm-small font-medium text-tm-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
