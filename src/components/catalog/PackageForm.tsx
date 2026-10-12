"use client";

import Image from "next/image";
import { useId, type ReactNode } from "react";

import type { DraftStore } from "@/components/editor/draft-store";
import {
  BenefitListField,
  EnumField,
  inputClass,
  issuesAt,
  LocalizedField,
  MediaField,
  NumberField,
  PriceField,
  smallButton,
  TextField,
  TextLinesField,
  type FieldContext,
} from "@/components/editor/fields";
import { pageLabels } from "@/components/editor/labels";
import { diffPaths } from "@/lib/content/paths";
import type { DocumentId } from "@/lib/content/documents";
import { parseDocument, type FieldIssue } from "@/lib/content/draft-model";
import { shownBenefits } from "@/lib/content/package-facts";
import { formatNumber } from "@/lib/content/render";
import type { CatalogPackage, LocalizedText, SiteContent } from "@/lib/content/schema";

import { categories, groupsIn } from "./catalog-edit";

// One package, as a form laid out in the order an Admin fills it in: what it
// is, what it costs, what it gives, its terms, and how it shows on the site.
// Every change goes to the draft store at once and saves like any edit; the
// card at the top is what visitors will see of it.

type PackageFormProps = {
  content: SiteContent;
  store: DraftStore;
  id: string;
  /** Today in Thailand, to say whether the days it is set to show include it. */
  today: string;
  featured: boolean;
  onFeatured: (on: boolean) => void;
  onMove: (category: CatalogPackage["category"], group: string) => void;
  onCopy: () => void;
  onRemove: () => void;
  onClose: () => void;
  pickMedia: FieldContext["pickMedia"];
};

const emptyText: LocalizedText = { th: "", en: "" };

function Part({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-tm-line pt-5">
      <div>
        <h3 className="text-tm-small font-semibold">{title}</h3>
        {hint ? <p className="mt-0.5 text-tm-caption text-tm-muted">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-tm-caption font-semibold text-tm-muted">{label}</p>
      {children}
    </div>
  );
}

/** A localized line that a package may leave out: a box to say it has one, then the two languages. */
function OptionalText({ label, value, onChange, issues }: { label: string; value: LocalizedText | undefined; onChange: (value: LocalizedText | undefined) => void; issues: readonly FieldIssue[] }) {
  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-2 text-tm-small">
        <input type="checkbox" className="size-4 accent-tm-ink" checked={value !== undefined} onChange={(event) => onChange(event.target.checked ? emptyText : undefined)} />
        {label}
      </label>
      {value !== undefined ? <LocalizedField value={value} onChange={onChange} issues={issues} locale="th" label={label} /> : null}
    </div>
  );
}

