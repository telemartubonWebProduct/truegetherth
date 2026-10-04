import type { MediaAsset } from "@/lib/content/schema";

// Every image the public pages use, with its origin. Files come from the old
// site's /public folder (commit 87c70d2); product, brand and photo assets are
// the business's own or its partners', and none is AI-generated. Rights for
// partner logos and True campaign artwork are to be confirmed by the owner.
const legacy = "เว็บเดิม public/";

function asset(
  src: string,
  width: number,
  height: number,
  kind: MediaAsset["kind"],
  th: string,
  en: string,
): MediaAsset {
  return { src, width, height, kind, alt: { th, en }, source: `${legacy}${src.slice(1)}` };
}

/** An old-site picture that looks AI-generated; nobody recorded where it came from. */
function generated(src: string, width: number, height: number, th: string, en: string): MediaAsset {
  return {
    ...asset(src, width, height, "generated", th, en),
    source: `${legacy}${src.slice(1)} (ลักษณะเป็นภาพสร้างด้วย AI ไม่มีบันทึกที่มา เจ้าของต้องยืนยันสิทธิ์ใช้งาน)`,
  };
}

export const media = {
  // Brand
  // The site's own mark, drawn for this site (scripts/brand/logo.mjs).
  "truegetherth-logo": {
    src: "/brand/truegetherth-logo.png",
    width: 1404,
    height: 200,
    kind: "brand",
    alt: { th: "truegetherth", en: "truegetherth" },
    source: "วาดสำหรับเว็บนี้ (scripts/brand/logo.mjs)",
  },
  "true-online-logo": asset("/assets/wEnergy/trueonline.png", 744, 117, "brand", "ทรูออนไลน์", "True Online"),
  "line-logo": asset("/assets/IcoSocialMedia/LINE_APP_iOS.png", 1001, 1000, "brand", "LINE", "LINE"),
  "facebook-logo": asset("/assets/IcoSocialMedia/facebook.png", 512, 512, "brand", "Facebook", "Facebook"),
  "line-qr": asset(
    "/assets/etc/lineScanAddFriend.webp",
    540,
    540,
    "brand",
    "คิวอาร์โค้ดเพิ่มเพื่อน LINE @341tmfte",
    "QR code to add LINE @341tmfte",
  ),

  // Home internet benefits (icons from the old package cards)
  "icon-wifi-router": asset("/assets/tol-ico/tol-icon-1.png", 106, 106, "product", "เราเตอร์ Wi-Fi", "Wi-Fi router"),
  "icon-wifi-router-pair": asset("/assets/tol-ico/Router.png", 200, 200, "product", "เราเตอร์ Wi-Fi 2 ตัว", "Two Wi-Fi routers"),
  "icon-wifi-tower": asset("/assets/tol-ico/tol-icon-2.png", 106, 106, "product", "อุปกรณ์ Wi-Fi ทรู ทรงตั้ง", "True Wi-Fi tower unit"),
  "icon-camera-indoor": asset("/assets/tol-ico/tol-icon-3.png", 106, 106, "product", "กล้องวงจรปิดในบ้าน", "Indoor security camera"),
  "icon-camera-outdoor": asset("/assets/tol-ico/Camera.png", 200, 200, "product", "กล้องวงจรปิดนอกบ้าน", "Outdoor security camera"),
  "icon-trueid-tv-box": asset("/assets/tol-ico/tol-icon-4.png", 106, 106, "product", "กล่อง TrueID TV และรีโมต", "TrueID TV box and remote"),
  "icon-dhipaya": asset("/assets/tol-ico/tol-icon-5.png", 106, 106, "brand", "ทิพยประกันภัย", "Dhipaya Insurance"),
  "icon-fwd": asset("/assets/tol-ico/ico-fwd.jpg", 212, 192, "brand", "FWD ประกันภัย", "FWD Insurance"),
  "icon-sim-10gb": asset("/assets/tol-ico/sim 10GB.png", 200, 200, "product", "ซิมทรู 5G เน็ต 10GB", "true 5G SIM with 10 GB"),
  "icon-sim-20gb": asset("/assets/tol-ico/sim 20GB.png", 200, 200, "product", "ซิมทรู 5G เน็ต 20GB", "true 5G SIM with 20 GB"),
  "icon-truevisions-now-joy": asset(
    "/assets/tol-ico/true-visions-now-joy.png",
    298,
    298,
    "brand",
    "ทรูวิชั่นส์ นาว จอย",
    "TrueVisions NOW JOY",
  ),
  "icon-iqiyi-24m": asset("/assets/tol-ico/iQIYI.png", 200, 200, "brand", "iQIYI ดูฟรี 24 เดือน", "iQIYI free for 24 months"),
  "icon-viu-24m": asset("/assets/tol-ico/viu.png", 200, 200, "brand", "Viu ดูฟรี 24 เดือน", "Viu free for 24 months"),
  "icon-netflix": asset("/assets/tol-ico/icon-netflix.png", 181, 180, "brand", "Netflix", "Netflix"),
  "icon-gaming-nation": asset("/assets/tol-ico/ico-gaming-nation.png", 180, 150, "brand", "Gaming Nation", "Gaming Nation"),
  "icon-ihavecpu": asset("/assets/tol-ico/image 352.png", 49, 49, "brand", "iHAVECPU", "iHAVECPU"),
  "icon-gaming-partner": asset(
    "/assets/tol-ico/image 354.png",
    141,
    136,
    "brand",
    "โลโก้พันธมิตรด้านเกม",
    "Gaming partner logo",
  ),

  // Existing-customer add-ons
  "cctv-offer": asset(
    "/assets/HomeInternet/oldcustomer/cctv_pro.webp",
    500,
    500,
    "promo",
    "กล้องวงจรปิดทรูสำหรับลูกค้าทรูออนไลน์",
    "True security camera for True Online customers",
  ),
  "trueid-tv-offer": asset(
    "/assets/HomeInternet/oldcustomer/TrueIDTV_pro.webp",
    500,
    500,
    "promo",
    "กล่อง TrueID TV พร้อมแพ็กเกจ TrueID",
    "TrueID TV box with a TrueID package",
  ),

  // Mobile partners
  "logo-iqiyi": asset("/assets/package-ico/icon-iQIYI-01.png", 124, 124, "brand", "iQIYI", "iQIYI"),
  "logo-viu": asset("/assets/package-ico/icon-viu-01.png", 124, 124, "brand", "Viu", "Viu"),
  "logo-wetv": asset("/assets/package-ico/icon-Wetv.png", 124, 124, "brand", "WeTV", "WeTV"),
  "logo-trueid": asset("/assets/monthy/icons/ico-trueID.webp", 180, 65, "brand", "TrueID", "TrueID"),
  "logo-all-cafe": asset("/assets/monthy/icons/lifestyleIcon/All_Cafe.webp", 150, 152, "brand", "ออล คาเฟ่", "All Café"),
  "logo-true-coffee": asset("/assets/monthy/icons/lifestyleIcon/True_Coffee.webp", 150, 152, "brand", "ทรูคอฟฟี่", "True Coffee"),
  "logo-sf": asset("/assets/monthy/icons/lifestyleIcon/SF.webp", 150, 152, "brand", "เอส เอฟ ซีเนม่า", "SF Cinema"),
  "logo-mcdonalds": asset("/assets/monthy/icons/lifestyleIcon/McDonalds (1).webp", 150, 150, "brand", "แมคโดนัลด์", "McDonald's"),
  "logo-au-bon-pain": asset("/assets/monthy/icons/lifestyleIcon/Au_Bon_Pain.webp", 150, 152, "brand", "โอ ปอง แปง", "Au Bon Pain"),
  "logo-starbucks": asset(
    "/assets/monthy/icons/starbucks-card-e-coupon.webp",
    500,
    281,
    "brand",
    "สตาร์บัคส์ อี-คูปอง",
    "Starbucks e-coupon",
  ),

  // W&W Energy solar
  "solar-rooftop": asset(
    "/assets/solar/wwenergy_bg1-scaled-e1729143100746.webp",
    2560,
    1220,
    "photo",
    "แผงโซลาร์เซลล์บนหลังคาบ้าน",
    "Solar panels on a house roof",
  ),
  "solar-products": asset(
    "/assets/solar/wwenergy_product-scaled.webp",
    2560,
    1440,
    "promo",
    "แผงโซลาร์เซลล์ LONGi และอินเวอร์เตอร์ Huawei",
    "LONGi solar panels and a Huawei inverter",
  ),
  "solar-aerial": asset(
    "/assets/wEnergy/stepinstall.webp",
    768,
    464,
    "photo",
    "ภาพมุมสูงหลังคาที่ติดตั้งโซลาร์เซลล์ของ WERWIND Energy",
    "Aerial view of a roof with a WERWIND Energy solar installation",
  ),
  "solar-knowledge-1": asset("/assets/wEnergy/knowledge/install1.webp", 300, 169, "photo", "บ้านที่ติดตั้งแผงโซลาร์เซลล์บนหลังคา", "House with rooftop solar panels"),
  "solar-knowledge-2": asset("/assets/wEnergy/knowledge/install2.webp", 300, 169, "photo", "แผงโซลาร์เซลล์บนหลังคากระเบื้อง", "Solar panels on a tiled roof"),
  "solar-knowledge-3": asset("/assets/wEnergy/knowledge/install3.webp", 300, 169, "photo", "ภาพมุมสูงสำรวจหลังคาบ้าน", "Aerial survey of house roofs"),
  "solar-knowledge-4": asset("/assets/wEnergy/knowledge/install4.webp", 300, 247, "photo", "แบบติดตั้งโครงสร้างแผงโซลาร์เซลล์", "Mounting drawing for solar panels"),
  "solar-knowledge-5": asset("/assets/wEnergy/knowledge/install5.webp", 300, 266, "photo", "แผงโซลาร์เซลล์บนหลังคาเมทัลชีท", "Solar panels on a metal-sheet roof"),
  "solar-knowledge-6": asset("/assets/wEnergy/knowledge/install6.webp", 300, 195, "photo", "อินเวอร์เตอร์ที่ติดตั้งบนผนัง", "Inverter mounted on a wall"),
  "solar-knowledge-7": asset("/assets/wEnergy/knowledge/install7.webp", 300, 236, "photo", "หน้าจอแอปติดตามการผลิตไฟฟ้า", "Monitoring app showing power production"),
  "solar-knowledge-8": asset("/assets/wEnergy/knowledge/install8.webp", 300, 170, "photo", "การล้างทำความสะอาดแผงโซลาร์เซลล์", "Cleaning solar panels"),

  // The home page's opening: a True fibre router modelled for this site and
  // drawn live in 3D (scripts/blender/router.py). This is the same view as a
  // still (scripts/media/hero-poster.mjs): what shows first, and all that shows where
  // nothing may move. Its logo is the True Online mark above.
  "hero-router-still": {
    src: "/media/hero-v3/poster-2560.webp",
    width: 2560,
    height: 1440,
    kind: "illustration",
    alt: {
      th: "ภาพจำลอง 3 มิติของเราเตอร์ไฟเบอร์ทรูสีขาว มีเสาอากาศหกต้น",
      en: "3D model of a white True fibre router with six antennas",
    },
    source: "โมเดล 3 มิติที่สร้างสำหรับเว็บนี้ (scripts/blender/router.py) ถ่ายเป็นภาพนิ่งด้วย scripts/media/hero-poster.mjs",
  },

  "og-image": {
    src: "/media/og-image.png",
    width: 1200,
    height: 630,
    kind: "illustration",
    alt: {
      th: "โลโก้ truegetherth กับภาพจำลองเราเตอร์ไฟเบอร์ทรู",
      en: "The truegetherth logo with a model of a True fibre router",
    },
    source: "สร้างจากโลโก้และภาพนิ่งของเราเตอร์ (scripts/brand/logo.mjs)",
  },

  // Supporting pictures for the home page's offer cards and service tiles (R2),
  // until the S1–S8 illustrations briefed for Google Flow arrive. Scenes and
  // people only, never a product: the old site used them as decoration, they
  // look AI-generated and carry no text, prices or logos.
  "scene-living-room-wifi": generated(
    "/assets/HomeInternet/home-tol-newcustomer.webp",
    721,
    405,
    "ห้องนั่งเล่นยามค่ำที่มีสัญลักษณ์ Wi-Fi เรืองแสงรอบห้อง",
    "Living room at night with glowing Wi-Fi symbols around it",
  ),
  "scene-smart-home": generated(
    "/assets/HomeInternet/home-tol-customer.webp",
    721,
    405,
    "ไอคอนบ้านอัจฉริยะและอุปกรณ์ในบ้านลอยเหนือโทรศัพท์บนโต๊ะ",
    "Smart-home icons floating above a phone on a table",
  ),
  "scene-gamers-neon": generated(
    "/assets/backgrounds/bgWifiHome.jpg",
    1344,
    768,
    "กลุ่มวัยรุ่นในแสงนีออนสีชมพู",
    "Young people in pink neon light",
  ),
  "scene-city-fibre": generated(
    "/assets/backgrounds/bgWifiHome2.jpg",
    1344,
    768,
    "เมืองยามค่ำคืนที่มีเส้นแสงพาดผ่านเหมือนสายไฟเบอร์",
    "City at night crossed by a line of light like a fibre cable",
  ),
  "scene-data-glow": generated(
    "/assets/backgrounds/bgWiifiHome3.jpg",
    1344,
    768,
    "ใบหน้าผู้หญิงในแสงสีแดงจากหน้าจอข้อมูล",
    "A woman's face lit red by screens of data",
  ),
  "people-phone-violet": generated(
    "/assets/PackagePlan/Monthly/thumb-01.webp",
    528,
    297,
    "หญิงสาวใส่แจ็กเก็ตสีส้มกำลังใช้โทรศัพท์",
    "Young woman in an orange jacket using her phone",
  ),
  "people-laptop-orange": generated(
    "/assets/PackagePlan/Monthly/thumb-02.webp",
    528,
    297,
    "หญิงสาวยิ้มหน้าแล็ปท็อป",
    "Young woman smiling at her laptop",
  ),
  "people-laptop-lights": generated(
    "/assets/PackagePlan/Monthly/thumb-03.webp",
    528,
    297,
    "หญิงสาวดูแล็ปท็อปในห้องที่มีไฟประดับ",
    "Young woman watching her laptop in a room with string lights",
  ),
  "people-phone-city": generated(
    "/assets/PackagePlan/Monthly/thumb-04.webp",
    528,
    297,
    "หญิงสาวถือโทรศัพท์ในเมืองยามค่ำ",
    "Young woman holding her phone in the city at night",
  ),
  "people-street-backpack": generated(
    "/assets/imgAiPromote/ai-cardSection.webp",
    1024,
    1024,
    "ชายหนุ่มสะพายเป้ยิ้มบนถนน",
    "Young man with a backpack smiling on a street",
  ),
  "people-night-market": generated(
    "/assets/imgAiPromote/ai-cardSection2.webp",
    1024,
    1024,
    "หญิงสาวใช้โทรศัพท์ในตลาดกลางคืน",
    "Young woman using her phone at a night market",
  ),
  "people-tablet-home": generated(
    "/assets/imgAiPromote/ai-cardSection3.webp",
    1024,
    1024,
    "ชายหนุ่มดูแท็บเล็ตในห้องนั่งเล่นยามค่ำ",
    "Young man watching a tablet in a living room at night",
  ),
  "people-toy-shop": generated(
    "/assets/imgAiPromote/ai-cardSection4.webp",
    1024,
    1024,
    "หญิงสาวยิ้มถือโทรศัพท์ในร้านของเล่น",
    "Young woman smiling with her phone in a toy shop",
  ),
  "people-smile-home": generated(
    "/assets/imgAiPromote/ai-cardSection5.webp",
    1024,
    1024,
    "ชายหนุ่มใส่แว่นยิ้มในบ้าน",
    "Young man in glasses smiling at home",
  ),
  "people-phone-neon": generated(
    "/assets/imgAiPromote/ai-cardSection6.webp",
    1024,
    1024,
    "หญิงสาวถือโทรศัพท์ท่ามกลางแสงไฟเมือง",
    "Young woman with her phone among city lights",
  ),

  // Illustrations S1–S8 made in Google Flow from the brief in the owner's Drive (R2/R5).
  // Generated scenes, no text or logos; checked before use (docs/renovation/R2-HOME-PROMOS.md).
  "flow-s1-family-streaming": {
    src: "/media/flow/s1-family-streaming.webp",
    width: 1920,
    height: 1072,
    kind: "generated",
    alt: { th: "ครอบครัวนั่งดูทีวีด้วยกันในห้องนั่งเล่น", en: "A family watching TV together in their living room" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S1-family-streaming.jpg) แปลงเป็น WebP",
  },
  "flow-s2-work-from-home": {
    src: "/media/flow/s2-work-from-home.webp",
    width: 1200,
    height: 896,
    kind: "generated",
    alt: { th: "ผู้หญิงประชุมออนไลน์ด้วยแล็ปท็อปที่โต๊ะทำงานในบ้าน", en: "A woman on a video call at her desk at home" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S2-work-from-home.jpg) แปลงเป็น WebP",
  },
  "flow-s3-gamer": {
    src: "/media/flow/s3-gamer.webp",
    width: 1920,
    height: 1434,
    kind: "generated",
    alt: { th: "วัยรุ่นใส่หูฟังเล่นเกมคอมพิวเตอร์", en: "A teenager with headphones playing a computer game" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S3-gamer.jpg) แปลงเป็น WebP",
  },
  "flow-s4-mobile-city": {
    src: "/media/flow/s4-mobile-city.webp",
    width: 1920,
    height: 1434,
    kind: "generated",
    alt: { th: "ชายหนุ่มยิ้มดูโทรศัพท์ริมถนนยามเย็น", en: "A young man smiling at his phone on a street at dusk" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S4-mobile-city.jpg) แปลงเป็น WebP",
  },
  "flow-s5-friends-phone": {
    src: "/media/flow/s5-friends-phone.webp",
    width: 1920,
    height: 1434,
    kind: "generated",
    alt: { th: "เพื่อนสามคนดูคลิปในโทรศัพท์ด้วยกันที่ร้านกลางแจ้ง", en: "Three friends watching a clip on a phone at an outdoor café" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S5-prepaid-friends.jpg) แปลงเป็น WebP",
  },
  "flow-s6-technician": {
    src: "/media/flow/s6-technician.webp",
    width: 1920,
    height: 1072,
    kind: "generated",
    alt: { th: "ช่างติดตั้งอุปกรณ์เน็ตบ้านบนผนัง เจ้าของบ้านยืนดู", en: "A technician fitting home internet equipment to a wall while the owner looks on" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S6-technician.jpg) แปลงเป็น WebP",
  },
  "flow-s7-support": {
    src: "/media/flow/s7-support.webp",
    width: 1920,
    height: 1434,
    kind: "generated",
    alt: { th: "เจ้าหน้าที่ใส่ชุดหูฟังกำลังให้คำแนะนำลูกค้า", en: "A support agent with a headset helping a customer" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S7-support.jpg) แปลงเป็น WebP",
  },
  "flow-s8-fibre": {
    src: "/media/flow/s8-fibre.webp",
    width: 1920,
    height: 1072,
    kind: "generated",
    alt: { th: "เส้นใยแก้วนำแสงสีขาวและแดงบนพื้นสีน้ำเงิน", en: "White and red fibre-optic strands on a blue background" },
    source: "Google Flow ตามบรีฟ ส่งในโฟลเดอร์ Drive “ส่งไฟล์ที่นี่” 2 ต.ค. 2026 (S8-fibre-abstract.jpg) แปลงเป็น WebP",
  },

  // Apply with an agent
  "agent-support": asset(
    "/assets/HomeInternet/home-tol-Applywithagent.webp",
    720,
    404,
    "photo",
    "เจ้าหน้าที่ใส่ชุดหูฟังพร้อมให้คำปรึกษา",
    "Staff member with a headset ready to help",
  ),
} satisfies Record<string, MediaAsset>;

export type MediaId = keyof typeof media;
