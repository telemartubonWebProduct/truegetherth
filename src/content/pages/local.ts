import type { LocalPage } from "@/lib/content/schema";

import { t } from "../catalog/helpers";

// The page for people looking for True home internet in Ubon Ratchathani, where
// the head office is (the address is site.contact.address, as the owner gave it
// on 2026-11-12). It says only what the rest of the site already says: who we
// are, that an address is checked before anything is confirmed, and that
// requests come from every province. The three provinces the team itself looks
// after are the owner's word of 2026-11-12. Which districts, how long an
// installation takes and what customers say are the owner's to add.
export const ubonPage: LocalPage = {
  id: "ubon",
  path: "/ubon",
  seo: {
    title: t("ติดเน็ตบ้านทรู อุบลราชธานี เช็กพื้นที่และสมัครกับสำนักงานในอุบล", "True home internet in Ubon Ratchathani: address check and sign-up"),
    description: t(
      "ติดเน็ตบ้านทรูในอุบลราชธานีกับ Telemart พาร์ทเนอร์ที่ได้รับการแต่งตั้งของทรู ออนไลน์ สำนักงานใหญ่อยู่ที่ตำบลไร่น้อย อำเภอเมืองอุบลราชธานี ดูแลลูกค้าในอุบลราชธานี ศรีสะเกษ และอำนาจเจริญ เจ้าหน้าที่เช็กพื้นที่ตามที่อยู่จริง เทียบแพ็กเกจ และนัดติดตั้งให้ จันทร์–เสาร์ 09:00–18:00 น.",
      "Get True home internet in Ubon Ratchathani through Telemart, an Authorized Partner of True Online with its head office in Rai Noi, Mueang Ubon Ratchathani. We look after customers in Ubon Ratchathani, Si Sa Ket and Amnat Charoen: our team checks your address, compares plans and arranges installation, Monday to Saturday, 9:00 to 18:00.",
    ),
  },
  hero: {
    heading: t("เน็ตบ้านทรู อุบลราชธานี", "True home internet in Ubon Ratchathani"),
    description: t(
      "Telemart มีสำนักงานใหญ่อยู่ในอำเภอเมืองอุบลราชธานี ทีมของเราดูแลลูกค้าในอุบลราชธานี ศรีสะเกษ และอำนาจเจริญ แจ้งที่อยู่ติดตั้งของคุณทาง LINE หรือโทรศัพท์ เจ้าหน้าที่จะตรวจพื้นที่ เทียบแพ็กเกจ และยืนยันเงื่อนไขก่อนสมัคร การติดตั้งขึ้นกับผลตรวจพื้นที่ของแต่ละที่อยู่",
      "Telemart's head office is in Mueang Ubon Ratchathani, and our team looks after customers in Ubon Ratchathani, Si Sa Ket and Amnat Charoen. Send us your installation address on LINE or by phone: our team checks availability, compares plans and confirms the terms before you apply. Installation depends on the check of each address.",
    ),
    primaryCta: {
      id: "ubon-line",
      label: t("แชตกับเจ้าหน้าที่ทาง LINE", "Chat with us on LINE"),
      target: { kind: "contact", channel: "line-sales" },
      style: "primary",
    },
    secondaryCta: {
      id: "ubon-packages",
      label: t("ดูแพ็กเกจเน็ตบ้าน", "See home internet packages"),
      target: { kind: "page", path: "/broadband" },
      style: "secondary",
    },
    tone: "canvas",
  },
  office: {
    heading: t("สำนักงานเทเลมาร์ท อุบลราชธานี", "Telemart's office in Ubon Ratchathani"),
    description: t("ติดต่อเจ้าหน้าที่ได้ทาง LINE หรือโทรศัพท์ในเวลาทำการ", "Reach our team on LINE or by phone during opening hours."),
    mapLabel: t("เปิดแผนที่สำนักงาน", "Open the office on the map"),
    tone: "canvas",
  },
  serviceArea: {
    heading: t("จังหวัดที่ทีมเทเลมาร์ทดูแล", "The provinces our team looks after"),
    description: t(
      "ทีมของเราดูแลลูกค้าในสามจังหวัดนี้เอง การติดตั้งยังขึ้นกับผลตรวจพื้นที่ของแต่ละที่อยู่ อยู่จังหวัดอื่นก็แจ้งเรื่องเข้ามาได้",
      "Our own team looks after customers in these three provinces. Installation still depends on the check of each address. From another province you can send us a request too.",
    ),
    provinces: [t("อุบลราชธานี", "Ubon Ratchathani"), t("ศรีสะเกษ", "Si Sa Ket"), t("อำนาจเจริญ", "Amnat Charoen")],
    tone: "canvas",
  },
  faq: {
    heading: t("คำถามเรื่องติดเน็ตบ้านทรูในอุบลราชธานี", "Questions about True home internet in Ubon Ratchathani"),
    items: [
      {
        id: "office",
        question: t("สำนักงานของเทเลมาร์ทในอุบลราชธานีอยู่ที่ไหน", "Where is Telemart's office in Ubon Ratchathani?"),
        answer: t(
          "สำนักงานใหญ่อยู่ที่ 296 หมู่บ้านโนนหงษ์ทอง หมู่ที่ 12 ตำบลไร่น้อย อำเภอเมืองอุบลราชธานี จังหวัดอุบลราชธานี 34000 ติดต่อได้จันทร์–เสาร์ 09:00–18:00 น. ทาง LINE หรือโทรศัพท์",
          "The head office is at 296 Non Hong Thong Village, Moo 12, Rai Noi, Mueang Ubon Ratchathani, Ubon Ratchathani 34000. Reach us Monday to Saturday, 9:00 to 18:00, on LINE or by phone.",
        ),
      },
      {
        id: "other-districts",
        question: t("อยู่อำเภออื่นของอุบลราชธานี ติดเน็ตบ้านทรูได้ไหม", "Can I get True home internet in another district of Ubon Ratchathani?"),
        answer: t(
          "ขึ้นกับผลตรวจพื้นที่ของที่อยู่นั้น การมีบริการในอำเภอเดียวกันยังไม่ยืนยันว่าทุกบ้านหรือทุกอาคารติดตั้งได้ แจ้งบ้านเลขที่ ตำบล อำเภอ และรหัสไปรษณีย์ให้เจ้าหน้าที่ตรวจก่อนสมัคร",
          "It depends on the check of that address. Service elsewhere in the same district does not confirm that every home or building can be connected. Give our team the house number, subdistrict, district and postcode to check before you apply.",
        ),
      },
      {
        id: "nearby-provinces",
        question: t("อยู่ศรีสะเกษหรืออำนาจเจริญ ติดเน็ตบ้านทรูกับเทเลมาร์ทได้ไหม", "Can I get True home internet through Telemart in Si Sa Ket or Amnat Charoen?"),
        answer: t(
          "ได้ ทีมเทเลมาร์ทดูแลลูกค้าในจังหวัดศรีสะเกษและอำนาจเจริญเช่นเดียวกับอุบลราชธานี แจ้งบ้านเลขที่ ตำบล อำเภอ และรหัสไปรษณีย์ให้เจ้าหน้าที่ตรวจพื้นที่ก่อน การติดตั้งขึ้นกับผลตรวจของแต่ละที่อยู่",
          "Yes. Telemart's team looks after customers in Si Sa Ket and Amnat Charoen as it does in Ubon Ratchathani. Give our team the house number, subdistrict, district and postcode to check first: installation depends on the check of each address.",
        ),
      },
      {
        id: "other-provinces",
        question: t("อยู่นอกสามจังหวัดนี้ สมัครผ่านเทเลมาร์ทได้ไหม", "Can I apply through Telemart from outside these three provinces?"),
        answer: t(
          "ได้ เรารับเรื่องจากทุกจังหวัด แต่การติดตั้งขึ้นกับผลตรวจพื้นที่และเงื่อนไขของแต่ละที่อยู่ เจ้าหน้าที่จะแจ้งผลก่อนยืนยันทุกครั้ง",
          "Yes. We take requests from every province, but installation depends on the address check and the terms for each address. Our team tells you the result before anything is confirmed.",
        ),
      },
      {
        id: "who",
        question: t("เทเลมาร์ทเป็นบริษัททรูหรือไม่", "Is Telemart True itself?"),
        answer: t(
          "ไม่ใช่ เว็บไซต์นี้ดำเนินงานโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด (Telemart) พาร์ทเนอร์ที่ได้รับการแต่งตั้งอย่างเป็นทางการของทรู ออนไลน์ (Authorized Partner) และตัวแทนจำหน่ายของทรู เรารับสมัครและประสานงานติดตั้งให้ แต่ไม่ใช่ผู้ให้บริการเครือข่าย",
          "No. This website is run by Telemart Communication Co., Ltd. (Telemart), an officially appointed partner of True Online (Authorized Partner) and a dealer of True. We take applications and coordinate installation, but we are not the network operator.",
        ),
      },
    ],
  },
};
