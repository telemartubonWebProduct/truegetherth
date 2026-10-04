import type { Cta, PackagePage } from "@/lib/content/schema";

import { t } from "../catalog/helpers";

// Package pages keep the old URLs and in-page anchors (the home page and
// campaign links point at /monthy#game, /topup#internet, /broadband-old#cctv…).
// Section order is fixed here; the catalog supplies the packages of each group.

const interested = (id: string): Cta => ({
  id,
  label: t("สนใจแพ็กเกจนี้", "I'm interested"),
  target: { kind: "contact", channel: "line-sales" },
  style: "primary",
});

const dialNote = t(
  "แพ็กเกจที่มีรหัส กดสมัครจากโทรศัพท์ของคุณได้ หรือให้เจ้าหน้าที่ช่วยสมัครทาง LINE",
  "Packages with a code can be added by dialling it from your phone, or our team can add them for you on LINE.",
);

export const broadbandNewPage: PackagePage = {
  id: "broadband-new",
  path: "/broadband",
  seo: {
    title: t("เน็ตบ้านทรูไฟเบอร์ สำหรับลูกค้าใหม่", "True fibre home internet for new customers"),
    description: t(
      "เทียบแพ็กเกจเน็ตบ้านทรูไฟเบอร์สำหรับลูกค้าใหม่ ความเร็ว 500 Mbps ถึง 1.5 Gbps พร้อมอุปกรณ์และสิทธิประโยชน์ คุยกับเจ้าหน้าที่เพื่อตรวจพื้นที่และสมัคร",
      "Compare True fibre home internet for new customers, from 500 Mbps to 1.5 Gbps with equipment and benefits. Talk to our team to check your area and apply.",
    ),
  },
  hero: {
    heading: t("เน็ตบ้านทรูไฟเบอร์ สำหรับลูกค้าใหม่", "True fibre home internet for new customers"),
    description: t(
      "แพ็กเกจเน็ตบ้านพร้อมสิทธิประโยชน์สำหรับสายเกม สายซีรีส์ และสายกีฬา ทุกแพ็กเกจเรียงข้อมูลแบบเดียวกันให้เทียบง่าย",
      "Home internet with perks for gamers, series fans and sports lovers. Every package lists the same details, so they are easy to compare.",
    ),
    tone: "canvas",
  },
  layout: "compare",
  packageCta: interested("broadband-new-interest"),
  sections: [
    {
      id: "packages",
      heading: t("โปรโมชันสำหรับลูกค้าใหม่", "Offers for new customers"),
      groups: [{ id: "new-customer", category: "broadband-new", group: "new-customer" }],
      notes: [
        t("ราคาต่อเดือน ไม่รวม VAT ทุกแพ็กเกจทำสัญญา 24 เดือน", "Monthly prices exclude VAT. Every package has a 24-month contract."),
        t(
          "การติดตั้งขึ้นกับผลตรวจพื้นที่ เจ้าหน้าที่ยืนยันเงื่อนไขล่าสุดกับคุณก่อนสมัคร",
          "Installation depends on a check of your address. Our team confirms the latest terms with you before you sign up.",
        ),
      ],
      tone: "canvas",
    },
  ],
};

