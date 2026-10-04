# M2 Public + Content Model — รายงานผล

วันที่ 30 กันยายน 2026 · branch `claude/vigilant-hypatia-czj87e` ต่อจาก M1 ([draft PR #2](https://github.com/telemartubonWebProduct/telemartUbon/pull/2))

**สรุป:** หน้าสาธารณะทั้ง 9 หน้าสร้างใหม่ตามแนวทาง A+B+C บน design tokens ของ M1 แสดงได้ทั้ง **ภาษาไทย (URL เดิม)** และ **ภาษาอังกฤษ (`/en/...`)** พร้อมปุ่มสลับภาษา เนื้อหาทั้งหมดมาจาก content model ที่ตรวจด้วย Zod (ชุดเดียวกับที่ Mirror Editor ของ M3 จะแก้) หน้าแรกมีภาพ Router Wi-Fi แบบภาพนิ่งที่แสดงทันทีและเปลี่ยนเป็นโมเดล 3D เมื่อเครื่องรองรับ ทดสอบผ่านทั้งในเครื่อง (Chromium desktop + มือถือจำลอง) และ GitHub Actions **ยังไม่ deploy production และไม่เปลี่ยน DNS** ส่วน Vercel ที่เจ้าของเชื่อมกับ repo ไว้สร้าง preview ของ branch นี้ให้อัตโนมัติ (bot รายงาน Ready ที่ `telemart-ubon-git-claude-vigilant-15d7b6-truetelemarts-projects.vercel.app`; session นี้เปิด URL นั้นไม่ได้เพราะ network policy จึงยังไม่ได้ตรวจหน้าที่ deploy จริง) **ราคาและเงื่อนไขแพ็กเกจทั้งหมดยังเป็นข้อมูลจากเว็บเดิมที่ธุรกิจต้องยืนยันก่อนเปิดใช้งาน** (ดูหัวข้อ “สิ่งที่เจ้าของต้องตรวจ”)

## เกณฑ์รับงาน M2 เทียบกับผล

| เกณฑ์ใน PLAN.md | ผล | หลักฐาน |
| --- | --- | --- |
| หน้า A+B+C ใช้งานได้ทั้งมือถือและ desktop | ทำแล้ว 9 หน้า × 2 ภาษา | e2e ทุกหน้า × desktop/มือถือ: `lang` ถูก, h1 เดียว, ไม่มีรูปที่ไม่มี alt, ไม่มี scroll แนวนอน, ไม่มี request ในเว็บที่ error; ตรวจ screenshot ด้วยตา |
| Poster แสดงก่อนโหลด 3D | ทำแล้ว | ภาพนิ่งเป็น HTML ที่ render ฝั่ง server; three.js โหลดแยกหลังหน้าว่าง (ไม่อยู่ใน JS ชุดแรก) |
| WebGL ใช้ไม่ได้ยังอ่าน/ติดต่อได้ | ทำแล้ว | e2e ปิด WebGL และ reduced motion → คงภาพนิ่ง ไม่สร้าง canvas; ปุ่มทุกปุ่มเป็นลิงก์ธรรมดา |
| โมเดลไม่บัง CTA | ทำแล้ว | e2e ตรวจว่าจุดกลางปุ่ม “ดูแพ็กเกจเน็ตบ้าน” เป็นปุ่มนั้นเองทั้ง desktop/มือถือ; บนมือถือข้อความและปุ่มมาก่อนภาพ |
| นำข้อมูล/สื่อเดิมเข้า model + catalog | ทำแล้ว | 99 แพ็กเกจ (แสดง 80, ซ่อน 19), media registry ระบุที่มาทุกไฟล์, unit test ตรวจ reference ทุกจุด |
| Shared renderer | ทำแล้ว | `src/components/site` อ่านจาก `src/lib/content` อย่างเดียว; M3 ใช้ component ชุดนี้ใน editor |
| SEO / redirect / route / asset map | ทำแล้ว | URL เดิมทุกหน้าและ anchor เดิม, canonical + hreflang (th, en, x-default), `sitemap.xml` สองภาษา, `robots.txt`, ภาพแชร์ 1200×630, 404 สองภาษา — e2e ครอบคลุม |
| ราคา/โปรตรวจโดยธุรกิจ | **ยังไม่ผ่าน** | ทุกแพ็กเกจมีสถานะ `unverified` หรือ `hidden` และมีบันทึกให้ตรวจ ธุรกิจต้องยืนยันก่อน launch |
| (คำขอเพิ่ม) โหมดสลับภาษา TH/EN | ทำแล้ว | e2e กดสลับภาษาไป-กลับ, ลิงก์ในหน้าอังกฤษอยู่ใน `/en` ทั้งหมด, ข้อความอังกฤษไม่มีอักษรไทย (unit test > 300 คู่) |

## โหมดภาษา ไทย / English

- **URL:** ไทยใช้ URL เดิมทุกหน้า (`/`, `/broadband`, `/monthy#game` …) อังกฤษเติม `/en` ข้างหน้า (`/en`, `/en/broadband`, `/en/monthy#game`) ลิงก์เก่าที่แชร์ไว้ใช้ได้เหมือนเดิม `/th/...` redirect ถาวรไป URL ไทยเดิมเพื่อไม่ให้ซ้ำ
- **ปุ่มสลับ:** “ไทย / English” อยู่ที่ header (มองเห็นเสมอทั้ง desktop และมือถือ ไม่ต้องเปิดเมนู) และที่ footer กดแล้วไปหน้าเดียวกันในอีกภาษา ภาษาปัจจุบันมีขีดเส้นแดงใต้คำ
- **เนื้อหา:** ทุกข้อความที่ผู้เข้าชมเห็น (เมนู ปุ่ม ชื่อแพ็กเกจ รายละเอียด หน่วย ข้อความว่าง ข้อความ alt ของรูป) มีทั้ง `th` และ `en` ใน content model และ schema บังคับว่าต้องมีทั้งสองภาษา ข้อความอังกฤษเป็นร่างแปลให้เจ้าของตรวจ
- **ข้อตกลงและนโยบาย:** หน้าอังกฤษแปลจากฉบับไทย มีหมายเหตุว่าถ้าขัดกันให้ถือฉบับภาษาไทย
- **Search engine:** แต่ละหน้าบอก URL ภาษาไทย/อังกฤษของตัวเอง (`hreflang`) และใช้ภาษาไทยเป็นค่าเริ่มต้น (`x-default`) sitemap มีครบ 18 URL
- **ที่ยังเป็นภาษาไทยเสมอ:** หลังบ้าน `/admin` (ตาม M1) และหน้า 404 แสดงทั้งสองภาษาพร้อมกันเพราะ URL ที่ไม่รู้จักบอกภาษาไม่ได้

## สิ่งที่ทำ (เรียงตาม commit)

1. `feat(i18n): serve the public site in Thai at its URLs and English under /en` — ย้ายหน้าไป `src/app/[locale]`, rewrite ให้ไทยอยู่ URL เดิม, redirect `/th/*` และ `/SoonContent`, root layout แยกของหลังบ้าน, `global-not-found` สำหรับ 404 จริง
2. `feat(content): model the public site's content in Thai and English` — schema (`src/lib/content/schema.ts`), เนื้อหาใน `src/content` (site settings, 9 หน้า, media registry, สิทธิประโยชน์, 99 แพ็กเกจพร้อมที่มาและบันทึกตรวจ), loader ที่ตรวจทุก reference ตอน build
3. `feat(site): rebuild the public pages in Thai and English` — component ชุดใหม่: header/เมนู (dropdown บน desktop, แผงเมนูบนมือถือ), ปุ่มสลับภาษา, footer, แถบติดต่อ, การ์ดเปรียบเทียบแพ็กเกจที่หัวข้อตรงแถวกันทุกใบ (CSS subgrid), หมวดพร้อม anchor เดิม, ช่องทางติดต่อ, หน้าข้อตกลง; ลบ component/ข้อมูลเก่าและ MUI/Emotion/Swiper/framer-motion; SEO ครบ
4. `feat(home): 3D router hero with the poster as fallback` — โมเดล Router Wi-Fi แบบ procedural (ไม่มีไฟล์ให้โหลด) กล้องและสัดส่วนเดียวกับภาพนิ่ง หมุนแนะนำหนึ่งครั้งแล้วหยุด ลากซ้าย-ขวาเพื่อหมุนได้ในขอบเขต หยุด render เมื่อเลื่อนพ้นจอหรือสลับแท็บ
5. `docs: …` (commit นี้) — รายงานนี้, ภาพแชร์ social, ลบ `@react-three/drei` ที่ไม่ได้ใช้

### หน้าแต่ละหน้า

| URL | เนื้อหา |
| --- | --- |
| `/` | Hero + Router Wi-Fi, เลือกบริการ 4 แบบ (โซลาร์ระบุว่าเป็นบริการของ W&W Energy), แพ็กเกจเน็ตบ้านเด่น 3 แพ็กเกจ, แพ็กเสริมมือถือพร้อมลิงก์ไปหมวด, 3 ขั้นตอน, โซลาร์เซลล์, คำถามที่พบบ่อย |
| `/broadband` | เน็ตบ้านลูกค้าใหม่ 7 แพ็กเกจแบบเปรียบเทียบ |
| `/broadband-old` | เพิ่มสปีดรายเดือน/รายวัน, อุปกรณ์เสริม (`#cctv`) |
| `/monthy` | แพ็กเสริมรายเดือน 7 หมวด (`#internetpure`, `#socialInternet`, `#entertainment`, `#game` …) |
| `/topup` | แพ็กเสริมเติมเงิน 6 หมวด (`#internet`, `#internetcall`, `#call`, `#entertain`, `#game`, `#inssurance`) |
| `/wEnergy` | โซลาร์เซลล์ W&W Energy: บริการ, ผลงาน, ขั้นตอน, ราคา 3 แพ็กเกจ (`#solar`), โปรเน็ตบ้านร่วม, ความรู้พื้นฐาน |
| `/service` | ช่องทางติดต่อ: LINE (QR + ID), โทร 3 เบอร์, อีเมล, เฟซบุ๊ก |
| `/wifiService` | สมัครเน็ตบ้านผ่านเจ้าหน้าที่ + 3 ขั้นตอน |
| `/termsAndPrivacy` | ข้อตกลงและนโยบายความเป็นส่วนตัว พร้อมสารบัญ |

ปุ่ม “สนใจแพ็กเกจนี้” ทุกใบเปิด LINE ฝ่ายขาย (`https://lin.ee/blqnOJow` แบบเดียวกับเว็บเดิม) และมี `data-cta` ถาวรสำหรับวัดผลใน M5 ปุ่มใน header/hero ไปหน้าติดต่อ ฟอร์มขอให้เจ้าหน้าที่ติดต่อกลับเป็นงาน M5

## ผลทดสอบล่าสุด

สภาพแวดล้อม: Claude Cloud container (Ubuntu 24.04), Node 24.18.0, Playwright 1.63.0 กับ Chromium (WebGL ผ่าน SwiftShader), Supabase local stack สำหรับชุด Auth

| ชุดทดสอบ | คำสั่ง | ผล |
| --- | --- | --- |
| ESLint | `npm run lint` | ผ่าน |
| TypeScript | `npm run typecheck` | ผ่าน |
| Unit (Vitest) | `npm test` | 79/79 (content model, reference, render helpers, ไฟล์ media, กล้อง 3D เทียบภาพนิ่ง, ของ M1) |
| Production build | `npm run build` | ผ่าน; หน้าสาธารณะ 18 หน้า prerender เป็น static |
| E2E ทั้งหมด | `npm run test:e2e:local` | 73/73 (หน้า 9 × 2 ภาษา × desktop/มือถือ, สลับภาษา, ลิงก์อังกฤษ, anchor เดิม, ปุ่ม LINE, เมนู, redirect, 404, sitemap/robots, ภาพ 3D 4 กรณี × 2, Auth 13) |
| GitHub Actions | PR #2 | ผ่านทั้ง 2 jobs ที่ commit `d6b5a4c`; commit ต่อจากนั้นดูสถานะใน PR |
| Dependency audit | `npm audit` | 0 vulnerabilities |
| ขนาด JS | build จริง | หน้าแรกโหลด JS ชุดแรก ~188 KB (gzip); three.js + Fiber ~244 KB (gzip) โหลดทีหลังเฉพาะเมื่อแสดง 3D |

## สิ่งที่เจ้าของต้องตรวจหรือยืนยัน

ข้อมูลทั้งหมดนำเข้าจากเว็บเดิม (commit `87c70d2`) ไม่มีการสร้างราคา โปร รีวิว หรือยอดผู้ใช้ขึ้นเอง รายละเอียดรายแพ็กเกจอยู่ใน `review.notes` ของแต่ละรายการใน `src/content/catalog/*.ts`

1. **ราคาและเงื่อนไขแพ็กเกจ (ต้องทำก่อน launch):** แสดงอยู่ 80 รายการ (เน็ตบ้านใหม่ 7, ลูกค้าปัจจุบัน 6, รายเดือน 49, เติมเงิน 15, โซลาร์ 3) ทั้งหมดสถานะ `unverified` ต้องยืนยันราคา ระยะเวลา รหัสกดสมัคร และเงื่อนไขปัจจุบัน แล้วเปลี่ยนเป็น `verified` (หรือบอกนโยบายว่าจะแสดงแพ็กเกจที่ยังไม่ยืนยันหรือไม่ — brief กำหนดให้ใช้ข้อมูลที่ตรวจแล้วเท่านั้น) — **2026-10-01:** ไฟล์ให้เจ้าของตรวจ [`price-review-2026-10-01.xlsx`](price-review-2026-10-01.xlsx) (ชีตแพ็กเกจที่แสดง 80 และที่ซ่อน 19 พร้อมคอลัมน์ ยืนยัน / แก้เป็น / ซ่อน) สร้างจาก `src/content` ไม่มีการแก้ราคา
2. **แพ็กเกจที่ซ่อนไว้ 19 รายการ** เพราะข้อมูลเดิมขัดกันหรือซ้ำ เช่น
   - Up2U Au Bon Pain: ชื่อบอก 79 บาท เน็ต 5GB แต่ข้อมูลเป็น 200 บาท 3GB
   - WeTV 4GB: ช่วงสมัคร 7 มิ.ย.–31 ก.ค. 67 หมดเขตแล้ว
   - Viu Premium 500MB: ชื่อบอก 1 วัน แต่ระยะเวลา 30 วัน ราคา 999 บาท
   - หมวด “ความบันเทิง” ของเติมเงินทั้งหมวดเป็นสำเนาแพ็กโทร จึงแสดงข้อความ “ยังไม่มีแพ็กเกจที่ตรวจข้อมูลแล้ว” พร้อมปุ่ม LINE
   - แพ็กเพิ่มสปีด “รายวัน” ของลูกค้าปัจจุบันเป็นข้อมูลตัวอย่าง (ราคาเท่ารายเดือน ไม่มีระยะเวลา)
   - รายการที่อยู่ผิดหมวด (เน็ต/ประกันในหมวดเกม ฯลฯ) และรายการซ้ำ
3. **จุดที่ต้องยืนยันในแพ็กเกจที่แสดง:** แพ็กเกจลูกค้าปัจจุบันไม่ระบุว่ารวม VAT หรือไม่ (จึงไม่แสดงบรรทัด VAT), “ระยะสัญญา 12 เดือน” ที่ขัดกับสัญญา 24 เดือนของแพ็ก 499, ชื่อทางการของแพ็ก 799 และ 1,199 บาท, รหัสกดสมัครที่ซ้ำกัน (`*900*7129#`), iQIYI 119 ที่เงื่อนไขบอกลูกค้าเติมเงินแต่อยู่หน้ารายเดือน, ราคา Asian Combo 179 บาทเป็นรายรอบหรือรายปี, ไอคอนสิทธิประโยชน์ 2 รายการที่ระบุไม่ได้ (อุปกรณ์ Wi-Fi ทรงตั้ง และโลโก้พันธมิตรเกมสีแดง)
4. **บัญชี LINE:** เว็บเดิมใช้ 2 ลิงก์ — ปุ่มแพ็กเกจและ footer ใช้ `lin.ee/blqnOJow` (คู่กับ QR/ID `@341tmfte` ใน footer เดิม) ส่วนหน้าติดต่อและปุ่มลอยใช้ `lin.ee/eMhqQpj` เว็บใหม่ใช้ `blqnOJow` เป็นหลักทุกจุด ต้องยืนยันว่าแต่ละลิงก์เป็นบัญชีไหน และหน้าติดต่อควรใช้บัญชีใด (เปลี่ยนได้ที่ `channels` ใน `src/content/pages/support.ts`)
5. **เบอร์โทร 3 เบอร์** ตั้งป้าย “ฝ่ายขาย” ทั้งหมด ถ้าแต่ละเบอร์ดูแลคนละเรื่องให้แจ้งชื่อป้าย
6. **โซลาร์เซลล์:** ข้อความเดิมใช้ทั้งชื่อ W&W Energy และ WERWIND Energy/Werwind Energy Solar ต้องยืนยันชื่อที่ใช้ทางการ; ตัวเลขผลงาน (77 จังหวัด, 57 ทีม, 2,115 โครงการ, 56,304 kW) และ ISO 9001:2015 เป็นข้อความเดิมที่ต้องยืนยัน; รูปผลิตภัณฑ์มีเบอร์ 091-710-1605 และ LINE @WWESOLAR ของ W&W ฝังอยู่ในภาพ (ลูกค้าอาจติดต่อ W&W โดยตรง); โปร “ติดตั้งโซลาร์ รับเน็ตทรูออนไลน์ฟรี 36 เดือน” ยังมีอยู่หรือไม่
7. **ภาพ Router Wi-Fi:** เป็นภาพประกอบ (concept) ไม่อ้างรุ่นจริง มีคำบรรยาย “ภาพประกอบ ไม่ใช่รุ่นที่ติดตั้งจริง” ใต้ภาพ ถ้าต้องการให้ตรงรุ่นที่ติดตั้ง ต้องส่งชื่อรุ่น/ภาพอ้างอิงที่อนุมัติ (ตาม 3D-MEDIA-PLAN.md)
8. **ข้อความภาษาอังกฤษ** ทั้งหมดเป็นร่างแปล ควรให้ผู้รู้ภาษาตรวจ โดยเฉพาะหน้าข้อตกลง
9. **ข้อตกลงและนโยบายความเป็นส่วนตัว:** ข้อความเดิมยังต้องให้ธุรกิจ/ที่ปรึกษากฎหมายตรวจ; เว็บโหลด Google Ads tag และ Tawk โดยยังไม่มีการขอความยินยอมคุกกี้ (PDPA) — ออกแบบใน M5 พร้อม analytics
10. **Google Ads:** เว็บเดิมยิง event `conversion` ทุกครั้งที่เปิดหน้าแรก (นับการเข้าชมเป็น conversion) เว็บใหม่คง base tag แต่เลิกยิง event นี้ ถ้าแคมเปญใช้ conversion นี้ในการตั้งราคาประมูล ให้แจ้งผู้ดูแลบัญชีก่อน deploy; M5 จะผูก conversion กับการส่งฟอร์มสำเร็จ/คลิกติดต่อ — **อัปเดต 2026-10-01:** เจ้าของสั่งคืนการยิง conversion เมื่อเปิดหน้าแรกแล้ว (DECISIONS.md หัวข้อถัดจาก R1)
11. **ฟอร์มติดต่อเดิมที่หน้า `/service`** (ส่งอีเมลผ่าน Nodemailer) ถูกแทนด้วยช่องทาง LINE/โทรไว้ก่อน ฟอร์มขอให้ติดต่อกลับที่บันทึกลง Supabase เป็นงาน M5 — ถ้าต้อง deploy ก่อน M5 หน้านี้จะไม่มีฟอร์ม (`/api/contact` ยังอยู่)
12. **Favicon** ปัจจุบันเป็นโลโก้ตัวอักษรที่ถูกบีบเป็น 32×11 ควรมีไอคอนสี่เหลี่ยมจากเจ้าของแบรนด์
13. **สิทธิ์การใช้โลโก้พันธมิตรและภาพแคมเปญของทรู** ที่นำมาจากเว็บเดิม (ระบุที่มาใน `src/content/media.ts`)

## งาน integration ที่ยังเหลือ

- M3: ย้ายเนื้อหาจาก `src/content` ไป Supabase (draft/published) และ Mirror Editor ที่ใช้ component ชุดเดียวกัน — ตอนนี้แก้เนื้อหาต้องแก้โค้ด
- M5: ฟอร์มขอให้ติดต่อกลับ + lead ใน Supabase, GA4 property/สิทธิ์ Data API, event การคลิก LINE/โทร (ใช้ `data-cta` ที่มีแล้ว), consent
- M6: Vercel project/environment (ตั้ง `NEXT_PUBLIC_SITE_URL` ให้ตรงโดเมนจริง; ค่าเริ่มต้นคือ `https://www.telemartubon.com`), ตรวจบน Safari iPhone และ Chrome Android จริง, วัด LCP/INP จาก deployment จริง, domain cutover
- Higgsfield (ถ้าจะใช้ภาพ/วิดีโอประกอบ): connector ยังตอบ `USER_NOT_LOGGED_IN` ตอนตรวจครั้งก่อน

## Dependencies

- ลบ: `@mui/material`, `@mui/icons-material`, `@mui/material-nextjs`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`, `@heroicons/react`, `framer-motion`, `swiper`, `react-multi-carousel`, `react-facebook`, `react-intersection-observer` (ใช้เฉพาะหน้าเดิม) และ `@react-three/drei` (ไม่ได้ใช้: Environment ของ drei พ่วง loader ที่ไม่จำเป็น จึงใช้ `RoomEnvironment` ของ three แทน)
- ใช้จริงแล้ว: `three 0.186.1`, `@react-three/fiber 9.8.1` (โหลดแบบ lazy), `zod 4.6.5`
- คงไว้: Tailwind 3.4 (tokens เป็น CSS variables ย้ายเป็น v4 ภายหลังได้), `nodemailer` สำหรับ `/api/contact` จนกว่า M5, `@google-analytics/data` สำหรับ M5
- ฟอนต์: IBM Plex Sans Thai ผ่าน `next/font` (ไฟล์ฟอนต์ถูกรวมตอน build ไม่ดึงจาก Google ขณะเปิดหน้า); เลิกใช้ Prompt

## ข้อจำกัดและเรื่องที่ทราบ

- 3D ทดสอบใน Chromium headless (WebGL แบบ software) ยังไม่ได้ลองบนมือถือจริง Safari/Chrome ตามเกณฑ์ของ 3D-MEDIA-PLAN.md; บนเครื่องที่ช้า WebGL จะทำงานช้าตาม ภาพนิ่งยังแสดงจนกว่าเฟรมแรกของโมเดลพร้อม
- โมเดล 3D แยกรูปทรงแบบง่าย (ไม่มีโลโก้/พอร์ต) ตั้งใจให้เป็น concept เท่ากับภาพนิ่ง
- ภาพนิ่งและภาพแชร์สร้างใหม่ได้ด้วย `python3 scripts/media/router-concept.py public/media/router-concept.svg` และ `node scripts/media/og-image.mjs`; ถ้าเปลี่ยนสัดส่วน ให้แก้ `router-geometry.ts` ให้ตรง (unit test จะเตือน)
- Tawk live chat โหลดหลังหน้าว่าง ภาษาของกล่องแชตตั้งค่าที่ Tawk dashboard ไม่ได้ตามภาษาของหน้า
- เมนูบนมือถือเป็นแผงเปิด/ปิด (ปิดด้วย Escape หรือเมื่อเลือกลิงก์) ไม่ใช่ modal จึงไม่ล็อก focus
- ราคาไม่ได้ผ่านการตรวจ ดังนั้น preview ที่ Vercel สร้างอัตโนมัติไม่ควรส่งให้ลูกค้าดู

## วิธีตรวจซ้ำ

```bash
npm ci
npm run lint && npm run typecheck && npm test && npm run build
npm start                     # เปิด http://localhost:3000 (ไทย) และ http://localhost:3000/en (อังกฤษ)
npm run db:start              # สำหรับชุดทดสอบ Auth (Docker; ใน Claude Cloud รัน scripts/cloud/supabase-images.sh ก่อน)
npm run test:e2e:local        # build กับ local stack แล้วรัน Playwright ทั้งหมด
```
