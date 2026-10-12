"use client";

import Image from "next/image";
import { useId, useState, type ReactNode } from "react";

import { pagePaths, pageDocumentIds } from "@/lib/content/documents";
import type { FieldIssue } from "@/lib/content/draft-model";
import { resolveLink } from "@/lib/content/render";
import type { Cta, Link as ContentLink, LinkTarget, LocalizedText, Price, SiteContent } from "@/lib/content/schema";
import { contactChannel } from "@/lib/content/schema";
import { defaultTheme, themeProblems, toneIds, type ThemeColors, type Tone } from "@/lib/content/theme";
import type { Locale } from "@/lib/i18n/locales";

import { fieldLabel, pageLabels, valueLabel } from "./labels";
import { anchorsFor } from "./usage";

// Controls of the Mirror editor, one per kind of content value (schema-walk.ts
// decides which). Each takes the current value and reports a whole new value;
// the store applies it to the document and the preview renders it at once.

export const inputClass =
  "block w-full rounded-tm-control border border-tm-line bg-tm-canvas px-3 py-2 text-tm-small text-tm-ink transition-colors duration-tm-fast placeholder:text-tm-muted hover:border-tm-muted focus:border-tm-ink aria-[invalid=true]:border-tm-danger";
export const smallButton =
  "inline-flex min-h-8 items-center justify-center gap-1 rounded-tm-control border border-tm-line bg-tm-canvas px-2.5 text-tm-caption font-semibold text-tm-ink transition-colors duration-tm-fast hover:border-tm-ink disabled:cursor-not-allowed disabled:opacity-50";

export type FieldContext = {
  content: SiteContent;
  locale: Locale;
  /** Opens the media picker; the chosen asset id is passed to `onPick`. */
  pickMedia: (current: string | undefined, onPick: (id: string) => void) => void;
  /** Selects another binding in the panel (and the preview). */
  select: (binding: string) => void;
};

/** Issues at `path` or inside it, relative to it. */
export function issuesAt(issues: readonly FieldIssue[], path: readonly string[]): FieldIssue[] {
  return issues
    .filter((issue) => path.every((segment, index) => String(issue.path[index]) === segment))
    .map((issue) => ({ path: issue.path.slice(path.length), message: issue.message }));
}

function IssueText({ issues, id }: { issues: readonly FieldIssue[]; id?: string }) {
  if (issues.length === 0) return null;
  return (
    <p id={id} className="mt-1 text-tm-caption font-medium text-tm-danger">
      {Array.from(new Set(issues.map((issue) => issue.message))).join(" · ")}
    </p>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  render,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  render?: (option: T) => ReactNode;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={option === value}
          onClick={() => onChange(option)}
          className="inline-flex min-h-9 items-center gap-2 rounded-tm-control border border-tm-line px-2.5 text-tm-caption font-medium hover:border-tm-muted aria-checked:border-tm-ink aria-checked:bg-tm-ink aria-checked:text-tm-on-ink"
        >
          {render ? render(option) : valueLabel(option)}
        </button>
      ))}
    </div>
  );
}

// Text -----------------------------------------------------------------------------

const languageNames: Record<Locale, string> = { th: "ไทย", en: "English" };

