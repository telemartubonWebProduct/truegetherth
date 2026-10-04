# ข้อเสนอ 3D และสื่อ Hero: Router Wi-Fi ของทรู

ตรวจข้อมูลวันที่ 29 กันยายน 2026 เอกสารนี้เป็นข้อเสนอเตรียม implementation และเกณฑ์ตรวจรับ

อัปเดต 30 ก.ย. (M2): สร้าง concept แล้ว — ภาพนิ่ง `public/media/router-concept.svg` (วาดด้วย `scripts/media/router-concept.py`) และโมเดล procedural three.js + Fiber สัดส่วน/มุมกล้องเดียวกัน (`src/components/site/home/`) ไม่มีไฟล์ GLB/HDR, ไม่อ้างรุ่นจริง, โหลดหลังหน้าว่างเฉพาะเครื่องที่มี WebGL2 และไม่ได้เลือก reduced motion, หยุด render เมื่อพ้นจอ ทดสอบใน Chromium headless แล้ว ยังต้องตรวจบน Safari iPhone/Chrome Android จริงและเปลี่ยนเป็นรุ่นจริงเมื่อได้ reference ที่อนุมัติ ดู [M2-PUBLIC-SITE.md](M2-PUBLIC-SITE.md)

ผู้ใช้ยืนยันหมวดอุปกรณ์เป็น **Router Wi-Fi ของทรู** แล้ว แต่ยังไม่มี SKU/model ที่ยืนยัน จึงต้องเลือกรุ่นและภาพอ้างอิงก่อนสร้าง geometry ให้ตรงสินค้าจริง ณ เวลาสำรวจไม่พบไฟล์ `.glb`, `.gltf`, `.hdr`, `.exr` หรือ `.ktx2` ใน repository นอก dependency/build directories

## เครื่องมือที่แนะนำ

ใช้ **Three.js + React Three Fiber + Drei เฉพาะ helpers ที่ใช้จริง** สำหรับโมเดลที่ตอบสนองต่อ scroll/drag และปรับค่าจาก CMS ได้ มี poster ภาพนิ่งคุณภาพสูงที่แสดงตั้งแต่โหลดหน้าและใช้เป็น fallback ส่วน Higgsfield เหมาะกับภาพ/คลิป cinematic เมื่อเป้าหมายเป็นช็อตโฆษณาที่กำกับมุมกล้องไว้แล้ว การเลือกเครื่องมือขึ้นกับคุณภาพที่ได้ ไม่จำเป็นต้องทำทั้งสองแบบ

| ทางเลือก | เหมาะกับ | ต้นทุนดูแลและข้อจำกัด |
| --- | --- | --- |
| Three + Fiber + selected Drei | โมเดล interactive และ state ที่ผูกกับ React/CMS | ใช้ `Canvas`, loader, environment และ controls ร่วมกับ component lifecycle; ตรวจ bundle ของ helper ที่เลือก |
| Pure Three + addons | ฉากเล็กหนึ่งฉากที่ไม่มี state ซับซ้อน | dependency หลักน้อยกว่า แต่ต้องจัดการ resize, loop, event และ disposal เอง |
| Higgsfield image/video | cinematic hero, ภาพกราฟิกประกอบ และคลิปแคมเปญ | ผลเป็นสื่อที่กำกับการเคลื่อนไหวแล้ว; ตรวจความคงที่ของรูปทรง/โลโก้ทุกช็อตก่อนใช้แทนสินค้า |

