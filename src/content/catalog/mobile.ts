import type { CatalogPackage, LocalizedText } from "@/lib/content/schema";

import { autoRenew, days, pkg, t } from "./helpers";

// Mobile packages from the old /monthy and /topup pages. Names no longer repeat
// the price and validity, which the card shows in their own fields; the full
// legacy titles stay in the source entry for review.

const monthly = "Monthy/Monthy.data.ts";
const series = "Monthy/series.data.ts";
const insurance = "Monthy/insurance.data.ts";
const game = "Monthy/game.data.ts";
const prepaid = "Topup/Topup.data.ts";

const nameNote = "ตัดราคาและระยะเวลาออกจากชื่อ เพราะแสดงในช่องราคาและระยะเวลาแล้ว";
const thirtyDaysAuto = t("30 วัน ต่ออายุอัตโนมัติ", "30 days, renews automatically");
const data = (gb: number) => t(`เน็ต ${gb} GB`, `${gb} GB data`);
const fullSpeed = (gb: number) => t(`เน็ตเต็มสปีด ${gb} GB`, `${gb} GB full-speed data`);
const threeApps = t("ปลดล็อก 3 แอป: iQIYI VIP, WeTV VIP และ Viu VIP", "Unlocks 3 apps: iQIYI VIP, WeTV VIP and Viu VIP");

function monthlyPkg(group: string, entry: [file: string, entry: string], rest: Omit<Parameters<typeof pkg>[0], "category" | "group" | "from">) {
  return pkg({ category: "mobile-monthly", group, from: entry, ...rest });
}
function prepaidPkg(group: string, entry: string, rest: Omit<Parameters<typeof pkg>[0], "category" | "group" | "from">) {
  return pkg({ category: "mobile-prepaid", group, from: [prepaid, entry], ...rest });
}

const boost = (id: string, gb: number, validity: number, amount: number, entry: string) =>
  monthlyPkg("internet-boost", [monthly, entry], {
    id,
    name: t(`เน็ตเพิ่มสปีด ${gb}GB`, `Speed boost ${gb} GB`),
    allowance: data(gb),
    validity: days(validity),
    price: { amount, per: "package", vat: "excluded" },
    notes: [nameNote],
  });

const callMinutes = (minutes: number): LocalizedText => t(`โทร ${minutes} นาที`, `${minutes} call minutes`);

