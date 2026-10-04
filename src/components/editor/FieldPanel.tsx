"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ZodType } from "zod";

import { documentSchema, isCollectionDocument, readDocument, type DocumentId } from "@/lib/content/documents";
import { parseDocument, validateDraft, type FieldIssue } from "@/lib/content/draft-model";
import { bindingPath, decodeBinding, diffPaths, encodeBinding, getAt } from "@/lib/content/paths";
import type { CatalogPackage, SiteContent } from "@/lib/content/schema";
import type { Locale } from "@/lib/i18n/locales";

import type { DocMeta, DraftState, DraftStore } from "./draft-store";
import {
  BenefitListField,
  BooleanField,
  ColorField,
  CtaField,
  EnumField,
  issuesAt,
  LinkField,
  LocalizedField,
  MediaField,
  MediaListField,
  NumberField,
  PackageField,
  PriceField,
  smallButton,
  TargetField,
  TextField,
  TextLinesField,
  ThemeField,
  ToneField,
  type FieldContext,
} from "./fields";
import { documentLabel, fieldLabel, itemLabel, pageLabels, pathLabel, valueLabel } from "./labels";
import { arrayBounds, moveItem, newItem, removeItem } from "./list-edit";
import { defOf, enumOptions, fieldKind, isReadOnly, objectFields, schemaAt, unwrap, type FieldKind } from "./schema-walk";
import { CatalogManager } from "./CatalogManager";
import { benefitUsage, mediaUsage, packagePages } from "./usage";

// The side panel of the Mirror editor. It shows the object that holds the
// selected field (a section, a card, a package) with a control for each value
// the schema allows; nested sections and lists open as their own view. Ids,
// paths and layout are shown as fixed facts, never as inputs.

export type Selection = { binding: string; from: "panel" | "preview"; seq: number };

type FieldPanelProps = {
  state: DraftState;
  store: DraftStore;
  published: SiteContent;
  selection: Selection;
  onSelect: (binding: string) => void;
  locale: Locale;
  pickMedia: FieldContext["pickMedia"];
};

const containerKinds: ReadonlySet<FieldKind> = new Set(["object", "objectList"]);

/** The object or list shown for a selected path, and the field in it to point at. */
function resolveContainer(root: ZodType, body: unknown, path: string[]): { container: string[]; focus: string[] | null } {
  for (let length = path.length; length > 0; length -= 1) {
    const prefix = path.slice(0, length);
    const schema = schemaAt(root, prefix);
    if (!schema || getAt(body, prefix) === undefined) continue;
    if (containerKinds.has(fieldKind(schema))) return { container: prefix, focus: length < path.length ? path.slice(0, length + 1) : null };
  }
  return { container: [], focus: path.length > 0 ? path.slice(0, 1) : null };
}

/** Field problems (schema) and site problems (references) of the document being edited. */
function checkDocument(content: SiteContent, documentId: DocumentId, body: unknown): { issues: FieldIssue[]; problems: string[] } {
  if (body === undefined) return { issues: [], problems: [] };
  const parsed = parseDocument(documentId, body);
  if (!parsed.ok) return { issues: parsed.issues.map((issue) => ({ path: bindingPath(body, issue.path), message: issue.message })), problems: [] };
  const checked = validateDraft(content, documentId, body);
  return { issues: [], problems: checked.ok ? [] : checked.messages };
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function countIssues(issues: readonly FieldIssue[], path: readonly string[]): number {
  return issuesAt(issues, path).length;
}

function timeOf(value: string | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(value));
}

type NodeProps = {
  documentId: DocumentId;
  body: unknown;
  publishedBody: unknown;
  issues: FieldIssue[];
  focus: string | null;
  ctx: FieldContext;
  store: DraftStore;
};

function DrillRow({ label, summary, issues, onOpen, binding }: { label: string; summary?: string; issues: number; onOpen: () => void; binding: string }) {
  return (
    <button
      type="button"
      data-field={binding}
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-tm-control border border-tm-line px-3 py-2.5 text-left hover:border-tm-ink focus-visible:border-tm-ink"
    >
      <span className="min-w-0">
        <span className="block text-tm-small font-semibold">{label}</span>
        {summary ? <span className="block truncate text-tm-caption text-tm-muted">{summary}</span> : null}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {issues > 0 ? (
          <span className="rounded-tm-pill bg-tm-danger px-1.5 text-[11px] font-semibold text-tm-on-red" aria-label={`มี ${issues} ช่องที่ต้องแก้`}>
            {issues}
          </span>
        ) : null}
        <span aria-hidden="true" className="text-tm-muted">
          ›
        </span>
      </span>
    </button>
  );
}

