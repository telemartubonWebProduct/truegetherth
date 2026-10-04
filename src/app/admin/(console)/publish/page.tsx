import type { Metadata } from "next";
import Link from "next/link";

import { pendingPublish, type DocumentChange } from "@/components/admin/release-diff";
import { PublishForm } from "@/components/admin/ReleaseForms";
import { pageTitle, textLink } from "@/components/admin/styles";
import { requireActiveAdmin } from "@/lib/auth/access";
import { readDrafts, DraftsUnavailableError } from "@/lib/content/drafts";
import { getPublishedFresh } from "@/lib/content/published";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "เผยแพร่" };

const kindLabel: Record<DocumentChange["kind"], string> = { new: "เพิ่มใหม่", removed: "ลบออก", changed: "แก้ไข" };

// Review before publishing (M4): every saved draft against what is live now,
// field by field, then one button that publishes exactly what is shown.
export default async function PublishPage() {
  await requireActiveAdmin("/admin/publish");
  const supabase = await createClient();
  const published = await getPublishedFresh();
  let drafts;
  try {
    drafts = await readDrafts(supabase);
  } catch (error) {
    if (error instanceof DraftsUnavailableError) {
      return <p>ฐานข้อมูลนี้ยังไม่มีตารางร่าง (migration ของ M3) จึงยังเผยแพร่ไม่ได้</p>;
    }
    throw error;
  }
  const pending = pendingPublish(published.content, drafts);
  const documents = JSON.stringify(pending.drafts.map((draft) => ({ documentId: draft.documentId, revision: draft.revision })));

  return (
    <>
      <header className="border-b border-tm-line pb-6">
        <h1 className={pageTitle}>เผยแพร่</h1>
        <p className="mt-2 max-w-[44rem] text-tm-muted">
          ตรวจความต่างระหว่างร่างกับหน้าเว็บที่แสดงอยู่ แล้วเผยแพร่ หน้าเว็บจะแสดงฉบับใหม่ในคำขอถัดไป และย้อนกลับได้จาก{" "}
          <Link href="/admin/releases" className={textLink}>
            ประวัติการเผยแพร่
          </Link>
        </p>
        <p className="mt-2 text-tm-small text-tm-muted" data-live-release={published.release ?? 0}>
          ตอนนี้หน้าเว็บแสดง: {published.release ? `ฉบับที่ ${published.release}` : "เนื้อหาตั้งต้นจากโค้ด (ยังไม่เคยเผยแพร่)"}
        </p>
      </header>

      <section aria-labelledby="changes-heading" className="mt-8">
        <h2 id="changes-heading" className="text-tm-h4 font-semibold">
          สิ่งที่จะเปลี่ยน
        </h2>
        {pending.drafts.length === 0 ? (
          <p className="mt-3 text-tm-muted">ไม่มีร่างที่รอเผยแพร่ แก้หน้าเว็บได้ที่ <Link href="/admin/editor" className={textLink}>แก้ไขหน้าเว็บ</Link></p>
        ) : (
          <ul className="mt-4 divide-y divide-tm-line border-y border-tm-line" data-publish-list="">
            {pending.drafts.map((draft) => (
              <li key={draft.documentId} className="py-3" data-document={draft.documentId}>
                <p className="font-semibold">
                  {draft.change?.label ?? draft.documentId}{" "}
                  <span className="text-tm-small font-normal text-tm-muted">({draft.change ? kindLabel[draft.change.kind] : "ร่างเหมือนหน้าเว็บอยู่แล้ว"})</span>
                </p>
                {draft.change && draft.change.fields.length > 0 ? (
                  <ul className="mt-1 grid list-disc gap-0.5 pl-5 text-tm-small text-tm-muted">
                    {draft.change.fields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pending.problems.length > 0 ? (
        <section aria-labelledby="blocked-heading" className="mt-8">
          <h2 id="blocked-heading" className="text-tm-h4 font-semibold">
            ร่างที่ยังเผยแพร่ไม่ได้ (คงเป็นร่าง)
          </h2>
          <ul className="mt-3 grid gap-2 text-tm-small">
            {pending.problems.map((problem) => (
              <li key={problem.documentId} className="rounded-tm-control bg-tm-danger-wash px-3 py-2 text-tm-danger">
                {problem.documentId}: {problem.messages.join("; ")}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pending.drafts.length > 0 ? (
        <section aria-label="เผยแพร่" className="mt-8">
          <PublishForm basedOn={published.release ?? 0} documents={documents} count={pending.drafts.length} />
        </section>
      ) : null}
    </>
  );
}
