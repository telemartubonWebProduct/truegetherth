"use server";

import { randomUUID } from "node:crypto";

import sharp, { type OutputInfo } from "sharp";
import { z } from "zod";

import { getAdminAccess } from "@/lib/auth/access";
import { mediaKind, type MediaAsset } from "@/lib/content/schema";
import { createClient } from "@/lib/supabase/server";

// Uploading a picture from the Mirror editor (R4). The file is checked and
// re-encoded here — read by sharp, turned upright, at most 2400 px wide, saved
// as WebP — then stored in the Supabase Storage bucket `media` with the
// Admin's own session, so the bucket's policies apply. The editor then adds
// it to the media library as an ordinary draft, which is validated on save.

/** Largest file accepted (next.config.ts allows the request a little more). */
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_WIDTH = 2400;
/** sharp reports AVIF as heif. */
const ACCEPTED = new Set(["jpeg", "png", "webp", "avif", "heif"]);

export type UploadOutcome = { ok: true; id: string; asset: MediaAsset } | { ok: false; message: string };

const fields = z.strictObject({
  kind: mediaKind,
  altTh: z.string().trim().min(1).max(300),
  altEn: z.string().trim().min(1).max(300),
});

export async function uploadMediaAction(form: FormData): Promise<UploadOutcome> {
  const access = await getAdminAccess();
  if (access.status !== "active") return { ok: false, message: "บัญชีนี้ไม่มีสิทธิ์อัปโหลดรูป หรือหมดเวลาเข้าสู่ระบบ ให้เข้าสู่ระบบใหม่" };

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "เลือกไฟล์รูปก่อน" };
  if (file.size > MAX_BYTES) return { ok: false, message: "ไฟล์ใหญ่เกิน 8 MB ย่อรูปก่อนแล้วลองใหม่" };
  const parsed = fields.safeParse({ kind: form.get("kind"), altTh: form.get("altTh"), altEn: form.get("altEn") });
  if (!parsed.success) return { ok: false, message: "กรอกคำอธิบายรูปทั้งภาษาไทยและอังกฤษ และเลือกชนิดของรูป" };

  let output: { data: Buffer; info: OutputInfo };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input).metadata();
    if (!meta.format || !ACCEPTED.has(meta.format) || (meta.pages ?? 1) > 1) {
      return { ok: false, message: "รับเฉพาะรูป JPEG, PNG, WebP หรือ AVIF (ไม่รับภาพเคลื่อนไหวหรือ SVG)" };
    }
    output = await sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, message: "อ่านไฟล์รูปนี้ไม่ได้ ลองบันทึกเป็น JPEG หรือ PNG แล้วอัปโหลดใหม่" };
  }

  const supabase = await createClient();
  const name = randomUUID();
  const path = `uploads/${name}.webp`;
  const { error } = await supabase.storage.from("media").upload(path, output.data, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("Uploading a picture failed", { message: error.message });
    return { ok: false, message: "อัปโหลดไม่สำเร็จ: ตรวจว่าฐานข้อมูลมีที่เก็บรูปแล้ว (migration ของ R4) แล้วลองอีกครั้ง" };
  }
  const { kind, altTh, altEn } = parsed.data;
  const date = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" }).format(new Date());
  return {
    ok: true,
    id: `upload-${name.slice(0, 8)}`,
    asset: {
      src: supabase.storage.from("media").getPublicUrl(path).data.publicUrl,
      width: output.info.width,
      height: output.info.height,
      kind,
      alt: { th: altTh, en: altEn },
      source: `อัปโหลดในหลังบ้าน ${date} (${file.name.slice(0, 120)})`,
    },
  };
}