export const broadbandExistingPage: PackagePage = {
  id: "broadband-existing",
  path: "/broadband-old",
  seo: {
    title: t("แพ็กเกจเสริมสำหรับลูกค้าทรูออนไลน์ปัจจุบัน", "Add-ons for current True Online customers"),
    description: t(
      "แพ็กเกจเพิ่มสปีด กล้องวงจรปิด และ TrueID TV สำหรับลูกค้าเน็ตบ้านทรูออนไลน์ปัจจุบัน",
      "Speed boosts, security cameras and TrueID TV for current True Online home internet customers.",
    ),
  },
  hero: {
    heading: t("แพ็กเกจและสิทธิพิเศษสำหรับลูกค้าปัจจุบัน", "Packages and perks for current customers"),
    description: t("อุปกรณ์และแพ็กเกจเสริมที่ตอบโจทย์ไลฟ์สไตล์คุณ", "Equipment and add-on packages that fit the way you live."),
    tone: "canvas",
  },
  layout: "compare",
  packageCta: interested("broadband-existing-interest"),
  sections: [
    {
      id: "speed",
      heading: t("แพ็กเกจเสริมเพิ่มสปีด", "Speed boosts"),
      description: t("เพิ่มความเร็วเน็ตบ้านโดยไม่ต้องเปลี่ยนแพ็กเกจหลัก", "Make your home internet faster without changing your main package."),
      groups: [
        { id: "speed-monthly", heading: t("รายเดือน", "Monthly"), category: "broadband-existing", group: "speed-boost" },
        { id: "speed-daily", heading: t("รายวัน", "Daily"), category: "broadband-existing", group: "speed-boost-daily" },
      ],
      notes: [],
      tone: "canvas",
    },
    {
      id: "cctv",
      heading: t("อุปกรณ์เสริม", "Add-on equipment"),
      description: t("สินค้าราคาพิเศษสำหรับลูกค้าทรูออนไลน์", "Special prices for True Online customers."),
      groups: [{ id: "add-ons", category: "broadband-existing", group: "add-ons" }],
      notes: [],
      tone: "canvas",
    },
  ],
};

