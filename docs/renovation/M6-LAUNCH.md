# M6 — เตรียมเปิดตัวจริง

วันที่ 3 ตุลาคม 2026 · ตาม prompt 11 และ [ARCHITECTURE.md](ARCHITECTURE.md) §11–12: สิ่งที่ทำได้ใน repo ทำและทดสอบแล้ว ส่วนที่ต้องใช้สิทธิ์ของเจ้าของ (Vercel, DNS, Supabase dashboard, GA4) เป็น checklist ด้านล่าง **ไม่ได้สร้าง Supabase project ใหม่** (ต้องถามเจ้าของก่อน — ดู "เรื่องที่ต้องตัดสินใจ")

## สิ่งที่ทำใน repo

| เรื่อง | สิ่งที่ได้ | หลักฐาน |
| --- | --- | --- |
| Smoke test หลัง deploy | `npm run test:smoke` (`playwright.smoke.config.ts`, `tests/smoke/`) อ่านอย่างเดียว ไม่ส่งฟอร์ม ไม่เข้าระบบ บล็อกทุกคำขอไปเว็บอื่น (GA4/Ads ไม่นับ) ใช้กับ production ได้ทุกครั้ง: ทุกหน้า th/en ตอบ 200 และไม่มี error, หน้าแพ็กเกจทุกหน้าใน sitemap, URL เก่า redirect 308, 404 จริง, robots/sitemap, HSTS, แถบคุกกี้มาก่อน third party, หน้าติดต่อเรามีฟอร์มหรือ LINE/โทร (รายงานว่าแบบไหน), หลังบ้านขอเข้าระบบและ noindex, ภาพแรกของหนังโหลด | ผ่าน 50 ข้อกับ build local (2 ข้อ HSTS ข้ามเพราะเป็น http) |
| Backup | `npm run db:backup:dev` (ตรวจ ref/organization เหมือน `db:push:dev`) และ `db:backup:local` เขียน `backups/<เวลา>-<target>/`: roles.sql, schema.sql, data.sql, data-restore.sql, รูปใน bucket media, manifest.json (จำนวนแถวทุกตาราง) โฟลเดอร์ `backups/` ไม่เข้า git | ทดสอบกับ local stack |
| Restore | `npm run db:restore:local -- backups/<โฟลเดอร์> --yes` ซ้อมกู้คืนบน local: reset (apply migration ทั้งหมด) → โหลดข้อมูล → คืนรูป → เทียบจำนวนแถวกับ manifest | ลบคำขอทิ้งแล้วกู้คืน: ทุกตารางตรง manifest, รูปเปิดได้ (HTTP 200), job ลบข้อมูลรายวันมีครั้งเดียว |
| Accessibility | `tests/e2e/accessibility.spec.ts` (axe-core, กฎ WCAG 2.2 A/AA) ทุกหน้า public ทั้งสองภาษา desktop + มือถือ รวมแถบคุกกี้ (ปกติ/เลือกเอง) ฟอร์มที่แสดงข้อผิดพลาดครบ เมนูที่เปิด หน้า 404; และหน้าคำขอ/รายงานในหลังบ้าน | 0 ข้อผิดในทุกหน้า (ตรวจแล้วว่า axe จับข้อผิดได้จริงด้วยรูปที่ไม่มี alt) |
| Performance (lab) | `node scripts/perf/lab-vitals.mjs <origin>` วัด LCP, CLS, TBT และขนาดที่โหลด บนมือถือจำลองแบบ Lighthouse mobile (CPU ช้า 4 เท่า, 150 ms, 1.6 Mbps) และ desktop | ตารางด้านล่าง |
| Cache ของเนื้อหา | fetch ฉบับที่เผยแพร่อยู่ได้นานสุด 1 วัน (นอกจากล้างทันทีเมื่อเผยแพร่) เพราะ data cache อยู่ข้าม deploy ถ้าฐานข้อมูลถูกกู้คืน หน้าเว็บตามทันภายในวัน | M5 |

