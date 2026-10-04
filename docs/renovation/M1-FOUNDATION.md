# M1 Foundation — รายงานผล

วันที่ 29 กันยายน 2026 · branch `claude/vigilant-hypatia-czj87e` (เริ่มจาก `codex/telemart-dev-handoff` commit `d3363b2`)

**สรุป:** งานโค้ดของ M1 เสร็จและทดสอบผ่านบน Linux (Node 24.18.0) กับ Supabase ที่รันจริงแบบ local stack (Auth, Data API, Postgres 17.6) และบน GitHub Actions ใน [draft PR #2](https://github.com/telemartubonWebProduct/telemartUbon/pull/2) แล้ว วันที่ 30 ก.ย. เจ้าของรัน `npm run db:push:dev:apply` จาก Windows เพื่อ apply migration ที่ dev project `wdcbbjvxrcxuaabcipqo` สร้าง Admin คนแรก และเข้าหลังบ้านบนเครื่องตัวเองแล้ว (เจ้าของแจ้ง; session ของ Claude ตรวจ hosted project ตรงไม่ได้เพราะไม่มี publishable key และ network policy ปิด `api.supabase.com`) ไม่มีการ deploy และไม่มีการเปลี่ยน DNS

## เกณฑ์รับงาน M1 เทียบกับผล

| เกณฑ์ใน PLAN.md | ผล | หลักฐาน |
| --- | --- | --- |
| อัปเกรด Next/React/เครื่องมือที่เข้ากันได้ | Next `16.3.7`, React/React DOM `19.3.0`, eslint-config-next `16.3.7`, TypeScript `5.9.3`, Node `24.x` (engines) | build/typecheck/lint ผ่าน; route เดิมครบทุกหน้า |
| lint CLI / typecheck / build ผ่าน | ผ่าน | `npm run lint`, `npm run typecheck`, `npm run build` (รวม build ที่ไม่มีค่า Supabase) |
| dependency advisories สำคัญแก้/ประเมินแล้ว | `npm audit` จาก 19 รายการ (critical 2, high 10) เหลือ **0** | ดูหัวข้อ “Dependencies” |
| design tokens | `src/styles/tokens.css` + Tailwind namespace `tm` | unit test ตรวจ contrast WCAG AA ทุกคู่สีข้อความ |
| responsive shell | route group `(public)` แยกจาก `/admin`; หลังบ้านมี sidebar ดำบน desktop และแถบเมนูบนมือถือ | screenshot desktop/mobile, e2e “console on a phone” |
| Supabase SSR Auth แบบ Admin role เดียว + RLS | migration + RLS + หน้าเข้าสู่ระบบ/ลืมรหัสผ่าน/ตั้งรหัสผ่าน/ไม่มีสิทธิ์/console | pgTAP 45 ข้อ, Playwright auth 13 ข้อ |
| login/logout/recovery และ denied access ทดสอบจริง | **ผ่านกับ Supabase Auth จริงใน local stack** (GoTrue v2.197.0, PostgREST v16.3); บน hosted dev project เจ้าของเข้าหลังบ้านได้แล้ว (เจ้าของแจ้ง 30 ก.ย.) | `npm run test:e2e:local` |
| CI | `.github/workflows/ci.yml` พร้อม | ผ่านบน GitHub Actions ทั้ง 2 jobs (lint/typecheck/unit/build และ Supabase local + pgTAP + Playwright) ใน draft PR #2 |

## สิ่งที่ทำ (เรียงตาม commit)

1. `chore: upgrade runtime…` — Next 16.3.7/React 19.3.0, ESLint CLI แทน `next lint`, สคริปต์ `typecheck`, แก้ import รูปที่ Turbopack ไม่รองรับ, อัปเกรด Swiper 14.3.0 และ Nodemailer 10.0.12 เพื่อปิดช่องโหว่, pin เวอร์ชันแบบ exact
2. `fix: repair broken assets and hydration errors…` — ปัญหาเดิมของเว็บจริงที่พบจาก smoke test ใหม่ (ทดสอบซ้ำกับ build เดิม `d3363b2` แล้วว่ามีอยู่ก่อน): รูป `Sim 10GB.png`/`iQiyi.png` 404 บน Linux, ลิงก์ favicon `/src/app/logo.ico` เสียทุกหน้า, React hydration error #418 ในหน้า `/`, `/broadband`, `/broadband-old`, `/wEnergy` (เกิดจาก `<p>` ซ้อน `<p>`), และสไตล์ MUI ที่ฝังใน `<body>`
3. `feat(db): add Admin access schema…` — `admin_memberships`, `audit_log` แบบ append-only, RLS, helper ใน schema `private`, สคริปต์ push ที่ตรวจ project ref และ organization ก่อน
4. `feat(ui): add Telemart design tokens…` — tokens, contrast helper, ย้ายหน้าเดิมเข้า `(public)` (URL เดิมทั้งหมด) และแยก Google Ads tag/Prompt font/MUI provider ให้อยู่เฉพาะหน้าสาธารณะ
5. `feat(auth): invite-only Admin sign-in…` — proxy (Next 16), หน้าหลังบ้าน, `/auth/confirm`, Server Actions, การตรวจสิทธิ์ฝั่ง server ทุกคำขอ
6. `ci: add GitHub Actions…` — lint/typecheck/unit/build/audit และ Supabase local + pgTAP + Playwright
7. `feat(auth): deny cross-site framing…` — ป้องกัน clickjacking หน้าหลังบ้าน
8. `test(db): scope RLS count assertions…` — ให้ pgTAP ผ่านได้ทั้งฐานข้อมูลใหม่และฐานที่มีข้อมูลเดิม
9. `fix(db): run the guarded dev push from Windows…` (30 ก.ย.) — เปลี่ยน `db:push:dev` จาก bash เป็น Node เพื่อให้รันจาก Windows cmd/PowerShell ได้ เพิ่ม `db:push:dev:apply` และลบ environment variable ที่ทำให้ CLI ไปที่ project อื่นได้

## ผลทดสอบล่าสุด

สภาพแวดล้อม: Claude Cloud container (Ubuntu 24.04, Linux), Node 24.18.0, npm 11.16.0, Supabase CLI 2.118.0 (local stack: Postgres 17.6.1.171, GoTrue v2.197.0, PostgREST v16.3, Mailpit), Playwright 1.63.0 กับ Chromium ที่ติดตั้งไว้ใน environment

| ชุดทดสอบ | คำสั่ง | ผล |
| --- | --- | --- |
| ESLint | `npm run lint` | ผ่าน ไม่มี warning |
| TypeScript | `npm run typecheck` | ผ่าน |
| Unit (Vitest) | `npm test` | 59/59 (รวมเงื่อนไขตรวจ dev target ของ `db:push:dev`) |
| Production build ไม่มีค่า Supabase | `npm run build` | ผ่าน; หลังบ้านแสดงข้อความว่ายังไม่ได้ตั้งค่า |
| RLS/สิทธิ์ (pgTAP) | `npm run db:test` | 45/45 (ฐานใหม่และฐานที่มีข้อมูลเดิม) |
| Database lint | `npm run db:lint` | ไม่มี error |
| E2E ทั้งหมด | `npm run test:e2e:local` | 35/35 (URL เดิม 10 หน้า × desktop/mobile + Swiper 2 + Auth 13) |
| ภาพหน้าเว็บเดิม | screenshot เทียบ build เดิม (ชั่วคราว ไม่ commit) | 20/20 ต่างไม่เกิน 0.5% |
| Dependency audit | `npm audit` | 0 vulnerabilities |

E2E ด้าน Auth ครอบคลุม: ผู้ไม่ได้เข้าสู่ระบบถูกส่งไปหน้า login, หน้าหลังบ้านไม่ถูก cache/index/frame, ข้อความผิดพลาดเดียวสำหรับอีเมลหรือรหัสผ่านผิด, Admin เข้า/ออกจากระบบ, กัน open redirect, บัญชีที่ไม่มีสิทธิ์ถูกปฏิเสธทั้งใน UI และเมื่อเรียก Data API ตรง, Admin ที่ถูกปิดสิทธิ์, การถอนสิทธิ์มีผลในคำขอถัดไป, ลืมรหัสผ่านทางอีเมล (ลิงก์ใช้ได้ครั้งเดียว, รหัสเดิมใช้ไม่ได้), เงื่อนไขรหัสผ่าน, คำเชิญ → ตั้งรหัสผ่าน → ถูกปฏิเสธ → ได้สิทธิ์ → เข้าได้, ลิงก์ปลอม, และหน้าจอมือถือ

## ความปลอดภัยที่ออกแบบไว้

- สิทธิ์หลังบ้านตรวจจาก `admin_memberships` ด้วย JWT ของผู้ใช้เองผ่าน RLS ทุกคำขอ ไม่ใช้ `user_metadata` และไม่อาศัยการซ่อนปุ่ม; proxy ทำหน้าที่ refresh session และส่งผู้ไม่ได้ login ไปหน้าเข้าสู่ระบบเท่านั้น
- ผู้ใช้เพิ่ม/แก้สิทธิ์ตัวเองไม่ได้ (ไม่มี insert/update/delete ผ่าน Data API) การให้สิทธิ์ทำผ่าน `private.grant_admin(...)` ใน SQL editor หรือ service role และทุกการเปลี่ยนแปลงถูกบันทึกลง `audit_log` ซึ่งแก้/ลบไม่ได้แม้แต่เจ้าของตาราง
- ปิดการสมัครเอง (invite-only), รหัสผ่านอย่างน้อย 12 ตัวอักษรมีตัวพิมพ์เล็ก/ใหญ่และตัวเลข, เปลี่ยนรหัสผ่านแล้วออกจากระบบทุกอุปกรณ์, ข้อความลืมรหัสผ่านเหมือนกันไม่ว่ามีบัญชีหรือไม่
- หน้าหลังบ้าน `noindex`, `Cache-Control: private, no-store`, `frame-ancestors 'self'`; ไม่มี secret key ใน repository หรือ `NEXT_PUBLIC_*`

## สิ่งที่ยังต้องตั้งค่าจริง (ต้องใช้สิทธิ์ของเจ้าของ)

1. ✅ **GitHub** (30 ก.ย.) — ติดตั้ง/เชื่อม Claude GitHub App แล้ว push branch และเปิด draft PR #2 ได้ CI ผ่าน; อย่า merge จนกว่าจะพร้อม deploy เพราะ Vercel deploy production จาก `main`
2. ✅ **Apply migration ที่ dev project** — ทำแล้ว 30 ก.ย. (เจ้าของแจ้ง) ใช้ขั้นตอนเดียวกันกับ migration ถัดไป (ต้องทำก่อนข้อ 4 เพราะ schema `private` และ `private.grant_admin` มาจาก migration นี้) จากเครื่องที่ checkout branch นี้แล้ว `npm ci` — ใช้ได้ทั้ง cmd, PowerShell และ bash:
   1. สร้าง personal access token ที่ https://supabase.com/dashboard/account/tokens ด้วยบัญชีที่อยู่ใน organization telemart-ubon แล้วตั้งค่าเฉพาะ terminal ที่ใช้ (ไม่ใส่ `.env.local`, repo หรือ environment variables ที่ทุกคนเห็น): cmd `set SUPABASE_ACCESS_TOKEN=sbp_...` · PowerShell `$env:SUPABASE_ACCESS_TOKEN = "sbp_..."` · bash `export SUPABASE_ACCESS_TOKEN=sbp_...`
   2. `npm run db:push:dev` — ตรวจ ref `wdcbbjvxrcxuaabcipqo` + organization `pfvlbpujcoqiqziehstu` ผ่าน Management API, link แล้ว dry run (ควรเห็น `20260929185408_admin_access_foundation.sql`)
   3. `npm run db:push:dev:apply` — ตรวจ ref/organization แล้วให้พิมพ์ ref ยืนยันก่อนเรียก CLI จากนั้น link, push และแสดง `migration list` (ถ้า terminal รับการพิมพ์ไม่ได้ ให้ตั้ง `CONFIRM_PROJECT_REF=wdcbbjvxrcxuaabcipqo` เฉพาะรอบนั้นแทน)
   4. ไม่ต้องใช้รหัสฐานข้อมูล (CLI สร้าง login role ชั่วคราวจาก token; ถ้าต้องการใช้รหัสให้ตั้ง `SUPABASE_DB_PASSWORD`) จากนั้นเปิด Security Advisor ตรวจอีกครั้ง และ revoke token เมื่อไม่ใช้แล้ว
3. **Supabase Auth ของ dev project** (Dashboard → Authentication):
   - ปิด “Allow new users to sign up” แต่เปิด Email provider ไว้ (ใช้สำหรับ login ด้วยรหัสผ่าน)
   - ตั้งความยาวรหัสผ่านขั้นต่ำ 12 และต้องมีตัวพิมพ์เล็ก/ใหญ่/ตัวเลข ให้ตรงกับแอป
   - URL Configuration: Site URL เป็น origin ที่ใช้ทดสอบ (เช่น `http://localhost:3000` หรือ staging URL) และเพิ่ม Redirect URLs ของ origin เหล่านั้น เช่น `http://localhost:3000/**`
   - Email Templates: ใช้เนื้อหาและหัวเรื่องจาก `supabase/templates/invite.html` และ `recovery.html` (ลิงก์ไป `/auth/confirm` แบบ token hash)
   - SMTP: อีเมลในตัวของ Supabase ส่งได้เฉพาะสมาชิกทีมและจำนวนจำกัด หากจะเชิญ Admin ที่ไม่ใช่สมาชิกทีม ต้องตั้ง custom SMTP
4. ✅ **สร้าง Admin คนแรก** — ทำแล้ว 30 ก.ย. (เจ้าของแจ้ง) วิธีเดียวกันใช้กับ Admin คนถัดไป (หลังข้อ 2): Authentication → Users → Add user แล้วเลือกอย่างใดอย่างหนึ่ง
   - Create new user: ใส่อีเมลและรหัสผ่านอย่างน้อย 12 ตัวที่มีตัวพิมพ์เล็ก/ใหญ่/ตัวเลข และเลือก Auto Confirm User (ไม่ต้องพึ่งอีเมล)
   - Send invitation: ลิงก์ในอีเมลชี้ไปที่ Site URL จึงต้องตั้งข้อ 3 (Site URL, Redirect URLs, template) และเปิดแอปที่ origin นั้นก่อน

   จากนั้นรัน `select private.grant_admin('อีเมล', 'Initial Admin');` ใน SQL editor ถ้าขึ้น `schema "private" does not exist` แปลว่ายังไม่ได้ apply migration (ข้อ 2) ถ้าขึ้น `No Supabase Auth user has email ...` แปลว่ายังไม่มีผู้ใช้นั้นใน Authentication
5. **Publishable key**: คัดลอกจาก Project Settings → API Keys ใส่ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ใน `.env.local`/Claude Cloud environment (ทั้งสองค่าเปิดเผยได้; ใน `.env.local` ของเจ้าของมีแล้ว ส่วน Claude Cloud environment ยังไม่มี `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ถ้าใส่ไว้ session ถัดไปจะตรวจ hosted project ผ่าน Data API ได้เอง) แล้ว `npm run dev` และเข้า http://localhost:3000/admin/login เพื่อทดสอบหลังบ้านกับ dev project จริง
6. **ยืนยันนโยบาย** ก่อนใช้งานจริงตาม ARCHITECTURE.md: รายชื่ออีเมล Admin, การเปิด MFA, ภาษา UI หลังบ้าน (ตอนนี้ภาษาไทย)
7. งานของ milestone ถัดไปที่ยังไม่เริ่ม: GA4 property/สิทธิ์ Data API (M5), บัญชี Higgsfield (M2 สื่อ), Vercel project/env/แพลนและโดเมน (M6), ราคาและข้อมูลแพ็กเกจที่ธุรกิจยืนยัน (M2)

## Dependencies

- เพิ่ม: `@playwright/test 1.63.0`, `vitest 5.0.2`, `supabase 2.118.0` (CLI ผ่าน npm), `@mui/material-nextjs 7.3.10`
- อัปเกรด: `next 16.3.7`, `react`/`react-dom 19.3.0`, `swiper 14.3.0`, `nodemailer 10.0.12`, `eslint-config-next 16.3.7`, `eslint 9.39.5`, `typescript 5.9.3`, `@types/node 24.19.0`, `@types/react(-dom) 19.3.0`, `postcss 8.5.28`, `tailwindcss 3.4.19`
- ลบ: `@types/nodemailer` (Nodemailer 10 มี types ในตัว), `@eslint/eslintrc`, `@mui/material-nextjs 6.3.1` (ไม่ได้ใช้และรองรับแค่ Next ≤15)
- คงไว้ตั้งใจ: Tailwind 3.4, MUI 6, framer-motion 11 สำหรับหน้าเดิมจนกว่า M2 จะออกแบบใหม่; TypeScript 7 ยังไม่ประเมิน
- ESLint 9.39.5 แสดงประกาศว่าหมดระยะ support แต่ ESLint 10 ติด peer ของ `eslint-plugin-react`/`-import`/`-jsx-a11y` ที่ `eslint-config-next 16.3.7` ใช้ (เป็นเครื่องมือ dev เท่านั้น ไม่กระทบ runtime)

## ข้อจำกัดและเรื่องที่ทราบ

- การตรวจ project ref ทำได้ในระดับ: `https://wdcbbjvxrcxuaabcipqo.supabase.co` ตอบกลับจริง (401 เพราะไม่มี apikey) ส่วนการตรวจ organization อยู่ใน `scripts/supabase/push-dev.mjs` (เงื่อนไขอยู่ใน `dev-target.mjs` ซึ่งมี unit test) ซึ่งต้องใช้ access token ของเจ้าของ; ทดสอบลำดับการทำงานทั้งหมดกับ Management API/CLI จำลองและตรวจว่า CLI 2.118.0 รับทุก flag แล้ว; 30 ก.ย. เจ้าของรัน `npm run db:push:dev` บน Windows cmd กับ dev project จริงแล้ว: ตรวจ ref/organization ผ่าน (`ACTIVE_HEALTHY`), link สำเร็จ, CLI ใช้ login role ชั่วคราว (ไม่ต้องใช้รหัสฐานข้อมูล) และ dry run แสดง migration ที่รอเพียง `20260929185408_admin_access_foundation.sql`
- ในรอบเดียวกัน prompt ยืนยันที่แสดงหลัง CLI รันบน Windows ไม่ได้รับการพิมพ์ (ขึ้น Cancelled ทันที ไม่มีอะไรถูก apply) `db:push:dev:apply` จึงถามยืนยันก่อนเรียก CLI และรับ `CONFIRM_PROJECT_REF` เป็นทางสำรอง
- Node 24 บน Windows อาจ abort ด้วย `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` เมื่อเรียก `process.exit()` หลัง `fetch()` (พบจริงในรอบนั้น หลังข้อความของสคริปต์) สคริปต์จึงจบด้วย `process.exitCode` เสมอ ล้าง timer และอ่าน response ให้จบก่อน; ยังไม่ได้ยืนยันซ้ำบน Windows
- Supabase CLI 2.118.0 ให้ environment variable `SUPABASE_PROJECT_ID` มีผลเหนือ project ที่ link ไว้ (ทดสอบแล้ว) สคริปต์จึงลบตัวแปรที่เปลี่ยนเป้าหมายได้ (`SUPABASE_PROJECT_ID`, `SUPABASE_DB_URL`, `SUPABASE_API_URL`, `SUPABASE_DASHBOARD_URL`, `SUPABASE_PROFILE`, `SUPABASE_WORKDIR`) ก่อนเรียก CLI และส่ง `--workdir` เป็น root ของ repo เสมอ
- `npm run test:e2e:local` และ `scripts/supabase/local-env.sh` ยังต้องใช้ bash (Linux/macOS/WSL/Git Bash); คำสั่งอื่นรวมถึง `db:push:dev` ใช้บน Windows cmd/PowerShell ได้
- `/api/contact` compile ผ่านกับ Nodemailer 10 แต่ไม่ได้ทดสอบส่งอีเมลจริง (ไม่มี credentials) — M5 จะแทนด้วย lead flow
- ยังไม่แก้ตามแผน M2/M5: meta description “Testing Prompt Thai font”, event `conversion` ที่ยิงทุกครั้งที่เปิดหน้าแรก, หน้า `/SoonContent` (ตัวอักษรแทบมองไม่เห็นเมื่อเครื่องใช้ dark mode)
- Swiper 14 เป็น major upgrade: ตรวจแล้วว่า carousel เริ่มทำงานและภาพหน้าตรงกับเดิม แต่ยังไม่ได้ทดสอบการกด/เลื่อนด้วยมือบนมือถือจริง
- Claude Cloud: ต้องเปิด Docker เองและดึง image ผ่าน mirror (`bash scripts/cloud/supabase-images.sh`) เพราะ network policy ปิดบาง registry; รายละเอียดใน CLAUDE-CLOUD-SETUP.md

## วิธีตรวจซ้ำ

```bash
npm ci
npm run lint && npm run typecheck && npm test && npm run build
npm run db:start              # ต้องมี Docker (ใน Claude Cloud รัน scripts/cloud/supabase-images.sh ก่อน)
npm run db:lint && npm run db:test
npm run test:e2e:local        # build กับ local stack แล้วรัน Playwright ทั้งหมด
```
