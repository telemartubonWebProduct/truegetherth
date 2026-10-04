"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { UploadOutcome } from "@/app/admin/(editor)/editor/media-actions";
import { mediaKind, type MediaAsset, type SiteContent } from "@/lib/content/schema";

import { smallButton, inputClass } from "./fields";
import { valueLabel } from "./labels";

// Chooses a picture from the site's media library, or uploads a new one (R4):
// the upload is re-encoded on the server, stored in Supabase Storage and added
// to the library as a draft, then chosen.

type MediaPickerProps = {
  content: SiteContent;
  /** Currently chosen asset, if any. */
  current: string | undefined;
  onPick: (id: string) => void;
  onClose: () => void;
  /** Uploads a file and adds it to the library; absent when uploads are unavailable. */
  onUpload?: (form: FormData) => Promise<UploadOutcome>;
};

function UploadForm({ onUpload, onDone }: { onUpload: NonNullable<MediaPickerProps["onUpload"]>; onDone: (id: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form
      className="grid gap-2 border-b border-tm-line px-5 py-3"
      aria-labelledby="media-upload-title"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        const outcome = await onUpload(new FormData(event.currentTarget)).catch(() => ({ ok: false as const, message: "อัปโหลดไม่สำเร็จ ลองอีกครั้ง" }));
        setBusy(false);
        if (outcome.ok) onDone(outcome.id);
        else setMessage(outcome.message);
      }}
    >
      <h3 id="media-upload-title" className="text-tm-small font-semibold">
        อัปโหลดรูปใหม่
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-tm-caption font-medium">
          ไฟล์รูป (JPEG, PNG, WebP, AVIF ไม่เกิน 8 MB)
          <input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="text-tm-caption" />
        </label>
        <label className="grid gap-1 text-tm-caption font-medium">
          ชนิดของรูป
          <select name="kind" required defaultValue="photo" className={inputClass}>
            {mediaKind.options.map((option) => (
              <option key={option} value={option}>
                {valueLabel(option)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-tm-caption font-medium">
          คำอธิบายรูป ไทย
          <input name="altTh" required maxLength={300} className={inputClass} />
        </label>
        <label className="grid gap-1 text-tm-caption font-medium">
          คำอธิบายรูป English
          <input name="altEn" required maxLength={300} className={inputClass} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={smallButton} disabled={busy}>
          {busy ? "กำลังอัปโหลด…" : "อัปโหลดและเลือกรูปนี้"}
        </button>
        <p className="text-tm-caption text-tm-muted">ระบบย่อรูปให้กว้างไม่เกิน 2400 px และแปลงเป็น WebP; ใช้รูปที่มีสิทธิ์ใช้งานเท่านั้น</p>
      </div>
      {message ? (
        <p role="alert" className="text-tm-caption text-tm-danger">
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function MediaPicker({ content, current, onPick, onClose, onUpload }: MediaPickerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const assets = Object.entries(content.media) as [string, MediaAsset][];
  const kinds = Array.from(new Set(assets.map(([, asset]) => asset.kind)));
  const [kind, setKind] = useState<string>(() => (current && content.media[current] ? content.media[current].kind : "all"));
  const [query, setQuery] = useState("");

  // Removing the element closes the dialog, so there is nothing to clean up
  // (closing here would fire "close" and unmount the picker again).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const needle = query.trim().toLowerCase();
  const shown = assets.filter(
    ([id, asset]) =>
      (kind === "all" || asset.kind === kind) &&
      (!needle || id.includes(needle) || asset.alt.th.toLowerCase().includes(needle) || asset.alt.en.toLowerCase().includes(needle)),
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
      aria-labelledby="media-picker-title"
      className="w-[min(56rem,calc(100vw-2rem))] rounded-tm-panel bg-tm-canvas p-0 text-tm-ink backdrop:bg-black/50"
    >
      <div className="flex max-h-[min(44rem,calc(100dvh-4rem))] flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-tm-line px-5 py-4">
          <h2 id="media-picker-title" className="text-tm-h4 font-semibold">
            เลือกรูปจากคลังสื่อ
          </h2>
          <button type="button" className={smallButton} onClick={() => dialogRef.current?.close()}>
            ปิด
          </button>
        </div>
        {onUpload ? (
          <UploadForm
            onUpload={onUpload}
            onDone={(id) => {
              onPick(id);
              dialogRef.current?.close();
            }}
          />
        ) : null}
        <div className="flex flex-wrap items-center gap-2 border-b border-tm-line px-5 py-3">
          <input
            type="search"
            aria-label="ค้นหารูป"
            placeholder="ค้นหาจากคำอธิบายรูป"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClass} max-w-[16rem]`}
          />
          <div role="radiogroup" aria-label="ชนิดของรูป" className="flex flex-wrap gap-1.5">
            {["all", ...kinds].map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={kind === option}
                onClick={() => setKind(option)}
                className="min-h-8 rounded-tm-pill border border-tm-line px-3 text-tm-caption font-medium aria-checked:border-tm-ink aria-checked:bg-tm-ink aria-checked:text-tm-on-ink"
              >
                {option === "all" ? "ทั้งหมด" : valueLabel(option)}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3 overflow-y-auto p-5">
          {shown.map(([id, asset]) => (
            <li key={id}>
              <button
                type="button"
                aria-pressed={id === current}
                onClick={() => {
                  onPick(id);
                  dialogRef.current?.close();
                }}
                className="flex h-full w-full flex-col overflow-hidden rounded-tm-control border border-tm-line text-left hover:border-tm-ink aria-pressed:border-2 aria-pressed:border-[#2563eb]"
              >
                <span className="flex h-28 items-center justify-center bg-tm-surface p-2">
                  <Image src={asset.src} alt="" width={asset.width} height={asset.height} sizes="160px" className="max-h-full w-auto object-contain" />
                </span>
                <span className="line-clamp-2 px-2 pt-1.5 text-tm-caption">{asset.alt.th}</span>
                <span className="px-2 pb-2 text-[11px] text-tm-muted">
                  {valueLabel(asset.kind)} · {asset.width}×{asset.height}
                </span>
              </button>
            </li>
          ))}
          {shown.length === 0 ? <li className="text-tm-small text-tm-muted">ไม่พบรูปที่ตรงกับคำค้น</li> : null}
        </ul>
      </div>
    </dialog>
  );
}