### ผลวัด lab (build local, 3 ต.ค. 2026)

| หน้า | มือถือ LCP | มือถือ TBT | มือถือ KB | Desktop LCP | CLS |
| --- | --- | --- | --- | --- | --- |
| `/` | 1.50 s | 415 ms | 715 | 0.20 s | 0 |
| `/broadband` | 1.25 s | 588 ms | 482 | 0.16 s | 0 |
| `/service` | 1.11 s | 426 ms | 495 | 0.13 s | 0 |
| `/packages/fiber-500-499` | 1.28 s | 180 ms | 575 | 0.11 s | 0 |
| `/en` | 1.66 s | 252 ms | 3,185 | 0.10 s | 0 |

- LCP และ CLS อยู่ในเกณฑ์ดี (LCP < 2.5 s, CLS < 0.1) วัดบน server local จึงไม่มีระยะทางเครือข่ายจริง ค่าจริงบน Vercel ต้องดูจากผู้ใช้จริง (Search Console › Core Web Vitals หรือ Vercel Speed Insights ถ้าเปิด)
- TBT บนมือถือช้า 4 เท่า 180–590 ms (เกณฑ์ดีของ Lighthouse < 200 ms) สูงสุดที่หน้าเน็ตบ้าน (ตัวกรอง/เปรียบเทียบ) เป็นงานปรับต่อได้ ไม่ขวางการเปิด
- หน้าแรก desktop โหลดราว 4.8 MB เพราะเฟรมหนัง 120 ภาพ (4.1 MB) ซึ่งโหลด **หลัง** หน้าพร้อมแล้ว ทีละหยาบไปละเอียด ไม่ถ่วง LCP; Save-Data/เน็ตช้าโหลดแค่ภาพนิ่ง
- Lighthouse CLI เปิด Chromium ในเครื่องนี้ไม่ได้ (`spawn UNKNOWN`) จึงวัดด้วยสคริปต์ข้างต้น ถ้าต้องการคะแนน Lighthouse ให้เปิด PageSpeed Insights กับ URL จริงหลัง deploy

## เรื่องที่ต้องตัดสินใจ (เจ้าของ)

1. **Supabase ของ production**: ตอนนี้มี project เดียว `wdcbbjvxrcxuaabcipqo` (Free)
   - **ทางเลือก A (แนะนำ)**: สร้าง project ใหม่สำหรับ production (คำขอจริงและข้อมูลส่วนบุคคลแยกจากข้อมูลทดสอบ) แล้วใช้ project เดิมเป็น dev/preview — Claude จะสร้างให้ก็ต่อเมื่อเจ้าของอนุมัติ และต้องเพิ่ม script push/backup สำหรับ ref ใหม่
   - **ทางเลือก B**: ใช้ project เดิมเป็น production — ง่ายที่สุด แต่ Preview ต้องไม่มี `SUPABASE_SECRET_KEY` (ไม่ให้คำขอทดสอบปนของจริง) และทดสอบหลังบ้านบน local เท่านั้น
2. **แพลน**: Supabase Free ไม่มี backup อัตโนมัติ และ project ที่ไม่มีการใช้งาน 7 วันอาจถูกพักไว้ ถ้าถูกพัก หน้าเว็บยังแสดงเนื้อหาจาก repo และฟอร์มบอกให้ทัก LINE/โทร (ไม่พังแต่เผยแพร่/รับคำขอไม่ได้) สำหรับ production ที่รับคำขอจริงควรพิจารณา Supabase Pro; Vercel ระบุว่า Hobby สำหรับการใช้งานส่วนตัวที่ไม่ใช่เชิงพาณิชย์ เว็บขายจึงควรเป็น Pro ([ARCHITECTURE.md](ARCHITECTURE.md) §11)

## Checklist ของเจ้าของ

### 1. ฐานข้อมูล (ทำก่อน push หรือทันทีหลัง push)

