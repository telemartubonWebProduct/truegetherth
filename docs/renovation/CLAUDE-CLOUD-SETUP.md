# ตั้งค่า Claude Cloud สำหรับ Telemart Ubon

ตรวจเอกสารทางการวันที่ 29 กันยายน 2026 เอกสารนี้เป็นค่าที่แนะนำและวิธีส่งต่องาน **ยังไม่ได้สร้างหรือบันทึก cloud environment, ใส่ credentials หรือเริ่ม cloud session ให้ผู้ใช้** Repo มีสคริปต์ [environment-setup.sh](../../scripts/cloud/environment-setup.sh) ที่ไม่ต้องพึ่ง checkout, `.env.example`, SessionStart hook และ handoff แยกแล้ว

## ค่าที่กรอกใน Add cloud environment

| ช่อง | ค่าที่แนะนำ |
| --- | --- |
| Name | `Telemart Ubon Renovation Dev` |
| Network access | `Custom` พร้อมเลือก **Also include default list of common package managers** และเพิ่ม allowed domain `wdcbbjvxrcxuaabcipqo.supabase.co` เพื่อพัฒนา M1 กับโปรเจกต์จริง; หากยังทำเฉพาะ lint/build จะใช้ `Trusted` ชั่วคราวได้ |
| Environment variables | ใช้ block ด้านล่าง เริ่มจากค่าที่ไม่มี secrets |
| Setup script | คัดลอกเนื้อหาทั้งไฟล์ [scripts/cloud/environment-setup.sh](../../scripts/cloud/environment-setup.sh) ลงช่องนี้ ไม่ใช่ใส่ชื่อไฟล์เป็นคำสั่ง |

Environment variables ที่คัดลอกได้ทันที:

```dotenv
NEXT_TELEMETRY_DISABLED=1
CI=true
NEXT_PUBLIC_SUPABASE_URL=https://wdcbbjvxrcxuaabcipqo.supabase.co
```

อย่าตั้ง `NODE_ENV=production` ใน environment เตรียมงานนี้ เพราะต้องติดตั้ง dev dependencies ด้วย ให้คำสั่ง dev/build เลือก mode ตามหน้าที่ URL Supabase คือ project ของผู้ใช้ที่ตรวจผ่าน MCP แล้ว (`wdcbbjvxrcxuaabcipqo`) การเชื่อมแอปยังต้องเติม publishable client key ตามชื่อที่ implementation ใช้จริง โดยไม่พิมพ์ secret/service-role key ลงเอกสาร