function FieldFrame({
  label,
  binding,
  focused,
  changed,
  onReset,
  extra,
  children,
}: {
  label: string;
  binding: string;
  focused: boolean;
  changed: boolean;
  onReset: () => void;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      data-field={binding}
      data-focused={focused || undefined}
      className="scroll-mt-4 rounded-tm-control p-2 -mx-2 transition-colors duration-tm-base data-[focused]:bg-[#eff6ff] data-[focused]:ring-2 data-[focused]:ring-[#2563eb]"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-tm-small font-semibold">{label}</span>
        <span className="flex items-center gap-1">
          {extra}
          {changed ? (
            <button type="button" onClick={onReset} className="rounded-tm-control px-1.5 text-tm-caption font-medium text-tm-muted underline-offset-2 hover:text-tm-ink hover:underline">
              คืนค่าที่เผยแพร่
            </button>
          ) : null}
        </span>
      </div>
      {children}
    </div>
  );
}

function emptyValue(kind: FieldKind, field: ZodType): unknown {
  switch (kind) {
    case "localized":
      return { th: "", en: "" };
    case "number":
      return 0;
    case "boolean":
      return true;
    case "enum":
      return enumOptions(field)[0];
    default:
      return "";
  }
}

/** One value inside the shown object: its control, reset and optional add/remove. */
function FieldRow({ name, parent, field, path, node }: { name: string; parent?: string; field: ZodType; path: string[]; node: NodeProps }) {
  const { documentId, body, publishedBody, issues, focus, ctx, store } = node;
  const kind = fieldKind(field);
  const { optional } = unwrap(field);
  const value = getAt(body, path);
  const publishedValue = getAt(publishedBody, path);
  const binding = encodeBinding(documentId, path);
  const label = fieldLabel(name, parent);
  const own = issuesAt(issues, path);
  const set = (next: unknown) => store.edit(documentId, path, next);

  if (containerKinds.has(kind)) {
    if (value === undefined) return null;
    const summary = Array.isArray(value) ? `${value.length} รายการ` : undefined;
    return <DrillRow label={label} summary={summary} issues={own.length} binding={binding} onOpen={() => ctx.select(binding)} />;
  }

  const changed = !sameJson(value, publishedValue);
  const frame = (children: ReactNode, extra?: ReactNode) => (
    <FieldFrame label={label} binding={binding} focused={focus === binding} changed={changed} onReset={() => set(publishedValue)} extra={extra}>
      {children}
    </FieldFrame>
  );

  if (value === undefined) {
    if (!optional) return null;
    if (kind === "media") return frame(<MediaField value={undefined} optional ctx={ctx} label={label} issues={own} onChange={set} />);
    if (!["localized", "text", "number", "boolean", "enum"].includes(kind)) return null;
    return frame(
      <button type="button" className={smallButton} onClick={() => set(emptyValue(kind, field))}>
        + เพิ่ม{label}
      </button>,
    );
  }
  const remove =
    optional && kind !== "media" ? (
      <button type="button" onClick={() => set(undefined)} className="rounded-tm-control px-1.5 text-tm-caption font-medium text-tm-muted underline-offset-2 hover:text-tm-danger hover:underline">
        เอาออก
      </button>
    ) : undefined;

  switch (kind) {
    case "localized":
      return frame(<LocalizedField value={value as never} label={label} locale={ctx.locale} issues={own} onChange={set} />, remove);
    case "localizedList":
      return frame(<TextLinesField value={value as never[]} label={label} locale={ctx.locale} issues={own} empty={{ th: "", en: "" } as never} onChange={set} />);
    case "textList":
      return frame(<TextLinesField value={value as string[]} label={label} locale={ctx.locale} issues={own} empty="" onChange={set} />);
    case "number":
      return frame(<NumberField value={value as number} label={label} issues={own} onChange={set} />, remove);
    case "boolean":
      return frame(<BooleanField value={value as boolean} label={label} onChange={set} />, remove);
    case "enum":
      return frame(<EnumField value={value as string} options={enumOptions(field)} label={label} onChange={set} />, remove);
    case "tone":
      return frame(<ToneField value={value as never} label={label} onChange={set} />);
    case "color":
      return frame(<ColorField value={value as string} label={label} onChange={set} />);
    case "theme":
      return frame(<ThemeField value={value as never} onChange={set} />);
    case "media":
      return frame(<MediaField value={value as string} optional={optional} ctx={ctx} label={label} issues={own} onChange={set} />);
    case "mediaList":
      return frame(<MediaListField value={value as string[]} ctx={ctx} label={label} onChange={set} />);
    case "benefitList":
      return frame(<BenefitListField value={value as string[]} ctx={ctx} label={label} onChange={set} />);
    case "package":
      return frame(<PackageField value={value as string} ctx={ctx} label={label} onChange={set} />);
    case "target":
      return frame(<TargetField value={value as never} ctx={ctx} label={label} issues={own} onChange={set} />, remove);
    case "cta":
      return frame(<CtaField value={value as never} ctx={ctx} label={label} issues={own} onChange={set} />);
    case "link":
      return frame(<LinkField value={value as never} ctx={ctx} label={label} issues={own} onChange={set} />);
    case "price":
      return frame(<PriceField value={value as never} issues={own} onChange={set} />);
    default:
      return frame(<TextField value={String(value)} label={label} issues={own} onChange={set} />, remove);
  }
}

