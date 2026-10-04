# แผนรีโนเวท Telemart Ubon

สถานะ 2026-09-29 (อัปเดต 30 ก.ย.): **M1 Foundation เสร็จในส่วนโค้ดและทดสอบกับ Supabase local stack และ CI บน GitHub แล้ว** (Next 16.3.7/React 19.3.0, design tokens, shell, Auth Admin role เดียว + RLS/migration, CI) เจ้าของ apply migration กับ dev project `wdcbbjvxrcxuaabcipqo` และสร้าง Admin คนแรกแล้ว (เจ้าของแจ้ง 30 ก.ย.) ไม่ได้ deploy และไม่ได้เปลี่ยน DNS — ผลและสิ่งที่ต้องตั้งค่าต่ออยู่ใน [M1-FOUNDATION.md](M1-FOUNDATION.md)

อัปเดต 30 ก.ย.: **M2 Public + Content Model เสร็จในส่วนโค้ดและทดสอบแล้ว** ทุกหน้าสร้างใหม่แบบ A+B+C เป็นภาษาไทย (URL เดิม) และอังกฤษ (`/en`) พร้อมปุ่มสลับภาษา, content model/catalog, ภาพ Router Wi-Fi แบบภาพนิ่ง + 3D และ SEO ยกเว้นเกณฑ์ “ราคา/โปรตรวจโดยธุรกิจ” ที่ยังรอเจ้าของ — ดู [M2-PUBLIC-SITE.md](M2-PUBLIC-SITE.md) ขั้นถัดไปคือ M3

## เป้าหมายที่รับจากผู้ใช้

ยกเครื่องเว็บไซต์โปรโมต/ขายเน็ตบ้าน แพ็กเกจมือถือ และบริการในเครือที่ธุรกิจยืนยัน โดยใช้ธีมทรู ขาว แดง ดำ มีหลังบ้านใช้งานง่าย รองรับ Supabase Auth, ติดตามพฤติกรรมและคลิกติดต่อ, Google Analytics และรายงานการทำงานของเว็บ

ขอบเขตธุรกิจยืนยันแล้ว: รับผู้สนใจให้เจ้าหน้าที่ติดต่อกลับ รับคำขอทั่วประเทศไทย และคงบริการโซลาร์เซลล์ W&W Energy ไม่มี checkout/payment ใน scope นี้ การให้บริการติดตั้ง fibre/solar ต้องตรวจพื้นที่และเงื่อนไขของแต่ละคำขอจริง

Mirror Editor ต้องแสดงหน้าเดียวกับเว็บจริง เช่นการ์ด “ลูกค้าใหม่” ในภาพที่ผู้ใช้ส่ง: เปิด edit แล้วคลิกรูปเพื่อเปลี่ยนรูป คลิกชื่อ/คำอธิบายเพื่อแก้ข้อความ เปลี่ยนไอคอน/ลิงก์/ปุ่ม/พื้นหลัง และเห็นผลในตำแหน่งเดิมทันที ทุกเนื้อหาที่ผู้เข้าชมเห็นต้องมี field หรือ site setting ที่จัดการได้

ใช้ Higgsfield เพื่อสร้างภาพกราฟิกและวิดีโอประกอบเว็บตามทิศทางที่เลือก ภาพสินค้า/อุปกรณ์/โลโก้ใช้ของจริงที่มีสิทธิ ไม่สร้างแทนด้วย AI

คำตอบที่ล็อกแล้ว: A+B+C เป็นแนวทางดีไซน์; Mirror Editor แก้ทุกค่าโดยคง layout ของหน้าใหม่ที่ตกลงไว้; มี Admin role เดียวดูแล content และ IT; deploy บน Vercel ใช้โดเมนที่ซื้อไว้ ไม่ต้องมีระบบหลาย role หรือ page builder จัดหน้าอิสระ

แนวทางภาพ: A ให้ความขาวสะอาดและ copy อ่านง่าย, B ให้การ์ดเปรียบเทียบโปร, C ให้ composition คลีนกับภาพอุปกรณ์เด่น เพิ่ม Router Wi-Fi ของทรูเป็น hero visual ไม่ใช่ TrueID TV ผู้ใช้ยอมให้เลือก Three.js/Higgsfield/วิธีอื่นตามคุณภาพ ข้อเสนอคือ optimized GLB/PBR ผ่าน Three.js + React Three Fiber พร้อม static poster fallback, lazy load และรองรับ reduced motion ไม่บังคับว่าต้องใช้ทั้ง 3D และ AI video