ช่องนี้ใช้รูปแบบ `.env` และผู้ใช้ environment อ่านค่าทั้งหมดได้ การเปลี่ยนค่ามีผลกับ session ใหม่ สำหรับ Pro/Max ให้เพิ่ม API credentials จากหน้าต่าง **Edit หลังสร้าง environment แล้ว** ถ้า API รองรับ proxy injection; key แบบนี้ไม่เข้า VM และไม่ใช้กับ request จาก setup script ดู [คำอธิบาย environment variables/API credentials ทางการ](https://code.claude.com/docs/en/cloud-environments#set-environment-variables)

เก็บ secret ของ Supabase/server, SMTP, GA service account และ deployment แยกตาม runtime ที่ต้องใช้จริง ไม่ใส่ค่าใน setup script, source code หรือเอกสาร public ค่า API credentials ที่ proxy แนบ headers ไม่ได้สร้าง environment variable ให้ Supabase SDK โดยอัตโนมัติ

## Network สำหรับ setup และ integration

เริ่ม M1 ที่ต้องติดต่อ Supabase ผ่าน SDK/HTTP จาก VM ให้ใช้ `Custom`, เปิด **Also include default list of common package managers**, แล้วเพิ่ม `wdcbbjvxrcxuaabcipqo.supabase.co`; เพิ่ม `api.supabase.com` เฉพาะเมื่อจำเป็นต้องเรียก Management API จาก VM ถ้าทำเฉพาะ code/dependency work ใช้ `Trusted` ชั่วคราวได้ ข้อเสนอนี้ยังไม่ใช่การอนุมัติให้ cloud agent สร้างหรือแก้ production resource

Default list ครอบคลุม npm, Node download และ Ubuntu apt domains แต่ไม่ได้ระบุ Supabase ในรายการ; connector MCP ที่เปิดใช้เดินทางคนละช่องกับ VM network ดู [network access/default allowlist](https://code.claude.com/docs/en/cloud-environments#network-access) จึงต้องตรวจทั้งสิทธิของ connector และ HTTP reachability ตามวิธี integration ที่ใช้จริง ไม่เปิด Full เพียงเพื่อให้ npm ติดตั้งได้

## Setup script และ checkout ที่ต้องตรวจ

เปิด [environment-setup.sh](../../scripts/cloud/environment-setup.sh) แล้ววาง **เนื้อหาทั้งไฟล์** (เริ่ม `#!/usr/bin/env bash`) ลงช่อง Setup script สคริปต์นี้ติดตั้ง Node 24.18.0 จาก nodejs.org พร้อมตรวจ checksum ใน `/opt/telemart-cloud` โดยไม่ต้องมี checkout เพราะ Cloud อาจ cache environment ก่อน clone repository

ก่อนเริ่ม session ต้องให้ branch ที่ cloud clone มี `.claude/settings.json`, `scripts/cloud/session-start.sh`, `package.json`, `package-lock.json` และเอกสาร handoff ครบ ถ้า checkout หาไม่พบ ให้ตรวจ repository ที่เลือกและ branch ไม่คัดลอก path Windows ไปใช้ใน Linux และไม่เดา path `/root/...` ของ checkout

หน้าที่แยกกันของสคริปต์ที่เตรียม:

1. Environment setup เตรียม Node 24.18.0 โดยไม่ต้องมี checkout; ถ้า Ubuntu image ไม่มี `curl`/`xz` จะติดตั้งผ่าน `apt-get` ก่อน
2. หลัง Claude เปิด session hook จะตรวจ checkout root, ใส่ Node 24 ลง `CLAUDE_ENV_FILE`, รัน `npm ci --include=dev` เมื่อ lockfile เปลี่ยน/ยังไม่มี dependencies; ถ้าล้มเหลวต้องรายงาน failure ไม่กลบด้วย `|| true`
3. `scripts/cloud/setup.sh` คือคำสั่ง equivalent สำหรับทดสอบ repo ใน Linux container/local ไม่ใช่ค่าที่ใส่ใน Cloud UI
4. ไม่เริ่ม dev server ค้างใน setup ไม่สร้าง Supabase project ไม่รัน migration ไม่ deploy และไม่พิมพ์ secrets

`npm ci` ต้องมี lockfile ที่ตรงกับ manifest และไม่ปรับ manifest/lockfileระหว่างติดตั้งตาม [npm documentation](https://docs.npmjs.com/cli/v11/commands/npm-ci/) หาก lock ไม่ตรง ให้แก้ใน branch งานอย่างตั้งใจและตรวจ diff แทนการแทน `ci` ด้วย `install` เงียบ ๆ

Claude Cloud ใช้ Ubuntu 24.04 x86_64 และรายการ base tools ยังระบุ Node 20/21/22; setup ต้อง provision Node 24 ชัดเจน Setup ที่สำเร็จในเวลาประมาณห้านาทีถูก cache เป็น filesystem ส่วน process ที่รันค้างไม่ถูกเก็บ SessionStart เหมาะกับงานที่ต้องรันทุก startup/resume ดู [installed tools/setup scripts](https://code.claude.com/docs/en/cloud-environments#setup-scripts)

`nvm` เป็น shell function ที่ต้อง source และ Bash non-interactive ไม่โหลด profile ปกติ ตาม [nvm documentation](https://github.com/nvm-sh/nvm#installing-in-docker) จึงติดตั้ง Node แบบระบุตำแหน่งคงที่ใน `/opt/telemart-cloud` และให้ `.claude/settings.json` เรียก `scripts/cloud/session-start.sh` เพื่อเขียน PATH ลง `CLAUDE_ENV_FILE` ในทุก startup/resume แทนการหวังว่า `export PATH` จาก setup shell จะคงอยู่ ตรวจ `node --version` และ `command -v node` ใน **shell ใหม่ของ cloud session** อีกครั้ง

## สิ่งที่ตรวจพบจริงระหว่าง M1 (2026-09-29)

- Session ที่เริ่มจาก commit ก่อนมี `.claude/settings.json` จะไม่รัน SessionStart hook: Node 24 มีอยู่ที่ `/opt/telemart-cloud` (setup script ทำงานแล้ว) แต่ต้อง `export PATH=/opt/telemart-cloud/node-v24.18.0-linux-x64/bin:$PATH` และ `npm ci` เอง; session ที่เริ่มบน branch ที่มี hook แล้วไม่ต้องทำ
- `npm ci` จาก registry บางครั้งถูกตัดกลางทาง (`ECONNRESET`); รันซ้ำพร้อม `--fetch-retries=5 --maxsockets=6` ผ่าน
- Docker daemon ไม่ได้รันเอง และ network policy ตอบ 429 จาก Docker Hub, บล็อก blob ของ `public.ecr.aws`/`ghcr.io` แต่ดึงผ่าน `mirror.gcr.io` ได้ — รัน `bash scripts/cloud/supabase-images.sh` (เปิด dockerd + ดึง image ของ Supabase CLI ผ่าน mirror) ก่อน `npm run db:start`
- `api.supabase.com` ถูกปฏิเสธ (403) จึง apply migration ไป dev project จาก session นี้ไม่ได้ ให้เจ้าของรัน `npm run db:push:dev` จากเครื่องที่มีสิทธิ์ ไม่ใส่ access token หรือรหัสฐานข้อมูลใน environment variables ที่ทุกคนเห็น
- `wdcbbjvxrcxuaabcipqo.supabase.co` เข้าถึงได้จาก VM (ตอบ 401 เมื่อไม่มี apikey) เมื่อต้องการทดสอบหลังบ้านกับ dev project ให้เพิ่ม `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (key สาธารณะ) ในช่อง Environment variables
- Playwright ใช้ Chromium ที่ติดตั้งไว้: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium` (ไม่ต้อง `playwright install`)
- `git push` ต้องให้ Claude GitHub App มีสิทธิ์เขียน repository; รอบนี้ fetch ได้แต่ push ได้ 403

## สิ่งที่ส่งไปกับ repository

- ส่งไฟล์แผน, design brief, script, manifest/lock และ handoff ผ่าน remote branch `codex/telemart-dev-handoff` ที่ cloud จะ clone; ตรวจ branch ที่เลือกใน Claude Cloud
- พวก skills/plugin/config ที่อยู่เฉพาะบน Windows ไม่ได้พิสูจน์ว่ามีใน cloud ใช้ไฟล์ที่ repository มีจริงและ connector ที่ session เปิดจริง
- Skills ที่เตรียมใน `.agents/skills/` เป็น canonical files ของงานนี้ ให้ handoff/`CLAUDE.md` ระบุไฟล์ที่ต้องอ่าน ส่วนการ auto-load slash commands ของ Claude Cloud ใช้ project `.claude/skills/` ที่ commit แล้ว หรือ skills ของบัญชี claude.ai ตาม [Claude skills documentation](https://code.claude.com/docs/en/skills#use-skills-in-cowork-and-cloud-sessions) ไม่อ้างว่า plugin ของ Codex ถูกเชื่อมให้ Claude แล้ว

เมื่อ cloud ใช้การ clone จาก GitHub จะเริ่มจาก remote branch ไม่ใช่ไฟล์ค้างในเครื่อง ดู [cloud handoff ทางการ](https://code.claude.com/docs/en/claude-code-on-the-web#from-terminal-to-cloud) จึงต้องให้ task files ที่จำเป็นไปถึง branch นั้นก่อนเริ่ม session; บันทึกเอกสารในเครื่องอย่างเดียวไม่ใช่การตั้งค่า cloud สำเร็จ

## Readiness และ launch gates

| ระดับ | ต้องมีหลักฐาน |
| --- | --- |
| เตรียมพร้อมใน repo | script/manifest/lock/handoff อยู่ใน branch ที่เลือก; placeholders และขอบเขต implementation ชัด |
| Environment บันทึกแล้ว | เห็นชื่อ environment และเลือกใช้กับ session จริง; ค่าที่กรอกตรงเอกสาร |
| Cloud setup ผ่าน | setup exit 0, Node 24 ใน shell ใหม่, `npm ci` ผ่านและ manifest/lock ไม่เปลี่ยนโดยไม่ตั้งใจ |
| เริ่มงานพัฒนาได้ | อ่าน plan/decisions/handoff; ยืนยัน target Supabase; รัน baseline build/typecheck ที่เหมาะกับ source ปัจจุบัน |
| Integration ยืนยันแล้ว | Auth/DB/Storage/lead/analytics ทดสอบกับ target จริงและมีผลที่ตรวจได้ |
| Release พร้อม | ตาม release gates ใน PLAN.md; การเปิด cloud session ไม่เท่ากับ deploy หรือ production พร้อม |

ขณะเตรียม environment ให้ใช้คำสั่งตรวจตามโค้ดจริง: `npm run build` แล้ว `npx tsc --noEmit` สำหรับ baseline นี้ เพราะ build สร้าง Next image declarations; ตรวจ lint script หลัง Next/ESLint migrationก่อนเรียก gate ใหม่ รายงาน library/setup, implementation, integration และ deployment แยกกัน
