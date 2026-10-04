import type { Benefit } from "@/lib/content/schema";

import type { MediaId } from "./media";

// Benefits shown on package cards. On the old site these were bare icons with
// empty titles; the labels below describe what each icon shows. Two need the
// owner's confirmation (see review notes in the M2 report): the tall True
// device and the red gaming-partner logo.
function benefit(icon: MediaId, th: string, en: string): Benefit {
  return { icon, label: { th, en } };
}

export const benefits = {
  "wifi-router": benefit("icon-wifi-router", "เราเตอร์ Wi-Fi", "Wi-Fi router"),
  "wifi-router-pair": benefit("icon-wifi-router-pair", "เราเตอร์ Wi-Fi 2 ตัว", "Two Wi-Fi routers"),
  "wifi-tower": benefit("icon-wifi-tower", "อุปกรณ์ Wi-Fi ทรู ทรงตั้ง", "True Wi-Fi tower unit"),
  "camera-indoor": benefit("icon-camera-indoor", "กล้องวงจรปิดในบ้าน", "Indoor security camera"),
  "camera-outdoor": benefit("icon-camera-outdoor", "กล้องวงจรปิดนอกบ้าน", "Outdoor security camera"),
  "trueid-tv-box": benefit("icon-trueid-tv-box", "กล่อง TrueID TV", "TrueID TV box"),
  "dhipaya-insurance": benefit("icon-dhipaya", "ประกันภัยจากทิพยประกันภัย", "Dhipaya Insurance cover"),
  "fwd-insurance": benefit("icon-fwd", "ประกันจาก FWD", "FWD insurance cover"),
  "sim-10gb": benefit("icon-sim-10gb", "ซิมทรู 5G เน็ต 10GB", "true 5G SIM with 10 GB"),
  "sim-20gb": benefit("icon-sim-20gb", "ซิมทรู 5G เน็ต 20GB", "true 5G SIM with 20 GB"),
  "truevisions-now-joy": benefit("icon-truevisions-now-joy", "TrueVisions NOW JOY", "TrueVisions NOW JOY"),
  "iqiyi-24m": benefit("icon-iqiyi-24m", "iQIYI ดูฟรี 24 เดือน", "iQIYI free for 24 months"),
  "viu-24m": benefit("icon-viu-24m", "Viu ดูฟรี 24 เดือน", "Viu free for 24 months"),
  netflix: benefit("icon-netflix", "Netflix", "Netflix"),
  "gaming-nation": benefit("icon-gaming-nation", "Gaming Nation", "Gaming Nation"),
  ihavecpu: benefit("icon-ihavecpu", "iHAVECPU", "iHAVECPU"),
  "gaming-partner": benefit("icon-gaming-partner", "สิทธิพิเศษจากพันธมิตรด้านเกม", "Gaming partner perk"),

  // Mobile partners
  iqiyi: benefit("logo-iqiyi", "iQIYI VIP", "iQIYI VIP"),
  viu: benefit("logo-viu", "Viu", "Viu"),
  wetv: benefit("logo-wetv", "WeTV VIP", "WeTV VIP"),
  trueid: benefit("logo-trueid", "TrueID", "TrueID"),
  "all-cafe": benefit("logo-all-cafe", "ออล คาเฟ่", "All Café"),
  "true-coffee": benefit("logo-true-coffee", "ทรูคอฟฟี่", "True Coffee"),
  "sf-cinema": benefit("logo-sf", "เอส เอฟ ซีเนม่า", "SF Cinema"),
  mcdonalds: benefit("logo-mcdonalds", "แมคโดนัลด์", "McDonald's"),
  "au-bon-pain": benefit("logo-au-bon-pain", "โอ ปอง แปง", "Au Bon Pain"),
  starbucks: benefit("logo-starbucks", "สตาร์บัคส์", "Starbucks"),
} satisfies Record<string, Benefit>;

export type BenefitId = keyof typeof benefits;
