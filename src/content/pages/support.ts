import type { AgentPage, ContactPage, LegalPage } from "@/lib/content/schema";

import { t } from "../catalog/helpers";

export const contactPage: ContactPage = {
  id: "contact",
  path: "/service",
  seo: {
    title: t("ติดต่อเรา", "Contact us"),
    description: t(
      "ติดต่อ truegetherth ทาง LINE โทรศัพท์ อีเมล หรือเฟซบุ๊ก เพื่อสอบถามแพ็กเกจเน็ตบ้าน เน็ตมือถือ และโซลาร์เซลล์",
      "Contact truegetherth on LINE, by phone, email or Facebook about home internet, mobile packages and solar.",
    ),
  },
  hero: {
    heading: t("ติดต่อเรา", "Contact us"),
    description: t(
      "มีคำถามหรือต้องการความช่วยเหลือ ติดต่อเจ้าหน้าที่ได้ทุกช่องทางด้านล่าง",
      "Questions or need help? Reach our team through any of the channels below.",
    ),
    tone: "canvas",
  },
  channels: {
    heading: t("ช่องทางติดต่อ", "Ways to reach us"),
    // The old contact page's LINE button opened lineService; the footer paired
    // lineSales with the @341tmfte QR code. Which account the business wants here
    // is on the review list (docs/renovation/M2-PUBLIC-SITE.md).
    items: [
      {
        id: "line",
        channel: "line-sales",
        title: t("LINE", "LINE"),
        description: t(
          "สอบถามแพ็กเกจ ขอคำแนะนำ หรือขอให้เจ้าหน้าที่ติดต่อกลับ",
          "Ask about packages, get advice or ask us to call you back.",
        ),
      },
      {
        id: "phone",
        channel: "phone-sales",
        title: t("โทรศัพท์", "Phone"),
        description: t("โทรคุยกับฝ่ายขายได้โดยตรง", "Call our sales team directly."),
      },
      {
        id: "email",
        channel: "email",
        title: t("อีเมล", "Email"),
        description: t("ส่งรายละเอียดหรือเอกสารถึงเรา", "Send us details or documents."),
      },
      {
        id: "facebook",
        channel: "facebook",
        title: t("เฟซบุ๊ก", "Facebook"),
        description: t("ติดตามข่าวและส่งข้อความถึงเพจของเรา", "Follow our news and message our page."),
      },
    ],
    tone: "canvas",
  },
  callback: {
    heading: t("ขอให้เจ้าหน้าที่ติดต่อกลับ", "Ask us to call you back"),
    description: t(
      "กรอกชื่อ เบอร์โทร และพื้นที่ที่ต้องการใช้บริการ เจ้าหน้าที่จะโทรกลับเพื่อตรวจพื้นที่และแนะนำแพ็กเกจ รับเรื่องจากทุกจังหวัด",
      "Leave your name, number and the area you need service in. We will call you back to check your area and suggest a package. We take requests from every province.",
    ),
    tone: "surface",
  },
};

