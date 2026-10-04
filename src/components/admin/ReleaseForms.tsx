"use client";

import { useActionState, useState } from "react";

import { publishAction, rollbackAction, type ActionState } from "@/app/admin/(console)/publish/actions";

import { primaryButton, secondaryButton, textInput } from "./styles";

// The buttons of the publish and history pages. Each posts to its Server
// Action, which redirects to the history on success or returns why it failed.

export function PublishForm({ basedOn, documents, count }: { basedOn: number; documents: string; count: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(publishAction, null);
  return (
    <form action={action} className="grid max-w-[36rem] gap-3">
      <input type="hidden" name="basedOn" value={basedOn} />
      <input type="hidden" name="documents" value={documents} />
      <label className="grid gap-1.5 text-tm-small font-semibold">
        บันทึกสั้นๆ ว่าเผยแพร่อะไร (ไม่บังคับ)
        <input name="note" maxLength={500} className={textInput} placeholder="เช่น ปรับราคาแพ็กเกจ 1 Gbps" />
      </label>
      <button type="submit" className={`${primaryButton} sm:w-auto`} disabled={pending}>
        {pending ? "กำลังเผยแพร่…" : `เผยแพร่ ${count} เอกสาร`}
      </button>
      {state ? (
        <p role="alert" className="rounded-tm-control bg-tm-danger-wash px-3 py-2 text-tm-small text-tm-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function RollbackForm({ release, basedOn }: { release: number; basedOn: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(rollbackAction, null);
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <button type="button" className={secondaryButton} onClick={() => setConfirming(true)}>
        ย้อนกลับไปฉบับที่ {release}
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="release" value={release} />
      <input type="hidden" name="basedOn" value={basedOn} />
      <span className="text-tm-small">หน้าเว็บจะกลับเป็นฉบับที่ {release} ทันที (ร่างที่ค้างอยู่ไม่ถูกแตะ)</span>
      <button type="submit" className={`${primaryButton} w-auto`} disabled={pending}>
        {pending ? "กำลังย้อนกลับ…" : "ยืนยันย้อนกลับ"}
      </button>
      <button type="button" className={secondaryButton} onClick={() => setConfirming(false)}>
        ยกเลิก
      </button>
      {state ? (
        <p role="alert" className="w-full text-tm-small text-tm-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