ยังไม่มีไฟล์โมเดลจริงหรือ SKU ที่ยืนยัน ภาพ Router.png เดิมเป็น icon 200×200; ไม่อ้างว่าโมเดลตรงอุปกรณ์จริงทุกมุมจากข้อมูลนี้ ถ้าต้องการ exact hardware match ต้องมี reference ที่เพียงพอและตรวจภาพก่อนใช้ ข้อกำหนดเชิงพาณิชย์ของแพ็กเกจไม่อนุมานจากภาพประกอบ

## เอกสารประกอบ

- [แบบที่คัดพร้อมภาพเปรียบเทียบ](templates.html) และ [รายละเอียดต้นแบบ/ข้อจำกัด](TEMPLATE-SHORTLIST.md)
- [ผลตรวจเว็บเดิมและแผนรักษา URL](CURRENT-SITE-AUDIT.md)
- [สถาปัตยกรรม หน้า/ไฟล์ ข้อมูล สิทธิ์ และ analytics](ARCHITECTURE.md)
- [แนวทาง 3D และสื่อ Router Wi-Fi](3D-MEDIA-PLAN.md)
- [Brief ดีไซน์ Telemart ที่เขียนเองและแผนใช้ของฟรี](FREE-DESIGN-BRIEF.md)
- [เครื่องมือที่ติดตั้งและสถานะการเชื่อมต่อ](TOOLING-SETUP.md)
- [คำถามและการตัดสินใจที่ยังเปิด](DECISIONS.md)
- [ชุดส่งต่องานพัฒนา](DEV-HANDOFF.md) และ [ตั้งค่า Claude Cloud](CLAUDE-CLOUD-SETUP.md)
- [รายงานผล M1 Foundation](M1-FOUNDATION.md)
- [รายงานผล M2 Public + Content Model และรายการที่เจ้าของต้องตรวจ](M2-PUBLIC-SITE.md)

## ชุดหน้าที่จะเปลี่ยน

| พื้นที่ | ขอบเขตเสนอ |
|---|---|
| หน้าแรก | Hero A+C พร้อม Router Wi-Fi visual/fallback, หมวดบริการ, โปรโมชั่น, แพ็กเกจเด่นแบบ B, จุดขาย, ลูกค้าใหม่/เดิม, ขั้นตอนสมัคร, FAQ, ติดต่อ |
| เน็ตบ้าน | ลูกค้าใหม่/เดิม, ค้น/กรอง/เปรียบเทียบแพ็กเกจ, รายละเอียดราคา/ภาษี/เงื่อนไข, ขอเช็กพื้นที่หรือให้ติดต่อกลับ |
| มือถือ | รายเดือน/เติมเงิน/แพ็กเกจเสริมและบริการจริงที่เลือกคงไว้ |
| บริการอื่น | คง Solar W&W Energy พร้อมฟอร์มขอคำปรึกษา/เสนอราคา; หมวดอื่นตามบริการจริงที่ตรวจข้อมูลแล้ว |
| ติดต่อ/นโยบาย | ฟอร์มพร้อมสถานะส่งจริง, LINE/โทร, privacy/consent ที่ตกลง, SEO/social share |
| Dashboard | ผู้ชม ช่องทางเข้า คลิก/คำขอ ช่วงเวลา และสถานะ integrations |
| Mirror Editor | เลือกหน้า ดู/แก้ desktop/tablet/mobile, แก้ fields และสื่อ, บันทึกร่าง/preview/publish/revisions/rollback |
| Catalog/Media | แพ็กเกจ หมวด เงื่อนไข วันเริ่ม/สิ้นสุด รูป/วิดีโอ alt/crop และรายการจุดที่ใช้สื่อ |
| Leads | ผู้สนใจ แหล่งที่มา โปรที่สนใจ มอบหมาย บันทึกการติดตาม สถานะและประวัติ ตาม sales workflow ที่ตกลง |
| Reports | GA4 traffic/campaign/content/contact, lead funnel จริง, CSV ตามสิทธิ, ประวัติแก้เว็บ, error/uptime/Web Vitals แยกแหล่งข้อมูล |
| Settings/Users | แบรนด์ พื้นหลัง theme tokens เมนู footer ช่องทางติดต่อ SEO defaults และบัญชี Admin ที่ใช้งานอยู่ |