Fiber เป็น React renderer สำหรับ Three.js และ major 9 คู่กับ React 19 ตาม [เอกสาร PMNDRS](https://github.com/pmndrs/react-three-fiber/blob/master/docs/getting-started/installation.mdx) ส่วน Drei เป็น helpers สำหรับ Fiber ตาม [source ทางการ](https://github.com/pmndrs/drei) ข้อแนะนำด้านการดูแลและการเลือกเครื่องมือข้างต้นเป็นการประเมินสำหรับงานนี้

## เวอร์ชันและ compatibility ที่ตรวจจริง

อ่าน `package.json` และ `package-lock.json` ก่อนการติดตั้ง 3D พบ Next `15.1.11`, React/react-dom `19.0.0` ส่วนเป้าหมาย migration คือ Next `16.3.7`, React/react-dom `19.3.0`, Node 24

| Package | เวอร์ชันที่ npm registry รายงาน | Peer/engine ที่เกี่ยวข้อง |
| --- | --- | --- |
| `three` | `0.186.1` | ไม่ประกาศ Node engine หรือ React peer |
| `@react-three/fiber` | `9.8.1` | React/react-dom `>=19 <19.4`; Three `>=0.156` |
| `@react-three/drei` | `10.7.9` | React/react-dom `^19`; Fiber `^9.0.0`; Three `>=0.159` |
| `@types/three` | `0.186.0` | dev dependency สำหรับ TypeScript ตรงกับ Three r186 |
| `next` | `16.3.7` | Node `>=20.9.0`; React/react-dom รองรับ `^19.0.0` |

ตรวจด้วย `npm view <package>@<version> engines peerDependencies peerDependenciesMeta --json` และ `npm view @types/three version` ข้อมูลต้นทาง: [Three](https://registry.npmjs.org/three/0.186.1), [Fiber](https://registry.npmjs.org/@react-three/fiber/9.8.1), [Drei](https://registry.npmjs.org/@react-three/drei/10.7.9), [Next](https://registry.npmjs.org/next/16.3.7)

ช่วง peer รองรับทั้ง React 19.0 ปัจจุบันและ React 19.3 ที่วางแผนไว้ Node 24 อยู่ใน engine range ของ Next ส่วน 3D ทั้งสาม packages ไม่ประกาศ Node engine การผ่านช่วงเวอร์ชันนี้ยังต้องยืนยันด้วย install/build และทดสอบฉากจริงหลังอัปเกรด

งานหลักติดตั้งทั้ง 4 packages แบบ exact pins แล้ว `npm ls --depth=0` ยืนยัน versions/peer resolution; import exports ของ Fiber/Drei และสร้าง/dispose Three BoxGeometry ผ่าน Node ESM สำเร็จ; typecheck และ production build ผ่าน (Next 15.1.11, 15 static pages) แยกสถานะ **ติดตั้ง library พร้อมแล้ว** ออกจาก **โมเดลจริงผ่านการตรวจรับและ render สำเร็จแล้ว** ยังไม่มีโมเดล/Canvas ใน application งาน research นี้ไม่ได้แก้ dependencies หรือสร้าง media

## สิ่งที่ทำให้โมเดลดูเป็นสินค้า premium

- เลือก SKU จริง ตรวจ silhouette, สัดส่วน, เสาอากาศ, ช่องระบายอากาศ, พอร์ต และตำแหน่งโลโก้จากภาพที่เชื่อถือได้หลายมุม หากยังไม่มี asset/model ที่ยืนยัน ให้เก็บสถานะเป็น concept visual
- ใช้ glTF 2.0/GLB, geometry ขอบโค้งอย่างละเอียดเฉพาะที่เห็น, UV ที่ถูกต้อง และ PBR base-color/roughness/normal/AO เน้นแยกผิวพลาสติกด้าน ผิว glossy และช่องระบายอากาศ แทนการเพิ่ม polygon โดยไม่มีผลต่อภาพ
- จัด studio environment และ key/rim lights ให้รูปทรงอ่านชัดบนสีขาว/แดง/ดำ ตั้งสี textures ให้ถูก space; `MeshStandardMaterial` ใช้ metallic-roughness PBR และแนะนำ environment map เพื่อผลที่ดี ดู [material docs](https://threejs.org/docs/pages/MeshStandardMaterial.html) และ [color management](https://threejs.org/manual/pages/color-management.html)
- เก็บ detail จาก normal/AO ที่ bake, บีบ geometry ด้วย Meshopt/Draco ตาม asset และ textures ด้วย KTX2 เมื่อมีประโยชน์จริง สามารถใช้ loaders ใน Three ได้ ดู [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) และ [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html)
- เคลื่อนไหวแบบช็อตเดียวที่ตั้งใจ: มุม 3/4 → หมุนเผยรายละเอียด → หยุดพัก ให้ scroll/drag ของผู้ใช้ควบคุมได้ จำกัดการหมุนไม่ให้เห็นมุมที่ยังไม่มีรายละเอียด verified และเคารพ reduced motion

Higgsfield ใช้ภาพอ้างอิงจริงได้ตาม model-specific input schema ใน [เอกสาร media inputs ทางการ](https://github.com/higgsfield-ai/skills/blob/main/higgsfield-generate/references/media-inputs.md) ต้องตรวจรุ่น/inputs ก่อนผลิตและตรวจรูปทรง/โลโก้หลังผลิต การสร้างภาพหรือคลิปสวยไม่ได้ยืนยัน geometry ของผลิตภัณฑ์ รอบก่อนเครื่องมือรายงาน `USER_NOT_LOGGED_IN`; ตรวจ connection อีกครั้งก่อนส่งงาน generation

## Mobile budget และ fallback ที่เสนอ

ตัวเลขนี้เป็น **budget เริ่มต้นของโปรเจกต์** ไม่ใช่ค่ารับประกันจาก library และต้องปรับจากเครื่องจริง:

| รายการ | เป้าหมายเริ่มต้น |
| --- | --- |
| Poster | responsive AVIF/WebP ประมาณ 150–200 KB; CTA/ข้อความพร้อมก่อน 3D |
| GLB พร้อม textures | ไม่เกินประมาณ 2.5 MB สำหรับ mobile variant |
| Environment | ประมาณ 0.5 MB หรือน้อยกว่า; total 3D media รอบแรกประมาณ 3 MB |
| Geometry/draw calls | ประมาณ 20–60K triangles, ไม่เกินประมาณ 40 draw calls |
| Texture/DPR | 1K mobile, สูงสุด 2K เมื่อ detail จำเป็น; DPR เริ่ม 1 และจำกัดราว 1.5 |
| Animation | เป้าหมาย mobile 30 FPS ต่อเนื่องระหว่าง interaction; desktop 60 FPS เมื่อเครื่องรองรับ |

โหลดฉากเป็น client component แบบ dynamic import หลัง poster พร้อม, มี container ขนาดคงที่, render on demand เมื่อพัก และหยุดฉากเมื่ออยู่นอก viewport/tab ไม่ active ตาม [PMNDRS performance guidance](https://github.com/pmndrs/react-three-fiber/blob/master/docs/advanced/scaling-performance.mdx) และ [Next lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)

ใช้ WebGL2 เป็น baseline พร้อม poster fallback เมื่อ context/init/asset load ล้มเหลว, device ช้า หรือเลือก reduced motion; Three WebGLRenderer ปัจจุบันใช้ WebGL2 ดู [renderer docs](https://threejs.org/docs/pages/WebGLRenderer.html) ลด DPR/effects ก่อน และใช้ poster ต่อได้โดย CTA ใช้งานเหมือนเดิม

ก่อนรับงานต้องดูภาพ screenshot ตาม reference, ทดลอง Safari iPhone/Chrome Android จริง, scroll/drag/resize, editor preview, context failure และตรวจ LCP/INP/bundle size จาก build จริง ไม่มี performance test หรือการตรวจรับโมเดลเสร็จในขั้น proposal นี้

## Skills ที่พร้อมอยู่แล้ว

ใช้ `frontend-design` สำหรับ art direction และ `vercel-react-best-practices` สำหรับ client boundary, lazy loading และ bundle; มี Higgsfield tools/skills อยู่แล้วสำหรับทางเลือก cinematic จึงไม่ได้ติดตั้ง skill เพิ่มเพียงเพื่อทำ 3D หลีกเลี่ยงการเพิ่ม physics, postprocessing หรือ asset-generation package ก่อนเห็นว่าคุณภาพ/interaction ต้องใช้จริง
