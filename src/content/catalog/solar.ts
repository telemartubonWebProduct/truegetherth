import type { CatalogPackage } from "@/lib/content/schema";

import { pkg, t } from "./helpers";

const file = "wEnergy/solar.data.ts";
const estimateNote =
  "เพิ่มคำว่า “ประมาณ” ให้ยอดประหยัดและระยะคืนทุน เพราะหมายเหตุเดิมบอกว่าคำนวณจากค่าไฟ 4.7 บาท/หน่วย และใช้งานกลางวันเฉลี่ย 5 ชั่วโมง";
const priceNote = "ข้อมูลเดิมชื่อช่องสลับกัน: discount_price คือราคาปกติที่ขีดฆ่า และ price คือราคาที่เสนอ";

const solar = (
  id: string,
  kwp: number,
  pack: string,
  amount: number,
  regularAmount: number,
  savingPerMonth: string,
  panels: number,
  area: number,
  appliances: [th: string, en: string],
  paybackYears: number,
  entry: number,
) =>
  pkg({
    id,
    category: "solar",
    group: "rooftop",
    name: t(`${pack} ${kwp} kWp`, `${pack} ${kwp} kWp`),
    price: { amount, regularAmount, per: "once", vat: "excluded" },
    details: [
      t(`ประหยัดค่าไฟประมาณ ${savingPerMonth} บาท/เดือน`, `Saves about ${savingPerMonth} baht a month on electricity`),
      t(`แผงโซลาร์เซลล์ ${panels} แผ่น`, `${panels} solar panels`),
      t(`ใช้พื้นที่หลังคา ${area} ตร.ม.`, `Needs ${area} m² of roof`),
      t(`รองรับ ${appliances[0]}`, `Runs ${appliances[1]}`),
      t(`คืนทุนในประมาณ ${paybackYears} ปี`, `Pays back in about ${paybackYears} years`),
    ],
    from: [file, `solarcellData id ${entry}`],
    notes: [estimateNote, priceNote],
  });

export const solarPackages: CatalogPackage[] = [
  solar("solar-3kwp", 3, "S Pack", 115_000, 129_000, "2,000", 6, 15, ["แอร์ 2 เครื่อง ทีวี 1 เครื่อง ตู้เย็น 1 เครื่อง", "2 air conditioners, 1 TV and 1 fridge"], 5, 1),
  solar("solar-5kwp", 5, "M Pack", 159_000, 189_000, "3,000", 9, 22, ["แอร์ 3 เครื่อง ทีวี 2 เครื่อง ตู้เย็น 2 เครื่อง", "3 air conditioners, 2 TVs and 2 fridges"], 5, 2),
  solar("solar-10kwp", 10, "L Pack", 269_000, 299_000, "6,000", 18, 44, ["แอร์ 6 เครื่อง ทีวี 4 เครื่อง ตู้เย็น 2 เครื่อง", "6 air conditioners, 4 TVs and 2 fridges"], 4, 3),
];