URL เดิมต้องคงไว้หรือมี redirect map ที่ตรวจแล้ว รวม `/monthy`, `/broadband`, `/broadband-old`, `/topup`, `/wEnergy`, `/service`, `/wifiService`, `/termsAndPrivacy` และ anchor ที่มีผู้ใช้งานจริง ไม่เปลี่ยนสะกดแล้วทิ้งลิงก์เดิม

## Milestones และเกณฑ์รับงาน

| ขั้น | งาน | หลักฐานว่าเสร็จ |
|---|---|---|
| M0 — เตรียมและตัดสินใจ | Audit, เลือก A+B+C/Router Wi-Fi แล้ว, setup skills/libs, interview และล็อก scope | ยืนยัน decision tree; เป้าหมาย ยอด conversion พื้นที่ บริการ Supabase และงบชัด |
| M1 — Foundation | อัปเกรด Next/React/เครื่องมือที่เข้ากันได้, design tokens, responsive shell, Supabase SSR Auth/RLS ใน environment ที่เลือก, CI | lint CLI/typecheck/build ผ่าน; login/logout/recovery และ denied access ทดสอบจริง; dependency advisories สำคัญแก้/ประเมินแล้ว |
| M2 — Public + Content Model | หน้า A+B+C, Router Wi-Fi visual/3D ที่ตรวจคุณภาพ, catalog, นำข้อมูล/สื่อเดิมเข้า model, shared renderer, SEO/redirect | มือถือ/desktop ใช้งานได้; poster แสดงก่อนโหลด 3D; WebGL unavailable ยังอ่าน/สมัครได้; model ไม่บัง CTA; ราคา/โปรตรวจโดยธุรกิจ; route/asset/SEO map ครบ |
| M3 — Mirror CMS | Field selection, asset picker, background/theme settings, fixed layout, autosave/conflicts | แก้ทุกค่าคอนเทนต์/รูป/CTA/พื้นหลังแล้ว preview ทันที; reopen ยังอยู่; layout ไม่ถูกจัดใหม่จาก editor; draft ไม่รั่ว; public/preview หน้าตาตรงกัน |
| M4 — Publish + Operations | Admin publish diff, revisions/rollback, media usage, scheduling หากเลือก | Admin เผยแพร่และ cache refresh ตรวจบน public URL; rollback คืน content/ราคา/theme/media ครบ; audit ระบุบัญชี/เวลา; concurrent edits ไม่ทับเงียบ |
| M5 — Leads + Analytics | Contact validation/spam control, บันทึกคำขอ/notification retries, GA4 events/consent, Data API reports | คลิก LINE/โทรแยกจากส่งฟอร์มและสมัครสำเร็จ; lead ซ้ำไม่เพิ่ม; notification error ไม่ทำ lead หาย; GA DebugView/report มีหลักฐานจริง; preview ไม่ปนสถิติ |
| M6 — Launch | Vercel preview/production, ตรวจ content/accessibility/mobile/performance, backup/restore, migration, domain cutover, smoke/rollback | URL จริง login/contact/publish/reports ใช้งานได้; environment ไม่ปนข้อมูล; domain/HTTPS ตรวจจริง; restore และ rollback มีหลักฐาน |

แต่ละ milestone ต้องส่ง demo ที่ตรวจได้และระบุข้อจำกัด ไม่ถือว่าติดตั้งแพ็กเกจหรือ build ผ่านเท่ากับ service เชื่อมสำเร็จหรือ deploy แล้ว

ผล M1 (2026-09-29, อัปเดต 30 ก.ย.): lint/typecheck/build ผ่าน, unit 59/59, pgTAP RLS 45/45, Playwright 35/35 (รวม login/logout/recovery/invite/denied 13 ข้อกับ Supabase Auth ใน local stack), `npm audit` 19 → 0 และภาพหน้าเว็บเดิม 10 URL ตรงกับ build เดิม CI บน GitHub ผ่านทั้ง 2 jobs ใน draft PR #2; migration และ Admin คนแรกทำแล้วที่ dev project (เจ้าของแจ้ง 30 ก.ย.) ส่วนที่ยังเหลือดูใน [M1-FOUNDATION.md](M1-FOUNDATION.md)

