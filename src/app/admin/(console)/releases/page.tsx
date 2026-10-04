import type { Metadata } from "next";
import Link from "next/link";

import { changesBetween } from "@/components/admin/release-diff";
import { RollbackForm } from "@/components/admin/ReleaseForms";
import { pageTitle, textLink } from "@/components/admin/styles";
import { requireActiveAdmin } from "@/lib/auth/access";
import { getPublishedFresh } from "@/lib/content/published";
import { usableRelease } from "@/lib/content/releases";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "ประวัติการเผยแพร่" };

const dateTime = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" });

// Every publish and rollback (M4): who, when, the note, and what a release
// differs in from the live one; any release that still fits the site can be
// put back live (a new release, so the history is never rewritten).
export default async function ReleasesPage({ searchParams }: PageProps<"/admin/releases">) {
  await requireActiveAdmin("/admin/releases");
  const { published: justPublished, compare } = await searchParams;
  const supabase = await createClient();
  const live = await getPublishedFresh();
  const { data: releases, error } = await supabase
    .from("content_releases")
    .select("number, kind, restored_from, note, created_by_email, created_at")
    .order("number", { ascending: false })
    .limit(100);

  const compareNumber = typeof compare === "string" ? Number(compare) : NaN;
  let comparison: { number: number; changes: ReturnType<typeof changesBetween>; usable: boolean } | null = null;
  if (Number.isInteger(compareNumber) && compareNumber > 0) {
    const { data: row } = await supabase.from("content_releases").select("number, schema_version, content").eq("number", compareNumber).maybeSingle();
    if (row) {
      const content = usableRelease({ number: row.number, schemaVersion: row.schema_version, content: row.content });
      comparison = { number: row.number, changes: content ? changesBetween(live.content, content) : [], usable: content !== null };
    }
  }

  return (
    <>
      <header className="border-b border-tm-line pb-6">
        <h1 className={pageTitle}>ประวัติการเผยแพร่</h1>
        <p className="mt-2 text-tm-muted">
          หน้าเว็บแสดง: {live.release ? `ฉบับที่ ${live.release}` : "เนื้อหาตั้งต้นจากโค้ด (ยังไม่เคยเผยแพร่)"} ·{" "}
          <Link href="/admin/publish" className={textLink}>
            เผยแพร่ร่าง
          </Link>
        </p>
        {typeof justPublished === "string" ? (
          <p role="status" className="mt-4 rounded-tm-control bg-tm-success-wash px-3 py-2 text-tm-small text-tm-success">
            เผยแพร่ฉบับที่ {justPublished} แล้ว หน้าเว็บแสดงฉบับนี้ตั้งแต่คำขอถัดไป
          </p>
        ) : null}
      </header>

      {error ? (
        <p className="mt-6 text-tm-danger">อ่านประวัติไม่ได้: ตรวจว่า migration ของ M4 ถูก apply แล้ว</p>
      ) : (releases ?? []).length === 0 ? (
        <p className="mt-6 text-tm-muted">ยังไม่เคยเผยแพร่</p>
      ) : (
        <ol className="mt-6 divide-y divide-tm-line border-y border-tm-line" data-release-list="">
          {(releases ?? []).map((release) => {
            const current = release.number === live.release;
            return (
              <li key={release.number} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" data-release={release.number}>
                <div>
                  <p className="font-semibold">
                    ฉบับที่ {release.number}{" "}
                    <span className="text-tm-small font-normal text-tm-muted">
                      {release.kind === "rollback" ? `ย้อนกลับไปฉบับที่ ${release.restored_from}` : "เผยแพร่"}
                    </span>
                    {current ? <span className="ml-2 rounded-tm-pill bg-tm-ink px-2 py-0.5 text-tm-caption text-tm-on-ink">แสดงอยู่</span> : null}
                  </p>
                  <p className="text-tm-small text-tm-muted">
                    {dateTime.format(new Date(release.created_at))} · {release.created_by_email ?? "ระบบ"}
                    {release.note ? ` · ${release.note}` : ""}
                  </p>
                  {!current ? (
                    <Link href={`/admin/releases?compare=${release.number}`} className={`${textLink} text-tm-small`}>
                      ต่างจากที่แสดงอยู่อย่างไร
                    </Link>
                  ) : null}
                </div>
                {!current ? <RollbackForm release={release.number} basedOn={live.release ?? 0} /> : null}
              </li>
            );
          })}
        </ol>
      )}

      {comparison ? (
        <section aria-labelledby="compare-heading" className="mt-8">
          <h2 id="compare-heading" className="text-tm-h4 font-semibold">
            ถ้าย้อนกลับไปฉบับที่ {comparison.number} จะเปลี่ยน
          </h2>
          {!comparison.usable ? (
            <p className="mt-2 text-tm-danger">ฉบับนี้ใช้รูปแบบเนื้อหาที่เว็บรุ่นนี้ไม่รองรับแล้ว</p>
          ) : comparison.changes.length === 0 ? (
            <p className="mt-2 text-tm-muted">เหมือนฉบับที่แสดงอยู่</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {comparison.changes.map((change) => (
                <li key={change.documentId}>
                  <p className="font-medium">{change.label}</p>
                  {change.fields.length > 0 ? <p className="text-tm-small text-tm-muted">{change.fields.join(" · ")}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}
