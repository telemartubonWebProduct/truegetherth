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
    title: t("ติดเน็ตบ้านทรู โปรเน็ตบ้านทรูไฟเบอร์ลูกค้าใหม่", "Get True home internet: fibre deals for new customers"),
    description: t(
      "ติดเน็ตบ้านทรูกับพาร์ทเนอร์ที่ได้รับการแต่งตั้งของทรู ออนไลน์ เทียบโปรเน็ตบ้านทรูไฟเบอร์ลูกค้าใหม่ 500 Mbps ถึง 1.5 Gbps ราคาต่อเดือนไม่รวม VAT เจ้าหน้าที่เช็คพื้นที่และนัดติดตั้งให้ รับเรื่องทุกจังหวัด",
      "Get True home internet through an appointed Authorized Partner of True Online. Compare fibre deals for new customers from 500 Mbps to 1.5 Gbps; monthly prices exclude VAT. We check your area and book the installation, in every province.",
    ),
  },
  hero: {
    heading: t("โปรเน็ตบ้านทรูไฟเบอร์ สำหรับลูกค้าใหม่", "True fibre home internet deals for new customers"),
    description: t(
      "ติดเน็ตบ้านทรูกับพาร์ทเนอร์ที่ได้รับการแต่งตั้งของทรู ออนไลน์ เจ้าหน้าที่เช็คพื้นที่และนัดติดตั้งให้ ทุกแพ็กเกจเรียงข้อมูลแบบเดียวกันให้เทียบง่าย",
      "Get True home internet through a True Online partner: we check your area and book the installation.",
    ),
    tone: "canvas",
  },
  layout: "compare",
  packageCta: interested("broadband-new-interest"),
  sections: [
    {
      id: "packages",
      heading: t("แพ็กเกจเน็ตบ้านทรูสำหรับลูกค้าใหม่", "True home internet packages"),
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
  // Offer facts come from the catalog; general usage guidance uses the primary
  // sources recorded in R18. App bandwidth examples are not bundled benefits.
  faq: {
    heading: t("คำถามเรื่องติดเน็ตบ้านทรู", "Questions about getting True home internet"),
    items: [
      {
        id: "choose-speed",
        question: t("เลือกเน็ตบ้าน 500 Mbps หรือ 1 Gbps อย่างไร", "How do I choose between 500 Mbps and 1 Gbps?"),
        answer: t(
          "เริ่มจากจำนวนอุปกรณ์ที่ใช้งานพร้อมกัน และงานที่ทำ เช่น ประชุมวิดีโอ ดูสตรีม หรือดาวน์โหลดไฟล์ใหญ่ แล้วเทียบความเร็วดาวน์โหลดและอัปโหลดของแต่ละแพ็ก หากหลายอุปกรณ์รับส่งข้อมูลพร้อมกัน ให้แจ้งลักษณะการใช้งานกับเจ้าหน้าที่เพื่อช่วยเลือกแพ็ก ไม่ควรเลือกจากตัวเลขความเร็วเพียงอย่างเดียว",
          "Start with the devices used at the same time and what they do, such as video calls, streaming or large downloads. Compare each package's download and upload speeds. Tell our team about simultaneous use so they can help you choose; the speed figure alone does not determine the right package.",
        ),
      },
      {
        id: "500-mbps-use",
        question: t("เน็ตบ้านทรู 500 Mbps พอสำหรับทำงานและดู 4K ไหม", "Is 500 Mbps enough for working from home and 4K streaming?"),
        answer: t(
          "ให้ดูงานที่ใช้พร้อมกัน ไม่ใช่จำนวนเครื่องอย่างเดียว ตัวอย่างเช่น Netflix แนะนำการเชื่อมต่อที่เสถียรอย่างน้อย 15 Mbps สำหรับ 4K ส่วน Zoom ระบุว่าเมื่อใช้งานวิดีโอ 1080p ต้องการอัปโหลดอย่างน้อย 3.8 Mbps และดาวน์โหลด 3.0 Mbps จึงควรเผื่อแบนด์วิดท์สำหรับงานอื่นที่เกิดพร้อมกันด้วย และเทียบอัปโหลดของแพ็กเมื่อต้องประชุมหรือส่งไฟล์ ความเสถียรของ Wi-Fi อุปกรณ์ และเงื่อนไขของแอปยังมีผล ตัวเลขเหล่านี้เป็นแนวทางการใช้งาน ไม่รับประกันความเร็วทุกเครื่องหรือหมายความว่ามีสมาชิก Netflix หรือ Zoom รวมในแพ็ก ให้ตรวจสิทธิ์จริงในรายละเอียดแพ็กและยืนยันกับเจ้าหน้าที่",
          "Consider simultaneous tasks, not just the device count. Netflix recommends a stable connection of at least 15 Mbps for 4K. Zoom specifies at least 3.8 Mbps upload and 3.0 Mbps download when using 1080p video. Leave capacity for other simultaneous tasks and compare upload speeds for calls and file transfers. Wi-Fi stability, devices and app requirements also matter. These are usage guidelines, not guaranteed speeds per device or a promise that Netflix or Zoom subscriptions are included. Check the actual package benefits and confirm with our team.",
        ),
      },
      {
        id: "wifi-speed-check",
        question: t("ทำไมทดสอบ Wi-Fi แล้วความเร็วไม่เท่าตัวเลขแพ็ก", "Why can a Wi-Fi speed test be slower than the package speed?"),
        answer: t(
          "ผลผ่าน Wi-Fi ยังขึ้นกับอุปกรณ์ ระยะห่างจากเราเตอร์ ผนัง และการใช้งานพร้อมกัน ลองใช้อุปกรณ์เดิมใกล้เราเตอร์ และเปรียบเทียบย่าน 2.4 GHz กับ 5 GHz ตามที่อุปกรณ์รองรับ ก่อนสรุปว่าต้องเพิ่มความเร็วแพ็ก จดจุดที่ทดสอบ ช่วงเวลา และผลดาวน์โหลดกับอัปโหลดไว้ หากยังผิดปกติให้แจ้งเจ้าหน้าที่เพื่อตรวจสอบ สปีดแพ็กกับความครอบคลุมของ Wi-Fi เป็นคนละเรื่อง การเพิ่ม Mbps อย่างเดียวอาจไม่แก้จุดอับสัญญาณ",
          "Wi-Fi results also depend on your device, distance from the router, walls and simultaneous use. Try the same device near the router and compare the 2.4 GHz and 5 GHz bands if supported before deciding you need a faster package. Record the location, time, download and upload results. If the problem persists, ask the team to investigate. Package speed and Wi-Fi coverage are different: more Mbps alone may not fix a weak-signal area.",
        ),
      },
      {
        id: "multi-floor-wifi",
        question: t("บ้านหลายชั้นต้องเลือกแพ็กที่เร็วขึ้นเสมอไหม", "Does a home with several floors always need a faster package?"),
        answer: t(
          "ควรดูทั้งความเร็วของแพ็กและการกระจายสัญญาณ Wi-Fi ระยะห่างจากเราเตอร์ ผนัง และอุปกรณ์ที่ใช้มีผลต่อสัญญาณในแต่ละห้อง การเพิ่มความเร็วแพ็กอย่างเดียวจึงอาจไม่แก้จุดอับสัญญาณ แจ้งจำนวนชั้นและห้องที่ใช้งานกับเจ้าหน้าที่ เพื่อสอบถามตำแหน่งเราเตอร์และทางเลือกอุปกรณ์ พร้อมยืนยันค่าใช้จ่ายและเงื่อนไขก่อนสมัคร",
          "Consider both package speed and Wi-Fi coverage. Distance from the router, walls and your devices affect the connection in each room. A faster package alone may not fix weak coverage. Tell our team about the floors and rooms you use, ask about router placement and equipment options, and confirm costs and terms before applying.",
        ),
      },
      {
        id: "compare-terms",
        question: t("นอกจากราคา ควรเทียบอะไรในแพ็กเน็ตบ้านทรู", "What should I compare besides the price?"),
        answer: t(
          "เทียบความเร็วดาวน์โหลดและอัปโหลด ระยะสัญญา อุปกรณ์ และสิทธิประโยชน์ที่คุณใช้จริง บางแพ็กให้เลือกสิทธิประโยชน์ได้เพียงหนึ่งอย่าง ให้เปิดรายละเอียดของแพ็กเพื่ออ่านเงื่อนไขทั้งหมด และให้เจ้าหน้าที่ยืนยันราคาไม่รวม VAT ค่าใช้จ่ายอื่นและเงื่อนไขล่าสุดก่อนสมัคร",
          "Compare download and upload speeds, contract length, equipment and benefits you will actually use. Some packages let you choose only one benefit. Open the package details for all conditions, then ask our team to confirm the price before VAT, any other charges and the latest terms before you apply.",
        ),
      },
      {
        id: "can-i-get-it",
        question: t("บ้านของฉันติดเน็ตบ้านทรูได้ไหม", "Can True home internet be installed at my home?"),
        answer: t(
          "ขึ้นกับผลตรวจพื้นที่ แจ้งที่อยู่ทาง LINE โทรหาเรา หรือฝากเบอร์ให้โทรกลับ เจ้าหน้าที่จะตรวจพื้นที่และแจ้งผลก่อนคุณสมัคร รับเรื่องจากทุกจังหวัด",
          "It depends on a check of your address. Send it to us on LINE, call us or leave your number for a call back, and we tell you the result before you sign up. We take requests from every province.",
        ),
      },
      {
        id: "how-to-apply",
        question: t("สมัครเน็ตบ้านทรูกับเราอย่างไร", "How do I apply?"),
        answer: t(
          "เลือกแพ็กเกจที่สนใจ แล้วทัก LINE โทรหาเรา หรือขอให้เจ้าหน้าที่โทรกลับ เจ้าหน้าที่ช่วยเทียบแพ็กเกจ ตรวจพื้นที่ และนัดวันติดตั้งให้",
          "Pick a package, then message us on LINE, call us or ask us to call you back. We help you compare packages, check your area and book the installation.",
        ),
      },
      {
        id: "vat",
        question: t("ราคาในหน้านี้รวม VAT หรือยัง", "Do the prices on this page include VAT?"),
        answer: t("ยังไม่รวม ราคาที่แสดงเป็นราคาต่อเดือนที่ยังไม่รวม VAT", "No. The prices shown are monthly prices before VAT."),
      },
      {
        id: "contract",
        question: t("ต้องทำสัญญากี่เดือน", "How long is the contract?"),
        answer: t("ทุกแพ็กเกจลูกค้าใหม่ในหน้านี้ทำสัญญา 24 เดือน", "Every package for new customers on this page has a 24-month contract."),
      },
      {
        id: "up-to-date",
        question: t("ราคาและเงื่อนไขในหน้านี้เป็นข้อมูลล่าสุดไหม", "Are these prices and terms up to date?"),
        answer: t(
          "ราคาและเงื่อนไขมาจากข้อมูลเดิมของร้าน อาจไม่ใช่ข้อมูลล่าสุด เจ้าหน้าที่จะยืนยันเงื่อนไขล่าสุดกับคุณก่อนสมัครทุกครั้ง",
          "They come from our earlier listings and may not be current. Our team always confirms the latest terms with you before you sign up.",
        ),
      },
      {
        // Who is behind the site, in the words of the footer, the terms and the home page's questions.
        id: "who-runs-the-site",
        question: t("เว็บไซต์นี้เป็นเว็บไซต์หลักของทรูหรือไม่", "Is this True's own website?"),
        answer: t(
          "ไม่ใช่ เว็บไซต์นี้ดำเนินงานโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด (Telemart) พาร์ทเนอร์ที่ได้รับการแต่งตั้งอย่างเป็นทางการของทรู ออนไลน์ (Authorized Partner) และตัวแทนจำหน่ายของทรู เรารับสมัครและประสานงานติดตั้งให้ แต่ไม่ใช่ผู้ให้บริการเครือข่าย",
          "No. This website is run by Telemart Communication Co., Ltd. (Telemart), an officially appointed Authorized Partner of True Online and Authorized Dealer of True. We take your application and arrange the installation; we are not the network operator.",
        ),
      },
    ],
  },
};

export const broadbandExistingPage: PackagePage = {
  id: "broadband-existing",
  path: "/broadband-old",
  seo: {
    title: t("เพิ่มสปีดเน็ตบ้านทรูออนไลน์ สำหรับลูกค้าปัจจุบัน", "Speed boosts and add-ons for current True Online customers"),
    description: t(
      "แพ็กเกจเพิ่มสปีด กล้องวงจรปิด และ TrueID TV สำหรับลูกค้าเน็ตบ้านทรูออนไลน์ปัจจุบัน สอบถามและสมัครผ่านเจ้าหน้าที่ทาง LINE หรือโทรศัพท์",
      "Speed boosts, security cameras and TrueID TV for current True Online home internet customers. Ask and apply through our team on LINE or by phone.",
    ),
  },
  hero: {
    heading: t("เพิ่มสปีดเน็ตบ้านทรู และแพ็กเสริมสำหรับลูกค้าปัจจุบัน", "Speed boosts and add-ons for current True Online customers"),
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
    title: t("แพ็กเสริมทรูรายเดือน", "True postpaid mobile add-ons"),
    description: t(
      "แพ็กเสริมมือถือทรูรายเดือน ทั้งเน็ตเพิ่มสปีด เน็ตไม่จำกัด โซเชียล โทร ซีรีส์ ความคุ้มครอง เกมและไลฟ์สไตล์",
      "True postpaid mobile add-ons: speed boosts, unlimited data, social apps, calls, series, cover, games and lifestyle.",
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
    title: t("แพ็กเสริมทรูเติมเงิน", "True prepaid mobile add-ons"),
    description: t(
      "แพ็กเสริมมือถือทรูแบบเติมเงิน ทั้งเน็ตไม่อั้น เน็ตพร้อมโทร โทรทุกค่าย เกม และประกัน",
      "True prepaid mobile add-ons: unlimited data, data with calls, calls to all networks, games and insurance.",
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