ผล M2 (2026-09-30): lint/typecheck/build ผ่าน, unit 79/79, Playwright 73/73 (9 หน้า × 2 ภาษา × desktop/มือถือ, สลับภาษา, anchor เดิม, 3D/poster fallback, Auth 13), `npm audit` 0; ราคา/เงื่อนไข 80 แพ็กเกจที่แสดงยัง `unverified` และซ่อน 19 รายการที่ข้อมูลขัดกัน รายการตรวจอยู่ใน [M2-PUBLIC-SITE.md](M2-PUBLIC-SITE.md)

ผล M3 (2026-09-30): Mirror Editor ที่ `/admin/editor` — ตัวอย่างหน้าจริงใน iframe 3 ขนาดจอ × 2 ภาษา, คลิกเลือกช่องแล้วแก้ในแผง (ทุกช่องของเนื้อหามีตัวแก้ตาม schema), autosave เป็นร่างต่อเอกสารพร้อมจับการชนกัน, ทิ้งร่างได้; lint/typecheck/build ผ่าน, unit 116/116, pgTAP 84/84, Playwright ครบรวม editor 8 ข้อ; migration ร่างรอเจ้าของ apply ที่ dev project รายละเอียดใน [M3-MIRROR-EDITOR.md](M3-MIRROR-EDITOR.md)

ออกแบบใหม่ก่อน M4 (ผู้ใช้ขอ 30 ก.ย. หลังดู UI): R1 หนังเปิดหน้าแรก + สี/ตัวอักษร/header ใหม่, R2 โปรแนะนำแบบแท็บและการ์ดมีรูป + ส่วนอื่นของหน้าแรก, R3 หน้าแพ็กเกจแบบกรอง/เรียง/เทียบ/รายละเอียด, R4 CRUD สินค้าและบริการ + อัปโหลดสื่อ

ผล R1 (2026-10-01): หนังเลื่อนแล้วเล่น 3 ฉากพร้อมแถบปุ่มบนจอตลอด, แผงนิ่งสำหรับ reduced motion/ไม่มี JS/editor, ส่วนอุปกรณ์ Wi-Fi, header กระจก, schema รุ่น 2, หนังชั่วคราววาดด้วยโค้ด และสคริปต์แปลงวิดีโอจาก Google Flow; บรีฟภาพ/วิดีโออยู่ใน Google Drive ของเจ้าของ รายละเอียดใน [R1-HOME-FILM.md](R1-HOME-FILM.md)

ผล R2 (2026-10-01): โปรแนะนำแบบแท็บ 4 หมวด การ์ดมีรูปเลื่อนข้างได้ ต่อจากหนัง ใช้แพ็กเกจจาก catalog ตรงๆ, การ์ดบริการแบบรูปภาพ, หัวข้อหน้าแรกขนาดเดียวกัน, schema รุ่น 3 และตัวเลือกแพ็กเกจเดียวใน editor; รูปชั่วคราวจากเว็บเดิมรอ S1–S8 รายละเอียดใน [R2-HOME-PROMOS.md](R2-HOME-PROMOS.md)

ผล R3 (2026-10-01): หน้าแพ็กเกจมีตัวกรองความเร็ว/ราคา/สิทธิประโยชน์ การเรียง และเปรียบเทียบ 2–3 แพ็กเกจ, หน้ารายละเอียด `/packages/<รหัส>` ทุกแพ็กเกจที่แสดงพร้อมปุ่ม LINE/โทรและหมายเหตุราคา, URL/anchor เดิมใช้ได้ รายละเอียดใน [R3-PACKAGE-PAGES.md](R3-PACKAGE-PAGES.md)

ผล R4 (2026-10-02): editor เพิ่ม/ลบ/ซ่อน/เรียงแพ็กเกจ สิทธิประโยชน์ และรายการในหน้า (FAQ เมนู การ์ด ขั้นตอน ฉากหนัง แท็บโปร) ตามขอบเขต schema, อัปโหลดรูปไป Supabase Storage (WebP, Admin เท่านั้น), migration + pgTAP; รูป S1–S8 จาก Google Flow ใช้กับการ์ดโปรและการ์ดบริการ รายละเอียดใน [R4-CATALOG-AND-MEDIA.md](R4-CATALOG-AND-MEDIA.md)

