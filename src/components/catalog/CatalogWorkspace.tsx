"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { discardDraftAction, saveDraftAction } from "@/app/admin/(editor)/editor/actions";
import { uploadMediaAction } from "@/app/admin/(editor)/editor/media-actions";
import { pageTitle } from "@/components/admin/styles";
import { draftedDocuments, DraftStore, summarize, type DraftRevision } from "@/components/editor/draft-store";
import { inputClass, LocalizedField, MediaField, smallButton, type FieldContext } from "@/components/editor/fields";
import { documentLabel, pageLabels } from "@/components/editor/labels";
import { MediaPicker } from "@/components/editor/MediaPicker";
import { benefitUsage } from "@/components/editor/usage";
import { todayInThailand } from "@/lib/content/dates";
import type { DocumentId } from "@/lib/content/documents";
import type { DraftProblem } from "@/lib/content/draft-model";
import { isShown } from "@/lib/content/lookup";
import { formatNumber } from "@/lib/content/render";
import type { CatalogPackage, CategoryId, LocalizedText, SiteContent } from "@/lib/content/schema";

import {
  blankPackage,
  catalogOrderOf,
  categories,
  copyName,
  copyOf,
  featuredMoved,
  featuredWith,
  groupsIn,
  orderIntoGroup,
  orderWithin,
  packageIdFor,
  packagesIn,
  pageOf,
  uniqueId,
  withGroupAdded,
  withGroupMoved,
  withGroupRemoved,
  withGroupRenamed,
  type GroupEntry,
} from "./catalog-edit";
import { PackageForm } from "./PackageForm";

// "Packages and promos" (docs/renovation/R7-CATALOG.md): the catalog as lists
// an Admin adds to, edits, copies, moves and removes from, apart from the
// Mirror editor, which keeps to the words and pictures of each page. What ties
// the two together is the group: a package shows on the page that lists its
// group, and a package recommended here gets a card on the home page. Every
// change is an ordinary draft (a package, a package page, or the catalog's
// order), saved by the same store as the editor's and published the same way.

type CatalogWorkspaceProps = {
  published: SiteContent;
  working: SiteContent;
  drafts: DraftRevision[];
  problems: DraftProblem[];
  draftsAvailable: boolean;
  /** A package to open at once (the Mirror editor's link to one). */
  initialPackage?: string;
};

type View = { kind: "category"; category: CategoryId } | { kind: "featured" } | { kind: "benefits" };
type Filter = "all" | "shown" | "hidden" | "unverified";
/** A package about to be made, waiting for its name: a new one in a group, or a copy of another. */
type Naming = ({ mode: "add"; entry: GroupEntry } | { mode: "copy"; item: CatalogPackage }) & { name: LocalizedText };

const summaryText = {
  clean: "ยังไม่มีการแก้ไขในรอบนี้",
  saved: "บันทึกแล้ว",
  pending: "มีการแก้ไข",
  saving: "กำลังบันทึก…",
  invalid: "มีช่องที่ต้องแก้ก่อนบันทึก",
  error: "บันทึกไม่สำเร็จ",
  conflict: "มีคนแก้พร้อมกัน",
} as const;

const emptyText: LocalizedText = { th: "", en: "" };

/** How a package stands with visitors today, in a few words. */
function standing(item: CatalogPackage, today: string): { text: string; tone: string } {
  if (item.review.status === "hidden") return { text: "ซ่อน", tone: "bg-tm-surface text-tm-muted" };
  if (item.showFrom !== undefined && today < item.showFrom) return { text: `รอแสดง ${item.showFrom}`, tone: "bg-tm-surface text-tm-muted" };
  if (item.showUntil !== undefined && item.showUntil < today) return { text: "พ้นช่วงแสดง", tone: "bg-tm-surface text-tm-muted" };
  return item.review.status === "verified" ? { text: "แสดง · ยืนยันแล้ว", tone: "bg-tm-success-wash text-tm-success" } : { text: "แสดง · ยังไม่ยืนยัน", tone: "bg-[#fef3c7] text-[#78350f]" };
}

function Thumb({ content, id }: { content: SiteContent; id: string | undefined }) {
  const asset = id ? content.media[id] : undefined;
  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-tm-control bg-tm-surface">
      {asset ? <Image src={asset.src} alt="" fill sizes="40px" className="object-cover" /> : null}
    </span>
  );
}

/** Two boxes for a name in Thai and English, with the buttons that keep or drop it. */
function NameForm({ title, value, onChange, children }: { title: string; value: LocalizedText; onChange: (value: LocalizedText) => void; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-tm-control border border-tm-line bg-tm-canvas p-3">
      <p className="text-tm-small font-semibold">{title}</p>
      <LocalizedField value={value} onChange={onChange} issues={[]} locale="th" label={title} />
      {children}
    </div>
  );
}