export const mobileMonthly: CatalogPackage[] = [
  boost("m-boost-60gb", 60, 30, 399, "PromotionMonthyUpspeed id 1"),
  boost("m-boost-50gb", 50, 30, 349, "PromotionMonthyUpspeed id 2"),
  boost("m-boost-35gb", 35, 15, 299, "PromotionMonthyUpspeed id 3"),
  boost("m-boost-20gb", 20, 15, 199, "PromotionMonthyUpspeed id 4"),

  monthlyPkg("unlimited", [monthly, "PromotionMonthyNolimit id 1"], {
    id: "m-unlimited-7d",
    name: t("เน็ตเต็มสปีดไม่อั้น 7 วัน", "Unlimited full-speed data, 7 days"),
    allowance: t("เน็ตเต็มสปีด ไม่จำกัดปริมาณ", "Unlimited full-speed data"),
    validity: days(7),
    price: { amount: 199, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("unlimited", [monthly, "PromotionMonthyNolimit id 2"], {
    id: "m-unlimited-3d",
    name: t("เน็ตเต็มสปีดไม่อั้น 3 วัน", "Unlimited full-speed data, 3 days"),
    allowance: t("เน็ตเต็มสปีด ไม่จำกัดปริมาณ", "Unlimited full-speed data"),
    validity: days(3),
    price: { amount: 99, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),

  monthlyPkg("social", [monthly, "PromotionMonthySocial id 1"], {
    id: "m-social-4-apps",
    name: t("เน็ต YouTube, Facebook, LINE, Twitter ไม่อั้น", "Unlimited YouTube, Facebook, LINE and Twitter"),
    allowance: t("เน็ตไม่อั้นสำหรับ YouTube, Facebook, LINE และ Twitter", "Unlimited data for YouTube, Facebook, LINE and Twitter"),
    validity: days(30),
    price: { amount: 199, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("social", [monthly, "PromotionMonthySocial id 2"], {
    id: "m-youtube-1d",
    name: t("เน็ต YouTube ไม่อั้น 1 วัน", "Unlimited YouTube, 1 day"),
    allowance: t("เน็ตไม่อั้นสำหรับ YouTube", "Unlimited data for YouTube"),
    validity: days(1),
    price: { amount: 29, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("social", [monthly, "PromotionMonthySocial id 3"], {
    id: "m-youtube-30d",
    name: t("เน็ต YouTube ไม่อั้น 30 วัน", "Unlimited YouTube, 30 days"),
    allowance: t("เน็ตไม่อั้นสำหรับ YouTube", "Unlimited data for YouTube"),
    validity: days(30),
    price: { amount: 179, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("social", [monthly, "PromotionMonthySocial id 4"], {
    id: "m-youtube-auto",
    name: t("เน็ต YouTube ไม่อั้น ต่ออายุอัตโนมัติ", "Unlimited YouTube, renews automatically"),
    allowance: t("เน็ตไม่อั้นสำหรับ YouTube", "Unlimited data for YouTube"),
    validity: thirtyDaysAuto,
    price: { amount: 159, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("social", [monthly, "PromotionMonthySocial id 5"], {
    id: "m-trueid-1d",
    name: t("เน็ตทรูไอดีไม่อั้น 24 ชั่วโมง", "Unlimited TrueID, 24 hours"),
    allowance: t("เน็ตไม่อั้นสำหรับแอป TrueID", "Unlimited data for the TrueID app"),
    validity: days(1),
    price: { amount: 9, per: "package", vat: "excluded" },
    benefits: ["trueid"],
  }),
  monthlyPkg("social", [monthly, "PromotionMonthySocial id 6"], {
    id: "m-trueid-7d",
    name: t("เน็ตทรูไอดีไม่อั้น 7 วัน", "Unlimited TrueID, 7 days"),
    allowance: t("เน็ตไม่อั้นสำหรับแอป TrueID", "Unlimited data for the TrueID app"),
    validity: days(7),
    price: { amount: 19, per: "package", vat: "excluded" },
    benefits: ["trueid"],
  }),

  ...(
    [
      ["m-call-100", 100, 109, 1],
      ["m-call-150", 150, 149, 2],
      ["m-call-200", 200, 199, 3],
      ["m-call-300", 300, 249, 4],
    ] as const
  ).map(([id, minutes, amount, entry]) =>
    monthlyPkg("calls", [monthly, `PromotionMonthyCall id ${entry}`], {
      id,
      name: callMinutes(minutes),
      allowance: callMinutes(minutes),
      validity: days(30),
      price: { amount, per: "package", vat: "excluded" },
      notes: [nameNote],
    }),
  ),

  monthlyPkg("asian-combo", [series, "PromotionMonthyAsianCombo id 1"], {
    id: "m-asian-combo-yearly",
    name: t("Asian Combo รายปี (Viu, WeTV, iQIYI)", "Asian Combo yearly (Viu, WeTV, iQIYI)"),
    validity: days(365),
    price: { amount: 999, per: "package", vat: "included" },
    dialCode: "*900*7129#",
    benefits: ["viu", "wetv", "iqiyi"],
  }),
  monthlyPkg("asian-combo", [series, "PromotionMonthyAsianCombo id 2"], {
    id: "m-super-asian-combo-yearly",
    name: t("Super Asian Combo รายปี + คูปองแมคโดนัลด์", "Super Asian Combo yearly + McDonald's coupon"),
    validity: days(365),
    price: { amount: 1099, per: "package", vat: "included" },
    dialCode: "*900*7129#",
    benefits: ["viu", "wetv", "iqiyi", "mcdonalds"],
    notes: ["รหัสกดสมัครซ้ำกับ Asian Combo รายปี (*900*7129#) รอยืนยัน"],
  }),
  monthlyPkg("asian-combo", [series, "PromotionMonthyAsianCombo id 3"], {
    id: "m-asian-combo-159",
    name: t("Asian Combo VIP Package ต่ออายุอัตโนมัติ 12 รอบ", "Asian Combo VIP package, renews for 12 cycles"),
    validity: days(30),
    price: { amount: 159, per: "package", vat: "included" },
    dialCode: "*900*7570#",
    benefits: ["viu", "wetv", "iqiyi"],
    notes: [nameNote, "ไอคอนเดิมเป็นกล้อง/พรีเมียร์ลีก/ซิม/TrueID ที่คัดลอกมาผิด จึงใช้โลโก้ Viu, WeTV, iQIYI ตามชื่อแพ็กเกจ"],
  }),
  monthlyPkg("asian-combo", [series, "PromotionMonthyAsianCombo id 4"], {
    id: "m-asian-combo-179",
    name: t(
      "Asian Combo 3 แอป VIP พร้อมเน็ตใช้งานแอป ต่ออายุอัตโนมัติ 12 รอบ",
      "Asian Combo: 3 VIP apps with app data, renews for 12 cycles",
    ),
    allowance: t("เน็ตใช้งานแอป 5 GB", "5 GB app data"),
    validity: days(365),
    price: { amount: 179, per: "package", vat: "included" },
    dialCode: "*900*7129#",
    benefits: ["viu", "wetv", "iqiyi"],
    notes: [
      nameNote,
      "ระยะเวลาเดิม 365 วัน แต่ชื่อบอกต่ออายุอัตโนมัติ 12 รอบ รอยืนยันว่าราคา 179 บาทเป็นรายรอบหรือรายปี",
      "รหัสกดสมัครซ้ำกับ Asian Combo รายปี (*900*7129#) รอยืนยัน",
    ],
  }),

  monthlyPkg("combo-plus", [series, "PromotionMonthyComboplus id 1"], {
    id: "m-entertainment-combo-mcdonalds",
    name: t("Entertainment Combo + McDonald's", "Entertainment Combo + McDonald's"),
    validity: days(365),
    price: { amount: 1099, per: "package", vat: "included" },
    dialCode: "*900*7179#",
    benefits: ["iqiyi", "wetv", "viu", "mcdonalds"],
    details: [threeApps, t("คูปองแมคโดนัลด์ 200 บาท/เดือน", "McDonald's coupon worth 200 baht a month"), data(5)],
    notes: ["ข้อความเดิมสะกด “QIYI VIP” แก้เป็น iQIYI VIP"],
  }),
  monthlyPkg("combo-plus", [series, "PromotionMonthyComboplus id 2"], {
    id: "m-combo-starbucks",
    name: t("Combo + Asian Entertainment x Starbucks", "Combo + Asian Entertainment x Starbucks"),
    validity: days(30),
    price: { amount: 299, per: "package", vat: "included" },
    benefits: ["iqiyi", "wetv", "viu", "starbucks"],
    details: [
      threeApps,
      t("เน็ตไม่อั้นสำหรับเล่นเกม 11 เกม", "Unlimited data for 11 games"),
      t("Starbucks มูลค่า 100 บาท", "Starbucks credit worth 100 baht"),
      t("เน็ต 10 GB สำหรับดูคอนเทนต์", "10 GB data for streaming content"),
    ],
  }),

  monthlyPkg("viu", [series, "PromotionMonthyViu id 1"], {
    id: "m-viu-premium-4gb",
    name: t("Viu Premium + เน็ต 4GB ต่ออายุอัตโนมัติ", "Viu Premium + 4 GB data, renews automatically"),
    allowance: t("เน็ต 4 GB และโบนัสเน็ตดูแอป Viu ไม่อั้น", "4 GB data plus unlimited Viu app data"),
    validity: days(30),
    price: { amount: 79, per: "package", vat: "included" },
    dialCode: "*900*7432#",
    benefits: ["viu"],
  }),
  monthlyPkg("viu", [series, "PromotionMonthyViu id 2"], {
    id: "m-viu-premium-1d",
    name: t("Viu Premium + เน็ต Viu ไม่อั้น 1 วัน", "Viu Premium + unlimited Viu data, 1 day"),
    allowance: t("เน็ตไม่อั้น ความเร็วสูงสุด 15 Mbps", "Unlimited data at up to 15 Mbps"),
    validity: days(1),
    price: { amount: 31.03, per: "package", vat: "included" },
    benefits: ["viu"],
  }),
  monthlyPkg("viu", [series, "PromotionMonthyViu id 3"], {
    id: "m-viu-premium-500mb",
    name: t("Viu Premium + เน็ต 500MB 1 วัน", "Viu Premium + 500 MB data, 1 day"),
    allowance: t("เน็ต 500 MB", "500 MB data"),
    validity: days(30),
    price: { amount: 999, per: "package", vat: "included" },
    dialCode: "*900*7553#",
    benefits: ["viu"],
    hide: "ชื่อบอก 1 วัน แต่ระยะเวลาเป็น 30 วัน และราคา 999 บาท ไม่สอดคล้องกัน",
  }),

  monthlyPkg("iqiyi", [series, "PromotionMonthyIqiyi id 1"], {
    id: "m-iqiyi-49",
    name: t("iQIYI VIP พิเศษสำหรับลูกค้าทรูรายเดือน", "iQIYI VIP special for True postpaid customers"),
    allowance: t("เน็ต 10 GB เต็มสปีดสำหรับดู iQIYI", "10 GB full-speed data for iQIYI"),
    validity: days(30),
    price: { amount: 49, per: "package", vat: "included" },
    conditions: [t("49 บาทเดือนแรก เดือนถัดไป 119 บาท", "49 baht for the first month, then 119 baht a month")],
    dialCode: "*900*7592#",
    benefits: ["iqiyi"],
    notes: [nameNote],
  }),
  monthlyPkg("iqiyi", [series, "PromotionMonthyIqiyi id 2"], {
    id: "m-iqiyi-119",
    name: t("iQIYI VIP พิเศษ! เน็ตดู iQIYI 10GB ต่ออายุอัตโนมัติ", "iQIYI VIP special: 10 GB iQIYI data, renews automatically"),
    allowance: t("เน็ต 10 GB เต็มสปีดสำหรับดู iQIYI", "10 GB full-speed data for iQIYI"),
    validity: days(30),
    price: { amount: 119, per: "package", vat: "included" },
    conditions: [
      t(
        "สำหรับลูกค้าทรูแบบเติมเงิน และลูกค้าดีแทคแบบเติมเงินและรายเดือน",
        "For True prepaid customers and dtac prepaid and postpaid customers",
      ),
    ],
    dialCode: "*900*7129#",
    benefits: ["iqiyi"],
    notes: [
      "แสดงในหน้ารายเดือน แต่เงื่อนไขระบุลูกค้าเติมเงิน รอยืนยันหน้าที่ควรแสดง",
      "รหัสกดสมัครซ้ำกับ Asian Combo (*900*7129#) รอยืนยัน",
    ],
  }),
  monthlyPkg("iqiyi", [series, "PromotionMonthyIqiyi id 3"], {
    id: "m-iqiyi-79",
    name: t("iQIYI VIP ต่ออายุอัตโนมัติ 12 เดือน", "iQIYI VIP, renews for 12 months"),
    validity: days(30),
    price: { amount: 79, per: "package", vat: "included" },
    dialCode: "*900*7591#",
    benefits: ["iqiyi"],
  }),
  monthlyPkg("iqiyi", [series, "PromotionMonthyIqiyi id 4"], {
    id: "m-iqiyi-500mb",
    name: t("iQIYI VIP + เน็ต 500MB 1 วัน", "iQIYI VIP + 500 MB data, 1 day"),
    allowance: t("เน็ต 500 MB", "500 MB data"),
    validity: days(1),
    price: { amount: 20.33, per: "package", vat: "included" },
    dialCode: "*900*7551#",
    benefits: ["iqiyi"],
  }),

  monthlyPkg("wetv", [series, "PromotionMonthyWeTV id 1"], {
    id: "m-wetv-4gb",
    name: t("WeTV VIP + เน็ต 4GB ต่ออายุอัตโนมัติ 12 เดือน", "WeTV VIP + 4 GB data, renews for 12 months"),
    allowance: t("เน็ต 4 GB และโบนัสเน็ตดูแอป WeTV ไม่อั้น", "4 GB data plus unlimited WeTV app data"),
    validity: days(30),
    price: { amount: 99, per: "package", vat: "included" },
    dialCode: "*900*7594#",
    benefits: ["wetv"],
    hide: "ข้อความระบุช่วงสมัคร 7 มิ.ย. 67 – 31 ก.ค. 67 ซึ่งหมดเขตแล้ว",
  }),
  monthlyPkg("wetv", [series, "PromotionMonthyWeTV id 2"], {
    id: "m-wetv-79",
    name: t("WeTV VIP ต่ออายุอัตโนมัติ 12 เดือน", "WeTV VIP, renews for 12 months"),
    validity: days(30),
    price: { amount: 79, per: "package", vat: "included" },
    dialCode: "*900*7593#",
    benefits: ["wetv"],
  }),
  monthlyPkg("wetv", [series, "PromotionMonthyWeTV id 3"], {
    id: "m-wetv-1d",
    name: t("WeTV + เน็ต WeTV ไม่อั้น 1 วัน", "WeTV + unlimited WeTV data, 1 day"),
    allowance: t("เน็ตไม่อั้นสำหรับ WeTV ความเร็วสูงสุด 15 Mbps", "Unlimited WeTV data at up to 15 Mbps"),
    validity: days(1),
    price: { amount: 31.03, per: "package", vat: "included" },
    benefits: ["wetv"],
  }),
  monthlyPkg("wetv", [series, "PromotionMonthyWeTV id 4"], {
    id: "m-wetv-500mb",
    name: t("WeTV VIP + เน็ต 500MB 1 วัน", "WeTV VIP + 500 MB data, 1 day"),
    allowance: t("เน็ต 500 MB", "500 MB data"),
    validity: days(1),
    price: { amount: 20.33, per: "package", vat: "included" },
    dialCode: "*900*7552#",
    benefits: ["wetv"],
  }),

  monthlyPkg("life-insurance", [insurance, "PromotionInsuranceCumulative id 1"], {
    id: "m-life-cover-10gb",
    name: t("เน็ตเต็มสปีด 10GB + ฟรีประกันชีวิตสะสมสูงสุด 270,000 บาท", "10 GB full-speed data + free cumulative life cover up to 270,000 baht"),
    allowance: fullSpeed(10),
    validity: autoRenew,
    price: { amount: 99, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("life-insurance", [insurance, "PromotionInsuranceCumulative id 2"], {
    id: "m-life-cover-5gb",
    name: t("เน็ตเต็มสปีด 5GB + ฟรีประกันชีวิตสะสมสูงสุด 180,000 บาท", "5 GB full-speed data + free cumulative life cover up to 180,000 baht"),
    allowance: fullSpeed(5),
    validity: autoRenew,
    price: { amount: 79, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),

  ...(
    [
      ["m-accident-1gb", 1, "100,000", 79, 1],
      ["m-accident-2gb", 2, "200,000", 99, 2],
      ["m-accident-5gb", 5, "500,000", 199, 3],
    ] as const
  ).map(([id, gb, cover, amount, entry]) =>
    monthlyPkg("accident-insurance", [insurance, `PromotionFreeAcidentInsurance id ${entry}`], {
      id,
      name: t(`เน็ต ${gb}GB + ประกันอุบัติเหตุ คุ้มครอง ${cover} บาท`, `${gb} GB data + accident cover of ${cover} baht`),
      allowance: data(gb),
      validity: autoRenew,
      price: { amount, per: "package", vat: "excluded" },
    }),
  ),
  monthlyPkg("accident-insurance", [insurance, "PromotionFreeAcidentInsurance id 4"], {
    id: "m-accident-30gb",
    name: t("เน็ต 30GB + ประกันอุบัติเหตุ คุ้มครอง 100,000 บาท", "30 GB data + accident cover of 100,000 baht"),
    allowance: t("เน็ต 30 GB ความเร็วสูงสุด 15 Mbps", "30 GB data at up to 15 Mbps"),
    validity: autoRenew,
    price: { amount: 300, per: "package", vat: "excluded" },
    notes: ["ชื่อเดิมไม่มีหน่วย “บาท” หลัง 100,000"],
  }),

  ...(
    [
      ["m-doctor-1gb-129", 1, 129, 1, days(30)],
      ["m-doctor-1gb-149", 1, 149, 2, days(30)],
      ["m-doctor-3gb-299", 3, 299, 3, autoRenew],
      ["m-doctor-3gb-399", 3, 399, 4, autoRenew],
    ] as const
  ).map(([id, gb, amount, entry, validity]) =>
    monthlyPkg("doctor-coupon", [insurance, `PromotionConsultcoupon id ${entry}`], {
      id,
      name: t(
        `เน็ตเต็มสปีด ${gb}GB + คูปองปรึกษาแพทย์ออนไลน์ผ่านแอปหมอดี`,
        `${gb} GB full-speed data + online doctor consultation coupon (MorDee app)`,
      ),
      allowance: fullSpeed(gb),
      validity,
      price: { amount, per: "package", vat: "excluded" },
      notes: [`มี 2 รายการชื่อเดียวกัน (เน็ต ${gb}GB) ต่างกันเฉพาะราคา รอยืนยันความแตกต่าง`],
    }),
  ),
  monthlyPkg("doctor-coupon", [insurance, "PromotionConsultcoupon id 5"], {
    id: "m-doctor-misplaced-net-call",
    name: t("เน็ตไม่อั้น 10 Mbps + โทรในเครือข่าย", "Unlimited 10 Mbps + on-net calls"),
    validity: days(30),
    price: { amount: 499, per: "package", vat: "excluded" },
    hide: "เป็นแพ็กเน็ตและโทร (ซ้ำกับหน้าเติมเงิน) อยู่ผิดหมวดคูปองปรึกษาแพทย์",
  }),

  monthlyPkg("whoscall", [insurance, "PromotionWhoscall id 1"], {
    id: "m-whoscall-auto",
    name: t("Whoscall Premium ต่ออายุอัตโนมัติ", "Whoscall Premium, renews automatically"),
    allowance: t("เน็ตแอป Whoscall ไม่อั้น และโบนัสเน็ตเต็มสปีด 5 GB", "Unlimited Whoscall app data plus a 5 GB full-speed bonus"),
    validity: autoRenew,
    price: { amount: 99, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),
  monthlyPkg("whoscall", [insurance, "PromotionWhoscall id 2"], {
    id: "m-whoscall-yearly",
    name: t("Whoscall Premium รายปี", "Whoscall Premium yearly"),
    allowance: t("เน็ตแอป Whoscall ไม่อั้น", "Unlimited Whoscall app data"),
    validity: days(365),
    price: { amount: 549, per: "package", vat: "excluded" },
    notes: [nameNote],
  }),

  ...gamePackages("m", (group, entry, rest) => monthlyPkg(group, [game, entry], rest)),

  ...(
    [
      ["m-up2u-all-cafe-5gb", "all-cafe", 5, t("รับฟรีคูปองเครื่องดื่ม All Café (16 oz) 3 คูปอง", "3 free All Café drink coupons (16 oz)"), days(15), 119, "excluded", 1, "Up2U All Café"],
      ["m-up2u-all-cafe-10gb", "all-cafe", 10, t("รับฟรีคูปองเครื่องดื่ม All Café (16 oz) 6 คูปอง", "6 free All Café drink coupons (16 oz)"), thirtyDaysAuto, 210, "included", 2, "Up2U All Café"],
      ["m-up2u-true-coffee", "true-coffee", 10, t("รับฟรีคูปองทรูคอฟฟี่ มูลค่า 200 บาท", "Free True Coffee coupon worth 200 baht"), thirtyDaysAuto, 200, "excluded", 3, "Up2U True Coffee"],
      ["m-up2u-sf-cinema", "sf-cinema", 10, t("รับฟรีคูปองตั๋วหนัง SF Cinema", "Free SF Cinema movie ticket coupon"), thirtyDaysAuto, 200, "excluded", 4, "Up2U SF Cinema"],
      ["m-up2u-mcdonalds", "mcdonalds", 10, t("รับฟรีคูปองแมคโดนัลด์ มูลค่า 200 บาท", "Free McDonald's coupon worth 200 baht"), thirtyDaysAuto, 200, "excluded", 5, "Up2U McDonald's"],
    ] as const
  ).map(([id, partner, gb, coupon, validity, amount, vat, entry, brand]) =>
    monthlyPkg("lifestyle", [game, `PromotionCouponLiftstyle id ${entry}`], {
      id,
      name: t(`${brand} เน็ตเต็มสปีด ${gb}GB + คูปอง`, `${brand}: ${gb} GB full-speed data + coupon`),
      allowance: fullSpeed(gb),
      validity,
      price: { amount, per: "package", vat },
      benefits: [partner],
      details: [coupon],
      notes: vat === "included" ? [nameNote, "รายการนี้ระบุ “รวม VAT” ต่างจากรายการอื่นในหมวดเดียวกัน"] : [nameNote],
    }),
  ),
  monthlyPkg("lifestyle", [game, "PromotionCouponLiftstyle id 6"], {
    id: "m-up2u-au-bon-pain",
    name: t("Up2U Au Bon Pain เน็ตเต็มสปีด + คูปองเงินสด", "Up2U Au Bon Pain: full-speed data + cash coupon"),
    allowance: data(3),
    validity: days(30),
    price: { amount: 200, per: "package", vat: "excluded" },
    benefits: ["au-bon-pain"],
    details: [t("รับคูปองเงินสด Au Bon Pain 50 บาท", "Au Bon Pain cash coupon worth 50 baht")],
    hide: "ชื่อเดิมระบุ 79 บาท เน็ต 5GB แต่ราคาในข้อมูลเป็น 200 บาท และเน็ต 3 GB (ตัวอย่างใน CURRENT-SITE-AUDIT)",
  }),
];

/**
 * The old /monthy and /topup pages list the same four "game" packages: one
 * gaming package and three copies of insurance or internet packages.
 */
function gamePackages(
  prefix: "m" | "p",
  make: (group: string, entry: string, rest: Omit<Parameters<typeof pkg>[0], "category" | "group" | "from">) => CatalogPackage,
): CatalogPackage[] {
  return [
    make("game", "PromotionGame id 1", {
      id: `${prefix}-game-prohub`,
      name: t("เน็ตเต็มสปีด 10GB + PROHUB ต่ออายุอัตโนมัติ", "10 GB full-speed data + PROHUB, renews automatically"),
      allowance: fullSpeed(10),
      validity: thirtyDaysAuto,
      price: { amount: 200, per: "package", vat: "excluded" },
      notes: [nameNote],
    }),
    make("game", "PromotionGame id 2", {
      id: `${prefix}-game-misplaced-life-cover`,
      name: t("เน็ต 10GB + ประกันชีวิต 7,500 บาท", "10 GB data + life cover of 7,500 baht"),
      validity: days(30),
      price: { amount: 150, per: "package", vat: "excluded" },
      hide: "เป็นแพ็กประกันชีวิต อยู่ผิดหมวดเกม",
    }),
    make("game", "PromotionGame id 3", {
      id: `${prefix}-game-misplaced-5mbps`,
      name: t("เน็ตไม่อั้น 5 Mbps 5 วัน", "Unlimited 5 Mbps, 5 days"),
      validity: days(5),
      price: { amount: 50, per: "package", vat: "excluded" },
      hide: "ซ้ำกับแพ็กเน็ตไม่อั้น 5 Mbps ของหน้าเติมเงิน อยู่ผิดหมวดเกม",
    }),
    make("game", "PromotionGame id 4", {
      id: `${prefix}-game-misplaced-20mbps`,
      name: t("เน็ตไม่อั้น 20 Mbps 30 วัน", "Unlimited 20 Mbps, 30 days"),
      validity: days(30),
      price: { amount: 300, per: "package", vat: "excluded" },
      hide: "ซ้ำกับแพ็กเน็ตไม่อั้น 20 Mbps ของหน้าเติมเงิน อยู่ผิดหมวดเกม",
    }),
  ];
}

const speedNet = (id: string, mbps: number, cap: string, after: string, validity: number, amount: number, entry: number) =>
  prepaidPkg("internet", `PromotionTopup id ${entry}`, {
    id,
    name: t(`เน็ตไม่อั้น ${mbps} Mbps ${validity} วัน`, `Unlimited ${mbps} Mbps, ${validity} days`),
    allowance: t(`ความเร็ว ${mbps} Mbps ใช้ได้ ${cap} จากนั้น ${after}`, `${mbps} Mbps for ${cap}, then ${after}`),
    validity: days(validity),
    price: { amount, per: "package", vat: "excluded" },
    notes: [nameNote],
  });

const netAndCalls = (id: string, mbps: number, validity: number, amount: number, entry: number) =>
  prepaidPkg("internet-calls", `PromotionTopupCallNet id ${entry}`, {
    id,
    name: t(`เน็ตไม่อั้น ${mbps} Mbps + โทรในเครือข่าย ${validity} วัน`, `Unlimited ${mbps} Mbps + on-net calls, ${validity} days`),
    allowance: t(`เน็ตไม่อั้น ${mbps} Mbps และโทรในเครือข่าย`, `Unlimited data at ${mbps} Mbps and on-net calls`),
    validity: days(validity),
    price: { amount, per: "package", vat: "excluded" },
  });

const allNetworkCalls = (id: string, minutes: number, validity: number, amount: number, entry: number) =>
  prepaidPkg("calls", `PromotionTopupCall id ${entry}`, {
    id,
    name: t(`โทรทุกค่าย ${minutes} นาที`, `Calls to all networks, ${minutes} minutes`),
    allowance: callMinutes(minutes),
    validity: days(validity),
    price: { amount, per: "package", vat: "excluded" },
    notes: [nameNote],
  });

export const mobilePrepaid: CatalogPackage[] = [
  speedNet("p-net-8mbps", 8, "30 GB", "1 Mbps", 8, 88, 1),
  speedNet("p-net-10mbps", 10, "50 GB", "2 Mbps", 15, 150, 2),
  speedNet("p-net-5mbps", 5, "15 GB", "512 Kbps", 5, 50, 3),
  prepaidPkg("internet", "PromotionTopup id 4", {
    id: "p-net-20mbps",
    name: t("เน็ตไม่อั้น 20 Mbps 30 วัน", "Unlimited 20 Mbps, 30 days"),
    allowance: t("ความเร็ว 20 Mbps ไม่จำกัดปริมาณ (FUP 5 Mbps)", "20 Mbps with no data cap (FUP 5 Mbps)"),
    validity: days(30),
    price: { amount: 300, per: "package", vat: "excluded" },
    notes: [nameNote, "ชื่อเดิมระบุทั้ง “Unlimited” และ “FUP 5Mbps” รอยืนยันเงื่อนไขการลดความเร็ว"],
  }),

  netAndCalls("p-net-call-1mbps", 1, 7, 129, 1),
  netAndCalls("p-net-call-2mbps", 2, 10, 199, 2),
  netAndCalls("p-net-call-4mbps", 4, 15, 299, 3),
  netAndCalls("p-net-call-6mbps", 6, 30, 399, 4),
  netAndCalls("p-net-call-10mbps", 10, 30, 499, 5),

  allNetworkCalls("p-call-120", 120, 30, 60, 1),
  allNetworkCalls("p-call-200", 200, 30, 100, 2),
  allNetworkCalls("p-call-300", 300, 15, 80, 3),
  allNetworkCalls("p-call-500", 500, 7, 50, 4),

  prepaidPkg("entertainment", "PromotionTopupEntertain id 1", {
    id: "p-entertainment-placeholder",
    name: t("แพ็กเกจความบันเทิง", "Entertainment package"),
    validity: days(30),
    price: { amount: 60, per: "package", vat: "excluded" },
    details: [
      t("Starbucks 100 บาท", "Starbucks worth 100 baht"),
      t("เน็ต 10 GB สำหรับคอนเทนต์", "10 GB data for content"),
      t("Viu VIP, iQIYI VIP และ WeTV VIP", "Viu VIP, iQIYI VIP and WeTV VIP"),
      t("เน็ตไม่อั้นสำหรับเล่นเกม 11 เกม", "Unlimited data for 11 games"),
    ],
    hide: "ชื่อและราคาเหมือนแพ็กโทรทุกค่าย 120 นาที 60 บาท แต่หมายเหตุเป็นสิทธิ์บันเทิง ไม่สอดคล้องกัน รอข้อมูลแพ็กบันเทิงจริง",
  }),
  ...(
    [
      [2, 200, 30, 100],
      [3, 300, 15, 80],
      [4, 500, 7, 50],
    ] as const
  ).map(([entry, minutes, validity, amount]) =>
    prepaidPkg("entertainment", `PromotionTopupEntertain id ${entry}`, {
      id: `p-entertainment-copy-${entry}`,
      name: t(`โทรทุกค่าย ${minutes} นาที`, `Calls to all networks, ${minutes} minutes`),
      validity: days(validity),
      price: { amount, per: "package", vat: "excluded" },
      hide: "ซ้ำกับแพ็กโทรทุกค่ายในหมวดโทร อยู่ในหมวดความบันเทิง",
    }),
  ),

  ...gamePackages("p", (group, entry, rest) => prepaidPkg(group, entry, rest)),

  prepaidPkg("insurance", "PromotionInsurance id 1", {
    id: "p-life-cover-5gb",
    name: t("เน็ต 5GB + ประกันชีวิต 5,000 บาท ต่ออายุอัตโนมัติ", "5 GB data + life cover of 5,000 baht, renews automatically"),
    validity: days(30),
    price: { amount: 200, per: "package", vat: "excluded" },
    hide: "ชื่อระบุเน็ต 5GB แต่ช่องปริมาณเป็น “Max Speed 10 GB” และราคาสูงกว่าแพ็ก 10GB + ประกัน 7,500 บาท (150 บาท) ไม่สอดคล้องกัน",
  }),
  prepaidPkg("insurance", "PromotionInsurance id 2", {
    id: "p-life-cover-10gb",
    name: t("เน็ต 10GB + ประกันชีวิต 7,500 บาท ต่ออายุอัตโนมัติ", "10 GB data + life cover of 7,500 baht, renews automatically"),
    allowance: fullSpeed(10),
    validity: thirtyDaysAuto,
    price: { amount: 150, per: "package", vat: "excluded" },
  }),
  prepaidPkg("insurance", "PromotionInsurance id 3", {
    id: "p-insurance-copy-5mbps",
    name: t("เน็ตไม่อั้น 5 Mbps 5 วัน", "Unlimited 5 Mbps, 5 days"),
    validity: days(5),
    price: { amount: 50, per: "package", vat: "excluded" },
    hide: "ซ้ำกับแพ็กเน็ตไม่อั้น 5 Mbps ในหมวดเน็ต อยู่ในหมวดประกัน",
  }),
  prepaidPkg("insurance", "PromotionInsurance id 4", {
    id: "p-insurance-copy-20mbps",
    name: t("เน็ตไม่อั้น 20 Mbps 30 วัน", "Unlimited 20 Mbps, 30 days"),
    validity: days(30),
    price: { amount: 300, per: "package", vat: "excluded" },
    hide: "ซ้ำกับแพ็กเน็ตไม่อั้น 20 Mbps ในหมวดเน็ต อยู่ในหมวดประกัน",
  }),
];