export function LocalizedField({
  value,
  onChange,
  issues,
  locale,
  label,
}: {
  value: LocalizedText;
  onChange: (value: LocalizedText) => void;
  issues: readonly FieldIssue[];
  locale: Locale;
  label: string;
}) {
  const id = useId();
  return (
    <div className="grid gap-2">
      {(["th", "en"] as const).map((lang) => {
        const own = issuesAt(issues, [lang]);
        return (
          <div key={lang}>
            <label
              htmlFor={`${id}-${lang}`}
              className={`flex items-center gap-1.5 text-tm-caption ${lang === locale ? "font-semibold text-tm-ink" : "font-medium text-tm-muted"}`}
              title={lang === locale ? "ภาษาที่แสดงในตัวอย่างตอนนี้" : undefined}
            >
              <span className="sr-only">{label} </span>
              {languageNames[lang]}
              {lang === locale ? <span aria-hidden="true" className="size-1.5 rounded-full bg-[#2563eb]" /> : null}
            </label>
            <textarea
              id={`${id}-${lang}`}
              lang={lang}
              rows={1}
              value={value[lang]}
              onChange={(event) => onChange({ ...value, [lang]: event.target.value })}
              aria-invalid={own.length > 0 || undefined}
              aria-describedby={own.length > 0 ? `${id}-${lang}-error` : undefined}
              className={`${inputClass} mt-1 min-h-[2.5rem] resize-y [field-sizing:content]`}
            />
            <IssueText issues={own} id={`${id}-${lang}-error`} />
          </div>
        );
      })}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  issues,
  label,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  issues: readonly FieldIssue[];
  label: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <input
        id={id}
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={issues.length > 0 || undefined}
        className={inputClass}
      />
      <IssueText issues={issues} />
    </div>
  );
}

/** Keeps what is typed until it is a number, so "1." or "" never reach the page. */
export function NumberField({
  value,
  onChange,
  issues,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  issues: readonly FieldIssue[];
  label: string;
}) {
  const [text, setText] = useState(String(value));
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(String(value));
  }
  const number = text.trim() === "" ? Number.NaN : Number(text.replace(/,/g, ""));
  const typing = !Number.isFinite(number);
  return (
    <div>
      <input
        aria-label={label}
        inputMode="decimal"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          const next = Number(event.target.value.replace(/,/g, ""));
          if (event.target.value.trim() !== "" && Number.isFinite(next)) {
            setSeen(next);
            onChange(next);
          }
        }}
        aria-invalid={typing || issues.length > 0 || undefined}
        className={`${inputClass} tm-num max-w-[12rem]`}
      />
      {typing ? <p className="mt-1 text-tm-caption font-medium text-tm-danger">ใส่ตัวเลข เช่น 599 หรือ 31.03</p> : <IssueText issues={issues} />}
    </div>
  );
}

export function BooleanField({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-9 items-center gap-2 text-tm-small">
      <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-tm-ink" />
      {label}
    </label>
  );
}