export const mobileMonthlyPage: PackagePage = {
  id: "mobile-monthly",
  path: "/monthy",
  seo: {
    title: t("แพ็กเสริมมือถือรายเดือน", "Postpaid mobile add-ons"),
    description: t(
      "แพ็กเสริมมือถือรายเดือน ทั้งเน็ตเพิ่มสปีด เน็ตไม่จำกัด โซเชียล โทร ซีรีส์ ความคุ้มครอง เกมและไลฟ์สไตล์",
      "Postpaid mobile add-ons: speed boosts, unlimited data, social apps, calls, series, cover, games and lifestyle.",
    ),
  },
  hero: {
    heading: t("แพ็กเสริมมือถือรายเดือน", "Postpaid mobile add-ons"),
    description: t(
      "เน็ต โทร โซเชียล ซีรีส์ ความคุ้มครอง และไลฟ์สไตล์ เลือกได้ตามการใช้งานของคุณ",
      "Data, calls, social apps, series, cover and lifestyle perks, picked by how you use your phone.",
    ),
    tone: "canvas",
  },
  layout: "compact",
  packageCta: interested("mobile-monthly-interest"),
  sections: [
    {
      id: "internetpure",
      heading: t("เน็ตเพิ่มสปีด", "Speed boosts"),
      groups: [{ id: "internet-boost", category: "mobile-monthly", group: "internet-boost" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "unlimited",
      heading: t("เน็ตไม่จำกัด", "Unlimited data"),
      groups: [{ id: "unlimited", category: "mobile-monthly", group: "unlimited" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "socialInternet",
      heading: t("เน็ตเล่นโซเชียล", "Social and app data"),
      groups: [{ id: "social", category: "mobile-monthly", group: "social" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "calls",
      heading: t("โทร", "Calls"),
      groups: [{ id: "calls", category: "mobile-monthly", group: "calls" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "entertainment",
      heading: t("ซีรีส์และความบันเทิง", "Series and entertainment"),
      groups: [
        { id: "asian-combo", heading: t("Asian Combo", "Asian Combo"), category: "mobile-monthly", group: "asian-combo" },
        { id: "combo-plus", heading: t("Combo+", "Combo+"), category: "mobile-monthly", group: "combo-plus" },
        { id: "viu", heading: t("Viu", "Viu"), category: "mobile-monthly", group: "viu" },
        { id: "iqiyi", heading: t("iQIYI", "iQIYI"), category: "mobile-monthly", group: "iqiyi" },
        { id: "wetv", heading: t("WeTV", "WeTV"), category: "mobile-monthly", group: "wetv" },
      ],
      notes: [dialNote],
      tone: "canvas",
    },
    {
      id: "protection",
      heading: t("ความคุ้มครอง", "Cover and protection"),
      groups: [
        {
          id: "life-insurance",
          heading: t("ประกันชีวิตคุ้มครองสะสม", "Cumulative life cover"),
          category: "mobile-monthly",
          group: "life-insurance",
        },
        { id: "accident-insurance", heading: t("ฟรีประกันอุบัติเหตุ", "Free accident cover"), category: "mobile-monthly", group: "accident-insurance" },
        { id: "doctor-coupon", heading: t("คูปองปรึกษาแพทย์", "Doctor consultation coupons"), category: "mobile-monthly", group: "doctor-coupon" },
        { id: "whoscall", heading: t("Whoscall ป้องกันมิจฉาชีพ", "Whoscall scam protection"), category: "mobile-monthly", group: "whoscall" },
      ],
      notes: [],
      tone: "canvas",
    },
    {
      id: "game",
      heading: t("เกมและไลฟ์สไตล์", "Games and lifestyle"),
      groups: [
        { id: "game", heading: t("เกม", "Games"), category: "mobile-monthly", group: "game" },
        { id: "lifestyle", heading: t("คูปองไลฟ์สไตล์", "Lifestyle coupons"), category: "mobile-monthly", group: "lifestyle" },
      ],
      notes: [],
      tone: "canvas",
    },
  ],
};

export const mobilePrepaidPage: PackagePage = {
  id: "mobile-prepaid",
  path: "/topup",
  seo: {
    title: t("แพ็กเสริมมือถือแบบเติมเงิน", "Prepaid mobile add-ons"),
    description: t(
      "แพ็กเสริมมือถือแบบเติมเงิน ทั้งเน็ตไม่อั้น เน็ตพร้อมโทร โทรทุกค่าย เกม และประกัน",
      "Prepaid mobile add-ons: unlimited data, data with calls, calls to all networks, games and insurance.",
    ),
  },
  hero: {
    heading: t("แพ็กเสริมมือถือแบบเติมเงิน", "Prepaid mobile add-ons"),
    description: t(
      "คุ้ม ครบ ทุกไลฟ์สไตล์ ไม่ว่าจะเน็ต โทร โซเชียล หรือความบันเทิง",
      "Good value for every lifestyle, whether you want data, calls, social apps or entertainment.",
    ),
    tone: "canvas",
  },
  layout: "compact",
  packageCta: interested("mobile-prepaid-interest"),
  sections: [
    {
      id: "internet",
      heading: t("เน็ต", "Data"),
      groups: [{ id: "internet", category: "mobile-prepaid", group: "internet" }],
      notes: [
        t(
          "FUP คือความเร็วที่ใช้ต่อได้หลังใช้ครบปริมาณที่กำหนด",
          "FUP is the speed you keep after using the full data amount.",
        ),
      ],
      tone: "canvas",
    },
    {
      id: "internetcall",
      heading: t("เน็ตและโทร", "Data and calls"),
      groups: [{ id: "internet-calls", category: "mobile-prepaid", group: "internet-calls" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "call",
      heading: t("โทร", "Calls"),
      groups: [{ id: "calls", category: "mobile-prepaid", group: "calls" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "entertain",
      heading: t("ความบันเทิง", "Entertainment"),
      groups: [{ id: "entertainment", category: "mobile-prepaid", group: "entertainment" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "game",
      heading: t("เกม", "Games"),
      groups: [{ id: "game", category: "mobile-prepaid", group: "game" }],
      notes: [],
      tone: "canvas",
    },
    {
      id: "inssurance",
      heading: t("ประกัน", "Insurance"),
      groups: [{ id: "insurance", category: "mobile-prepaid", group: "insurance" }],
      notes: [],
      tone: "canvas",
    },
  ],
};
