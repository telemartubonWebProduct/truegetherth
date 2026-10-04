# ตรวจเว็บจริงหลัง deploy — 3 ตุลาคม 2026

ตาม prompt 2: ตรวจ `https://www.telemartubon.com` แบบอ่านอย่างเดียว หลัง push `main` ที่ `1758204` (Vercel production deployment สำเร็จ, Node ของ Vercel) ไม่ส่งฟอร์ม ไม่เข้าระบบ บล็อกคำขอไปเว็บอื่นทุกครั้ง (ยกเว้นตอนตรวจว่าสคริปต์ Google/Tawk โหลด ซึ่งยอมให้โหลดเฉพาะไฟล์สคริปต์ ไม่ให้ส่งข้อมูลออก) **ยังไม่แก้โค้ด** ตามที่ prompt ระบุ

## ผลรวม

| ตรวจ | ผล |
| --- | --- |
| `E2E_BASE_URL=https://www.telemartubon.com npx playwright test tests/e2e/public-routes.spec.ts tests/e2e/home-film.spec.ts` | 48 ผ่าน, 1 ข้าม, **19 ไม่ผ่าน** — ทุกข้อที่ไม่ผ่านคือหน้าภาษาไทยด้วยสาเหตุเดียว (ปัญหา 1) หนังหน้าแรกผ่านครบ |
| `npm run test:smoke` (ชุดใหม่ของ M6) | หน้าภาษาไทยไม่ผ่านด้วยสาเหตุเดียวกัน; อย่างอื่นผ่านทั้งหมด: ภาษาอังกฤษทุกหน้า, หน้าแพ็กเกจทุกหน้าใน sitemap, redirect 308, 404, robots/sitemap, HSTS, แถบคุกกี้มาก่อน third party, หลังบ้าน noindex, ภาพแรกของหนัง |
| Redirect เก่าตาม `next.config.ts` | `/th` → `/`, `/th/broadband` → `/broadband`, `/SoonContent` → `/`, `/en/SoonContent` → `/en` เป็น 308 ถูกต้อง |
| sitemap/robots | robots: `Disallow: /admin`, `/auth`, `/api` และ `Sitemap: https://www.telemartubon.com/sitemap.xml`; sitemap 178 URL ชี้ `https://www.telemartubon.com` ทั้งหมด |
| Google Ads + GA4 | ก่อนเลือกคุกกี้ไม่โหลดอะไร; กด "ยอมรับทั้งหมด" แล้ว gtag.js โหลด (200) และตั้งค่า consent → `AW-18007307609` → `G-DQGCC5J4YM` ตามลำดับ |
| Tawk | หลังยอมรับ สคริปต์และไฟล์แอปของ Tawk โหลดครบในเบราว์เซอร์ปกติ (Chrome บน Windows) — headless Chrome ถูก CDN ของ Tawk ปฏิเสธ (ข้อความ CORS) จึงตรวจด้วยเครื่องมืออัตโนมัติไม่ได้ ไม่ใช่ปัญหาของเว็บ |
| `/admin` | ขึ้นข้อความให้ตั้งค่า Supabase (`NEXT_PUBLIC_SUPABASE_URL`) — production ยังไม่มีค่า Supabase (ปัญหา 2) |
| HTTPS | HSTS `max-age=63072000` |
| ความเร็ว (lab, จากเครื่องนี้ถึง Vercel) | มือถือจำลอง (CPU ช้า 4 เท่า, 1.6 Mbps): LCP 1.7–2.1 s, CLS ≤ 0.04, TBT 67–398 ms; desktop LCP 0.3–0.5 s — ตาราง: `node scripts/perf/lab-vitals.mjs https://www.telemartubon.com` |
| Lighthouse มือถือ | PageSpeed Insights API แบบไม่มี key หมดโควตาวันนี้ และ Lighthouse CLI เปิด Chromium บนเครื่องนี้ไม่ได้ — เปิด https://pagespeed.web.dev/ กับหน้าแรกเองได้ |

## ปัญหาและวิธีแก้