export const agentPage: AgentPage = {
  id: "apply-with-agent",
  path: "/wifiService",
  seo: {
    title: t("สมัครเน็ตบ้านผ่านเจ้าหน้าที่", "Apply for home internet through our team"),
    description: t(
      "สมัครเน็ตบ้านทรูไฟเบอร์ผ่านเจ้าหน้าที่ ช่วยเลือกแพ็กเกจ ตรวจพื้นที่ และนัดวันติดตั้งให้",
      "Apply for True fibre home internet through our team: we help you choose, check your area and book the installation.",
    ),
  },
  hero: {
    heading: t("สมัครเน็ตบ้านผ่านเจ้าหน้าที่", "Apply for home internet through our team"),
    description: t(
      "ติดตั้งเน็ตบ้านไฟเบอร์ได้ง่าย ๆ เจ้าหน้าที่ช่วยเลือกแพ็กเกจ ตรวจพื้นที่ และนัดวันติดตั้งให้",
      "Getting fibre installed is simple: our team helps you choose a package, checks your area and books the installation.",
    ),
    image: "agent-support",
    primaryCta: {
      id: "agent-line",
      label: t("แชตกับเจ้าหน้าที่ทาง LINE", "Chat with us on LINE"),
      target: { kind: "contact", channel: "line-sales" },
      style: "primary",
    },
    secondaryCta: {
      id: "agent-packages",
      label: t("ดูแพ็กเกจเน็ตบ้าน", "See home internet packages"),
      target: { kind: "page", path: "/broadband" },
      style: "secondary",
    },
    tone: "canvas",
  },
  steps: {
    heading: t("เจ้าหน้าที่ช่วยอะไรบ้าง", "How our team helps"),
    items: [
      {
        id: "tell-us",
        title: t("บอกความต้องการ", "Tell us what you need"),
        description: t(
          "ส่งข้อความทาง LINE หรือโทร บอกการใช้งานและพื้นที่ที่ต้องการติดตั้ง",
          "Message us on LINE or call, and tell us how you use the internet and where you need it.",
        ),
      },
      {
        id: "choose",
        title: t("เลือกแพ็กเกจ", "Pick a package"),
        description: t("เจ้าหน้าที่ช่วยเทียบแพ็กเกจที่เหมาะกับบ้านของคุณ", "We compare the packages that suit your home."),
      },
      {
        id: "install",
        title: t("ตรวจพื้นที่และนัดติดตั้ง", "Area check and installation"),
        description: t(
          "ตรวจพื้นที่ติดตั้งตามที่อยู่ของคุณ แล้วนัดวันติดตั้ง",
          "We check installation at your address and book a date with you.",
        ),
      },
    ],
    tone: "canvas",
  },
};

