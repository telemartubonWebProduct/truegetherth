# Tooling setup สำหรับการรีโนเวท Telemart Ubon

ตรวจสอบและติดตั้งวันที่ 29 กันยายน 2026 ระหว่างขั้นเลือกแนวทางและวางแผน ก่อนลงมือเปลี่ยนเว็บไซต์

## Skills ที่ติดตั้งจริง

ติดตั้งระดับโปรเจกต์สำหรับ Codex ด้วย Skills CLI 1.7.0 แบบ `--copy` เก็บเป็นไฟล์ปกติใน `.agents/skills/` ไม่สร้าง symlink หรือเปลี่ยนชุด skills ส่วนกลาง

| Skill | ใช้ทำอะไร | Source | ตำแหน่งในโปรเจกต์ |
| --- | --- | --- | --- |
| `grill-me` | คำสั่งเริ่มสัมภาษณ์เพื่อให้เข้าใจขอบเขตตรงกัน | [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me) | `.agents/skills/grill-me/` |
| `grilling` | ขั้นตอนสัมภาษณ์จริงที่ `grill-me` เรียกใช้ | [mattpocock/skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling) | `.agents/skills/grilling/` |
| `vercel-react-best-practices` | แนวทาง React/Next.js ด้านการโหลดข้อมูล ประสิทธิภาพ และขนาด bundle | [Vercel](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | `.agents/skills/vercel-react-best-practices/` |
| `frontend-design` | วางสี ตัวอักษร layout และ interaction ให้ตรงธุรกิจและธีม True | [Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | `.agents/skills/frontend-design/` |

คำสั่งที่รันสำเร็จ:

```powershell
npx --yes skills add mattpocock/skills --skill grill-me grilling --agent codex --copy --yes
npx --yes skills add vercel-labs/agent-skills --skill vercel-react-best-practices --agent codex --copy --yes
npx --yes skills add anthropics/skills --skill frontend-design --agent codex --copy --yes
```

ตรวจด้วย `npx --yes skills list --json` พบทั้ง 4 skills ใน scope `project` และตรวจ filesystem แล้วไม่พบ reparse point ใน `.agents/` มีไฟล์ที่ติดตั้งรวม 81 ไฟล์ พร้อม `skills-lock.json` บันทึก source, skillPath และ computedHash ไว้สำหรับทำซ้ำและตรวจการเปลี่ยนแปลง

ก่อนติดตั้งอ่านเนื้อหา ตรวจ source และเทียบความนิยมจาก [Skills leaderboard](https://skills.sh/) และ GitHub โดยพบ `grill-me` ประมาณ 1.2M installs, Vercel React ประมาณ 754K และ frontend-design ประมาณ 934K ณ เวลาที่ตรวจ จำนวนเหล่านี้เป็นเพียงข้อมูลคัดกรองความน่าเชื่อถือร่วมกับ source และเนื้อหา ไม่ใช่ผลยืนยันความปลอดภัยของโค้ดเว็บไซต์

## ขั้นตอน /grill-me ที่ใช้กับงานนี้

เวอร์ชันปัจจุบันของ `grill-me` เป็น wrapper จึงติดตั้ง `grilling` ด้วย อ่านทั้งสองไฟล์ครบแล้ว ขั้นตอนที่ต้องทำคือ:

1. แบ่งเรื่องที่ต้องตัดสินใจเป็นต้นไม้ เช่น เป้าหมายธุรกิจ → ช่องทางรับลูกค้า → รูปแบบ lead; รูปแบบแก้คอนเทนต์ → draft/publish → สิทธิ์ admin
2. ในแต่ละรอบถามเฉพาะเรื่องที่ prerequisites ตัดสินใจแล้ว ถามพร้อมกันทั้งกลุ่มนั้น มีเลขคำถามและคำตอบที่แนะนำ
3. รอคำตอบผู้ใช้ก่อนถามรอบถัดไป เรื่องที่หาได้จากโค้ด เครื่องมือ หรือข้อมูลสาธารณะให้ตรวจเอง
4. จบเมื่อไม่มีเรื่องสำคัญค้างโดยเงียบ ๆ และผู้ใช้ยืนยันว่าเข้าใจตรงกันก่อนลงมือสร้างตามแผน

คำสั่งจาก skill ที่กำหนดขอบเขตนี้โดยตรง: “Do not act on it until the user confirms you have reached a shared understanding.” ดู [ไฟล์ skill](../../.agents/skills/grilling/SKILL.md)

การติดตั้ง tooling นี้อยู่ในขอบเขตที่ผู้ใช้สั่งให้เตรียมไว้ก่อน งานหน้าเว็บและหลังบ้านต้องเดินต่อหลังเลือก template และสรุปผล interview

## ความสามารถที่มีอยู่แล้ว

| ความสามารถ | สถานะ | วิธีใช้ในแผน |
| --- | --- | --- |
| Supabase skill และ Postgres best practices | มีใน plugin ที่พร้อมใช้งานอยู่แล้ว ไม่ติดตั้งซ้ำ | ออกแบบ Auth, database, RLS และ Storage เมื่อถึงขั้น implementation |
| Web Design Guidelines | มี skill ส่วนกลางอยู่แล้ว ไม่ติดตั้งซ้ำ | ตรวจ accessibility, UI และ responsive หลังสร้างจริง |
| Higgsfield MCP และ skills | มี tools ให้เรียกได้ แต่การตรวจ account ในรอบนี้รายงาน `USER_NOT_LOGGED_IN` | ต้องเชื่อม account ก่อนสร้างภาพ/วิดีโอกราฟิกจริง ไม่ใช้แทนภาพสินค้า |
| Google Analytics | ยังต้องตรวจ property และการเข้าถึง API ตามแผน integration | ห้ามอ้างว่าเชื่อมรายงานแล้วจากเพียงการมี library |

ความพร้อมของ skill/tool ไม่เท่ากับการตั้งค่า service ของเว็บไซต์เสร็จแล้ว

## Next.js และ libraries

ไม่ได้ติดตั้ง `next-best-practices` จาก source เก่า เพราะ [README ทางการของ vercel-labs/next-skills](https://github.com/vercel-labs/next-skills) ระบุว่าย้าย workflow skills ไปยัง Next.js repository และยกเลิก skill ชื่อนี้ ความรู้ reference อยู่ใน bundled docs (`next/dist/docs/`) และ agent rules ที่ Next.js 16.3+ สร้างเมื่อรัน `next dev` ดู [Next.js AI agents guide](https://nextjs.org/docs/app/guides/ai-agents)

ต้องเลือก Next.js stable ที่ registry มีจริง แล้วใช้เอกสารให้ตรงเวอร์ชัน ไม่อนุมานเวอร์ชันจากข้อความ README เพียงอย่างเดียว ไม่ติดตั้ง cache workflow skills ก่อนมีข้อสรุปเรื่อง rendering/cache ที่จำเป็น

งาน subtask นี้ไม่ได้แก้ `package.json`, `package-lock.json`, application source หรือ environment variables และไม่ได้รัน migration/codemod/Next dev งานติดตั้งและอัปเกรด libraries ของเว็บไซต์รวมถึงการทดสอบ build อยู่ในขั้น tooling ของงานหลัก ต้องบันทึกตามผลจริงก่อนถือว่าพร้อมใช้งาน

## รายการไฟล์ที่เปลี่ยนจาก subtask นี้

- เพิ่ม `.agents/skills/grill-me/` (2 ไฟล์)
- เพิ่ม `.agents/skills/grilling/` (2 ไฟล์)
- เพิ่ม `.agents/skills/vercel-react-best-practices/` (75 ไฟล์ รวม rules และ compiled guide)
- เพิ่ม `.agents/skills/frontend-design/` (2 ไฟล์ รวม license)
- เพิ่ม `skills-lock.json`
- เพิ่ม `docs/renovation/TOOLING-SETUP.md`

ไม่มีการ commit, push, publish หรือปรับแต่ง account ภายนอกใน subtask นี้

## ผล setup ของงานหลัก

งานหลักติดตั้งผ่าน npm สำเร็จและตรวจ `npm ls --depth=0` แล้ว:

| Library | Exact version | หน้าที่ |
|---|---|---|
| `@supabase/supabase-js` | `2.117.2` | Auth/database/storage client |
| `@supabase/ssr` | `0.12.7` | Server/browser clients และ cookies |
| `zod` | `4.6.5` | Request/content validation |
| `@google-analytics/data` | `7.2.1` | GA4 reports บน server |

เปลี่ยนเฉพาะ package.json/package-lock.json เพื่อเตรียม dependencies; ยังไม่เขียน integration หรือใส่ credentials Runtime เดิมยังเป็น Next `15.1.11` / React `19.0.0` จะย้าย Next/React และ UI toolchain ใน M1 หลังยืนยัน scope

Local runtime ที่ตรวจจริง: Node `24.18.0`, npm `11.16.0`, RTK `0.42.4`

ตรวจ baseline เว็บเดิมหลังติดตั้ง dependencies ทั้ง 4 รายการครบแล้ว: `npm run build` ผ่าน 15 หน้า static, `npx tsc --noEmit` ผ่าน, `git diff --check` ผ่าน และ import exports ของทั้ง 4 libraries ผ่าน ครั้งแรก typecheck ก่อน Next สร้าง image declarations เคยรายงาน 10 TS2307 แล้วหายในการตรวจหลัง build

หลังติดตั้ง GA Data library ตรวจ dependency tree สำเร็จ และ `npm audit` ยังพบ 19 advisories (3 low, 4 moderate, 10 high, 2 critical) รวม Next/Swiper critical และ Nodemailer high ยังไม่แก้ด้วย force update จะจัดการใน milestone อัปเกรดแล้วตรวจซ้ำ

npm แจ้ง lifecycle scripts ของ sharp/protobufjs ยังไม่อยู่ใน allowScripts ไม่ได้อนุมัติ scripts เพิ่มโดยอัตโนมัติ และไม่ถือว่าการติดตั้งทำให้ GA4/Auth ของเว็บเชื่อมแล้ว การทดสอบ service จริงเป็นงาน integration ภายหลัง

หน้าตัวเลือก `templates.html` เปิดผ่าน local preview ที่ `http://127.0.0.1:4318/templates.html` เพื่อดูภาพอ้างอิงจริง ไม่มีการ publish เว็บไซต์ local preview ใช้ Python HTTP server บน loopback และจะใช้ได้ขณะ process ทำงาน

## เครื่องมือที่เพิ่มใน M1 (2026-09-29)

| Library/tool | Exact version | หน้าที่ |
|---|---|---|
| `next` / `react` / `react-dom` | `16.3.7` / `19.3.0` / `19.3.0` | runtime ใหม่ (Turbopack build, proxy) |
| `eslint-config-next` + `eslint` | `16.3.7` + `9.39.5` | lint ด้วย ESLint CLI (`npm run lint`) |
| `vitest` | `5.0.2` | unit tests (`npm test`) |
| `@playwright/test` | `1.63.0` | smoke URL เดิมและ Auth flows |
| `supabase` (CLI ผ่าน npm) | `2.118.0` | local stack, migrations, pgTAP (`npm run db:*`) |
| `@mui/material-nextjs` | `7.3.10` | Emotion cache สำหรับ App Router (แทน 6.3.1 ที่ไม่ได้ใช้และไม่รองรับ Next 16) |

ลบ `@types/nodemailer` (Nodemailer 10 มี types ในตัว) และ `@eslint/eslintrc` (flat config ตรง) รายละเอียดผลทดสอบและเหตุผลอยู่ใน [M1-FOUNDATION.md](M1-FOUNDATION.md)

## Setup 3D หลังเลือก A+B+C

ผู้ใช้เพิ่ม C และยืนยัน Router Wi-Fi ของทรูเป็นภาพเด่น อนุญาตให้เลือก Three.js/Higgsfield/วิธีอื่นตามคุณภาพ ติดตั้ง exact pins เพิ่มแล้ว:

| Library | Exact version | Scope |
|---|---|---|
| `three` | `0.186.1` | dependency |
| `@react-three/fiber` | `9.8.1` | dependency |
| `@react-three/drei` | `10.7.9` | dependency — ลบใน M2 เพราะไม่ได้ใช้ |
| `@types/three` | `0.186.0` | dev dependency |

ตรวจ `npm ls --depth=0` พบ versions ตรงและไม่เกิด peer conflict กับ React/react-dom 19.0.0; smoke import Fiber Canvas/Drei OrbitControls และสร้าง/dispose Three BoxGeometry ผ่าน Node ESM สำเร็จ Node smoke แจ้ง CJS deprecation ของ Three จาก dependency import path จึงยังต้องตรวจ browser bundle จริงในการสร้างฉาก ไม่ถือเป็นผล render

`npx tsc --noEmit` และ `npm run build` หลัง installation ผ่าน (build exit 0, 15 static pages); `git diff --check` ผ่าน Audit ยังรายงาน 19 รายการเดิม โมเดล/texture/poster ยังไม่ได้สร้าง และยังไม่ได้ติดตั้งหน้า Canvas ในแอป แนวทางผลิต/ตรวจคุณภาพอยู่ [3D-MEDIA-PLAN.md](3D-MEDIA-PLAN.md)