export function CatalogWorkspace({ published, working, drafts, problems, draftsAvailable, initialPackage }: CatalogWorkspaceProps) {
  const [store] = useState(() => new DraftStore({ published, working, drafts, save: saveDraftAction, discard: discardDraftAction }));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const content = state.content;
  const today = useMemo(() => todayInThailand(), []);

  const opened = initialPackage ? working.catalog.find((item) => item.id === initialPackage) : undefined;
  const [view, setView] = useState<View>({ kind: "category", category: opened?.category ?? "broadband-new" });
  const [group, setGroup] = useState<string | null>(opened?.group ?? null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(opened?.id ?? null);
  const [benefitId, setBenefitId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ current: string | undefined; onPick: (id: string) => void } | null>(null);
  const [naming, setNaming] = useState<Naming | null>(null);
  const [groupForm, setGroupForm] = useState<{ mode: "add"; name: LocalizedText; where: string; heading: LocalizedText } | { mode: "rename"; group: string; name: LocalizedText } | null>(null);

  const pickMedia = useCallback((current: string | undefined, onPick: (id: string) => void) => setPicker({ current, onPick }), []);
  // The content as the store has it this instant: a handler that makes two changes reads it again in between.
  const now = () => store.getSnapshot().content;

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

  const summary = summarize(state);
  const drafted = draftedDocuments(state);
  const featured = new Set(content.featured);
  const troubled = (Object.entries(state.meta) as [DocumentId, NonNullable<(typeof state.meta)[DocumentId]>][]).filter(([, meta]) => meta.status === "invalid" || meta.status === "error" || meta.status === "conflict");

  // Packages ------------------------------------------------------------------------

  const exists = (id: string) => now().catalog.some((item) => item.id === id) || published.catalog.some((item) => item.id === id);

  const setFeatured = (item: CatalogPackage, on: boolean) => {
    const apply = () => store.replace("catalog", { ...catalogOrderOf(now()), featured: featuredWith(now(), item.id, on) });
    if (on && item.image === undefined) {
      // A card needs a picture: choose one, then recommend.
      pickMedia(undefined, (image) => {
        store.edit(`package:${item.id}`, ["image"], image);
        apply();
      });
      return;
    }
    apply();
  };

  // A new package and a copy are named first: the English name gives the package its address, which stays.
  const addPackage = (entry: GroupEntry) => setNaming({ mode: "add", entry, name: emptyText });
  const copyPackage = (item: CatalogPackage) => setNaming({ mode: "copy", item, name: copyName(item) });
  const idFor = (pending: Naming) => packageIdFor(exists, pending.name.en, pending.mode === "add" ? `${pending.entry.group}-new` : `${pending.item.id}-copy`);

  const createNamed = () => {
    if (!naming) return;
    const name = { th: naming.name.th.trim(), en: naming.name.en.trim() };
    const id = idFor(naming);
    if (naming.mode === "add") {
      const { entry } = naming;
      const siblings = packagesIn(now(), entry.category, entry.group);
      store.create(`package:${id}`, blankPackage(id, entry.category, entry.group, siblings[0]?.price.per ?? "month", name));
      store.replace("catalog", { ...catalogOrderOf(now()), order: orderIntoGroup(now(), id, entry.category, entry.group) });
    } else {
      const { item } = naming;
      store.create(`package:${id}`, copyOf(item, id, name));
      store.replace("catalog", { ...catalogOrderOf(now()), order: orderIntoGroup(now(), id, item.category, item.group, item.id) });
      setNotice(`ทำสำเนา “${item.name.th}” แล้ว: สำเนาเริ่มแบบซ่อน ตรวจราคาและเงื่อนไขก่อนเปลี่ยนเป็นแสดง`);
    }
    setNaming(null);
    setEditing(id);
  };

  const movePackage = (id: string, category: CategoryId, next: string) => {
    const item = now().catalog.find((entry) => entry.id === id);
    if (!item || (item.category === category && item.group === next)) return;
    store.replace(`package:${id}`, { ...item, category, group: next });
    store.replace("catalog", { ...catalogOrderOf(now()), order: orderIntoGroup(now(), id, category, next) });
  };

  const removePackage = (item: CatalogPackage) => {
    if (now().featured.includes(item.id)) store.replace("catalog", { ...catalogOrderOf(now()), featured: featuredWith(now(), item.id, false) });
    store.remove(`package:${item.id}`);
    setSelected((current) => new Set([...current].filter((id) => id !== item.id)));
    if (editing === item.id) setEditing(null);
  };

  const setStatus = (item: CatalogPackage, status: CatalogPackage["review"]["status"]) => store.edit(`package:${item.id}`, ["review", "status"], status);

  // Groups --------------------------------------------------------------------------

  const category = view.kind === "category" ? view.category : null;
  const groups = category ? groupsIn(content, category) : [];
  const current = groups.find((entry) => entry.group === group) ?? null;
  const page = category ? pageOf(content, category) : undefined;

  const saveGroupForm = () => {
    if (!groupForm || !category || !page) return;
    if (!groupForm.name.th.trim() || !groupForm.name.en.trim()) return setNotice("ใส่ชื่อกลุ่มทั้งภาษาไทยและอังกฤษ");
    if (groupForm.mode === "rename") {
      store.replace(`page:${category}`, withGroupRenamed(page, groupForm.group, groupForm.name));
    } else {
      const fresh = groupForm.where === "";
      if (fresh && (!groupForm.heading.th.trim() || !groupForm.heading.en.trim())) return setNotice("ใส่ชื่อหัวข้อใหม่ทั้งภาษาไทยและอังกฤษ");
      const made = withGroupAdded(now(), page, category, groupForm.name, fresh ? { newSection: groupForm.heading } : { section: groupForm.where });
      store.replace(`page:${category}`, made.page);
      setGroup(made.group);
    }
    setNotice(null);
    setGroupForm(null);
  };

  const removeGroup = (entry: GroupEntry) => {
    if (!page) return;
    const next = withGroupRemoved(page, entry.group);
    if (!next) return setNotice("ลบไม่ได้: หน้านี้ต้องมีอย่างน้อยหนึ่งกลุ่ม");
    store.replace(`page:${entry.category}`, next);
    setGroup(null);
  };

  // The packages on the screen --------------------------------------------------------

  const inView = category ? content.catalog.filter((item) => item.category === category && (group === null || item.group === group)) : [];
  const words = query.trim().toLowerCase();
  const rows = inView.filter((item) => {
    if (words && !`${item.name.th} ${item.name.en} ${item.id}`.toLowerCase().includes(words)) return false;
    if (filter === "shown") return isShown(item, today);
    if (filter === "hidden") return !isShown(item, today);
    if (filter === "unverified") return item.review.status === "unverified";
    return true;
  });
  const chosen = rows.filter((item) => selected.has(item.id));
  const removedPackages = published.catalog.filter((item) => !content.catalog.some((entry) => entry.id === item.id));
  const allGroups = categories.flatMap((entry) => groupsIn(content, entry));
  const editingItem = editing ? content.catalog.find((item) => item.id === editing) : undefined;

  const statusTone =
    summary.status === "conflict" || summary.status === "error"
      ? "bg-tm-danger text-tm-on-red"
      : summary.status === "invalid"
        ? "bg-[#fef3c7] text-[#78350f]"
        : summary.status === "saved"
          ? "bg-tm-success-wash text-tm-success"
          : "bg-tm-surface text-tm-muted";

  const tab = (label: string, count: number, active: boolean, onClick: () => void) => (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="min-h-10 whitespace-nowrap rounded-tm-pill border border-tm-line px-4 text-tm-small font-medium hover:border-tm-ink aria-selected:border-tm-ink aria-selected:bg-tm-ink aria-selected:text-tm-on-ink"
    >
      {label} <span className="tm-num opacity-70">{count}</span>
    </button>
  );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-tm-line pb-6">
        <div>
          <h1 className={pageTitle}>แพ็กเกจและโปร</h1>
          <p className="mt-2 max-w-[44rem] text-tm-muted">เพิ่ม แก้ ทำสำเนา ย้าย ซ่อน และลบแพ็กเกจที่นี่ที่เดียว แพ็กเกจขึ้นหน้าเว็บตามกลุ่มของมันเอง และขึ้นหน้าแรกเมื่อเปิด “แนะนำ” ทุกอย่างเป็นร่างจนกว่าจะเผยแพร่</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p role="status" aria-live="polite" data-save-status={summary.status} className={`rounded-tm-pill px-3 py-1 text-tm-caption font-semibold ${statusTone}`}>
            {summary.status === "clean" ? (drafted.length > 0 ? `ร่างบันทึกไว้แล้ว ${drafted.length} รายการ` : "ตรงกับฉบับที่เผยแพร่") : summaryText[summary.status]}
          </p>
          <Link href="/admin/publish" onClick={() => store.flushAll()} className="inline-flex min-h-10 items-center rounded-tm-control bg-tm-red px-4 text-tm-small font-semibold text-tm-on-red hover:bg-tm-red-press">
            เผยแพร่…
          </Link>
        </div>
      </header>

      {draftsAvailable ? null : (
        <p role="alert" className="mt-4 rounded-tm-control border border-tm-danger bg-tm-danger-wash px-4 py-2 text-tm-small text-tm-danger">
          ฐานข้อมูลนี้ยังไม่มีตารางร่าง จึงยังบันทึกไม่ได้ (ลองแก้ได้ แต่จะไม่ถูกเก็บ)
        </p>
      )}
      {problems.length > 0 ? (
        <p role="alert" className="mt-4 rounded-tm-control border border-[#f59e0b] bg-[#fef3c7] px-4 py-2 text-tm-small text-[#78350f]">
          ร่างบางเอกสารใช้ไม่ได้และถูกข้ามไป (แสดงฉบับที่เผยแพร่แทน): {problems.map((problem) => `${problem.documentId} — ${problem.messages[0] ?? ""}`).join(" · ")}
        </p>
      ) : null}
      {troubled.length > 0 ? (
        <ul role="alert" className="mt-4 grid gap-2 rounded-tm-control border border-tm-danger bg-tm-danger-wash px-4 py-3 text-tm-small">
          {troubled.map(([documentId, meta]) => (
            <li key={documentId} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-tm-danger">{documentLabel(content, documentId)}:</span>
              <span>{meta.status === "conflict" ? "ผู้ดูแลอีกคนแก้พร้อมกัน" : (meta.messages[0] ?? "บันทึกไม่สำเร็จ")}</span>
              {meta.status === "conflict" ? (
                <>
                  <button type="button" className={smallButton} onClick={() => store.keepMine(documentId)}>
                    ใช้ฉบับของฉัน
                  </button>
                  <button type="button" className={smallButton} onClick={() => store.takeTheirs(documentId)}>
                    ใช้ฉบับล่าสุดในระบบ
                  </button>
                </>
              ) : meta.status === "error" ? (
                <button type="button" className={smallButton} onClick={() => store.retry(documentId)}>
                  ลองอีกครั้ง
                </button>
              ) : null}
              {documentId.startsWith("package:") && content.catalog.some((item) => `package:${item.id}` === documentId) ? (
                <button type="button" className={smallButton} onClick={() => setEditing(documentId.slice(8))}>
                  เปิดแพ็กเกจ
                </button>
              ) : (
                <button type="button" className={smallButton} onClick={() => void store.discard(documentId)}>
                  ทิ้งการแก้นี้
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {notice ? (
        <p role="status" className="mt-4 flex items-center justify-between gap-3 rounded-tm-control bg-tm-surface px-4 py-2 text-tm-small">
          {notice}
          <button type="button" className="underline" onClick={() => setNotice(null)}>
            ปิด
          </button>
        </p>
      ) : null}

      <div role="tablist" aria-label="หมวดของแพ็กเกจ" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {categories.map((entry) =>
          tab(pageLabels[entry], content.catalog.filter((item) => item.category === entry).length, view.kind === "category" && view.category === entry, () => {
            setView({ kind: "category", category: entry });
            setGroup(null);
            setSelected(new Set());
            setGroupForm(null);
          }),
        )}
        <span className="mx-1 w-px shrink-0 bg-tm-line" aria-hidden="true" />
        {tab("โปรแนะนำหน้าแรก", content.featured.filter((id) => content.catalog.some((item) => item.id === id)).length, view.kind === "featured", () => setView({ kind: "featured" }))}
        {tab("สิทธิประโยชน์", Object.keys(content.benefits).length, view.kind === "benefits", () => setView({ kind: "benefits" }))}
      </div>

      {view.kind === "category" && category ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <nav aria-label="กลุ่มในหมวดนี้" className="grid content-start gap-1">
            <button type="button" aria-current={group === null ? "true" : undefined} onClick={() => setGroup(null)} className="flex min-h-10 items-center justify-between rounded-tm-control px-3 text-left text-tm-small font-medium hover:bg-tm-surface aria-[current=true]:bg-tm-ink aria-[current=true]:text-tm-on-ink">
              ทุกกลุ่ม <span className="tm-num opacity-70">{content.catalog.filter((item) => item.category === category).length}</span>
            </button>
            {groups.map((entry, index) => (
              <div key={entry.group}>
                {index === 0 || groups[index - 1].section.id !== entry.section.id ? <p className="px-3 pb-1 pt-3 text-tm-caption font-semibold text-tm-muted">{entry.section.heading.th}</p> : null}
                <button
                  type="button"
                  aria-current={group === entry.group ? "true" : undefined}
                  onClick={() => {
                    setGroup(entry.group);
                    setSelected(new Set());
                    setGroupForm(null);
                  }}
                  className="flex min-h-10 w-full items-center justify-between gap-2 rounded-tm-control px-3 text-left text-tm-small hover:bg-tm-surface aria-[current=true]:bg-tm-ink aria-[current=true]:text-tm-on-ink"
                >
                  <span className="truncate">{entry.name}</span>
                  <span className="tm-num opacity-70">{packagesIn(content, entry.category, entry.group).length}</span>
                </button>
              </div>
            ))}
            {page ? (
              <button type="button" className={`${smallButton} mt-3 justify-self-start`} onClick={() => setGroupForm({ mode: "add", name: emptyText, where: page.sections[0]?.id ?? "", heading: emptyText })}>
                + เพิ่มกลุ่ม
              </button>
            ) : (
              <p className="px-3 pt-3 text-tm-caption text-tm-muted">หมวดนี้มีกลุ่มเดียว ตามแบบของหน้าโซลาร์เซลล์</p>
            )}
          </nav>

          <section aria-label="แพ็กเกจ" className="grid content-start gap-4">
            {groupForm?.mode === "add" && page ? (
              <NameForm title="กลุ่มใหม่" value={groupForm.name} onChange={(name) => setGroupForm({ ...groupForm, name })}>
                <label className="grid gap-1.5 text-tm-caption font-semibold text-tm-muted">
                  อยู่ใต้หัวข้อของหน้า
                  <select className={inputClass} value={groupForm.where} onChange={(event) => setGroupForm({ ...groupForm, where: event.target.value })}>
                    {page.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.heading.th}
                      </option>
                    ))}
                    <option value="">หัวข้อใหม่ (ท้ายหน้า)</option>
                  </select>
                </label>
                {groupForm.where === "" ? <LocalizedField value={groupForm.heading} onChange={(heading) => setGroupForm({ ...groupForm, heading })} issues={[]} locale="th" label="ชื่อหัวข้อใหม่" /> : null}
                <div className="flex gap-2">
                  <button type="button" className={`${smallButton} border-tm-ink bg-tm-ink text-tm-on-ink`} onClick={saveGroupForm}>
                    เพิ่มกลุ่ม
                  </button>
                  <button type="button" className={smallButton} onClick={() => setGroupForm(null)}>
                    ยกเลิก
                  </button>
                </div>
              </NameForm>
            ) : null}

            {current ? (
              <div className="grid gap-3 rounded-tm-control border border-tm-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="mr-auto min-w-0">
                    <p className="text-tm-caption text-tm-muted">
                      {pageLabels[current.category]} › {current.section.heading.th}
                    </p>
                    <h2 className="truncate text-tm-h4 font-semibold">{current.name}</h2>
                  </div>
                  {current.editable && page ? (
                    <>
                      <button type="button" className={smallButton} onClick={() => setGroupForm({ mode: "rename", group: current.group, name: current.heading ?? current.section.heading })}>
                        เปลี่ยนชื่อ
                      </button>
                      <button type="button" className={smallButton} aria-label={`เลื่อนกลุ่มขึ้น: ${current.name}`} onClick={() => store.replace(`page:${current.category}`, withGroupMoved(page, current.group, -1))}>
                        ↑
                      </button>
                      <button type="button" className={smallButton} aria-label={`เลื่อนกลุ่มลง: ${current.name}`} onClick={() => store.replace(`page:${current.category}`, withGroupMoved(page, current.group, 1))}>
                        ↓
                      </button>
                      <button
                        type="button"
                        className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`}
                        disabled={packagesIn(content, current.category, current.group).length > 0}
                        title={packagesIn(content, current.category, current.group).length > 0 ? "ย้ายหรือลบแพ็กเกจในกลุ่มก่อน จึงลบกลุ่มได้" : undefined}
                        onClick={() => removeGroup(current)}
                      >
                        ลบกลุ่ม
                      </button>
                    </>
                  ) : null}
                  <Link href={`/admin/editor?page=${current.category}`} className={smallButton} onClick={() => store.flushAll()}>
                    ดูบนหน้าเว็บ
                  </Link>
                  <button type="button" className={`${smallButton} border-tm-ink bg-tm-ink text-tm-on-ink`} onClick={() => addPackage(current)}>
                    + เพิ่มแพ็กเกจ
                  </button>
                </div>
                {groupForm?.mode === "rename" && groupForm.group === current.group ? (
                  <NameForm title="ชื่อกลุ่ม (หัวข้อที่ลูกค้าเห็นบนหน้าเว็บ)" value={groupForm.name} onChange={(name) => setGroupForm({ ...groupForm, name })}>
                    <div className="flex gap-2">
                      <button type="button" className={`${smallButton} border-tm-ink bg-tm-ink text-tm-on-ink`} onClick={saveGroupForm}>
                        บันทึกชื่อ
                      </button>
                      <button type="button" className={smallButton} onClick={() => setGroupForm(null)}>
                        ยกเลิก
                      </button>
                    </div>
                  </NameForm>
                ) : null}
              </div>
            ) : (
              <p className="text-tm-small text-tm-muted">เลือกกลุ่มก่อน เพื่อเพิ่มแพ็กเกจ เรียงลำดับ หรือจัดการกลุ่ม</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <input type="search" aria-label="ค้นหาแพ็กเกจ" placeholder="ค้นหาชื่อแพ็กเกจ" value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} max-w-[18rem]`} />
              <select aria-label="กรองตามสถานะ" value={filter} onChange={(event) => setFilter(event.target.value as Filter)} className={`${inputClass} max-w-[13rem]`}>
                <option value="all">ทุกสถานะ</option>
                <option value="shown">ที่แสดงบนเว็บ</option>
                <option value="hidden">ที่ไม่แสดง</option>
                <option value="unverified">ยังไม่ยืนยัน</option>
              </select>
              <p className="ml-auto text-tm-caption text-tm-muted" aria-live="polite">
                {rows.length} จาก {inView.length} แพ็กเกจ
              </p>
            </div>

            {chosen.length > 0 ? (
              <div role="group" aria-label="ทำกับที่เลือก" className="flex flex-wrap items-center gap-2 rounded-tm-control bg-tm-surface px-3 py-2 text-tm-small">
                <span className="font-semibold">เลือก {chosen.length} รายการ</span>
                <button type="button" className={smallButton} onClick={() => chosen.forEach((item) => item.review.status === "hidden" && setStatus(item, "unverified"))}>
                  แสดง
                </button>
                <button type="button" className={smallButton} onClick={() => chosen.forEach((item) => item.review.status !== "hidden" && setStatus(item, "hidden"))}>
                  ซ่อน
                </button>
                <select
                  aria-label="ย้ายที่เลือกไปกลุ่ม"
                  className={`${inputClass} max-w-[16rem]`}
                  value=""
                  onChange={(event) => {
                    const [nextCategory, ...rest] = event.target.value.split("/");
                    if (!nextCategory) return;
                    chosen.forEach((item) => movePackage(item.id, nextCategory as CategoryId, rest.join("/")));
                    setSelected(new Set());
                  }}
                >
                  <option value="">ย้ายไปกลุ่ม…</option>
                  {allGroups.map((entry) => (
                    <option key={`${entry.category}/${entry.group}`} value={`${entry.category}/${entry.group}`}>
                      {pageLabels[entry.category]} › {entry.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`}
                  onClick={() => {
                    if (window.confirm(`ลบ ${chosen.length} แพ็กเกจที่เลือก? (เป็นร่าง เอาคืนได้ก่อนเผยแพร่)`)) chosen.forEach(removePackage);
                  }}
                >
                  ลบ
                </button>
                <button type="button" className="ml-auto underline" onClick={() => setSelected(new Set())}>
                  ยกเลิกการเลือก
                </button>
              </div>
            ) : null}

            {rows.length === 0 ? (
              <p className="rounded-tm-control border border-dashed border-tm-line px-4 py-8 text-center text-tm-small text-tm-muted">{inView.length === 0 ? "กลุ่มนี้ยังไม่มีแพ็กเกจ หน้าเว็บจะยังไม่แสดงกลุ่มนี้จนกว่าจะมีแพ็กเกจ" : "ไม่มีแพ็กเกจที่ตรงกับการค้นหา"}</p>
            ) : (
              <ul className="grid gap-1.5" aria-label="รายการแพ็กเกจ">
                {rows.map((item) => {
                  const state = standing(item, today);
                  const siblings = packagesIn(content, item.category, item.group).map((entry) => entry.id);
                  const index = siblings.indexOf(item.id);
                  const isDraft = drafted.includes(`package:${item.id}`);
                  return (
                    <li key={item.id} data-catalog-item={item.id} className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3 rounded-tm-control border border-tm-line px-3 py-2 hover:border-tm-muted sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]">
                      <input
                        type="checkbox"
                        aria-label={`เลือก: ${item.name.th}`}
                        className="size-4 accent-tm-ink"
                        checked={selected.has(item.id)}
                        onChange={(event) => {
                          const next = new Set(selected);
                          if (event.target.checked) next.add(item.id);
                          else next.delete(item.id);
                          setSelected(next);
                        }}
                      />
                      <Thumb content={content} id={item.image} />
                      <button type="button" className="min-w-0 text-left" onClick={() => setEditing(item.id)}>
                        <span className="block truncate text-tm-small font-medium">
                          {item.name.th}
                          {isDraft ? <span className="ml-2 rounded-tm-pill bg-tm-ink px-1.5 py-0.5 text-[0.6875rem] font-semibold text-tm-on-ink">ร่าง</span> : null}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-tm-caption text-tm-muted">
                          <span className="tm-num font-semibold text-tm-ink">{formatNumber(item.price.amount, "th")} บาท</span>
                          {item.speed ? (
                            <span className="tm-num">
                              {formatNumber(item.speed.download.value, "th")}/{formatNumber(item.speed.upload.value, "th")} {item.speed.download.unit}
                            </span>
                          ) : item.allowance ? (
                            <span className="truncate">{item.allowance.th}</span>
                          ) : null}
                          <span className={`rounded-tm-pill px-1.5 ${state.tone}`}>{state.text}</span>
                          {group === null ? <span className="truncate">{groups.find((entry) => entry.group === item.group)?.name ?? item.group}</span> : null}
                        </span>
                      </button>
                      <span className="col-span-3 flex flex-wrap gap-1 sm:col-span-1" role="group" aria-label={`จัดแพ็กเกจ ${item.name.th}`}>
                        <button type="button" className={`${smallButton} aria-pressed:border-tm-red aria-pressed:bg-tm-red aria-pressed:text-tm-on-red`} aria-pressed={featured.has(item.id)} aria-label={`แนะนำในหน้าแรก: ${item.name.th}`} title="แนะนำในหน้าแรก" onClick={() => setFeatured(item, !featured.has(item.id))}>
                          ★
                        </button>
                        <button type="button" className={smallButton} aria-label={`เลื่อนขึ้น: ${item.name.th}`} disabled={index <= 0} onClick={() => store.replace("catalog", { ...catalogOrderOf(now()), order: orderWithin(now(), siblings, index, index - 1) })}>
                          ↑
                        </button>
                        <button type="button" className={smallButton} aria-label={`เลื่อนลง: ${item.name.th}`} disabled={index === siblings.length - 1} onClick={() => store.replace("catalog", { ...catalogOrderOf(now()), order: orderWithin(now(), siblings, index, index + 1) })}>
                          ↓
                        </button>
                        <button type="button" className={smallButton} aria-label={`แก้ไข: ${item.name.th}`} onClick={() => setEditing(item.id)}>
                          แก้ไข
                        </button>
                        <button type="button" className={smallButton} aria-label={`ทำสำเนา: ${item.name.th}`} onClick={() => copyPackage(item)}>
                          ทำสำเนา
                        </button>
                        <button type="button" className={smallButton} aria-label={`${item.review.status === "hidden" ? "แสดง" : "ซ่อน"}: ${item.name.th}`} onClick={() => setStatus(item, item.review.status === "hidden" ? "unverified" : "hidden")}>
                          {item.review.status === "hidden" ? "แสดง" : "ซ่อน"}
                        </button>
                        <button type="button" className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`} aria-label={`ลบ: ${item.name.th}`} onClick={() => removePackage(item)}>
                          ลบ
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {removedPackages.length > 0 ? (
              <section aria-label="แพ็กเกจที่ลบในร่าง" className="grid gap-2 border-t border-tm-line pt-4">
                <h3 className="text-tm-small font-semibold">ลบในร่าง (เผยแพร่จึงหายจากเว็บ)</h3>
                <ul className="grid gap-1">
                  {removedPackages.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-tm-small">
                      <span className="truncate">
                        {item.name.th} <span className="text-tm-muted">· {pageLabels[item.category]}</span>
                      </span>
                      <button type="button" className={smallButton} aria-label={`เอาคืน: ${item.name.th}`} onClick={() => void store.discard(`package:${item.id}`)}>
                        เอาคืน
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </section>
        </div>
      ) : null}

      {view.kind === "featured" ? (
        <section aria-label="โปรแนะนำหน้าแรก" className="mt-6 grid gap-6">
          <p className="max-w-[44rem] text-tm-small text-tm-muted">การ์ดในส่วน “โปรแนะนำ” ของหน้าแรก เรียงตามนี้ในแต่ละแท็บ เพิ่มได้จากปุ่ม ★ ในรายการแพ็กเกจ แพ็กเกจที่ซ่อนหรือพ้นช่วงแสดงจะไม่ขึ้นการ์ดจนกว่าจะกลับมาแสดง</p>
          {content.pages.home.promos.tabs.map((homeTab) => {
            const cards = content.featured.map((id) => content.catalog.find((item) => item.id === id)).filter((item): item is CatalogPackage => item !== undefined && homeTab.categories.includes(item.category));
            const ids = cards.map((item) => item.id);
            return (
              <div key={homeTab.id} className="grid gap-2">
                <h2 className="text-tm-h4 font-semibold">
                  แท็บ “{homeTab.title.th}” <span className="tm-num text-tm-small font-normal text-tm-muted">{cards.length} การ์ด</span>
                </h2>
                {cards.length === 0 ? <p className="text-tm-small text-tm-muted">ยังไม่มีแพ็กเกจที่แนะนำ แท็บนี้จะไม่แสดงในหน้าแรก</p> : null}
                <ol className="grid gap-1.5">
                  {cards.map((item, index) => {
                    const state = standing(item, today);
                    return (
                      <li key={item.id} data-featured-item={item.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-tm-control border border-tm-line px-3 py-2">
                        <Thumb content={content} id={item.image} />
                        <button type="button" className="min-w-0 text-left" onClick={() => setEditing(item.id)}>
                          <span className="block truncate text-tm-small font-medium">{item.name.th}</span>
                          <span className="flex flex-wrap items-center gap-2 text-tm-caption text-tm-muted">
                            <span className="tm-num font-semibold text-tm-ink">{formatNumber(item.price.amount, "th")} บาท</span>
                            <span className={`rounded-tm-pill px-1.5 ${state.tone}`}>{state.text}</span>
                          </span>
                        </button>
                        <span className="flex gap-1" role="group" aria-label={`จัดการ์ด ${item.name.th}`}>
                          <button type="button" className={smallButton} aria-label={`เลื่อนการ์ดขึ้น: ${item.name.th}`} disabled={index === 0} onClick={() => store.replace("catalog", { ...catalogOrderOf(now()), featured: featuredMoved(now(), ids, index, index - 1) })}>
                            ↑
                          </button>
                          <button type="button" className={smallButton} aria-label={`เลื่อนการ์ดลง: ${item.name.th}`} disabled={index === ids.length - 1} onClick={() => store.replace("catalog", { ...catalogOrderOf(now()), featured: featuredMoved(now(), ids, index, index + 1) })}>
                            ↓
                          </button>
                          <button type="button" className={smallButton} aria-label={`เอาออกจากหน้าแรก: ${item.name.th}`} onClick={() => setFeatured(item, false)}>
                            เอาออก
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </section>
      ) : null}

      {view.kind === "benefits" ? (
        <BenefitsView content={content} published={published} store={store} open={benefitId} onOpen={setBenefitId} pickMedia={pickMedia} />
      ) : null}

      {editingItem ? (
        <PackageForm
          content={content}
          store={store}
          id={editingItem.id}
          today={today}
          featured={featured.has(editingItem.id)}
          onFeatured={(on) => setFeatured(editingItem, on)}
          onMove={(nextCategory, next) => {
            movePackage(editingItem.id, nextCategory, next);
            setView({ kind: "category", category: nextCategory });
            setGroup(next);
          }}
          onCopy={() => copyPackage(editingItem)}
          onRemove={() => removePackage(editingItem)}
          onClose={() => setEditing(null)}
          pickMedia={pickMedia}
        />
      ) : null}

      {naming ? (
        <NamePackageDialog
          title={naming.mode === "add" ? `แพ็กเกจใหม่ในกลุ่ม “${naming.entry.name}”` : `ทำสำเนา “${naming.item.name.th}”`}
          hint={naming.mode === "add" ? "แพ็กเกจใหม่เริ่มแบบซ่อนและยังไม่มีราคา กรอกให้ครบแล้วจึงเปลี่ยนเป็นแสดง" : "สำเนาได้ราคา สิทธิประโยชน์ และเงื่อนไขของต้นฉบับ แต่เริ่มแบบซ่อน"}
          name={naming.name}
          address={idFor(naming)}
          onChange={(name) => setNaming({ ...naming, name })}
          onCreate={createNamed}
          onClose={() => setNaming(null)}
        />
      ) : null}

      {picker ? (
        <MediaPicker
          content={content}
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
    </>
  );
}

/** Asks the name of a package about to be made, and shows the address the name gives it. */
function NamePackageDialog({ title, hint, name, address, onChange, onCreate, onClose }: { title: string; hint: string; name: LocalizedText; address: string; onChange: (name: LocalizedText) => void; onCreate: () => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Removing the element closes the dialog, so there is nothing to clean up.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);
  const ready = name.th.trim() !== "" && name.en.trim() !== "";
  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="name-package-title" className="w-[min(32rem,calc(100vw-2rem))] rounded-tm-panel bg-tm-canvas p-0 text-tm-ink backdrop:bg-black/50">
      <div className="grid gap-4 p-5">
        <div>
          <h2 id="name-package-title" className="text-tm-h4 font-semibold">
            {title}
          </h2>
          <p className="mt-1 text-tm-small text-tm-muted">{hint}</p>
        </div>
        <LocalizedField value={name} onChange={onChange} issues={[]} locale="th" label="ชื่อแพ็กเกจใหม่" />
        <p className="text-tm-caption text-tm-muted">
          ที่อยู่หน้าของแพ็กเกจ: <span className="tm-num break-all font-semibold text-tm-ink">/packages/{address}</span>
          <br />
          มาจากชื่อภาษาอังกฤษ และเปลี่ยนภายหลังไม่ได้ ส่วนชื่อแก้ได้เสมอ
        </p>
        <div className="flex gap-2">
          <button type="button" className={`${smallButton} border-tm-ink bg-tm-ink text-tm-on-ink disabled:opacity-40`} disabled={!ready} onClick={onCreate}>
            สร้างแพ็กเกจ
          </button>
          <button type="button" className={smallButton} onClick={() => dialogRef.current?.close()}>
            ยกเลิก
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** The benefits packages can list: a name and an icon each, removed only when no package uses it. */
function BenefitsView({ content, published, store, open, onOpen, pickMedia }: { content: SiteContent; published: SiteContent; store: DraftStore; open: string | null; onOpen: (id: string | null) => void; pickMedia: FieldContext["pickMedia"] }) {
  const entries = Object.entries(content.benefits);
  const removed = Object.entries(published.benefits).filter(([id]) => !(id in content.benefits));
  const ctx: FieldContext = { content, locale: "th", pickMedia, select: () => undefined };
  const add = () => {
    const id = uniqueId((candidate) => candidate in content.benefits || candidate in published.benefits, "benefit-new");
    const icon = entries[0]?.[1].icon ?? Object.keys(content.media)[0];
    store.create(`benefit:${id}` as DocumentId, { label: { th: "สิทธิประโยชน์ใหม่", en: "New benefit" }, icon });
    onOpen(id);
  };
  return (
    <section aria-label="สิทธิประโยชน์" className="mt-6 grid max-w-[44rem] gap-3">
      <p className="text-tm-small text-tm-muted">สิ่งที่แพ็กเกจเลือกไปแสดงเป็นรายการสิทธิประโยชน์ แก้ที่นี่เปลี่ยนทุกแพ็กเกจที่ใช้</p>
      <ul className="grid gap-1.5">
        {entries.map(([id, benefit]) => {
          const used = benefitUsage(content, id);
          const documentId = `benefit:${id}` as DocumentId;
          return (
            <li key={id} data-benefit-item={id} className="grid gap-3 rounded-tm-control border border-tm-line px-3 py-2">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <Thumb content={content} id={benefit.icon} />
                <button type="button" className="min-w-0 text-left" onClick={() => onOpen(open === id ? null : id)}>
                  <span className="block truncate text-tm-small font-medium">{benefit.label.th}</span>
                  <span className="text-tm-caption text-tm-muted">ใช้ใน {used} แพ็กเกจ</span>
                </button>
                <span className="flex gap-1">
                  <button type="button" className={smallButton} aria-label={`แก้ไข: ${benefit.label.th}`} onClick={() => onOpen(open === id ? null : id)}>
                    {open === id ? "ปิด" : "แก้ไข"}
                  </button>
                  <button type="button" className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`} disabled={used > 0} title={used > 0 ? "เอาออกจากแพ็กเกจที่ใช้ก่อน จึงลบได้" : undefined} aria-label={`ลบ: ${benefit.label.th}`} onClick={() => store.remove(documentId)}>
                    ลบ
                  </button>
                </span>
              </div>
              {open === id ? (
                <div className="grid gap-3 border-t border-tm-line pt-3">
                  <LocalizedField value={benefit.label} onChange={(label) => store.edit(documentId, ["label"], label)} issues={store.metaOf(documentId).issues.filter((issue) => issue.path[0] === "label").map((issue) => ({ ...issue, path: issue.path.slice(1) }))} locale="th" label="ชื่อสิทธิประโยชน์" />
                  <MediaField value={benefit.icon} onChange={(icon) => icon && store.edit(documentId, ["icon"], icon)} optional={false} ctx={ctx} label="ไอคอน" issues={[]} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {removed.map(([id, benefit]) => (
        <p key={id} className="flex items-center justify-between gap-2 text-tm-small">
          <span className="truncate">ลบในร่าง: {benefit.label.th}</span>
          <button type="button" className={smallButton} onClick={() => void store.discard(`benefit:${id}` as DocumentId)}>
            เอาคืน
          </button>
        </p>
      ))}
      <button type="button" className={`${smallButton} justify-self-start`} onClick={add}>
        + เพิ่มสิทธิประโยชน์
      </button>
    </section>
  );
}
