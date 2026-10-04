"use client";

import { useState } from "react";

import type { DocumentId } from "@/lib/content/documents";
import { formatNumber } from "@/lib/content/render";
import type { CatalogPackage, CategoryId, SiteContent } from "@/lib/content/schema";

import type { DraftStore } from "./draft-store";
import { smallButton } from "./fields";
import { pageLabels, valueLabel } from "./labels";
import { moveItem } from "./list-edit";
import { benefitUsage, packagePages } from "./usage";

// Packages and benefits as lists (R4): add, edit, hide, remove and reorder.
// Every change is an ordinary draft — a package document, a tombstone or the
// "catalog" order document — so it autosaves, shows in the preview and is
// checked like any other edit: a package or benefit the site still uses
// cannot be removed, and a shown package needs a price.

type CatalogManagerProps = {
  content: SiteContent;
  published: SiteContent;
  store: DraftStore;
  onSelect: (binding: string) => void;
};

const categories: CategoryId[] = ["broadband-new", "broadband-existing", "mobile-monthly", "mobile-prepaid", "solar"];

/** The heading a group has on its page, to name it here. */
function groupName(content: SiteContent, category: CategoryId, group: string): string {
  for (const doc of content.pages.packages) {
    for (const section of doc.sections) {
      const entry = section.groups.find((candidate) => candidate.category === category && candidate.group === group);
      if (entry) return [section.heading.th, entry.heading?.th].filter(Boolean).join(" › ");
    }
  }
  if (category === "solar" && content.pages.solar.packages.group === group) return content.pages.solar.packages.heading.th;
  return group;
}

function uniqueId(taken: (id: string) => boolean, stem: string): string {
  let n = 1;
  while (taken(`${stem}-${n}`)) n += 1;
  return `${stem}-${n}`;
}

/** A new package starts hidden, with no price: the Admin types every value before showing it. */
function blankPackage(id: string, category: CategoryId, group: string, siblings: CatalogPackage[]): CatalogPackage {
  return {
    id,
    category,
    group,
    name: { th: "แพ็กเกจใหม่", en: "New package" },
    price: { amount: 0, per: siblings[0]?.price.per ?? "month", vat: "unknown" },
    benefits: [],
    details: [],
    conditions: [],
    source: { file: "หลังบ้าน", entry: "สร้างใน Mirror editor" },
    review: { status: "hidden", notes: ["สร้างในหลังบ้าน: กรอกชื่อ ราคา และเงื่อนไข แล้วเปลี่ยนสถานะเป็นแสดงบนเว็บ"] },
  };
}

const statusTone: Record<CatalogPackage["review"]["status"], string> = {
  verified: "bg-tm-success-wash text-tm-success",
  unverified: "bg-[#fef3c7] text-[#78350f]",
  hidden: "bg-tm-surface text-tm-muted",
};

