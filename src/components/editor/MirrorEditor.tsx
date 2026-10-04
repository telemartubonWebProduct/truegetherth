"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { discardDraftAction, saveDraftAction } from "@/app/admin/(editor)/editor/actions";
import { uploadMediaAction } from "@/app/admin/(editor)/editor/media-actions";
import { pageDocumentIds, TOMBSTONE, type DocumentId, type PageDocumentId } from "@/lib/content/documents";
import type { DraftProblem } from "@/lib/content/draft-model";
import type { SiteContent } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";

import { draftedDocuments, DraftStore, summarize, type DraftRevision } from "./draft-store";
import { FieldPanel, type Selection } from "./FieldPanel";
import { smallButton } from "./fields";
import { documentLabel, pageLabels } from "./labels";
import { MediaPicker } from "./MediaPicker";
import { previewPath, toEditor, type ToPreview } from "./protocol";

// The Mirror editor (ARCHITECTURE.md §3): the real page in a frame at a real
// device width, a panel with the fields of whatever is clicked, and autosaved
// drafts. Visitors never see drafts; publishing is M4.

type Viewport = "desktop" | "tablet" | "mobile";

const viewports: Record<Viewport, { width: number; label: string }> = {
  desktop: { width: 1280, label: "เดสก์ท็อป" },
  tablet: { width: 834, label: "แท็บเล็ต" },
  mobile: { width: 390, label: "มือถือ" },
};

const localeNames: Record<Locale, string> = { th: "ไทย", en: "English" };

type MirrorEditorProps = {
  published: SiteContent;
  working: SiteContent;
  drafts: DraftRevision[];
  problems: DraftProblem[];
  /** False when the database has no drafts table yet (M3 migration not applied). */
  draftsAvailable: boolean;
  initialPage: PageDocumentId;
  initialLocale: Locale;
  channel: string;
};