- [ ] Apply migration ที่ dev project ตามลำดับด้วย `npm run db:push:dev` (ตรวจรายการ) แล้ว `npm run db:push:dev:apply`: `20260930160641_content_drafts.sql`, `20261001160000_catalog_and_media.sql`, `20261002090000_content_releases.sql`, `20261002120000_leads.sql` (เปิด pg_cron) — ถ้าใช้ทางเลือก A ทำซ้ำที่ project production
- [ ] หลัง apply ครั้งแรก: `npm run db:backup:dev` แล้วเก็บโฟลเดอร์ไว้นอกเครื่อง (ไดรฟ์ส่วนตัว มีข้อมูลส่วนบุคคล); ทำซ้ำทุกสัปดาห์และก่อน apply migration ทุกครั้ง

### 2. Vercel → Project → Settings → Environment Variables

| ตัวแปร | Production | Preview | หมายเหตุ |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL ของ project production | URL ของ dev project | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key ของ production | ของ dev | ปลอดภัยในเบราว์เซอร์ |
| `SUPABASE_SECRET_KEY` | secret key ของ production, ติ๊ก **Sensitive** | ไม่ตั้ง (ฟอร์มจะเป็น LINE/โทร) หรือ secret ของ dev | ห้ามตั้งชื่อ `NEXT_PUBLIC_` ห้ามใส่ใน repo |
| `NEXT_PUBLIC_SITE_URL` | ไม่ต้องตั้ง (ค่าเริ่มต้น `https://www.telemartubon.com`) | ไม่ต้องตั้ง | ใช้ทำ canonical/sitemap |

- [ ] Redeploy หลังเปลี่ยนตัวแปร (ค่าเข้า build ตอน deploy)
- [ ] Settings → Deployment Protection: เปิด Vercel Authentication ให้ Preview ถ้าต้องการรัน smoke กับ preview ให้สร้าง "Protection Bypass for Automation" แล้วตั้ง `SMOKE_BYPASS_SECRET` ในเทอร์มินัลตอนรันเท่านั้น
- [ ] ตรวจว่า Production Branch คือ `main` และ Node.js Version เป็น 24.x

GA4 และ conversion ของ Google Ads ทำงานเฉพาะโดเมน `www.telemartubon.com` อยู่แล้ว preview จึงไม่ปนสถิติ และ Vercel ใส่ `noindex` ให้ URL preview

### 3. Supabase Dashboard → Authentication (ทุก project ที่ใช้)

- [ ] URL Configuration → **Site URL**: production = `https://www.telemartubon.com`; dev = `http://localhost:3000`
- [ ] **Redirect URLs** production: `https://www.telemartubon.com/auth/confirm**` (และ `https://telemartubon.com/auth/confirm**` ถ้าเปิดโดเมนไม่มี www แบบไม่ redirect); dev: `http://localhost:3000/**` และ preview แบบจำกัดทีม เช่น `https://*-<ชื่อทีม>.vercel.app/**` — ห้ามใช้ `https://*.vercel.app/**` ทั้งหมด
- [ ] Email Templates: วางเนื้อหา `supabase/templates/invite.html` และ `recovery.html` (ลิงก์ไป `/auth/confirm` แบบ token hash)
- [ ] SMTP: ตั้ง custom SMTP ถ้าจะเชิญ Admin ที่ไม่ใช่สมาชิกทีม Supabase (อีเมลในตัวส่งได้จำกัด) — รหัส SMTP ใส่ใน dashboard เท่านั้น
- [ ] เชิญ Admin และให้สิทธิ์ (M1-FOUNDATION.md "สิ่งที่เจ้าของต้องทำ") แล้วลองเข้า `https://www.telemartubon.com/admin` ลืมรหัสผ่าน → ลิงก์ในอีเมลต้องกลับมาที่โดเมนจริง

### 4. โดเมนและ DNS (Vercel → Settings → Domains)