ผล M4 (2026-10-02): เผยแพร่หลังดูความต่าง, ประวัติ + ย้อนกลับ (ฉบับใหม่ ไม่เขียนทับ), audit, หน้าเว็บจริงอ่านฉบับที่เผยแพร่จาก Supabase (fallback `src/content`) และรีเฟรชทันทีด้วย `updateTag`; migration + RLS + pgTAP และ e2e เผยแพร่/ย้อนกลับครบข้อความ ราคา ธีม รูป รายละเอียดใน [M4-PUBLISH.md](M4-PUBLISH.md)

ผล M5 (2026-10-02): ฟอร์มขอให้ติดต่อกลับในหน้าติดต่อเรา (ตรวจข้อมูล 3 ชั้น, กันส่งซ้ำ, honeypot + จำกัดอัตรา, สำเร็จเมื่อบันทึกจริง), คำขอเก็บใน Supabase ด้วย RLS ผ่าน `submit_lead()` ของ server, หลังบ้านมีกล่องคำขอ ประวัติ CSV และรายงาน, แจ้งเตือนในหลังบ้าน (ตามที่เลือก), ลบข้อมูลส่วนบุคคล 1 ปีหลังปิดอัตโนมัติ, แถบ consent คุกกี้ (GA4/Ads/Tawk โหลดหลังยินยอม) และ GA4 events แยก LINE/โทร/ส่งฟอร์มสำเร็จ; GA4 Data API ยังรอ Property ID + สิทธิ์ รายละเอียดใน [M5-LEADS.md](M5-LEADS.md)

ผล M6 (2026-10-03, ส่วนที่ทำใน repo): smoke test หลัง deploy (`npm run test:smoke`, อ่านอย่างเดียว ใช้กับ production ได้), backup/restore (`db:backup:dev`, `db:backup:local`, `db:restore:local` ซ้อมกู้คืนบน local ผ่าน), ตรวจ accessibility อัตโนมัติ (axe WCAG 2.2 A/AA ทุกหน้า 0 ข้อผิด), วัด performance แบบ lab, วิธี rollback และ checklist ของเจ้าของสำหรับ Vercel/DNS/Supabase Auth/GA4/มือถือจริง; ยังรอเจ้าของตัดสินใจเรื่อง Supabase project ของ production รายละเอียดใน [M6-LAUNCH.md](M6-LAUNCH.md)

## ขอบเขตการจัดการทุกค่า

- คอนเทนต์: หัวเรื่อง คำอธิบาย ราคา หน่วยความเร็ว เงื่อนไข FAQ labels เมนู footer และข้อความฟอร์ม
- สื่อ: รูปจริง กราฟิก วิดีโอ model/poster ของ Router Wi-Fi, alt text, ตำแหน่ง crop และเลือกโหมดสื่อใน fixed layout; model ใช้ไฟล์/ค่าที่ validate แล้ว
- การกระทำ: label/ปลายทาง/รูปแบบปุ่ม LINE โทร ฟอร์ม ลิงก์ภายใน/ภายนอก และ tracking ID ถาวร
- หน้าตา: พื้นหลังสี/ภาพ/วิดีโอ สีแบรนด์และ typography presets ใน fixed layout; ตำแหน่ง/โครง section และ breakpoints ควบคุมใน code
- ระบบ: สิทธิ์ เงื่อนไขความปลอดภัย และ secret ถูกควบคุมผ่าน settings/server ที่ได้รับอนุญาต ไม่กลายเป็น arbitrary code จาก editor

## Dependencies และการย้ายเวอร์ชัน

ติดตั้งเตรียมเฉพาะ libraries ที่ requirement ชัดเจนแบบ exact pin: Supabase JS/SSR, Zod, GA Data client และ Three.js/React Three Fiber/Drei พร้อม Three types และ lockfile รายละเอียดผลจริงอยู่ TOOLING-SETUP.md ยังไม่ได้สร้างโมเดลหรือเชื่อม service

M1 อัปเกรดแล้วเป็น Next `16.3.7` / React `19.3.0` (จาก Next `15.1.11`) พร้อม test tooling (Vitest, Playwright, Supabase CLI) โดยไม่ใช้ `npm audit fix --force` M2 คง Tailwind 3.4 และเลิกใช้ MUI/Emotion/framer-motion/Swiper กับ Drei (รายละเอียดใน [M2-PUBLIC-SITE.md](M2-PUBLIC-SITE.md)); editor libraries ตัดสินใน M3