1. **หน้าแรกภาษาไทยตอบคำขอ RSC ผิดบน Vercel** (ความสำคัญ: กลาง)
   - อาการ: ทุกหน้าภาษาไทย prefetch ลิงก์โลโก้/breadcrumb ไป `/` แล้วได้ `404` (`/?_rsc=…` พร้อม header `Next-Router-Segment-Prefetch: /_tree`) และคำขอ RSC เต็มของ `/` ได้ HTML แทน `text/x-component`; หน้าไทยอื่น (`/broadband` ฯลฯ) และภาษาอังกฤษทั้งหมดปกติ บน `next start` ในเครื่องไม่เกิด
   - ผล: กดลิงก์กลับหน้าแรกจากหน้าไทยเป็นการโหลดหน้าใหม่ทั้งหน้าแทนการเปลี่ยนหน้าแบบเร็ว และมี 404 ใน console/log; ผู้ชมยังไปถึงหน้าแรกได้
   - สาเหตุที่น่าจะเป็น: rewrite `{ source: "/", destination: "/th" }` ใน `next.config.ts` ไม่ครอบเส้นทาง RSC/segment ของ root ที่ Vercel ใช้ภายใน (เช่น `/index.rsc`) ขณะที่ path อื่นผ่านกฎ `/:path` ได้
   - วิธีแก้ที่เสนอ: ย้ายการ rewrite ภาษาไทยไปที่ `src/proxy.ts` (`NextResponse.rewrite` ไป `/th…`) ซึ่ง Next จัดการคำขอ RSC/prefetch ให้ แล้วเพิ่มข้อตรวจใน smoke test ว่า RSC ของ `/` ได้ `text/x-component`; ทดสอบบน Vercel preview ก่อน merge
2. **Vercel production ยังไม่มีค่า Supabase** (สูง สำหรับการเปิดหลังบ้าน/รับคำขอ)
   - อาการ: หลังบ้านใช้ไม่ได้ (ข้อความตั้งค่า), หน้าเว็บแสดงเนื้อหาจาก repo (ยังเผยแพร่จากหลังบ้านไม่ได้), หน้าติดต่อเราแสดง LINE/โทรแทนฟอร์ม
   - วิธีแก้: ตัดสินใจ Supabase project ของ production แล้วทำ checklist ข้อ 1–3 ใน [M6-LAUNCH.md](M6-LAUNCH.md) (apply migration, ตั้ง `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` แบบ Sensitive, Auth URL) แล้ว redeploy และรัน `npm run test:smoke` ให้เห็นว่าฟอร์ม "live"
3. **conversion ของ Google Ads นับเฉพาะผู้ยินยอมโฆษณา** (ข้อมูล)
   - ตั้งแต่ M5 ตาม PDPA ตัวเลข conversion จะน้อยกว่าเว็บเดิม ถ้าต้องการวัดจากทุกคนต้องใช้ข้อมูลที่ไม่ระบุตัวตน (เช่น Consent Mode แบบ advanced) ซึ่งต้องตัดสินใจเชิงนโยบายก่อน
4. **ราคาแพ็กเกจยังไม่ยืนยัน** (กลาง, ค้างจากก่อน)
   - หน้าแพ็กเกจยังแสดงหมายเหตุ "ราคาอาจไม่ใช่ข้อมูลล่าสุด" รอเจ้าของกรอก `docs/renovation/price-review-2026-10-01.xlsx` แล้วจะอัปเดตให้
5. **หน้าหนักบนมือถือ** (ต่ำ)
   - หน้าแรกบนมือถือโหลดราว 3.2 MB ส่วนใหญ่เป็นเฟรมหนังแนวตั้ง 2.5 MB ซึ่งโหลดหลังหน้าพร้อม (ไม่ถ่วง LCP); ลดได้ด้วยเฟรมน้อยลง (เช่น 90) หรือคุณภาพ AVIF ต่ำลงตอนสร้างเฟรม; หน้าเน็ตบ้าน TBT ~400 ms จากตัวกรอง/เปรียบเทียบ ปรับได้ภายหลัง
6. **สำเนาเก่าใน CDN ชั่วครู่หลัง deploy** (ต่ำ, สังเกต)
   - คำขอแรกของ `/` หลัง deploy ได้หน้าเก่าที่ cache ไว้ 36 ชั่วโมงจาก edge หนึ่งครั้ง คำขอถัดมาได้หน้าใหม่ ถ้าเห็นหน้าเก่านานกว่าไม่กี่นาที ใช้ Vercel → Settings → Caches → Purge

## ไม่ได้ตรวจ

- ส่งฟอร์มจริง, เข้าระบบหลังบ้าน, เผยแพร่ (ต้องมี Supabase บน production ก่อน)
- iPhone Safari / Android Chrome เครื่องจริง (checklist ข้อ 7 ใน M6-LAUNCH.md)
- GA4 DebugView (ต้องเข้า GA4 ของเจ้าของ)