- [ ] ตรวจว่า `www.telemartubon.com` และ `telemartubon.com` ผูกกับ project นี้ และ apex redirect ไป www (308)
- [ ] ใช้ค่า DNS ที่ Vercel แสดงสำหรับ project จริงเท่านั้น ไม่แตะ MX/TXT ของอีเมล บันทึก DNS เดิมไว้ก่อนเปลี่ยนทุกครั้ง
- [ ] HTTPS: certificate ใช้ได้ทั้งสองชื่อ (`npm run test:smoke` ตรวจ HSTS ให้)

### 5. หลัง deploy ทุกครั้ง

- [ ] `npm run test:smoke` (production) ต้องผ่านทั้งหมด ดูบรรทัด annotation ว่าฟอร์มติดต่อกลับ "live" แล้ว
- [ ] ทดสอบจริงหนึ่งรอบ: ส่งคำขอทดสอบจากมือถือ → เห็นใน `/admin/leads` → ลบข้อมูลส่วนบุคคลของคำขอทดสอบ
- [ ] เผยแพร่ครั้งแรกจากหลังบ้าน (M4) แล้วดูว่าหน้าเว็บเปลี่ยน; ทดสอบย้อนกลับหนึ่งครั้ง

### 6. GA4 และ Search Console

- [ ] GA4 Admin → Events: ตั้ง `generate_lead`, `contact_line`, `contact_phone` เป็น **key event**
- [ ] Custom definitions (event scope): `cta_id`, `form_id`, `lead_service`, `package_id`
- [ ] Data retention 14 เดือน; ทดสอบด้วย DebugView โดยยอมรับคุกกี้วิเคราะห์บนโดเมนจริง แล้วกด LINE/โทร/ส่งฟอร์ม
- [ ] ถ้าต้องการตัวเลข GA4 ในหน้ารายงานหลังบ้าน: ส่ง GA4 **Property ID** (ตัวเลข) และเพิ่ม service account เป็น Viewer ของ property (งาน integration ถัดไป)
- [ ] Google Search Console: ยืนยันโดเมน ส่ง `https://www.telemartubon.com/sitemap.xml`

### 7. มือถือจริง (ทีมทดสอบ ~20 นาที)

ทำบน iPhone (Safari) และ Android (Chrome) อย่างละเครื่อง:

- [ ] หน้าแรก: แถบคุกกี้ เลือก "ใช้เฉพาะที่จำเป็น" แล้วหายไป; เลื่อนหนังทั้งเรื่องลื่น ข้อความอ่านได้ทุกฉาก ปุ่มล่างกดได้; ปุ่มข้ามหนัง
- [ ] เมนูเปิด/ปิด, สลับภาษา, หน้าเน็ตบ้าน: ตัวกรอง เรียง เปรียบเทียบ 2–3 แพ็กเกจ
- [ ] หน้าแพ็กเกจ → "ขอให้เจ้าหน้าที่โทรกลับ" → ฟอร์มมีแพ็กเกจให้; ช่องเบอร์เปิดแป้นตัวเลข เลือกจังหวัดได้ ส่งแล้วเห็น "ได้รับคำขอแล้ว"
- [ ] ปุ่ม LINE เปิดแอป LINE, ปุ่มโทรเปิดหน้าจอโทร
- [ ] "ตั้งค่าคุกกี้" ท้ายหน้าเปิดได้ ถอนความยินยอมแล้วหน้าโหลดใหม่
- [ ] VoiceOver (iPhone) หรือ TalkBack (Android) อ่านข้อความผิดพลาดของฟอร์มและแถบคุกกี้ได้
- [ ] หลังบ้านบนมือถือ: เข้าระบบ เปิดคำขอ เปลี่ยนสถานะ

## วิธีย้อนกลับ (rollback)