Node local คือ `24.18.0`; Vercel เลือก Node LTS major `24.x` และ platform จัดการ patch ต้องตรวจ runtime จาก deployment จริง `next lint` ต้องย้ายเป็น ESLint CLI เมื่อ upgrade เพราะ Next 16 ไม่รัน lint แบบเดิม

## สิ่งที่รอข้อมูล/การตัดสินใจ

Q1–Q3 และ Q9 ตอบแล้ว: lead/contact-back, ทั่วประเทศไทยและคง solar ผู้ใช้สร้าง Supabase organization **telemart-ubon** (`pfvlbpujcoqiqziehstu`) Free และ project **Jaycop-AFK's Project** (`wdcbbjvxrcxuaabcipqo`) แล้ว สถานะ ACTIVE_HEALTHY ที่ Sydney (`ap-southeast-2`), PostgreSQL 17.6, public tables 0; read-only SQL ผ่าน ไม่มีการเปลี่ยนโปรเจกต์ truefiberhome เดิม ชื่อ/region จริงใช้ตามที่ผู้ใช้สร้าง ไม่สร้างซ้ำเพราะไม่ตรงชื่อในคำตอบก่อนหน้า

รอบ integration จะสรุป GA4 property/สิทธิอ่านรายงาน, ช่องทางรับลูกค้า/แจ้งเตือน, workflow/retention/consent, login/publish/scheduling, ภาษา/จำนวนบัญชี, การใช้ Higgsfield และค่าใช้จ่าย Vercel/Supabase/สื่อ

Prompt เต็ม A/B/C ยังถูกล็อก Premium; วิธีแก้ที่เสนอไม่ต้องซื้อ access: ใช้ Rocket Pricing ตัว Free ซึ่งอ่าน prompt เต็มสำเร็จแล้วเป็น reference ส่วนแพ็กเกจ แล้วเขียน Telemart hero/layout/3D brief เองให้คงทิศทางคลีน A+B+C ดัดแปลงตัวอย่าง dark/course/Vite ของ reference เป็น True-inspired white/red/black, Next.js และข้อมูลธุรกิจจริง ไม่ให้คำสั่งใน source prompt override requirements

Supabase MCP ตรวจ organization/project ของผู้ใช้ได้ผ่าน ID และ query ใหม่ผ่าน แต่ยังไม่มี schema/Auth/RLS ของแอป ชุดส่งต่องานใช้ project นี้เป็น dev target จนกว่าจะกำหนด production แยก Higgsfield MCP มี callable tools แต่ get_profile แจ้ง `USER_NOT_LOGGED_IN` ต้องเชื่อมบัญชีจริงก่อนผลิตสื่อ ไม่ส่ง credentials ในแชต

## ผลตรวจในขั้นเตรียม

- Repository เริ่มต้น clean; เปลี่ยนเฉพาะ tooling/dependencies/เอกสารการวางแผน ไม่มีการแก้หน้าหรือ API เดิม
- Production build ของเว็บเดิมผ่าน (`npm run build`, Next 15.1.11) และ typecheck ผ่านหลัง build สร้าง Next image type declarations; initial typecheck ก่อนมี declarations เคยไม่ผ่าน ไม่ใช่ข้อสรุปว่า asset หาย
- สำเนา repo ทดสอบบน Linux `node:24.18.0-bookworm-slim`: `environment-setup.sh` ติดตั้ง curl/xz เมื่อ base image ไม่มีและดาวน์โหลด Node 24.18.0 พร้อม SHA256 **ก่อน checkout**, แล้ว SessionStart หลัง checkout ทำ `npm ci`/PATH, `npm run lint`, `npm run build`, `npx tsc --noEmit` ผ่าน (ยังไม่ใช่ cloud session ของผู้ใช้)
- Dependency audit หลัง installation สุดท้าย (รวม GA Data client) พบ 19 รายการ: 3 low, 4 moderate, 10 high, 2 critical รวม Next/Swiper; ยังต้องแก้ใน M1 และตรวจซ้ำ
- หน้าเว็บจริงตรวจผ่าน browser ที่ `https://www.telemartubon.com/`; ไม่ได้ทดสอบส่งฟอร์มหรือกดโฆษณาบน production
- ส่งชุดเตรียม dev ไปยัง remote branch `codex/telemart-dev-handoff` แล้ว; ยังไม่มี deploy หรือ database migration