export function CatalogManager({ content, published, store, onSelect }: CatalogManagerProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const order = content.catalog.map((item) => item.id);
  const removed = published.catalog.filter((item) => !order.includes(item.id));
  const exists = (id: string) => content.catalog.some((item) => item.id === id) || published.catalog.some((item) => item.id === id);

  const move = (ids: string[], index: number, to: number) => {
    const next = moveItem(ids, index, to);
    // The group's slots in the whole order take the group's new order.
    const slots = order.map((id, position) => (ids.includes(id) ? position : -1)).filter((position) => position >= 0);
    const whole = [...order];
    slots.forEach((slot, rank) => (whole[slot] = next[rank]));
    store.replace("catalog", { order: whole });
  };

  const add = (category: CategoryId, group: string, siblings: CatalogPackage[]) => {
    const id = uniqueId(exists, `${group}-new`);
    store.create(`package:${id}`, blankPackage(id, category, group, siblings));
    // Right after the group's last package.
    const last = siblings.at(-1)?.id;
    const whole = order.filter((entry) => entry !== id);
    whole.splice(last ? whole.indexOf(last) + 1 : whole.length, 0, id);
    store.replace("catalog", { order: whole });
    onSelect(`package:${id}`);
  };

  const remove = (item: CatalogPackage) => {
    const pages = packagePages(content, item.id);
    if (pages.includes("home")) {
      setNotice(`ลบ “${item.name.th}” ไม่ได้: การ์ดโปรในหน้าแรกยังใช้อยู่ เปลี่ยนการ์ดก่อน หรือซ่อนแพ็กเกจแทน`);
      return;
    }
    setNotice(null);
    store.remove(`package:${item.id}`);
  };

  return (
    <div className="grid gap-6">
      <p className="text-tm-caption text-tm-muted">
        แพ็กเกจใหม่เริ่มแบบซ่อนและราคา 0: กรอกชื่อ ราคา และเงื่อนไขก่อน แล้วจึงเปลี่ยนสถานะเป็นแสดง (แพ็กเกจที่แสดงต้องมีราคา) การลบและการซ่อนเป็นร่าง เผยแพร่จึงมีผล
      </p>
      {notice ? (
        <p role="alert" className="rounded-tm-control bg-tm-danger-wash px-3 py-2 text-tm-caption text-tm-danger">
          {notice}
        </p>
      ) : null}
      {categories.map((category) => {
        const items = content.catalog.filter((item) => item.category === category);
        const groups = Array.from(new Set(items.map((item) => item.group)));
        return (
          <section key={category} aria-label={pageLabels[category]} className="grid gap-3">
            <h3 className="text-tm-small font-semibold">{pageLabels[category]}</h3>
            {groups.map((group) => {
              const siblings = items.filter((item) => item.group === group);
              const ids = siblings.map((item) => item.id);
              return (
                <div key={group} className="grid gap-1.5 rounded-tm-control border border-tm-line p-2">
                  <p className="text-tm-caption font-semibold text-tm-muted">{groupName(content, category, group)}</p>
                  <ul className="grid gap-1">
                    {siblings.map((item, index) => (
                      <li key={item.id} data-catalog-item={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-tm-control px-1.5 py-1 hover:bg-tm-surface">
                        <button type="button" className="min-w-0 text-left" onClick={() => onSelect(`package:${item.id}`)}>
                          <span className="block truncate text-tm-small font-medium">{item.name.th}</span>
                          <span className="flex flex-wrap items-center gap-1.5 text-tm-caption text-tm-muted">
                            <span className="tm-num">{formatNumber(item.price.amount, "th")} บาท</span>
                            <span className={`rounded-tm-pill px-1.5 ${statusTone[item.review.status]}`}>{valueLabel(item.review.status)}</span>
                          </span>
                        </button>
                        <span className="flex gap-1" role="group" aria-label={`จัดแพ็กเกจ ${item.name.th}`}>
                          <button type="button" className={smallButton} aria-label={`เลื่อนขึ้น: ${item.name.th}`} disabled={index === 0} onClick={() => move(ids, index, index - 1)}>
                            ↑
                          </button>
                          <button type="button" className={smallButton} aria-label={`เลื่อนลง: ${item.name.th}`} disabled={index === ids.length - 1} onClick={() => move(ids, index, index + 1)}>
                            ↓
                          </button>
                          <button
                            type="button"
                            className={smallButton}
                            aria-label={`${item.review.status === "hidden" ? "แสดง" : "ซ่อน"}: ${item.name.th}`}
                            onClick={() => store.edit(`package:${item.id}`, ["review", "status"], item.review.status === "hidden" ? "unverified" : "hidden")}
                          >
                            {item.review.status === "hidden" ? "แสดง" : "ซ่อน"}
                          </button>
                          <button
                            type="button"
                            className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`}
                            aria-label={`ลบ: ${item.name.th}`}
                            onClick={() => remove(item)}
                          >
                            ลบ
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className={`${smallButton} justify-self-start`} onClick={() => add(category, group, siblings)}>
                    + เพิ่มแพ็กเกจในกลุ่มนี้
                  </button>
                </div>
              );
            })}
          </section>
        );
      })}
      {removed.length > 0 ? (
        <section aria-label="แพ็กเกจที่ลบในร่าง" className="grid gap-2">
          <h3 className="text-tm-small font-semibold">ลบในร่าง (เผยแพร่จึงหายจากเว็บ)</h3>
          <ul className="grid gap-1">
            {removed.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-tm-small">
                <span className="truncate">{item.name.th}</span>
                <button type="button" className={smallButton} aria-label={`เอาคืน: ${item.name.th}`} onClick={() => void store.discard(`package:${item.id}`)}>
                  เอาคืน
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <BenefitsList content={content} published={published} store={store} onSelect={onSelect} />
    </div>
  );
}

function BenefitsList({ content, published, store, onSelect }: CatalogManagerProps) {
  const entries = Object.entries(content.benefits);
  const removed = Object.entries(published.benefits).filter(([id]) => !(id in content.benefits));
  const add = () => {
    const id = uniqueId((candidate) => candidate in content.benefits || candidate in published.benefits, "benefit-new");
    const icon = entries[0]?.[1].icon ?? Object.keys(content.media)[0];
    store.create(`benefit:${id}` as DocumentId, { label: { th: "สิทธิประโยชน์ใหม่", en: "New benefit" }, icon });
    onSelect(`benefit:${id}`);
  };
  return (
    <section aria-label="สิทธิประโยชน์" className="grid gap-2 border-t border-tm-line pt-4">
      <h3 className="text-tm-small font-semibold">สิทธิประโยชน์</h3>
      <ul className="grid gap-1">
        {entries.map(([id, benefit]) => {
          const used = benefitUsage(content, id);
          return (
            <li key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-tm-control px-1.5 py-1 hover:bg-tm-surface">
              <button type="button" className="min-w-0 text-left" onClick={() => onSelect(`benefit:${id}`)}>
                <span className="block truncate text-tm-small font-medium">{benefit.label.th}</span>
                <span className="text-tm-caption text-tm-muted">ใช้ใน {used} แพ็กเกจ</span>
              </button>
              <button
                type="button"
                className={`${smallButton} hover:border-tm-danger hover:text-tm-danger`}
                disabled={used > 0}
                title={used > 0 ? "เอาออกจากแพ็กเกจที่ใช้ก่อน จึงลบได้" : undefined}
                aria-label={`ลบ: ${benefit.label.th}`}
                onClick={() => store.remove(`benefit:${id}` as DocumentId)}
              >
                ลบ
              </button>
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