/** The card as the home page shows a recommended package, small: the figure over the picture, then what comes with it. */
function CardPreview({ content, item }: { content: SiteContent; item: CatalogPackage }) {
  const image = item.image ? content.media[item.image] : undefined;
  const { ui } = content.site;
  // As visitors see it: without the benefits hidden on this package.
  const shown = shownBenefits(item);
  const speed = item.speed ? `${formatNumber(item.speed.download.value, "th")}/${formatNumber(item.speed.upload.value, "th")} ${item.speed.download.unit}` : null;
  return (
    <div className="max-w-[20rem] overflow-hidden rounded-tm-panel border border-tm-line bg-tm-canvas" role="group" aria-label="ตัวอย่างการ์ดที่ลูกค้าเห็น">
      <div className="relative aspect-[16/9] bg-tm-surface">
        {image ? <Image src={image.src} alt="" fill sizes="320px" className="object-cover" /> : <p className="absolute inset-0 grid place-items-center text-tm-caption text-tm-muted">ยังไม่มีรูป</p>}
        {image && (speed || item.allowance) ? <span className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/70" aria-hidden="true" /> : null}
        {speed ? (
          <span className={`tm-num absolute bottom-2.5 left-3.5 text-[1.75rem] font-light leading-none tracking-tight ${image ? "text-white" : ""}`}>{speed}</span>
        ) : item.allowance ? (
          <span className={`absolute bottom-2.5 left-3.5 right-3.5 line-clamp-2 text-tm-small font-medium ${image ? "text-white" : ""}`}>{item.allowance.th}</span>
        ) : null}
      </div>
      <div className="grid gap-1 p-4">
        <p className="font-medium">{item.name.th || "ยังไม่มีชื่อ"}</p>
        <p className="text-tm-caption text-tm-muted">{item.contract ? `${ui.contract.th} ${item.contract.th}` : item.validity ? `${ui.validity.th} ${item.validity.th}` : ""}</p>
        {shown.length > 0 ? (
          <ul className="mt-1 flex gap-1.5" aria-label="สิทธิประโยชน์">
            {shown.slice(0, 4).map((id) => {
              const icon = content.media[content.benefits[id]?.icon ?? ""];
              return (
                <li key={id} className="grid size-8 place-items-center overflow-hidden rounded-[0.625rem] border border-tm-line bg-white p-1" title={content.benefits[id]?.label.th}>
                  {icon ? <Image src={icon.src} width={icon.width} height={icon.height} alt={content.benefits[id]?.label.th ?? ""} sizes="32px" className="size-full object-contain" /> : null}
                </li>
              );
            })}
            {shown.length > 4 ? <li className="tm-num grid h-8 min-w-8 place-items-center rounded-[0.625rem] bg-tm-surface px-1.5 text-tm-caption font-semibold text-tm-muted">+{shown.length - 4}</li> : null}
          </ul>
        ) : null}
        <p className="mt-1">
          <span className="tm-num text-tm-h3 font-light text-tm-red">{formatNumber(item.price.amount, "th")}</span>{" "}
          <span className="text-tm-caption">{(item.price.per === "month" ? ui.perMonth : ui.baht).th}</span>
          {item.price.regularAmount !== undefined ? (
            <span className="ml-2 text-tm-caption text-tm-muted">
              {ui.regularPrice.th} <s className="tm-num">{formatNumber(item.price.regularAmount, "th")}</s>
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function PackageForm({ content, store, id, today, featured, onFeatured, onMove, onCopy, onRemove, onClose, pickMedia }: PackageFormProps) {
  const titleId = useId();
  const documentId = `package:${id}` as DocumentId;
  const item = content.catalog.find((entry) => entry.id === id);
  const meta = store.metaOf(documentId);
  if (!item) return null;

  const parsed = parseDocument(documentId, item);
  const issues: FieldIssue[] = parsed.ok ? meta.issues : parsed.issues;
  const at = (...path: string[]) => issuesAt(issues, path);
  const set = (path: string[], value: unknown) => store.edit(documentId, path, value);
  const ctx: FieldContext = { content, locale: "th", pickMedia, select: () => undefined };

  const groups = categories.flatMap((category) => groupsIn(content, category));
  const groupValue = `${item.category}/${item.group}`;
  const waiting = item.showFrom !== undefined && today < item.showFrom;
  const over = item.showUntil !== undefined && item.showUntil < today;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex h-dvh w-[min(36rem,100vw)] flex-col bg-tm-canvas shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-tm-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-tm-caption text-tm-muted">แพ็กเกจ · {pageLabels[item.category]}</p>
            <h2 id={titleId} className="truncate text-tm-h4 font-semibold">
              {item.name.th || "ยังไม่มีชื่อ"}
            </h2>
            <p className="text-tm-caption text-tm-muted" data-doc-status={meta.status} role="status">
              {meta.status === "saving"
                ? "กำลังบันทึก…"
                : meta.status === "pending"
                  ? "มีการแก้ไข รอบันทึก"
                  : meta.status === "invalid"
                    ? "มีช่องที่ต้องแก้ก่อนจึงจะบันทึกได้"
                    : meta.status === "error"
                      ? "บันทึกไม่สำเร็จ"
                      : meta.status === "conflict"
                        ? "มีคนแก้พร้อมกัน"
                        : meta.revision > 0
                          ? "บันทึกร่างแล้ว · ยังไม่เผยแพร่"
                          : "ตรงกับฉบับที่เผยแพร่"}
            </p>
          </div>
          <button type="button" className={smallButton} onClick={onClose}>
            ปิด
          </button>
        </header>

        {/* The scroller is a plain block: as a grid of a fixed height it would squeeze the card (its overflow is hidden) to nothing. */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-5">
          {meta.status === "conflict" ? (
            <div role="alert" className="rounded-tm-control border border-tm-danger bg-tm-danger-wash p-3 text-tm-small">
              <p className="font-semibold text-tm-danger">ผู้ดูแลอีกคนบันทึกแพ็กเกจนี้หลังจากที่คุณเปิดไว้</p>
              <p className="mt-1">การแก้ของคุณยังอยู่ในหน้านี้แต่ยังไม่ถูกบันทึก ({diffPaths(item, meta.conflict?.body ?? store.publishedBody(documentId)).length} ช่องต่างกัน) เลือกว่าจะใช้ฉบับไหน:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={smallButton} onClick={() => store.keepMine(documentId)}>
                  ใช้ฉบับของฉัน (บันทึกทับ)
                </button>
                <button type="button" className={smallButton} onClick={() => store.takeTheirs(documentId)}>
                  ใช้ฉบับล่าสุดในระบบ (ทิ้งที่ฉันแก้)
                </button>
              </div>
            </div>
          ) : null}
          {meta.messages.length > 0 ? (
            <ul role="alert" className="grid gap-1 rounded-tm-control bg-tm-danger-wash px-3 py-2 text-tm-caption text-tm-danger">
              {meta.messages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}

          <CardPreview content={content} item={item} />

          <Part title="พื้นฐาน">
            <Labelled label="ชื่อแพ็กเกจ">
              <LocalizedField value={item.name} onChange={(value) => set(["name"], value)} issues={at("name")} locale="th" label="ชื่อแพ็กเกจ" />
            </Labelled>
            <Labelled label="อยู่ในกลุ่ม (ย้ายได้)">
              <select
                aria-label="กลุ่มของแพ็กเกจ"
                className={inputClass}
                value={groupValue}
                onChange={(event) => {
                  const [category, ...rest] = event.target.value.split("/");
                  onMove(category as CatalogPackage["category"], rest.join("/"));
                }}
              >
                {groups.map((entry) => (
                  <option key={`${entry.category}/${entry.group}`} value={`${entry.category}/${entry.group}`}>
                    {pageLabels[entry.category]} › {entry.name}
                  </option>
                ))}
              </select>
            </Labelled>
            <Labelled label="รูปของแพ็กเกจ (ใช้กับการ์ดหน้าแรกและหน้ารายละเอียด)">
              <MediaField value={item.image} onChange={(value) => set(["image"], value)} optional ctx={ctx} label="รูปของแพ็กเกจ" issues={at("image")} />
            </Labelled>
          </Part>

          <Part title="ราคา" hint="กรอกตามราคาจริงของโปร ระบบไม่เติมราคาให้เอง">
            <PriceField value={item.price} onChange={(value) => set(["price"], value)} issues={at("price")} />
          </Part>

          <Part title="สิ่งที่ลูกค้าได้">
            <div className="grid gap-1.5">
              <label className="flex items-center gap-2 text-tm-small">
                <input
                  type="checkbox"
                  className="size-4 accent-tm-ink"
                  checked={item.speed !== undefined}
                  // Starts at 0, which cannot be saved: the Admin types the real speed.
                  onChange={(event) => set(["speed"], event.target.checked ? { download: { value: 0, unit: "Mbps" }, upload: { value: 0, unit: "Mbps" } } : undefined)}
                />
                ความเร็วอินเทอร์เน็ต (ดาวน์โหลด/อัปโหลด)
              </label>
              {item.speed ? (
                <div className="grid grid-cols-2 gap-3 rounded-tm-control border border-tm-line p-3">
                  {(["download", "upload"] as const).map((side) => (
                    <div key={side} className="grid gap-1.5">
                      <p className="text-tm-caption font-semibold text-tm-muted">{side === "download" ? "ดาวน์โหลด" : "อัปโหลด"}</p>
                      <NumberField value={item.speed![side].value} label={side === "download" ? "ความเร็วดาวน์โหลด" : "ความเร็วอัปโหลด"} issues={at("speed", side, "value")} onChange={(value) => set(["speed", side, "value"], value)} />
                      <EnumField value={item.speed![side].unit} options={["Mbps", "Gbps"]} label={`หน่วย${side === "download" ? "ดาวน์โหลด" : "อัปโหลด"}`} onChange={(unit) => set(["speed", side, "unit"], unit)} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <OptionalText label="ปริมาณการใช้งาน (เน็ต โทร หรือแอป)" value={item.allowance} onChange={(value) => set(["allowance"], value)} issues={at("allowance")} />
            <OptionalText label="เหมาะกับ" value={item.audience} onChange={(value) => set(["audience"], value)} issues={at("audience")} />
            <OptionalText label="อายุการใช้งาน" value={item.validity} onChange={(value) => set(["validity"], value)} issues={at("validity")} />
            <OptionalText label="สัญญา" value={item.contract} onChange={(value) => set(["contract"], value)} issues={at("contract")} />
            <div className="grid gap-1.5">
              <label className="flex items-center gap-2 text-tm-small">
                <input type="checkbox" className="size-4 accent-tm-ink" checked={item.dialCode !== undefined} onChange={(event) => set(["dialCode"], event.target.checked ? "" : undefined)} />
                รหัสกดสมัครจากมือถือ
              </label>
              {item.dialCode !== undefined ? <TextField value={item.dialCode} onChange={(value) => set(["dialCode"], value)} issues={at("dialCode")} label="รหัสกดสมัคร" placeholder="*900*7129#" /> : null}
            </div>
            <Labelled label="สิทธิประโยชน์">
              <BenefitListField
                value={item.benefits}
                onChange={(value) => set(["benefits"], value)}
                hidden={item.hiddenBenefits ?? []}
                onHiddenChange={(value) => set(["hiddenBenefits"], value)}
                ctx={ctx}
                label="สิทธิประโยชน์"
              />
              <p className="text-tm-caption text-tm-muted">รายการที่ซ่อนยังอยู่ในแพ็กเกจ แต่ไม่แสดงบนเว็บ กด “แสดง” เพื่อเปิดกลับ</p>
            </Labelled>
          </Part>

          <Part title="รายละเอียดและเงื่อนไข">
            <Labelled label="รายละเอียด">
              <TextLinesField value={item.details} onChange={(value) => set(["details"], value)} issues={at("details")} locale="th" label="รายละเอียด" empty={emptyText} />
            </Labelled>
            <Labelled label="เงื่อนไข">
              <TextLinesField value={item.conditions} onChange={(value) => set(["conditions"], value)} issues={at("conditions")} locale="th" label="เงื่อนไข" empty={emptyText} />
            </Labelled>
          </Part>

          <Part title="การแสดงบนเว็บ">
            <Labelled label="สถานะ">
              <EnumField value={item.review.status} options={["verified", "unverified", "hidden"]} label="สถานะ" onChange={(status) => set(["review", "status"], status)} />
              {item.review.status === "unverified" ? <p className="text-tm-caption text-tm-muted">แสดงบนเว็บพร้อมหมายเหตุว่าราคายังไม่ยืนยัน เปลี่ยนเป็น “ธุรกิจยืนยันแล้ว” เมื่อตรวจราคาและเงื่อนไขแล้ว</p> : null}
            </Labelled>
            <label className="flex items-start gap-2 text-tm-small">
              <input type="checkbox" className="mt-0.5 size-4 accent-tm-ink" checked={featured} onChange={(event) => onFeatured(event.target.checked)} />
              <span>
                แนะนำในหน้าแรก
                <span className="block text-tm-caption text-tm-muted">ขึ้นเป็นการ์ดในส่วน “โปรแนะนำ” ของหน้าแรก ต้องมีรูปของแพ็กเกจ</span>
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["showFrom", "showUntil"] as const).map((key) => (
                <label key={key} className="grid gap-1.5 text-tm-caption font-semibold text-tm-muted">
                  {key === "showFrom" ? "เริ่มแสดงวันที่" : "แสดงถึงวันที่"}
                  <input type="date" className={inputClass} value={item[key] ?? ""} aria-invalid={at(key).length > 0} onChange={(event) => set([key], event.target.value || undefined)} />
                </label>
              ))}
            </div>
            <p className="text-tm-caption text-tm-muted">
              {waiting
                ? `ยังไม่แสดง: จะเริ่มแสดงวันที่ ${item.showFrom}`
                : over
                  ? `พ้นช่วงแสดงแล้ว (ถึง ${item.showUntil}): ไม่แสดงบนเว็บ`
                  : "เว้นว่างได้: ไม่ใส่วันเริ่มคือแสดงทันที ไม่ใส่วันสิ้นสุดคือแสดงตลอด หน้าเว็บอัปเดตตามวันภายในหนึ่งวัน"}
            </p>
            <Labelled label="บันทึกภายใน (ไม่แสดงบนเว็บ)">
              <TextLinesField value={item.review.notes} onChange={(value) => set(["review", "notes"], value)} issues={at("review", "notes")} locale="th" label="บันทึกภายใน" empty="" />
            </Labelled>
          </Part>
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-tm-line px-5 py-3">
          <button type="button" className={smallButton} onClick={onCopy}>
            ทำสำเนา
          </button>
          <button type="button" className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`} onClick={onRemove}>
            ลบแพ็กเกจ
          </button>
          {meta.revision > 0 || meta.status !== "saved" ? (
            <button type="button" className={smallButton} disabled={meta.status === "saving"} onClick={() => void store.discard(documentId)}>
              ทิ้งร่าง (กลับเป็นฉบับที่เผยแพร่)
            </button>
          ) : null}
          <button type="button" className={`${smallButton} ml-auto border-tm-ink bg-tm-ink text-tm-on-ink`} onClick={onClose}>
            เสร็จ
          </button>
        </footer>
      </div>
    </div>
  );
}
