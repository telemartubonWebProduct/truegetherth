# Telemart Ubon — ส่งต่องานพัฒนา

สถานะ 2026-09-30: เตรียม repo, dependency, แผน, Node 24 และ Claude Cloud setup บน remote branch [`codex/telemart-dev-handoff`](https://github.com/telemartubonWebProduct/telemartUbon/tree/codex/telemart-dev-handoff) เพื่อเริ่มพัฒนา **ยังไม่ได้รีโนเวทหน้าเว็บ/หลังบ้าน เชื่อม Auth/GA4/Higgsfield/Vercel หรือ deploy** ให้แยกหลักฐานแต่ละขั้นตาม `PLAN.md`

อัปเดต 2026-09-29: **M1 Foundation ทำแล้วบน branch `claude/vigilant-hypatia-czj87e`** (Next 16.3.7/React 19.3.0, tokens, shell, Auth Admin role เดียว + RLS/migration, CI) ทดสอบกับ Supabase local stack และ CI บน GitHub ผ่าน ([draft PR #2](https://github.com/telemartubonWebProduct/telemartUbon/pull/2)); 30 ก.ย. เจ้าของ apply migration ที่ dev project และสร้าง Admin คนแรกแล้ว (เจ้าของแจ้ง) ยังไม่ deploy ดู [M1-FOUNDATION.md](M1-FOUNDATION.md)

อัปเดต 2026-09-30: **M2 Public + Content Model ทำแล้วบน branch เดียวกัน** — หน้าเว็บใหม่ทั้งหมดภาษาไทย/อังกฤษพร้อมปุ่มสลับภาษา, content model, ภาพ Router Wi-Fi แบบภาพนิ่ง + 3D, SEO และ tests ราคาแพ็กเกจยังรอธุรกิจยืนยัน ดู [M2-PUBLIC-SITE.md](M2-PUBLIC-SITE.md) ก่อนเริ่ม M3

อัปเดต 2026-09-30: **M3 Mirror CMS ทำแล้วบน branch เดียวกัน** — `/admin/editor` แสดงหน้าจริงในกรอบตัวอย่าง 3 ขนาดจอ × 2 ภาษา คลิกเลือกช่องแล้วแก้ในแผง ตัวอย่างเปลี่ยนทันที บันทึกร่างอัตโนมัติต่อเอกสาร (ตาราง `content_drafts` + RLS) พร้อมจับการชนกัน หน้าเว็บจริงยังไม่เปลี่ยนจนกว่า M4 (เผยแพร่) migration ของ M3 ต้องให้เจ้าของ apply ที่ dev project ด้วย `npm run db:push:dev` / `db:push:dev:apply` ดู [M3-MIRROR-EDITOR.md](M3-MIRROR-EDITOR.md) ก่อนเริ่ม M4

อัปเดต 2026-10-01: **ออกแบบใหม่ R1 (หนังเปิดหน้าแรก) ทำแล้วบน branch เดียวกัน** — หน้าแรกเปิดด้วยหนังเลื่อนแล้วเล่น 3 ฉาก (ฟ้า → เมืองและเส้นไฟเบอร์ → บ้าน) พร้อมแถบปุ่มบนจอตลอด, Router ย้ายไปส่วนอุปกรณ์ Wi-Fi, header กระจก, schema รุ่น 2 ตอนนี้ใช้หนังชั่วคราวที่วาดด้วยโค้ด ระหว่างรอวิดีโอจาก Google Flow ตามบรีฟใน Google Drive ของเจ้าของ งานต่อไปคือ R2–R4 แล้วจึง M4 ดู [R1-HOME-FILM.md](R1-HOME-FILM.md)

อัปเดต 2026-10-01 (บ่าย): **เจ้าของสั่ง push งานทั้งหมด (M1–M3 + R1) เข้า `main` และย้ายไปพัฒนาบนเครื่องตัวเอง** โดยรับทราบว่า Vercel น่าจะ deploy production จาก `main` ทุกครั้งที่ `main` เปลี่ยน ตั้งแต่นี้ทำงานต่อจาก `main` สิ่งที่ยังต้องตามบน production: ราคาแพ็กเกจที่ยังไม่ยืนยัน, หนังชั่วคราว, ค่า Supabase ของ Vercel production (หลังบ้านใช้ไม่ได้จนกว่าจะตั้ง), migration ของ M3 ที่ dev project และ conversion ของ Google Ads ตรวจใน Vercel ว่า deployment ของ `main` ใช้โดเมนใด

อัปเดต 2026-10-02: **งานค้างจาก `telemart-prompts.md` ทำบน branch `renovation/backlog-2026-10-01`** (เจ้าของสั่งทำให้เสร็จแล้ว push เข้า `main` ครั้งเดียว): คืน conversion ของ Google Ads เฉพาะโดเมนจริง, ฟอนต์ local, ไฟล์ตรวจราคา `price-review-2026-10-01.xlsx`, R2 โปรหน้าแรก, R3 หน้าแพ็กเกจ (กรอง/เรียง/เทียบ/หน้ารายละเอียด), R4 เพิ่ม/ลบ/เรียง + อัปโหลดรูป + รูป Google Flow, M4 เผยแพร่/ประวัติ/ย้อนกลับ และ M5 ฟอร์มขอให้ติดต่อกลับ + consent คุกกี้ + GA4 (`G-DQGCC5J4YM`) + กล่องคำขอและรายงานในหลังบ้าน ดู [R2](R2-HOME-PROMOS.md), [R3](R3-PACKAGE-PAGES.md), [R4](R4-CATALOG-AND-MEDIA.md), [M4](M4-PUBLISH.md), [M5](M5-LEADS.md) **migration ที่เจ้าของต้อง apply ที่ dev project ตามลำดับ**: `20260930160641_content_drafts.sql` (M3), `20261001160000_catalog_and_media.sql` (R4), `20261002090000_content_releases.sql` (M4), `20261002120000_leads.sql` (M5) ด้วย `npm run db:push:dev` แล้ว `npm run db:push:dev:apply` และตั้ง `SUPABASE_SECRET_KEY` (Sensitive) ใน Vercel ก่อนเปิดใช้ฟอร์ม

อัปเดต 2026-10-03: หนังหน้าแรกใช้วิดีโอ Google Flow ของเจ้าของแล้ว ([R1-HOME-FILM.md](R1-HOME-FILM.md)) และ **M6 ส่วนที่ทำใน repo เสร็จ** — smoke test, backup/restore, accessibility, performance, rollback และ checklist ของเจ้าของใน [M6-LAUNCH.md](M6-LAUNCH.md) เจ้าของยังต้องตัดสินใจว่า production ใช้ Supabase project ไหน (Claude ไม่สร้าง project ใหม่โดยไม่ถาม)

## ข้อสรุปที่ต้องรักษา

| เรื่อง | ข้อสรุป |
| --- | --- |
| ธุรกิจ | เว็บโปรโมทแพ็กเกจเน็ตบ้าน มือถือ เครือข่าย และ W&W Energy Solar; รับผู้สนใจทั่วประเทศไทยให้เจ้าหน้าที่ติดต่อกลับ; ไม่มี checkout |
| ดีไซน์ | A+B+C: หน้าเปิดสะอาด การ์ดเปรียบเทียบโปร ภาพ Router Wi-Fi ของทรูเด่น ธีม Telemart ขาว/แดง/ดำ; prompt A/B/C ล็อก Premium ใช้ brief เขียนเองและ Rocket Pricing Free เป็น reference |
| CMS | Mirror Editor แชร์ renderer กับ public หน้าเหมือนจริง แก้ทุกค่าคอนเทนต์/รูป/CTA/theme ได้ทันที แต่ fixed layout; draft/publish/revision/rollback |
| สิทธิ์ | Admin role เดียว ดูแล content และตรวจ IT; invite only และตรวจ membership ฝั่ง server/RLS |
| โฮสต์ | Vercel + โดเมนเดิมที่ผู้ใช้ซื้อไว้; ยังไม่เชื่อม deployment หรือย้าย DNS |

## ปลายทางและสถานะที่ตรวจจริง

- Supabase organization `telemart-ubon`, ID `pfvlbpujcoqiqziehstu`, Free tier.
- Project ที่ผู้ใช้สร้าง `Jaycop-AFK's Project`, ref `wdcbbjvxrcxuaabcipqo`, API URL `https://wdcbbjvxrcxuaabcipqo.supabase.co`, region `ap-southeast-2` (Sydney).
- Supabase MCP รายงาน `ACTIVE_HEALTHY`; read-only SQL คืน PostgreSQL 17.6 และ public table count 0; Security Advisors `lints=[]` ณ วันที่ตรวจ. สิ่งนี้ยืนยันว่า database เข้าถึงได้ ไม่ใช่ว่าแอปมี schema/Auth/RLS แล้ว.
- MCP `list_organizations` ยังแสดงแค่ `truefiberhome` แต่ `get_organization`/`get_project` ด้วย ID ใหม่ใช้ได้จริง; เมื่อ Claude ต่อ connector ใหม่ให้ตรวจ target ด้วย ref นี้ก่อนทำ SQL. ห้ามใช้ project เดิมของ `truefiberhome`.
- Higgsfield connector ตอบ `USER_NOT_LOGGED_IN` ตอนตรวจ จึงยังผลิต/ผูกสื่อจริงไม่ได้. GA4 property, สิทธิอ่าน Data API, Vercel project/environment, production domain cutover และช่องทางแจ้ง lead ยังไม่ได้ตั้งค่า.

## สิ่งที่เตรียมใน repository

- `.nvmrc` pin Node `24.18.0`, `package-lock.json` พร้อม Supabase JS/SSR, Zod, GA Data, Three/Fiber (M2 ลบ Drei ที่ไม่ได้ใช้). `.env.example` มีเฉพาะ URL สาธารณะและชื่อค่าที่ต้องกำหนด ไม่มี secret.
- `scripts/cloud/environment-setup.sh` เป็นเนื้อหาสำหรับช่อง Setup script ติดตั้ง Node จาก official nodejs.org พร้อมตรวจ SHA256 โดยไม่พึ่ง checkout; `.claude/settings.json` เรียก `session-start.sh` เพื่อใส่ Node 24 ใน PATH และ `npm ci --include=dev` ตาม lockfile ใน session ใหม่/ที่ resume. `setup.sh` ใช้ทดสอบ repo ใน Linux local/container.
- `CLAUDE.md` ชี้ข้อกำหนดและทักษะใน repo. `.agents/skills` เป็นไฟล์อ้างอิงที่ checkout ได้ ไม่ใช่การยืนยันว่า Claude slash skills หรือ Higgsfield connector ถูกติดตั้งใน Claude Cloud.
- Repo เดิมเป็น Next `15.1.11`, React `19.0.0`. เป้าหมาย Next 16/React 19 และ audit 19 รายการอยู่ใน M1; อย่าอ้างว่าการลง libs ทำให้ upgrade เสร็จ.
- Windows baseline ก่อนส่งต่อผ่าน lint/build/typecheck. ทดสอบ Linux container `node:24.18.0-bookworm-slim` แล้ว: environment setup ลง Node ก่อน checkout, SessionStart ทำ `npm ci`, lint, build และ `npx tsc --noEmit` ผ่านครบ; Claude Cloud Ubuntu 24.04 จริงยังต้องตรวจแยก. Asset path runtime สองจุดใน `src/datas/home/WifiHome.data.ts` (การสะกดชื่อรูป Sim และ iQIYI) เป็นจุดตรวจบน filesystem case-sensitive.

## ค่าที่ใส่ใน Claude Cloud

ดู [CLAUDE-CLOUD-SETUP.md](CLAUDE-CLOUD-SETUP.md). ใช้ Name `Telemart Ubon Renovation Dev`, Network `Custom` พร้อม default package-manager domains และ `wdcbbjvxrcxuaabcipqo.supabase.co`, Environment variables ดังนี้ และวาง **เนื้อหาทั้งไฟล์** [environment-setup.sh](../../scripts/cloud/environment-setup.sh) ในช่อง Setup script:

```dotenv
NEXT_TELEMETRY_DISABLED=1
CI=true
NEXT_PUBLIC_SUPABASE_URL=https://wdcbbjvxrcxuaabcipqo.supabase.co
```

เลือก remote branch **`codex/telemart-dev-handoff`** ใน Claude Cloud หาก cloud เลือก default branch โดยอัตโนมัติ ให้เลือก branch นี้หรือรวมผ่าน review ก่อน. ค่าที่เป็น secret/service-role/SMTP/GA credentials ไม่อยู่ในฟอร์ม environment variables ที่เห็นได้กับทุกคนที่ใช้ environment.

## ข้อความเริ่มงานที่คัดลอกไป Claude Cloud ได้

> ทำ M1 Foundation ของ Telemart Ubon ใน branch นี้โดยอ่าน `CLAUDE.md` และ `docs/renovation/DEV-HANDOFF.md`, `PLAN.md`, `DECISIONS.md`, `ARCHITECTURE.md`, `CURRENT-SITE-AUDIT.md` ก่อน. เป้าหมายคือเตรียม runtime Next/React ที่เข้ากัน, design tokens/shell, Supabase Auth แบบ Admin role เดียวพร้อม RLS/migrations, CI และตรวจ lint/build/typecheck. ใช้เฉพาะ Supabase project `wdcbbjvxrcxuaabcipqo` ที่ผู้ใช้สร้างเป็น dev target; ก่อน SQL ตรวจ ref/organization และสร้าง migration versioned เพื่อรีวิว. รักษา URL เก่า/ข้อมูลจริง และแยกงาน frontend/CMS/leads/GA4/Higgsfield/Vercel ตาม milestones. รายงานสิ่งที่ทดสอบจริง, สิ่งที่ต้องใช้สิทธิ/ค่าจากเจ้าของ, และยังไม่ deploy หรือเปลี่ยน DNS. อย่าสร้าง project Supabase ใหม่ ไม่ลง secret ใน repo และอย่าอ้างว่า M2–M6 เสร็จเมื่อ M1 ผ่าน.

## ข้อความเริ่ม M2 ที่คัดลอกได้

> ทำ M2 Public + Content Model ของ Telemart Ubon ต่อจาก M1 โดยอ่าน `CLAUDE.md`, `docs/renovation/M1-FOUNDATION.md`, `PLAN.md`, `ARCHITECTURE.md`, `FREE-DESIGN-BRIEF.md`, `3D-MEDIA-PLAN.md` และ `CURRENT-SITE-AUDIT.md` ก่อน. ใช้ design tokens ใน `src/styles/tokens.css` และ route group `(public)`; รักษา URL เดิมทั้งหมด (smoke test ใน `tests/e2e/public-routes.spec.ts`). ราคา/โปร/เงื่อนไขใช้ข้อมูลที่ธุรกิจยืนยันเท่านั้น. ก่อนแตะ Supabase ให้ตรวจว่า migration ของ M1 ถูก apply ที่ `wdcbbjvxrcxuaabcipqo` แล้ว และใช้ `npm run db:push:dev` เท่านั้น. รายงานสิ่งที่ทดสอบจริง ไม่ deploy หรือเปลี่ยน DNS.

## ข้อความเริ่ม M3 ที่คัดลอกได้

> ทำ M3 Mirror CMS ของ Telemart Ubon ต่อจาก M2 โดยอ่าน `CLAUDE.md`, `docs/renovation/M2-PUBLIC-SITE.md`, `ARCHITECTURE.md` (§3–§6), `PLAN.md` และ `DECISIONS.md` ก่อน. ย้ายเนื้อหาจาก `src/content` ไป Supabase ด้วย schema เดิมใน `src/lib/content/schema.ts` (draft ของ Admin แยกจาก published, RLS, migration + pgTAP ใน `supabase/`), ให้ Mirror Editor ใช้ component ใน `src/components/site` ชุดเดียวกับหน้าเว็บ และคง layout คงที่. ข้อความทุกช่องต้องมีทั้ง `th` และ `en`. ใช้ Supabase dev project `wdcbbjvxrcxuaabcipqo` เท่านั้นผ่าน `npm run db:push:dev`. รายงานสิ่งที่ทดสอบจริง ไม่ deploy หรือเปลี่ยน DNS.

## ข้อความเริ่ม M4 ที่คัดลอกได้

> ทำ M4 Publish + Operations ของ Telemart Ubon ต่อจาก M3 โดยอ่าน `CLAUDE.md`, `docs/renovation/M3-MIRROR-EDITOR.md`, `ARCHITECTURE.md` (§4–§6), `PLAN.md` และ `DECISIONS.md` ก่อน. ก่อนแตะ schema ให้รัน `npm run db:push:dev` (dry run) เพื่อตรวจว่า migration `content_drafts` ของ M3 ถูก apply ที่ `wdcbbjvxrcxuaabcipqo` แล้ว. ทำ publish จากร่าง (diff ก่อนเผยแพร่, release ที่ตรึงทุกเอกสาร, published pointer + audit ใน transaction เดียว), ให้หน้าเว็บสาธารณะอ่าน release ที่เผยแพร่พร้อม cache invalidation ที่ตรวจบน public URL, ประวัติ/ย้อนกลับ และการอัปโหลดรูปผ่าน Supabase Storage + RLS. คง layout คงที่และข้อความทุกช่อง `th`/`en`. รายงานสิ่งที่ทดสอบจริง ไม่ deploy หรือเปลี่ยน DNS.

## เกณฑ์เริ่มพัฒนาจาก cloud

1. Claude Cloud มองเห็น branch นี้, `CLAUDE.md`, handoff, setup script และ lockfile.
2. Cloud setup/session-start ออกด้วย exit 0; ใน shell ใหม่ `node --version` เป็น `v24.18.0`, `npm ci` ผ่าน, `npm run build`/`npx tsc --noEmit` ผ่านบน Linux.
3. Supabase target เป็น ref ใหม่จริงและไม่มีการใช้ org/project truefiberhome. Integration/M1 จะเริ่มหลังอ่านแผน; production/paid feature/สิทธิ external เพิ่มเป็นคนละ gate.

ถ้าต้องการทดสอบ repo โดยยังไม่เรียก Supabase จะใช้ `Trusted` ชั่วคราวได้ แต่ก่อน M1 เชื่อม SDK ให้เลือก `Custom` ตามด้านบน. MCP connector กับ outbound VM network ไม่ใช่เส้นทางเดียวกัน.