function FixedFacts({ entries }: { entries: [string, unknown][] }) {
  if (entries.length === 0) return null;
  return (
    <details className="rounded-tm-control border border-dashed border-tm-line px-3 py-2">
      <summary className="cursor-pointer text-tm-caption font-semibold text-tm-muted">ข้อมูลโครงสร้าง (ระบบกำหนด แก้จากหน้านี้ไม่ได้)</summary>
      <dl className="mt-2 grid gap-x-3 gap-y-1 text-tm-caption sm:grid-cols-[8rem_minmax(0,1fr)]">
        {entries.map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-tm-muted">{fieldLabel(key)}</dt>
            <dd className="break-all font-mono">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function ObjectView({ schema, path, node }: { schema: ZodType; path: string[]; node: NodeProps }) {
  const fields = objectFields(schema);
  const value = getAt(node.body, path) as Record<string, unknown>;
  const parent = path.at(-1);
  const facts = fields.filter(([key]) => isReadOnly(key) && value[key] !== undefined).map(([key]): [string, unknown] => [key, value[key]]);
  return (
    <div className="grid gap-3">
      {fields
        .filter(([key]) => !isReadOnly(key))
        .map(([key, field]) => (
          <FieldRow key={key} name={key} parent={parent} field={field} path={[...path, key]} node={node} />
        ))}
      <FixedFacts entries={facts} />
    </div>
  );
}

const segmentOf = (item: unknown, index: number) =>
  typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : String(index);

function ListView({ schema, path, node }: { schema: ZodType; path: string[]; node: NodeProps }) {
  const list = (getAt(node.body, path) as unknown[]) ?? [];
  const element = unwrap(defOf(unwrap(schema).schema).element!).schema;
  const kind = fieldKind(element);
  const { min, max } = arrayBounds(schema);
  const fixed = min === max;
  const name = fieldLabel(path.at(-1) ?? "");
  const set = (next: unknown[]) => node.store.edit(node.documentId, path, next);
  const add = () => {
    const item = newItem(list);
    set([...list, item]);
    if (kind === "object") node.ctx.select(encodeBinding(node.documentId, [...path, segmentOf(item, list.length)]));
  };
  return (
    <div className="grid gap-2">
      {list.map((item, index) => {
        const segment = segmentOf(item, index);
        const itemPath = [...path, segment];
        const binding = encodeBinding(node.documentId, itemPath);
        const label = itemLabel(item, index);
        const row =
          kind === "object" ? (
            <DrillRow label={label} issues={countIssues(node.issues, itemPath)} binding={binding} onOpen={() => node.ctx.select(binding)} />
          ) : (
            <FieldRow name={label} field={element} path={itemPath} node={node} />
          );
        if (fixed && list.length < 2) return <div key={segment}>{row}</div>;
        return (
          <div key={segment} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1.5">
            {row}
            <div className="flex flex-col gap-1 pt-1" role="group" aria-label={`จัดรายการ ${label}`}>
              <button type="button" className={smallButton} aria-label={`เลื่อนขึ้น: ${label}`} disabled={index === 0} onClick={() => set(moveItem(list, index, index - 1))}>
                ↑
              </button>
              <button type="button" className={smallButton} aria-label={`เลื่อนลง: ${label}`} disabled={index === list.length - 1} onClick={() => set(moveItem(list, index, index + 1))}>
                ↓
              </button>
              {fixed ? null : (
                <button type="button" className={smallButton} aria-label={`ลบ: ${label}`} disabled={list.length <= min} onClick={() => set(removeItem(list, index))}>
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
      {fixed ? null : (
        <button type="button" className={`${smallButton} justify-self-start`} disabled={list.length >= max || list.length === 0} onClick={add}>
          + เพิ่ม{name} (คัดลอกจากรายการสุดท้าย)
        </button>
      )}
      <p className="text-tm-caption text-tm-muted">
        {fixed
          ? `รายการนี้มี ${min} รายการพอดีตามรูปแบบหน้า เรียงลำดับได้แต่เพิ่ม/ลบไม่ได้`
          : max === Number.POSITIVE_INFINITY
            ? `ต้องมีอย่างน้อย ${Math.max(min, 0)} รายการ`
            : `มีได้ ${min}–${max} รายการ`}
      </p>
    </div>
  );
}

function statusLine(meta: DocMeta): { text: string; tone: string } {
  switch (meta.status) {
    case "pending":
      return { text: "มีการแก้ไข รอบันทึก", tone: "text-tm-ink" };
    case "saving":
      return { text: "กำลังบันทึก…", tone: "text-tm-ink" };
    case "invalid":
      return { text: "มีช่องที่ต้องแก้ก่อนจึงจะบันทึกได้", tone: "text-tm-danger" };
    case "error":
      return { text: "บันทึกไม่สำเร็จ", tone: "text-tm-danger" };
    case "conflict":
      return { text: "มีคนแก้พร้อมกัน", tone: "text-tm-danger" };
    default:
      return meta.revision > 0
        ? { text: `บันทึกร่างแล้ว${meta.savedAt ? ` ${timeOf(meta.savedAt)} น.` : ""} · ยังไม่เผยแพร่`, tone: "text-tm-success" }
        : { text: "ตรงกับฉบับที่เผยแพร่", tone: "text-tm-muted" };
  }
}

function ConflictNotice({ documentId, meta, body, store }: { documentId: DocumentId; meta: DocMeta; body: unknown; store: DraftStore }) {
  const theirs = meta.conflict?.body ?? store.publishedBody(documentId);
  const changes = diffPaths(body, theirs);
  return (
    <div role="alert" className="rounded-tm-control border border-tm-danger bg-tm-danger-wash p-3 text-tm-small">
      <p className="font-semibold text-tm-danger">
        {meta.conflict
          ? `ผู้ดูแลอีกคนบันทึกเอกสารนี้หลังจากที่คุณเปิดไว้ (${timeOf(meta.conflict.updatedAt)} น.)`
          : "ผู้ดูแลอีกคนทิ้งร่างของเอกสารนี้ไปแล้ว"}
      </p>
      <p className="mt-1">การแก้ของคุณยังอยู่ในหน้านี้แต่ยังไม่ถูกบันทึก เลือกว่าจะใช้ฉบับไหน:</p>
      {changes.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-tm-caption">
          {changes.slice(0, 6).map((path) => (
            <li key={path.join("/")}>{pathLabel(body, path) || "ทั้งเอกสาร"}</li>
          ))}
          {changes.length > 6 ? <li>และช่องอื่นอีก</li> : null}
        </ul>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={smallButton} onClick={() => store.keepMine(documentId)}>
          ใช้ฉบับของฉัน (บันทึกทับ)
        </button>
        <button type="button" className={smallButton} onClick={() => store.takeTheirs(documentId)}>
          ใช้ฉบับล่าสุดในระบบ (ทิ้งที่ฉันแก้)
        </button>
      </div>
    </div>
  );
}

function DiscardButton({ documentId, meta, store }: { documentId: DocumentId; meta: DocMeta; store: DraftStore }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hasChanges = meta.revision > 0 || meta.status !== "saved";
  if (!hasChanges) return null;
  if (!confirming) {
    return (
      <button type="button" className={smallButton} disabled={meta.status === "saving"} onClick={() => setConfirming(true)}>
        ทิ้งร่างของเอกสารนี้
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-tm-caption">
      <span>กลับไปเป็นฉบับที่เผยแพร่อยู่?</span>
      <button
        type="button"
        className={`${smallButton} border-tm-danger text-tm-danger`}
        onClick={async () => {
          const outcome = await store.discard(documentId);
          setConfirming(false);
          setMessage(outcome.ok ? null : outcome.reason === "conflict" ? null : outcome.message);
        }}
      >
        ทิ้งร่าง
      </button>
      <button type="button" className={smallButton} onClick={() => setConfirming(false)}>
        ยกเลิก
      </button>
      {message ? <span className="text-tm-danger">{message}</span> : null}
    </div>
  );
}

function DocumentNotes({ content, documentId }: { content: SiteContent; documentId: DocumentId }) {
  if (documentId === "site") return <p className="text-tm-caption text-tm-muted">ค่าในส่วนนี้ใช้กับทุกหน้าของเว็บ</p>;
  const [kind, key] = documentId.split(":");
  if (kind === "package") {
    const item = readDocument(content, documentId) as CatalogPackage;
    const pages = packagePages(content, key);
    return (
      <div className="grid gap-1.5 text-tm-caption">
        <p className="text-tm-muted">
          แสดงใน: {pages.length ? pages.map((page) => pageLabels[page]).join(", ") : "ยังไม่มีหน้าที่แสดงแพ็กเกจนี้"} · แก้ที่นี่เปลี่ยนทุกหน้าที่แสดง
        </p>
        {item.review.status !== "verified" ? (
          <p className="rounded-tm-control bg-[#fef3c7] px-2 py-1.5 text-[#78350f]">
            {item.review.status === "hidden"
              ? "แพ็กเกจนี้ซ่อนจากหน้าเว็บ เพราะข้อมูลที่นำเข้าขัดกัน"
              : "ราคาและเงื่อนไขนำเข้าจากเว็บเดิม ธุรกิจยังไม่ยืนยัน"}{" "}
            ({valueLabel(item.review.status)})
          </p>
        ) : null}
      </div>
    );
  }
  if (kind === "benefit") return <p className="text-tm-caption text-tm-muted">ใช้ใน {benefitUsage(content, key)} แพ็กเกจ · แก้ที่นี่เปลี่ยนทุกแพ็กเกจ</p>;
  if (kind === "media") return <p className="text-tm-caption text-tm-muted">รูปนี้ใช้ {mediaUsage(content, key).length} ตำแหน่ง · คำอธิบายรูปเปลี่ยนทุกตำแหน่ง</p>;
  return null;
}

export function FieldPanel({ state, store, published, selection, onSelect, locale, pickMedia }: FieldPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const decoded = decodeBinding(selection.binding) ?? { documentId: "site" as DocumentId, path: [] };
  const { documentId } = decoded;
  const body = readDocument(state.content, documentId);
  const publishedBody = readDocument(published, documentId);
  const root = documentSchema(documentId);
  const { container, focus } = body === undefined ? { container: [], focus: null } : resolveContainer(root, body, decoded.path);
  const meta = store.metaOf(documentId);

  const { issues, problems } = checkDocument(state.content, documentId, body);

  const ctx: FieldContext = { content: state.content, locale, pickMedia, select: onSelect };
  const focusBinding = focus ? encodeBinding(documentId, focus) : null;
  const node: NodeProps = { documentId, body, publishedBody, issues, focus: focusBinding, ctx, store };

  // A field clicked in the preview is brought into view and ready for typing.
  useEffect(() => {
    if (selection.from !== "preview" || !focusBinding) return;
    const element = panelRef.current?.querySelector<HTMLElement>(`[data-field="${CSS.escape(focusBinding)}"]`);
    if (!element) return;
    element.scrollIntoView({ block: "nearest", behavior: "smooth" });
    element.querySelector<HTMLElement>("textarea, input, select, button[role=radio][aria-checked=true], button")?.focus({ preventScroll: true });
  }, [selection.seq, selection.from, focusBinding]);

  if (body === undefined) {
    // A package, picture or benefit removed in this draft: say so, and offer it back.
    if (!isCollectionDocument(documentId) || publishedBody === undefined) return <p className="p-4 text-tm-small">ไม่พบเอกสารนี้</p>;
    return (
      <div className="grid gap-3 p-1">
        <p className="text-tm-small font-semibold">{documentLabel(published, documentId)}</p>
        <p className="text-tm-small">ลบในร่างแล้ว: หายจากหน้าเว็บเมื่อเผยแพร่</p>
        {meta.messages.length > 0 ? (
          <ul role="alert" className="grid gap-1 rounded-tm-control bg-tm-danger-wash px-3 py-2 text-tm-caption text-tm-danger">
            {meta.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
        <DiscardButton documentId={documentId} meta={meta} store={store} />
      </div>
    );
  }

  if (documentId === "catalog") {
    return (
      <div ref={panelRef} className="grid gap-4">
        <div className="border-b border-tm-line pb-3">
          <h2 className="text-tm-h4 font-semibold">{documentLabel(state.content, documentId)}</h2>
          <p className={`text-tm-caption ${statusLine(meta).tone}`}>{statusLine(meta).text}</p>
        </div>
        <CatalogManager content={state.content} published={published} store={store} onSelect={onSelect} />
      </div>
    );
  }

  const crumbs = container.map((_, index) => container.slice(0, index + 1));
  const containerSchema = schemaAt(root, container)!;
  const containerKind = fieldKind(containerSchema);
  const status = statusLine(meta);
  const heading = container.length === 0 ? documentLabel(state.content, documentId) : pathLabel(body, container).split(" › ").at(-1);

  return (
    <div ref={panelRef} className="grid gap-4">
      <div className="grid gap-2 border-b border-tm-line pb-3">
        <nav aria-label="ตำแหน่งของช่องที่เลือก" className="text-tm-caption" hidden={container.length === 0}>
          <ol className="flex flex-wrap items-center gap-1 text-tm-muted">
            <li>
              <button type="button" className="font-medium hover:text-tm-ink hover:underline" onClick={() => onSelect(encodeBinding(documentId, []))}>
                {documentLabel(state.content, documentId)}
              </button>
            </li>
            {crumbs.map((path) => (
              <li key={path.join("/")} className="flex items-center gap-1">
                <span aria-hidden="true">›</span>
                <button type="button" className="font-medium hover:text-tm-ink hover:underline" onClick={() => onSelect(encodeBinding(documentId, path))}>
                  {pathLabel(body, path).split(" › ").at(-1)}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <h2 className="text-tm-h4 font-semibold">{heading}</h2>
        <DocumentNotes content={state.content} documentId={documentId} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-tm-caption font-medium ${status.tone}`} data-doc-status={meta.status}>
            {status.text}
            {meta.status === "error" ? (
              <button type="button" className="ml-2 underline" onClick={() => store.retry(documentId)}>
                ลองอีกครั้ง
              </button>
            ) : null}
          </p>
          <DiscardButton key={documentId} documentId={documentId} meta={meta} store={store} />
        </div>
        {meta.status === "error" && meta.messages.length ? <p className="text-tm-caption text-tm-danger">{meta.messages.join(" · ")}</p> : null}
      </div>

      {meta.status === "conflict" ? <ConflictNotice documentId={documentId} meta={meta} body={body} store={store} /> : null}
      {problems.length > 0 ? (
        <div role="alert" className="rounded-tm-control border border-tm-danger bg-tm-danger-wash p-3 text-tm-caption text-tm-danger">
          <p className="font-semibold">ยังบันทึกไม่ได้เพราะขัดกับส่วนอื่นของเว็บ</p>
          <ul className="mt-1 list-disc pl-4">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {issues.length > 0 && countIssues(issues, container) === 0 ? (
        <p className="rounded-tm-control bg-tm-danger-wash px-3 py-2 text-tm-caption text-tm-danger">มีช่องที่ต้องแก้ในส่วนอื่นของเอกสารนี้: {pathLabel(body, issues[0].path.map(String))}</p>
      ) : null}

      {containerKind === "objectList" ? (
        <ListView schema={containerSchema} path={container} node={node} />
      ) : (
        <ObjectView schema={containerSchema} path={container} node={node} />
      )}
    </div>
  );
}