const summaryText = {
  clean: "ยังไม่มีการแก้ไขในรอบนี้",
  saved: "บันทึกแล้ว",
  pending: "มีการแก้ไข",
  saving: "กำลังบันทึก…",
  invalid: "มีช่องที่ต้องแก้ก่อนบันทึก",
  error: "บันทึกไม่สำเร็จ",
  conflict: "มีคนแก้พร้อมกัน",
} as const;

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-tm-control border border-white/25 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className="min-h-8 rounded-[4px] px-2.5 text-tm-caption font-semibold text-white/80 hover:text-white aria-pressed:bg-white aria-pressed:text-tm-ink"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function MirrorEditor({ published, working, drafts, problems, draftsAvailable, initialPage, initialLocale, channel }: MirrorEditorProps) {
  const [store] = useState(() => new DraftStore({ published, working, drafts, save: saveDraftAction, discard: discardDraftAction }));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [pageId, setPageId] = useState(initialPage);
  const [locale, setLocale] = useState(initialLocale);
  const [edit, setEdit] = useState(true);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [selection, setSelection] = useState<Selection>({ binding: `page:${initialPage}`, from: "panel", seq: 0 });
  const [readyCount, setReadyCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ current: string | undefined; onPick: (id: string) => void } | null>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // The frame loads once; pages and languages then switch by message.
  const [frameSrc] = useState(() => previewPath(initialPage, initialLocale, channel));

  const send = useCallback((message: ToPreview) => {
    frameRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const select = useCallback((binding: string, from: Selection["from"] = "panel") => {
    setSelection((current) => ({ binding, from, seq: current.seq + 1 }));
  }, []);

  const openPage = useCallback((next: PageDocumentId, nextLocale: Locale) => {
    setPageId(next);
    setLocale(nextLocale);
    setSelection((current) => ({ binding: `page:${next}`, from: "panel", seq: current.seq + 1 }));
  }, []);

  // Messages from the preview frame.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      const parsed = toEditor.safeParse(event.data);
      if (!parsed.success || parsed.data.channel !== channel) return;
      const message = parsed.data;
      switch (message.type) {
        case "ready":
          setReadyCount((count) => count + 1);
          break;
        case "select":
          select(message.binding, "preview");
          break;
        case "navigate":
          openPage(message.pageId, message.locale);
          break;
        case "link":
          setNotice(`ลิงก์นี้พาไปที่ ${message.href} (หน้าตัวอย่างไม่เปิดลิงก์ออกนอกเว็บ ไม่โทรและไม่เปิด LINE จริง)`);
          break;
        case "render-error":
          setNotice(`ตัวอย่างแสดงเนื้อหาที่แก้อยู่ไม่ได้: ${message.message}`);
          break;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [channel, select, openPage]);

  // Every edit goes to the preview at once.
  useEffect(
    () => store.watchDocuments((documentId, body) => send({ type: "document", channel, documentId, body: body === undefined ? TOMBSTONE : body })),
    [store, send, channel],
  );

  // A (re)loaded preview gets the working content, then what to show.
  useEffect(() => {
    if (readyCount === 0) return;
    send({ type: "content", channel, content: store.getSnapshot().content });
  }, [readyCount, send, channel, store]);

  useEffect(() => {
    if (readyCount === 0) return;
    send({ type: "view", channel, pageId, locale, edit });
  }, [readyCount, send, channel, pageId, locale, edit]);

  useEffect(() => {
    if (readyCount === 0) return;
    send({ type: "select", channel, binding: selection.binding, scroll: selection.from === "panel" });
  }, [readyCount, send, channel, selection]);

  // The address keeps the page and language, so a reload reopens them.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", pageId);
    url.searchParams.set("locale", locale);
    window.history.replaceState(window.history.state, "", url);
  }, [pageId, locale]);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setStage({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element);
    const onFullscreen = () => setFullscreen(document.fullscreenElement === element);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, []);

  // Unsaved work is saved, or the Admin is warned, before the page goes away.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!store.hasUnsaved()) return;
      store.flushAll();
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      store.flushAll();
    };
  }, [store]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const pickMedia = useCallback((current: string | undefined, onPick: (id: string) => void) => setPicker({ current, onPick }), []);

  const summary = summarize(state);
  const drafted = draftedDocuments(state);
  const { width } = viewports[viewport];
  const gap = 24;
  const scale = stage.width > 0 ? Math.min(1, (stage.width - gap * 2) / width) : 1;
  const frameHeight = stage.height > 0 ? Math.max(480, (stage.height - gap * 2) / scale) : 800;
  const statusTone =
    summary.status === "conflict" || summary.status === "error"
      ? "bg-tm-danger text-tm-on-red"
      : summary.status === "invalid"
        ? "bg-[#fef3c7] text-[#78350f]"
        : summary.status === "saved"
          ? "bg-tm-success-wash text-tm-success"
          : "bg-white/15 text-white";

  return (
    <div className="flex h-dvh flex-col bg-tm-surface">
      <header className="tm-on-ink flex flex-wrap items-center gap-x-4 gap-y-2 bg-tm-ink px-4 py-2 text-tm-on-ink">
        <Link
          href="/admin"
          className="text-tm-small font-semibold text-white/80 hover:text-white"
          onClick={(event) => {
            if (store.hasUnsaved() && !window.confirm("มีการแก้ไขที่ยังไม่ได้บันทึก ออกจากหน้านี้หรือไม่?")) event.preventDefault();
          }}
        >
          ‹ หลังบ้าน
        </Link>
        <h1 className="text-tm-small font-semibold">แก้ไขหน้าเว็บ</h1>
        <label className="flex items-center gap-2 text-tm-caption text-white/80">
          หน้า
          <select
            value={pageId}
            onChange={(event) => openPage(event.target.value as PageDocumentId, locale)}
            className="min-h-8 rounded-tm-control border border-white/25 bg-tm-ink px-2 text-tm-small text-white"
          >
            {pageDocumentIds.map((id) => (
              <option key={id} value={id}>
                {pageLabels[id]}
              </option>
            ))}
          </select>
        </label>
        <Toggle label="ภาษาของตัวอย่าง" value={locale} onChange={setLocale} options={(["th", "en"] as const).map((value) => ({ value, label: localeNames[value] }))} />
        <Toggle
          label="ขนาดจอ"
          value={viewport}
          onChange={setViewport}
          options={(Object.keys(viewports) as Viewport[]).map((value) => ({ value, label: viewports[value].label }))}
        />
        <span className="text-tm-caption text-white/60" aria-live="polite">
          {width}px{scale < 1 ? ` · ย่อ ${Math.round(scale * 100)}%` : ""}
        </span>
        <button
          type="button"
          className="min-h-8 rounded-tm-control border border-white/25 px-2.5 text-tm-caption font-semibold hover:border-white"
          onClick={() => stageRef.current?.requestFullscreen()}
        >
          เต็มจอ
        </button>
        <Toggle
          label="โหมด"
          value={edit ? "edit" : "view"}
          onChange={(value) => setEdit(value === "edit")}
          options={[
            { value: "edit", label: "แก้ไข" },
            { value: "view", label: "ดูหน้าเว็บ" },
          ]}
        />
        <button type="button" className="min-h-8 rounded-tm-control border border-white/25 px-2.5 text-tm-caption font-semibold hover:border-white" onClick={() => select("site")}>
          ตั้งค่าทั้งเว็บ
        </button>
        <button type="button" className="min-h-8 rounded-tm-control border border-white/25 px-2.5 text-tm-caption font-semibold hover:border-white" onClick={() => select("catalog")}>
          แพ็กเกจและสิทธิประโยชน์
        </button>
        {/* Review and publish the saved drafts (M4); waiting edits save first. */}
        <Link
          href="/admin/publish"
          onClick={() => store.flushAll()}
          className="min-h-8 rounded-tm-control bg-tm-red px-2.5 py-1.5 text-tm-caption font-semibold text-tm-on-red hover:bg-tm-red-press"
        >
          เผยแพร่…
        </Link>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <p role="status" aria-live="polite" data-save-status={summary.status} className={`rounded-tm-pill px-3 py-1 text-tm-caption font-semibold ${statusTone}`}>
            {summary.status === "clean" ? (drafted.length > 0 ? "ร่างบันทึกไว้แล้ว" : "ตรงกับฉบับที่เผยแพร่") : summaryText[summary.status]}
            {summary.status === "saved" && state.lastSavedAt
              ? ` ${new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(state.lastSavedAt))} น.`
              : ""}
          </p>
          {summary.documents.length > 0 && summary.status !== "saving" && summary.status !== "pending" ? (
            <button type="button" className="text-tm-caption font-semibold underline" onClick={() => select(summary.documents[0])}>
              ดู {documentLabel(state.content, summary.documents[0])}
            </button>
          ) : null}
          <details className="relative">
            <summary className="min-h-8 cursor-pointer list-none rounded-tm-control border border-white/25 px-2.5 py-1 text-tm-caption font-semibold hover:border-white">
              ร่างที่ยังไม่เผยแพร่ ({drafted.length})
            </summary>
            <div className="absolute right-0 top-full z-20 mt-2 w-[22rem] rounded-tm-panel border border-tm-line bg-tm-canvas p-3 text-tm-ink shadow-lg">
              {drafted.length === 0 ? (
                <p className="text-tm-small text-tm-muted">ทุกหน้าตรงกับฉบับที่เผยแพร่</p>
              ) : (
                <ul className="grid gap-1">
                  {drafted.map((documentId: DocumentId) => (
                    <li key={documentId}>
                      <button type="button" className="w-full rounded-tm-control px-2 py-1.5 text-left text-tm-small hover:bg-tm-surface" onClick={() => select(documentId)}>
                        {documentLabel(state.content, documentId)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 border-t border-tm-line pt-2 text-tm-caption text-tm-muted">
                ร่างเก็บในระบบและเห็นเฉพาะผู้ดูแล หน้าเว็บจริงยังแสดงฉบับเดิม การเผยแพร่จะเปิดใน M4
              </p>
            </div>
          </details>
        </div>
      </header>

      {draftsAvailable ? null : (
        <div role="alert" className="border-b border-tm-danger bg-tm-danger-wash px-4 py-2 text-tm-caption text-tm-danger">
          ฐานข้อมูลนี้ยังไม่มีตารางร่างของ M3 จึงยังบันทึกไม่ได้ (ลองแก้ในตัวอย่างได้ แต่จะไม่ถูกเก็บ): ให้ผู้ดูแลระบบ apply migration{" "}
          <code>20260930160641_content_drafts.sql</code> ด้วย <code>npm run db:push:dev:apply</code> แล้วรีโหลดหน้านี้
        </div>
      )}
      {problems.length > 0 ? (
        <div role="alert" className="border-b border-[#f59e0b] bg-[#fef3c7] px-4 py-2 text-tm-caption text-[#78350f]">
          ร่างบางเอกสารใช้ไม่ได้และถูกข้ามไป (แสดงฉบับที่เผยแพร่แทน):{" "}
          {problems.map((problem) => `${problem.documentId} — ${problem.messages[0] ?? ""}`).join(" · ")}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div ref={stageRef} className="relative min-h-[60dvh] flex-1 overflow-hidden bg-[#d4d4d8] lg:min-h-0">
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: gap, width: width * scale, height: frameHeight * scale }}>
            <iframe
              ref={frameRef}
              src={frameSrc}
              title={`ตัวอย่างหน้า ${pageLabels[pageId]} (${localeNames[locale]}, ${viewports[viewport].label})`}
              className="block origin-top-left border-0 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.18)]"
              style={{ width, height: frameHeight, transform: `scale(${scale})` }}
            />
          </div>
          {readyCount === 0 ? (
            <p className="absolute inset-x-0 top-1/3 text-center text-tm-small text-tm-muted" role="status">
              กำลังเปิดตัวอย่าง…
            </p>
          ) : null}
          {fullscreen ? (
            <button
              type="button"
              className="absolute right-3 top-3 rounded-tm-pill bg-black/70 px-3 py-1 text-tm-caption font-semibold text-white hover:bg-black"
              onClick={() => document.exitFullscreen()}
            >
              ออกจากเต็มจอ
            </button>
          ) : null}
          {notice ? (
            <p role="status" className="absolute inset-x-4 bottom-4 mx-auto max-w-[40rem] rounded-tm-panel bg-tm-ink px-4 py-3 text-tm-small text-tm-on-ink shadow-lg">
              {notice}
              <button type="button" className="ml-3 underline" onClick={() => setNotice(null)}>
                ปิด
              </button>
            </p>
          ) : null}
        </div>

        <aside aria-label="แก้ไขเนื้อหา" className="min-h-0 overflow-y-auto border-l border-tm-line bg-tm-canvas p-4 lg:w-[26rem] lg:shrink-0">
          {edit ? null : (
            <p className="mb-3 rounded-tm-control bg-tm-surface px-3 py-2 text-tm-caption text-tm-muted">
              โหมดดูหน้าเว็บ: กดลิงก์ในตัวอย่างเพื่อเปลี่ยนหน้า สลับเป็น “แก้ไข” เพื่อคลิกเลือกช่องบนหน้า
            </p>
          )}
          <FieldPanel state={state} store={store} published={published} selection={selection} onSelect={select} locale={locale} pickMedia={pickMedia} />
          <div className="mt-6 border-t border-tm-line pt-3">
            <button type="button" className={smallButton} onClick={() => store.flushAll()} disabled={summary.status !== "pending" && summary.status !== "error"}>
              บันทึกตอนนี้
            </button>
          </div>
        </aside>
      </div>

      {picker ? (
        <MediaPicker
          content={state.content}
          current={picker.current}
          onPick={picker.onPick}
          onClose={() => setPicker(null)}
          onUpload={async (form) => {
            const outcome = await uploadMediaAction(form);
            // The new picture joins the library as a draft, saved and checked like any edit.
            if (outcome.ok) store.create(`media:${outcome.id}`, outcome.asset);
            return outcome;
          }}
        />
      ) : null}
    </div>
  );
}