// Text of the old /termsAndPrivacy page, with an English translation. The old
// page ended with a template note addressed to the site owner ("this document
// is only a basic sample, not legal advice…"); it is not shown. The whole text
// still needs review by the business and a legal adviser.
export const termsPage: LegalPage = {
  id: "terms",
  path: "/termsAndPrivacy",
  seo: {
    title: t("ข้อตกลงการใช้บริการและนโยบายความเป็นส่วนตัว", "Terms of service and privacy policy"),
    description: t(
      "ข้อตกลงการใช้เว็บไซต์ truegetherth และวิธีที่เราเก็บและใช้ข้อมูลส่วนบุคคลของคุณ",
      "The terms for using the truegetherth website and how we collect and use your personal data.",
    ),
  },
  heading: t("ข้อตกลงและเงื่อนไขการให้บริการ และนโยบายความเป็นส่วนตัว", "Terms of service and privacy policy"),
  intro: t(
    "เงื่อนไขการใช้เว็บไซต์นี้ และวิธีที่เราดูแลข้อมูลส่วนบุคคลของคุณ",
    "The terms for using this website, and how we look after your personal data.",
  ),
  sections: [
    {
      id: "acceptance",
      heading: t("1. การยอมรับเงื่อนไข", "1. Accepting these terms"),
      paragraphs: [
        t(
          "ยินดีต้อนรับสู่เว็บไซต์ของเรา เว็บไซต์นี้เป็นแพลตฟอร์มสำหรับแนะนำสินค้าและบริการที่เกี่ยวข้องกับอินเทอร์เน็ตและโซลาร์เซลล์ เมื่อท่านเข้าใช้งานหรือเยี่ยมชมเว็บไซต์ ถือว่าท่านได้อ่านและยอมรับเงื่อนไขทั้งหมดในหน้านี้ หากท่านไม่ยอมรับเงื่อนไขใด ๆ โปรดหยุดใช้งานเว็บไซต์ทันที",
          "Welcome to our website. It presents products and services related to the internet and solar power. By using or visiting the website you confirm that you have read and accept all the terms on this page. If you do not accept any of them, please stop using the website straight away.",
        ),
      ],
      list: [],
    },
    {
      id: "scope",
      heading: t("2. ขอบเขตบริการ", "2. Scope of the service"),
      paragraphs: [
        t(
          "ข้อมูลหรือคำแนะนำบนเว็บไซต์จัดทำขึ้นเพื่อสนับสนุนการตัดสินใจเลือกสินค้าหรือบริการด้านอินเทอร์เน็ตและโซลาร์เซลล์เท่านั้น เราขอสงวนสิทธิ์ในการเปลี่ยนแปลง ปรับปรุง หรือยกเลิกข้อมูลใด ๆ บนเว็บไซต์โดยไม่ต้องแจ้งให้ทราบล่วงหน้า",
          "Information and advice on the website are provided only to help you choose internet and solar products or services. We may change, update or remove any information on the website without notice.",
        ),
      ],
      list: [],
    },
    {
      id: "user-responsibilities",
      heading: t("3. ความรับผิดชอบของผู้ใช้", "3. Your responsibilities"),
      paragraphs: [],
      list: [
        t("3.1 ผู้ใช้ต้องรับผิดชอบในการตรวจสอบและยืนยันความถูกต้องของข้อมูลก่อนตัดสินใจ", "3.1 You are responsible for checking and confirming information before making a decision."),
        t(
          "3.2 ผู้ใช้ต้องไม่ละเมิดกฎหมาย หรือกระทำการใด ๆ ที่อาจก่อให้เกิดความเสียหายต่อเว็บไซต์หรือบุคคลอื่น",
          "3.2 You must not break the law or do anything that could harm the website or other people.",
        ),
        t("3.3 หากผู้ใช้พบปัญหาในการใช้งาน ควรติดต่อผู้ดูแลเว็บไซต์ทันที", "3.3 If you run into a problem using the website, contact us straight away."),
      ],
    },
    {
      id: "intellectual-property",
      heading: t("4. ลิขสิทธิ์และทรัพย์สินทางปัญญา", "4. Copyright and intellectual property"),
      paragraphs: [
        t(
          "เว็บไซต์นี้เป็นลูกข่ายและ/หรือพันธมิตรของ True เนื้อหา ข้อความ รูปภาพ โลโก้ หรือสื่ออื่น ๆ บนเว็บไซต์อาจเป็นทรัพย์สินทางปัญญาที่ได้รับอนุญาตให้ใช้อย่างถูกต้อง ทั้งจากบริษัทเราเอง หรือจาก True และ/หรือพันธมิตรอื่นตามสัญญา ห้ามทำซ้ำ ดัดแปลง หรือเผยแพร่เนื้อหาดังกล่าวไม่ว่าทั้งหมดหรือบางส่วน โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษรจากเจ้าของสิทธิ์หรือผู้ที่ได้รับสิทธิ์อย่างถูกต้อง",
          "This website is a dealer and/or partner of True. Content, text, images, logos and other media on it may be intellectual property licensed to us, whether our own or from True and/or other partners under contract. Do not copy, adapt or publish any of it, in whole or in part, without written permission from the rights holder or an authorised licensee.",
        ),
      ],
      list: [],
    },
    {
      id: "disclaimer",
      heading: t("5. การปฏิเสธความรับผิด", "5. Disclaimer"),
      paragraphs: [
        t(
          "ข้อมูลและบริการทั้งหมดบนเว็บไซต์นี้ให้ไว้ “ตามสภาพที่เป็น” (as is) เราไม่รับประกันความถูกต้อง ครบถ้วน หรือความพร้อมใช้งานได้ตลอดเวลา และขอปฏิเสธความรับผิดชอบใด ๆ ที่เกิดจากการใช้ข้อมูลหรือบริการบนเว็บไซต์นี้",
          "All information and services on this website are provided “as is”. We do not guarantee that they are accurate, complete or always available, and we accept no liability arising from their use.",
        ),
      ],
      list: [],
    },
    {
      id: "changes",
      heading: t("6. การเปลี่ยนแปลงเงื่อนไข", "6. Changes to these terms"),
      paragraphs: [
        t(
          "เราขอสงวนสิทธิ์ในการแก้ไขหรือเปลี่ยนแปลงเงื่อนไขการให้บริการได้ทุกเมื่อ โดยจะแจ้งให้ทราบผ่านทางเว็บไซต์ การใช้งานเว็บไซต์หลังมีการเปลี่ยนแปลงถือเป็นการยอมรับเงื่อนไขที่แก้ไขแล้ว",
          "We may amend these terms at any time and will announce changes on the website. Using the website after a change means you accept the amended terms.",
        ),
      ],
      list: [],
    },
    {
      id: "data-collection",
      heading: t("7. การเก็บรวบรวมข้อมูล", "7. Data we collect"),
      paragraphs: [
        t(
          "เราอาจเก็บข้อมูลส่วนบุคคลของท่าน เช่น ชื่อ อีเมล หมายเลขโทรศัพท์ หรือข้อมูลอื่น ๆ ที่ท่านให้ไว้โดยสมัครใจผ่านแบบฟอร์มลงทะเบียนหรือการติดต่อสอบถาม เพื่อใช้ติดต่อกลับหรือให้บริการตามที่ท่านร้องขอ",
          "We may collect personal data you choose to give us, such as your name, email address, phone number or other details, through registration forms or enquiries, to contact you back or provide the service you asked for.",
        ),
        t(
          "เมื่อท่านส่งแบบฟอร์มขอให้ติดต่อกลับ เราเก็บชื่อ เบอร์โทร จังหวัดและพื้นที่ บริการหรือแพ็กเกจที่สนใจ ช่วงเวลาที่สะดวก และรายละเอียดที่ท่านกรอก เพื่อโทรกลับ ตรวจพื้นที่ให้บริการ และแนะนำบริการตามที่ท่านขอ เราเก็บข้อมูลเหล่านี้ไว้จนครบ 1 ปีหลังปิดคำขอ แล้วลบข้อมูลที่ระบุตัวท่านได้ คงไว้เฉพาะสถิติที่ไม่ระบุตัวบุคคล",
          "When you send the call-back form, we keep your name, phone number, province and area, the service or package you are interested in, the time that suits you and any details you add, to call you back, check service in your area and advise you as you asked. We keep these details until one year after your request is closed, then delete what identifies you and keep only statistics that do not.",
        ),
      ],
      list: [],
    },
    {
      id: "cookies",
      heading: t("8. การเก็บและใช้งานคุกกี้ (Cookies)", "8. Cookies"),
      paragraphs: [
        t("เราอาจใช้คุกกี้และเทคโนโลยีที่คล้ายกันเพื่อ", "We may use cookies and similar technologies to:"),
        t(
          "หากคุกกี้เหล่านี้เก็บข้อมูลที่อาจระบุตัวตน หรือใช้ในเชิงการตลาด/โฆษณา เราจะแจ้งให้ท่านทราบและขอความยินยอมตามที่กฎหมายกำหนด ท่านสามารถปฏิเสธหรือลบคุกกี้ได้จากการตั้งค่าเบราว์เซอร์ของท่าน",
          "If these cookies collect data that could identify you, or are used for marketing or advertising, we will tell you and ask for your consent as the law requires. You can refuse or delete cookies in your browser settings.",
        ),
        t(
          "เว็บไซต์ใช้คุกกี้วิเคราะห์การใช้งาน (Google Analytics) คุกกี้โฆษณา (Google Ads) และแชตสด (Tawk) ก็ต่อเมื่อท่านยินยอมผ่านแถบคุกกี้ ท่านเปลี่ยนหรือถอนความยินยอมได้ทุกเมื่อที่ “ตั้งค่าคุกกี้” ท้ายหน้าเว็บ",
          "The website uses analytics cookies (Google Analytics), advertising cookies (Google Ads) and live chat (Tawk) only after you agree in the cookie banner. You can change or withdraw your consent at any time under “Cookie settings” at the bottom of each page.",
        ),
      ],
      list: [
        t("8.1 จดจำการตั้งค่าหรือ session ของผู้ใช้", "8.1 Remember your settings or session."),
        t("8.2 วิเคราะห์สถิติการใช้งาน (เช่น ผ่าน Google Analytics)", "8.2 Analyse usage statistics (for example with Google Analytics)."),
        t(
          "8.3 รองรับการทำงานของปลั๊กอินหรือบริการจากบุคคลภายนอก (เช่น Meta Messenger)",
          "8.3 Support plug-ins or services from third parties (for example Meta Messenger).",
        ),
      ],
    },
    {
      id: "tawk",
      heading: t("9. การเชื่อมต่อกับ Tawk Live Chat", "9. Tawk live chat"),
      paragraphs: [
        t(
          "เว็บไซต์ของเราอาจใช้ปลั๊กอินหรือ API ของ Tawk Live Chat เพื่อให้ท่านสื่อสารและติดต่อสอบถามได้สะดวกขึ้น เมื่อท่านใช้ฟีเจอร์ดังกล่าว ข้อมูลบางส่วน เช่น ข้อความหรือรหัสผู้ใช้ อาจถูกส่งไปยัง Tawk.to ตามเงื่อนไขการใช้บริการและนโยบายความเป็นส่วนตัวของ Tawk.to (https://www.tawk.to/privacy-policy/) หากท่านไม่ต้องการให้มีการประมวลผลข้อมูลผ่าน Tawk Live Chat กรุณาไม่ใช้บริการดังกล่าว",
          "Our website may use the Tawk live chat plug-in or API so you can message us more easily. When you use it, some data, such as your messages or a user ID, may be sent to Tawk.to under its terms of service and privacy policy (https://www.tawk.to/privacy-policy/). If you do not want your data processed through Tawk, please do not use the chat.",
        ),
      ],
      list: [],
    },
    {
      id: "disclosure",
      heading: t("10. การเปิดเผยข้อมูลให้บุคคลภายนอก", "10. Sharing data with third parties"),
      paragraphs: [
        t(
          "เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก เว้นแต่",
          "We will not disclose your personal data to third parties unless:",
        ),
      ],
      list: [
        t("10.1 ได้รับความยินยอมจากท่าน", "10.1 You have given your consent."),
        t("10.2 เป็นคำสั่งหรือข้อบังคับทางกฎหมาย", "10.2 The law or a legal order requires it."),
        t(
          "10.3 จำเป็นต่อการดำเนินงานของบริการภายนอกที่เกี่ยวข้อง (เช่น บริการชำระเงิน ผู้ให้บริการ Messenger)",
          "10.3 It is needed to run a related outside service (for example payment services or messaging providers).",
        ),
      ],
    },
    {
      id: "your-rights",
      heading: t("11. สิทธิ์ของท่านเกี่ยวกับข้อมูลส่วนบุคคล", "11. Your rights over your personal data"),
      paragraphs: [
        t(
          "ท่านมีสิทธิ์ขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลของท่าน หากกฎหมายในเขตอำนาจของท่านรองรับ หากต้องการใช้สิทธิ์ดังกล่าว กรุณาติดต่อเราผ่านช่องทางที่ระบุในเว็บไซต์",
          "You may ask to access, correct or delete your personal data where the law that applies to you allows it. To do so, contact us through the channels on this website.",
        ),
      ],
      list: [],
    },
    {
      id: "contact",
      heading: t("12. การติดต่อ", "12. Contact"),
      paragraphs: [
        t(
          "หากท่านมีคำถามเกี่ยวกับเงื่อนไขการให้บริการหรือนโยบายความเป็นส่วนตัว ติดต่อได้ที่อีเมล Truetelemart@hotmail.com หรือโทร 091-019-2552 ในเวลาทำการ",
          "If you have questions about these terms or our privacy policy, email Truetelemart@hotmail.com or call 091-019-2552 during business hours.",
        ),
      ],
      list: [],
    },
  ],
  disclaimer: t(
    "ฉบับภาษาอังกฤษแปลจากฉบับภาษาไทย หากข้อความสองฉบับขัดกัน ให้ถือฉบับภาษาไทยเป็นหลัก",
    "The English version is a translation of the Thai text. If the two differ, the Thai version applies.",
  ),
};