| ปัญหา | วิธี | เวลา |
| --- | --- | --- |
| เนื้อหา/ราคา/รูปผิดหลังเผยแพร่ | `/admin/releases` → "ย้อนกลับไปฉบับที่ N" → ยืนยัน หน้าเว็บกลับทันที ไม่ต้อง deploy | วินาที |
| deploy ใหม่พัง | Vercel → Deployments → deployment production ก่อนหน้า → **Instant Rollback** (Hobby ย้อนได้เฉพาะ deployment ก่อนหน้าหนึ่งตัว Pro เลือกได้ทุกตัว) หลัง rollback Vercel **หยุดผูกโดเมนกับ deploy ใหม่อัตโนมัติ** จนกว่าจะ Promote deployment ที่แก้แล้ว ([Vercel Instant Rollback](https://vercel.com/docs/instant-rollback)) | นาที |
| แก้โค้ดถาวร | `git revert <commit>` บน branch ใหม่ ทดสอบ แล้ว push เข้า `main` จากนั้น Promote | ตามรอบ deploy |
| migration ผิด | migration ใน repo เป็นแบบไปข้างหน้าเท่านั้น: เขียน migration ใหม่ที่แก้ แล้ว `db:push:dev`; ห้ามแก้ตารางมือใน dashboard | ตามงาน |
| ข้อมูลหาย/เสีย | กู้จาก backup (ด้านล่าง) | ชั่วโมง |
| เปลี่ยนโฮสต์แล้วต้องกลับ | คืนค่า DNS ที่บันทึกไว้ (ข้อ 4) | ตาม TTL |

## กู้คืนฐานข้อมูลจาก backup

Supabase Free ไม่มี backup อัตโนมัติหรือดาวน์โหลดได้ ([Supabase backups](https://supabase.com/docs/guides/platform/backups)) จึงใช้ `npm run db:backup:dev` เป็นหลัก ซ้อมกู้คืนบน local ก่อนเสมอ:

```bash
npm run db:start
npm run db:restore:local -- backups/<โฟลเดอร์> --yes
```

กู้คืนเข้า project บน Supabase (เช่น project ใหม่ หรือหลังข้อมูลเสีย) — **ทำเมื่อเจ้าของตัดสินใจแล้วเท่านั้น**:

1. Project ปลายทางต้องว่างหรือยอมเขียนทับ: apply migration ทั้งหมดก่อน (`npm run db:push:dev:apply` หรือ script ของ project นั้น)
2. โหลดข้อมูลด้วย psql และ connection string จาก Dashboard → Connect (ใส่รหัสในเทอร์มินัลเท่านั้น):
   `psql "<connection string>" --single-transaction -v ON_ERROR_STOP=1 -f backups/<โฟลเดอร์>/data-restore.sql`
3. คืนรูป: `npx supabase --experimental storage cp -r backups/<โฟลเดอร์>/storage/media ss:/// --linked`
4. ตรวจจำนวนแถว (`select count(*)` ของ `public.leads`, `public.content_releases`, `auth.users` ฯลฯ) เทียบกับ `manifest.json`
5. ถ้าหน้าเว็บยังแสดงฉบับเก่า เผยแพร่ใหม่หนึ่งครั้งหรือรอไม่เกิน 1 วัน

roles.sql และ schema.sql ใช้เมื่อกู้เข้า project ที่สร้างจากศูนย์ตามคู่มือ Supabase แทนการ apply migration

## สิ่งที่ยังไม่ได้ทำ

- ไม่ได้ทดสอบบน Safari/iPhone และ Chrome/Android เครื่องจริง (checklist ข้อ 7)
- ไม่ได้รัน backup/restore กับ project บน Supabase (เครื่องนี้ไม่มี access token) — ทดสอบกับ local stack เท่านั้น
- ไม่ได้ตั้ง error monitoring/uptime (เช่น Vercel Monitoring, Sentry, UptimeRobot) — ถ้าต้องการเลือกบริการแล้วจะเพิ่มให้
- คะแนน Lighthouse จริงดูได้ที่ PageSpeed Insights หลัง deploy