export function EnumField({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  label: string;
}) {
  if (options.length <= 4) return <Segmented label={label} value={value} options={options} onChange={onChange} />;
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} max-w-[20rem]`}>
      {options.map((option) => (
        <option key={option} value={option}>
          {valueLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Lists of lines --------------------------------------------------------------------

/** Lines of text (details, conditions, paragraphs): add, remove and reorder. */
export function TextLinesField<T extends LocalizedText | string>({
  value,
  onChange,
  issues,
  locale,
  label,
  empty,
}: {
  value: T[];
  onChange: (value: T[]) => void;
  issues: readonly FieldIssue[];
  locale: Locale;
  label: string;
  empty: T;
}) {
  const move = (from: number, to: number) => {
    const next = value.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <div className="grid gap-3">
      {value.length === 0 ? <p className="text-tm-caption text-tm-muted">ยังไม่มีรายการ</p> : null}
      {value.map((line, index) => {
        const own = issuesAt(issues, [String(index)]);
        return (
          <div key={index} className="rounded-tm-control border border-tm-line p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-tm-caption font-semibold text-tm-muted">บรรทัด {index + 1}</span>
              <span className="flex gap-1">
                <button type="button" className={smallButton} disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`เลื่อน${label}บรรทัด ${index + 1} ขึ้น`}>
                  ↑
                </button>
                <button
                  type="button"
                  className={smallButton}
                  disabled={index === value.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`เลื่อน${label}บรรทัด ${index + 1} ลง`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={smallButton}
                  onClick={() => onChange(value.filter((_, position) => position !== index))}
                  aria-label={`ลบ${label}บรรทัด ${index + 1}`}
                >
                  ลบ
                </button>
              </span>
            </div>
            {typeof line === "string" ? (
              <TextField
                value={line}
                label={`${label} บรรทัด ${index + 1}`}
                issues={own}
                onChange={(text) => onChange(value.map((entry, position) => (position === index ? (text as T) : entry)))}
              />
            ) : (
              <LocalizedField
                value={line}
                label={`${label} บรรทัด ${index + 1}`}
                locale={locale}
                issues={own}
                onChange={(text) => onChange(value.map((entry, position) => (position === index ? (text as T) : entry)))}
              />
            )}
          </div>
        );
      })}
      <div>
        <button type="button" className={smallButton} onClick={() => onChange([...value, empty])}>
          + เพิ่มบรรทัด
        </button>
      </div>
    </div>
  );
}

// Appearance ------------------------------------------------------------------------

const toneSwatch: Record<Tone, string> = {
  canvas: "var(--tm-color-canvas)",
  surface: "var(--tm-color-surface)",
  wash: "var(--tm-color-red-wash)",
  ink: "var(--tm-tone-ink-canvas)",
};

export function ToneField({ value, onChange, label }: { value: Tone; onChange: (value: Tone) => void; label: string }) {
  return (
    <Segmented
      label={label}
      value={value}
      options={toneIds}
      onChange={onChange}
      render={(option) => (
        <>
          <span aria-hidden="true" className="size-4 rounded-full border border-tm-line" style={{ background: toneSwatch[option] }} />
          {valueLabel(option)}
        </>
      )}
    />
  );
}

export function ColorField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(value);
  }
  const valid = /^#[0-9a-fA-F]{6}$/.test(text);
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (เลือกสี)`}
          value={value}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          className="h-9 w-12 cursor-pointer rounded-tm-control border border-tm-line bg-tm-canvas p-0.5"
        />
        <input
          aria-label={`${label} (รหัสสี)`}
          value={text}
          spellCheck={false}
          onChange={(event) => {
            setText(event.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(event.target.value)) {
              const next = event.target.value.toLowerCase();
              setSeen(next);
              onChange(next);
            }
          }}
          aria-invalid={!valid || undefined}
          className={`${inputClass} tm-num w-[8rem] font-mono`}
        />
      </div>
      {valid ? null : <p className="mt-1 text-tm-caption font-medium text-tm-danger">ใช้รหัสสีแบบ #rrggbb</p>}
    </div>
  );
}

export function ThemeField({ value, onChange }: { value: ThemeColors; onChange: (value: ThemeColors) => void }) {
  const problems = themeProblems(value);
  const keys = Object.keys(defaultTheme) as (keyof ThemeColors)[];
  return (
    <div className="grid gap-3">
      {keys.map((key) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center">
          <span className="text-tm-small font-medium">{fieldLabel(key, "theme")}</span>
          <ColorField value={value[key]} label={fieldLabel(key, "theme")} onChange={(color) => onChange({ ...value, [key]: color })} />
        </div>
      ))}
      <div role="status" className={`rounded-tm-control px-3 py-2 text-tm-caption ${problems.length ? "bg-tm-danger-wash text-tm-danger" : "bg-tm-success-wash text-tm-success"}`}>
        {problems.length ? (
          <>
            <p className="font-semibold">สีคู่นี้อ่านยาก จึงยังบันทึกไม่ได้</p>
            <ul className="mt-1 list-disc pl-4">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="font-medium">ตัวอักษรทุกคู่สีอ่านง่าย (ความต่างอย่างน้อย 4.5:1)</p>
        )}
      </div>
      <div>
        <button type="button" className={smallButton} onClick={() => onChange(defaultTheme)}>
          ใช้สีเริ่มต้นของ truegetherth
        </button>
      </div>
    </div>
  );
}

// Media and references --------------------------------------------------------------

export function MediaField({
  value,
  onChange,
  optional,
  ctx,
  label,
  issues,
}: {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  optional: boolean;
  ctx: FieldContext;
  label: string;
  issues: readonly FieldIssue[];
}) {
  const asset = value ? ctx.content.media[value] : undefined;
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-tm-control border border-tm-line bg-tm-surface">
          {asset ? (
            <Image src={asset.src} alt="" width={asset.width} height={asset.height} sizes="112px" className="max-h-full w-auto object-contain" />
          ) : (
            <span className="text-tm-caption text-tm-muted">ไม่มีรูป</span>
          )}
        </div>
        <div className="grid min-w-0 gap-1.5">
          {asset ? <p className="line-clamp-2 text-tm-caption text-tm-muted">{asset.alt.th}</p> : null}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={smallButton} onClick={() => ctx.pickMedia(value, (id) => onChange(id))} aria-label={`เปลี่ยน${label}`}>
              {asset ? "เปลี่ยนรูป" : "เลือกรูป"}
            </button>
            {asset ? (
              <button type="button" className={smallButton} onClick={() => ctx.select(`media:${value}`)}>
                แก้คำอธิบายรูป
              </button>
            ) : null}
            {optional && asset ? (
              <button type="button" className={smallButton} onClick={() => onChange(undefined)}>
                ไม่ใช้รูป
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <IssueText issues={issues} />
    </div>
  );
}

export function MediaListField({ value, onChange, ctx, label }: { value: string[]; onChange: (value: string[]) => void; ctx: FieldContext; label: string }) {
  return (
    <div className="grid gap-3">
      {value.map((id, index) => (
        <MediaField
          key={`${index}-${id}`}
          value={id}
          optional={false}
          ctx={ctx}
          issues={[]}
          label={`${label} ${index + 1}`}
          onChange={(next) => next && onChange(value.map((entry, position) => (position === index ? next : entry)))}
        />
      ))}
    </div>
  );
}

/**
 * A package's benefits. Where `hidden` is given (Packages and promos), each
 * line can be hidden: it stays in the list, visitors do not see it, and it
 * comes back with one click.
 */
export function BenefitListField({
  value,
  onChange,
  ctx,
  label,
  hidden,
  onHiddenChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  ctx: FieldContext;
  label: string;
  hidden?: string[];
  onHiddenChange?: (value: string[]) => void;
}) {
  const options = Object.entries(ctx.content.benefits);
  const off = hidden ?? [];
  return (
    <div className="grid gap-2">
      {value.length === 0 ? <p className="text-tm-caption text-tm-muted">ไม่มีสิทธิประโยชน์</p> : null}
      {value.map((id, index) => (
        <div key={`${index}-${id}`} className="flex items-center gap-2" data-benefit-hidden={off.includes(id) ? "" : undefined}>
          <select
            aria-label={`${label} ${index + 1}`}
            value={id}
            onChange={(event) => onChange(value.map((entry, position) => (position === index ? event.target.value : entry)))}
            className={`${inputClass} ${off.includes(id) ? "text-tm-muted line-through" : ""}`}
          >
            {options.map(([key, entry]) => (
              <option key={key} value={key}>
                {entry.label.th}
              </option>
            ))}
          </select>
          {onHiddenChange ? (
            <button
              type="button"
              className={`${smallButton} shrink-0`}
              aria-pressed={off.includes(id)}
              aria-label={`${off.includes(id) ? "แสดง" : "ซ่อน"} ${ctx.content.benefits[id]?.label.th ?? id}`}
              onClick={() => onHiddenChange(off.includes(id) ? off.filter((entry) => entry !== id) : [...off, id])}
            >
              {off.includes(id) ? "ซ่อนอยู่ · แสดง" : "ซ่อน"}
            </button>
          ) : null}
          <button type="button" className={`${smallButton} shrink-0`} onClick={() => ctx.select(`benefit:${id}`)}>
            แก้ข้อความ
          </button>
        </div>
      ))}
    </div>
  );
}

/** One package from the catalog (hidden ones cannot be chosen), and a way to edit it. */
export function PackageField({ value, onChange, ctx, label }: { value: string; onChange: (value: string) => void; ctx: FieldContext; label: string }) {
  const visible = ctx.content.catalog.filter((item) => item.review.status !== "hidden");
  const categories = Array.from(new Set(visible.map((item) => item.category)));
  return (
    <div className="flex items-center gap-2">
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {categories.map((category) => (
          <optgroup key={category} label={valueLabel(category)}>
            {visible
              .filter((item) => item.category === category)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name.th}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <button type="button" className={`${smallButton} shrink-0`} onClick={() => ctx.select(`package:${value}`)}>
        แก้แพ็กเกจ
      </button>
    </div>
  );
}

// Links, buttons and prices ---------------------------------------------------------

const targetKinds = ["page", "external", "contact"] as const;

function defaultTarget(kind: LinkTarget["kind"]): LinkTarget {
  switch (kind) {
    case "page":
      return { kind: "page", path: "/" };
    case "external":
      return { kind: "external", url: "https://" };
    case "contact":
      return { kind: "contact", channel: "line-sales" };
  }
}

function destination(target: LinkTarget, ctx: FieldContext): string {
  try {
    return resolveLink(target, ctx.locale, ctx.content.site).href;
  } catch {
    return "";
  }
}

export function TargetField({
  value,
  onChange,
  issues,
  ctx,
  label,
}: {
  value: LinkTarget;
  onChange: (value: LinkTarget) => void;
  issues: readonly FieldIssue[];
  ctx: FieldContext;
  label: string;
}) {
  const pages = pageDocumentIds.map((id) => ({ path: pagePaths[id], label: pageLabels[id] }));
  const anchors = value.kind === "page" ? anchorsFor(ctx.content, value.path) : [];
  const href = destination(value, ctx);
  return (
    <div className="grid gap-2">
      <Segmented label={`${label}: ชนิดปลายทาง`} value={value.kind} options={targetKinds} onChange={(kind) => kind !== value.kind && onChange(defaultTarget(kind))} />
      {value.kind === "page" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            aria-label={`${label}: หน้า`}
            value={value.path}
            onChange={(event) => onChange({ kind: "page", path: event.target.value })}
            className={inputClass}
          >
            {pages.map((page) => (
              <option key={page.path} value={page.path}>
                {page.label}
              </option>
            ))}
          </select>
          {anchors.length > 0 ? (
            <select
              aria-label={`${label}: หมวดในหน้า`}
              value={value.hash ?? ""}
              onChange={(event) => onChange({ kind: "page", path: value.path, ...(event.target.value ? { hash: event.target.value } : {}) })}
              className={inputClass}
            >
              <option value="">ทั้งหน้า</option>
              {anchors.map((anchor) => (
                <option key={anchor.id} value={anchor.id}>
                  {anchor.heading}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      ) : null}
      {value.kind === "external" ? (
        <TextField value={value.url} label={`${label}: ลิงก์`} placeholder="https://" issues={issuesAt(issues, ["url"])} onChange={(url) => onChange({ kind: "external", url })} />
      ) : null}
      {value.kind === "contact" ? (
        <select
          aria-label={`${label}: ช่องทาง`}
          value={value.channel}
          onChange={(event) => onChange({ kind: "contact", channel: contactChannel.parse(event.target.value) })}
          className={`${inputClass} max-w-[20rem]`}
        >
          {contactChannel.options.map((option) => (
            <option key={option} value={option}>
              {valueLabel(option)}
            </option>
          ))}
        </select>
      ) : null}
      <IssueText issues={issues.filter((issue) => issue.path[0] !== "url")} />
      {href ? (
        <p className="break-all text-tm-caption text-tm-muted">
          ปลายทางจริง: <span className="font-mono">{href}</span>
        </p>
      ) : null}
    </div>
  );
}

function Sub({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <span className="text-tm-caption font-semibold text-tm-muted">{label}</span>
      {children}
    </div>
  );
}

export function CtaField({ value, onChange, issues, ctx, label }: { value: Cta; onChange: (value: Cta) => void; issues: readonly FieldIssue[]; ctx: FieldContext; label: string }) {
  return (
    <div className="grid gap-3 rounded-tm-control border border-tm-line p-3">
      <Sub label="ข้อความบนปุ่ม">
        <LocalizedField value={value.label} label={`${label}: ข้อความ`} locale={ctx.locale} issues={issuesAt(issues, ["label"])} onChange={(text) => onChange({ ...value, label: text })} />
      </Sub>
      <Sub label="ปลายทาง">
        <TargetField value={value.target} label={label} ctx={ctx} issues={issuesAt(issues, ["target"])} onChange={(target) => onChange({ ...value, target })} />
      </Sub>
      <Sub label="รูปแบบปุ่ม">
        <Segmented label={`${label}: รูปแบบ`} value={value.style} options={["primary", "secondary"] as const} onChange={(style) => onChange({ ...value, style })} />
      </Sub>
      <p className="text-tm-caption text-tm-muted">
        รหัสติดตามคลิก: <span className="font-mono">{value.id}</span> (คงเดิมเมื่อแก้ข้อความ)
      </p>
    </div>
  );
}

export function LinkField({
  value,
  onChange,
  issues,
  ctx,
  label,
}: {
  value: ContentLink;
  onChange: (value: ContentLink) => void;
  issues: readonly FieldIssue[];
  ctx: FieldContext;
  label: string;
}) {
  return (
    <div className="grid gap-3 rounded-tm-control border border-tm-line p-3">
      <Sub label="ข้อความลิงก์">
        <LocalizedField value={value.label} label={`${label}: ข้อความ`} locale={ctx.locale} issues={issuesAt(issues, ["label"])} onChange={(text) => onChange({ ...value, label: text })} />
      </Sub>
      <Sub label="ปลายทาง">
        <TargetField value={value.target} label={label} ctx={ctx} issues={issuesAt(issues, ["target"])} onChange={(target) => onChange({ ...value, target })} />
      </Sub>
    </div>
  );
}

export function PriceField({ value, onChange, issues }: { value: Price; onChange: (value: Price) => void; issues: readonly FieldIssue[] }) {
  return (
    <div className="grid gap-3 rounded-tm-control border border-tm-line p-3">
      <Sub label={fieldLabel("amount")}>
        <NumberField value={value.amount} label={fieldLabel("amount")} issues={issuesAt(issues, ["amount"])} onChange={(amount) => onChange({ ...value, amount })} />
      </Sub>
      <Sub label={fieldLabel("regularAmount")}>
        <label className="flex items-center gap-2 text-tm-small">
          <input
            type="checkbox"
            className="size-4 accent-tm-ink"
            checked={value.regularAmount !== undefined}
            onChange={(event) => {
              const rest: Price = { ...value };
              delete rest.regularAmount;
              // Starts equal to the offer, which cannot be saved: the Admin
              // must type the real regular price, the editor never makes one up.
              onChange(event.target.checked ? { ...rest, regularAmount: value.amount } : rest);
            }}
          />
          แสดงราคาปกติแบบขีดฆ่า
        </label>
        {value.regularAmount !== undefined ? (
          <NumberField
            value={value.regularAmount}
            label={fieldLabel("regularAmount")}
            issues={issuesAt(issues, ["regularAmount"])}
            onChange={(regularAmount) => onChange({ ...value, regularAmount })}
          />
        ) : null}
      </Sub>
      <Sub label={fieldLabel("per")}>
        <Segmented label={fieldLabel("per")} value={value.per} options={["month", "package", "once"] as const} onChange={(per) => onChange({ ...value, per })} />
      </Sub>
      <Sub label={fieldLabel("vat")}>
        <Segmented label={fieldLabel("vat")} value={value.vat} options={["included", "excluded", "unknown"] as const} onChange={(vat) => onChange({ ...value, vat })} />
      </Sub>
      <IssueText issues={issues.filter((issue) => issue.path.length === 0)} />
    </div>
  );
}
