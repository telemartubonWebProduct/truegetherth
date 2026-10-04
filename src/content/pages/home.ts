import type { Cta, HomePage, LinkTarget } from "@/lib/content/schema";

import { t } from "../catalog/helpers";
import type { MediaId } from "../media";

const page = (path: string, hash?: string): LinkTarget => (hash ? { kind: "page", path, hash } : { kind: "page", path });

const promo = (packageId: string, image: MediaId) => ({ id: packageId, packageId, image });

const interested = (id: string): Cta => ({
  id,
  label: t("สนใจแพ็กเกจนี้", "I'm interested"),
  target: { kind: "contact", channel: "line-sales" },
  style: "primary",
});

// The home page (docs/renovation/R5-LANDING.md): the opening with the router
// and the robot arm, then five sections the scroll moves through, a price
// table and the questions. The copy is the old site's, as the owner had it;
// it is draft copy for the owner to edit in the back office.
export const home: HomePage = {
  id: "home",
  path: "/",
  seo: {
    title: t("เน็ตบ้านทรู เน็ตมือถือ และโซลาร์เซลล์", "True home internet, mobile and solar"),
    description: t(
      "เทียบแพ็กเกจเน็ตบ้านทรูสำหรับลูกค้าใหม่และลูกค้าปัจจุบัน แพ็กเสริมมือถือ และโซลาร์เซลล์ W&W Energy เจ้าหน้าที่ช่วยเลือกและตรวจพื้นที่ติดตั้งให้",
      "Compare True home internet for new and current customers, mobile add-ons and W&W Energy solar. Our team helps you choose and checks installation at your address.",
    ),
  },
  hero: {
    eyebrow: t("รับเรื่องจากทุกจังหวัด", "We take requests from every province"),
    heading: [t("เลือกเน็ตบ้านที่เหมาะ", "Home internet that fits"), t("กับทุกวันของคุณ", "your every day")],
    primaryCta: {
      id: "hero-broadband",
      label: t("ดูแพ็กเกจเน็ตบ้าน", "See home internet packages"),
      target: page("/broadband"),
      style: "primary",
    },
    secondaryCta: {
      id: "hero-contact",
      label: t("ติดต่อเจ้าหน้าที่", "Talk to our team"),
      target: page("/service"),
      style: "secondary",
    },
    tags: [
      { id: "hero-tag-broadband", label: t("เน็ตบ้าน", "Home internet"), target: page("/broadband") },
      { id: "hero-tag-mobile", label: t("เน็ตมือถือ", "Mobile"), target: page("/monthy") },
      { id: "hero-tag-solar", label: t("โซลาร์เซลล์", "Solar"), target: page("/wEnergy") },
    ],
    visual: "hero-router-still",
    visualNote: t("ภาพจำลอง 3 มิติและภาพประกอบจาก AI ไม่ใช่ภาพถ่ายอุปกรณ์จริง", "3D model and AI illustration, not a photograph of the actual equipment"),
  },
  manifesto: {
    label: t("เครือข่าย", "The network"),
    sentence: t(
      "ไฟเบอร์จากเครือข่ายทรู ตรงถึงบ้านคุณ เลือกความเร็วตามการใช้งานของบ้าน ทั้งดูซีรีส์ ทำงาน และเล่นเกม",
      "Fibre from the True network, all the way to your home. Pick the speed your home needs for streaming, working and gaming.",
    ),
  },
  promos: {
    label: t("แพ็กเกจที่เราแนะนำ", "Packages we recommend"),
    heading: t("โปรแนะนำ", "Recommended packages"),
    description: t("เลือกหมวด แล้วเลื่อนลงเพื่อดูแพ็กเกจถัดไป", "Pick a category, then keep scrolling to walk along the row"),
    // Packages straight from the catalog; the cards show their price and terms as the catalog has them.
    tabs: [
      {
        id: "broadband",
        title: t("เน็ตบ้าน", "Home internet"),
        items: [
          promo("fiber-500-499", "flow-s2-work-from-home"),
          promo("fiber-700-599", "flow-s1-family-streaming"),
          promo("fiber-1g-799", "flow-s3-gamer"),
          promo("fiber-500-650-cctv", "flow-s6-technician"),
          promo("fiber-500-999-netflix", "flow-s5-friends-phone"),
          promo("fiber-1500-1199", "flow-s8-fibre"),
        ],
        packageCta: interested("home-package-interest"),
        viewAll: {
          id: "home-all-broadband",
          label: t("ดูแพ็กเกจเน็ตบ้านทั้งหมด", "See all home internet packages"),
          target: page("/broadband"),
          style: "secondary",
        },
      },
      {
        id: "monthly",
        title: t("มือถือรายเดือน", "Postpaid mobile"),
        items: [
          promo("m-boost-60gb", "flow-s4-mobile-city"),
          promo("m-unlimited-7d", "flow-s8-fibre"),
          promo("m-social-4-apps", "flow-s5-friends-phone"),
          promo("m-asian-combo-179", "flow-s1-family-streaming"),
          promo("m-up2u-true-coffee", "flow-s2-work-from-home"),
          promo("m-call-200", "flow-s7-support"),
        ],
        remark: t("แพ็กเสริมสำหรับลูกค้ามือถือรายเดือน", "Add-ons for postpaid mobile customers"),
        packageCta: interested("home-monthly-interest"),
        viewAll: {
          id: "home-all-monthly",
          label: t("ดูแพ็กเสริมรายเดือนทั้งหมด", "See all postpaid add-ons"),
          target: page("/monthy"),
          style: "secondary",
        },
      },
      {
        id: "prepaid",
        title: t("เติมเงิน", "Prepaid"),
        items: [
          promo("p-net-20mbps", "flow-s4-mobile-city"),
          promo("p-net-10mbps", "flow-s8-fibre"),
          promo("p-net-call-6mbps", "flow-s5-friends-phone"),
          promo("p-call-200", "flow-s7-support"),
          promo("p-game-prohub", "flow-s3-gamer"),
        ],
        remark: t("แพ็กเสริมสำหรับลูกค้ามือถือเติมเงิน", "Add-ons for prepaid mobile customers"),
        packageCta: interested("home-prepaid-interest"),
        viewAll: {
          id: "home-all-prepaid",
          label: t("ดูแพ็กเสริมเติมเงินทั้งหมด", "See all prepaid add-ons"),
          target: page("/topup"),
          style: "secondary",
        },
      },
      {
        id: "solar",
        title: t("โซลาร์เซลล์", "Solar"),
        items: [
          promo("solar-3kwp", "solar-rooftop"),
          promo("solar-5kwp", "solar-aerial"),
          promo("solar-10kwp", "solar-rooftop"),
        ],
        remark: t("บริการของ W&W Energy แยกจากแพ็กเกจของทรู", "A W&W Energy service, separate from True's packages"),
        packageCta: {
          id: "home-solar-interest",
          label: t("สอบถามแพ็กเกจนี้", "Ask about this package"),
          target: { kind: "contact", channel: "line-sales" },
          style: "primary",
        },
        viewAll: {
          id: "home-all-solar",
          label: t("ดูรายละเอียดโซลาร์เซลล์", "See solar details"),
          target: page("/wEnergy", "solar"),
          style: "secondary",
        },
      },
    ],
  },
  steps: {
    label: t("ขั้นตอนสมัคร", "How it works"),
    heading: t("ให้เราช่วยเลือก แล้วนัดติดตั้งถึงบ้าน", "We help you choose, then book the installation"),
    description: t(
      "ทักทาง LINE หรือโทรหาเรา เจ้าหน้าที่ตรวจพื้นที่ตามที่อยู่ของคุณ แล้วติดต่อกลับเพื่อยืนยัน",
      "Message us on LINE or call. We check installation at your address, then contact you to confirm.",
    ),
    items: [
      {
        id: "choose",
        title: t("เลือกบริการ", "Choose a service"),
        description: t("เทียบแพ็กเกจแล้วเลือกแบบที่ตรงกับการใช้งาน", "Compare the packages and pick the one that fits."),
      },
      {
        id: "get-in-touch",
        title: t("ฝากข้อมูล", "Get in touch"),
        description: t("ทัก LINE หรือโทร พร้อมบอกพื้นที่ที่ต้องการติดตั้ง", "Message us on LINE or call, and tell us where you need it."),
      },
      {
        id: "area-check",
        title: t("ตรวจพื้นที่", "Area check"),
        description: t("เจ้าหน้าที่ตรวจพื้นที่ติดตั้งตามที่อยู่ของคุณ", "Our team checks installation at your address."),
      },
      {
        id: "book",
        title: t("นัดติดตั้ง", "Installation booked"),
        description: t("ติดต่อกลับเพื่อยืนยัน แล้วนัดวันติดตั้งกับคุณ", "We call back to confirm and book a date with you."),
      },
    ],
    slip: {
      title: t("ใบนัดติดตั้ง", "Installation slip"),
      caption: t("ตัวอย่างขั้นตอน", "Example"),
      service: { label: t("บริการ", "Service"), value: t("เน็ตบ้าน", "Home internet") },
      area: { label: t("พื้นที่ติดตั้ง", "Area check"), waiting: t("รอตรวจ", "To be checked"), done: t("ตรวจแล้ว", "Checked") },
      booking: { label: t("นัดติดตั้ง", "Installation"), waiting: t("รอนัด", "To be booked"), done: t("นัดวันแล้ว", "Booked") },
      statusLabel: t("สถานะ", "Status"),
      statuses: [
        t("รอเริ่มคำขอ", "Waiting to start"),
        t("เลือกบริการแล้ว", "Service chosen"),
        t("ได้รับข้อมูลติดต่อ", "Details received"),
        t("เจ้าหน้าที่ตรวจพื้นที่แล้ว", "Area checked"),
        t("ติดต่อกลับ นัดวันติดตั้ง", "Called back, date booked"),
      ],
      tear: t("ฉีกตามรอยปรุ", "Tear along the line"),
    },
  },
  services: {
    label: t("บริการ", "Services"),
    heading: t("เลือกบริการที่ต้องการ", "What are you looking for?"),
    items: [
      {
        id: "broadband",
        title: t("เน็ตบ้าน", "Home internet"),
        description: t(
          "แพ็กเกจทรูไฟเบอร์พร้อมอุปกรณ์และสิทธิประโยชน์ ลูกค้าปัจจุบันเพิ่มสปีด กล้องวงจรปิด และบริการเสริมได้",
          "True fibre packages with equipment and benefits. Current customers can add speed, security cameras and more.",
        ),
        target: page("/broadband"),
      },
      {
        id: "mobile",
        title: t("เน็ตมือถือ", "Mobile"),
        description: t("แพ็กเสริมรายเดือนและเติมเงิน ทั้งเน็ต โทร และความบันเทิง", "Postpaid and prepaid add-ons for data, calls and entertainment."),
        target: page("/monthy"),
      },
      {
        id: "solar",
        title: t("โซลาร์เซลล์", "Rooftop solar"),
        description: t("สำรวจ ออกแบบ และติดตั้งโซลาร์เซลล์บนหลังคา", "Survey, design and rooftop installation."),
        provider: t("บริการของ W&W Energy", "A W&W Energy service"),
        target: page("/wEnergy"),
      },
    ],
  },
  prices: {
    label: t("ตารางราคา", "Price table"),
    heading: t("แพ็กเกจเน็ตบ้าน ลูกค้าใหม่", "Home internet for new customers"),
    columns: { package: t("แพ็กเกจ", "Package"), price: t("ราคา", "Price") },
    category: "broadband-new",
    group: "new-customer",
    viewAll: {
      id: "home-prices-all",
      label: t("เทียบแพ็กเกจเน็ตบ้านทั้งหมด", "Compare all home internet packages"),
      target: page("/broadband"),
      style: "secondary",
    },
  },
  faq: {
    label: t("คำถาม", "Questions"),
    heading: t("คำถามที่พบบ่อย", "Common questions"),
    items: [
      {
        id: "how-to-apply",
        question: t("สมัครเน็ตบ้านผ่านเว็บไซต์นี้อย่างไร", "How do I apply for home internet here?"),
        answer: t(
          "เลือกแพ็กเกจแล้วกด “สนใจแพ็กเกจนี้” เพื่อคุยกับเจ้าหน้าที่ทาง LINE หรือโทรหาฝ่ายขาย เจ้าหน้าที่จะสอบถามที่อยู่ ตรวจพื้นที่ติดตั้ง และนัดวันติดตั้งกับคุณ",
          "Pick a package and select “I'm interested” to chat with our team on LINE, or call our sales line. We'll ask for your address, check installation there and book a date with you.",
        ),
      },
      {
        id: "nationwide",
        question: t("รับติดตั้งทุกจังหวัดหรือไม่", "Do you install in every province?"),
        answer: t(
          "รับเรื่องจากทุกจังหวัด แต่การติดตั้งเน็ตบ้านและโซลาร์เซลล์ขึ้นกับผลตรวจพื้นที่และเงื่อนไขของแต่ละที่อยู่ เจ้าหน้าที่จะแจ้งผลก่อนยืนยันทุกครั้ง",
          "We take requests from every province, but home internet and solar installation depend on a check of each address and its conditions. We always tell you the result before confirming.",
        ),
      },
      {
        id: "existing-customers",
        question: t("เป็นลูกค้าทรูออนไลน์อยู่แล้ว เพิ่มสปีดได้ไหม", "I already have True Online. Can I get more speed?"),
        answer: t(
          "ได้ ดูแพ็กเกจเพิ่มสปีดและบริการเสริมได้ในหน้าลูกค้าปัจจุบัน บางแพ็กเกจสำหรับลูกค้าที่ใช้แพ็กเกจ 599 บาทขึ้นไป",
          "Yes. Speed boosts and add-ons are on the current-customers page. Some boosts are for customers on a 599-baht package or higher.",
        ),
      },
      {
        id: "solar-provider",
        question: t("โซลาร์เซลล์เป็นบริการของใคร", "Who provides the solar service?"),
        answer: t(
          "โซลาร์เซลล์เป็นบริการของ W&W Energy ซึ่งสำรวจ ออกแบบ และติดตั้งระบบ ราคาและเงื่อนไขแยกจากแพ็กเกจเน็ตบ้านและมือถือของทรู",
          "Solar is provided by W&W Energy, who survey, design and install the system. Its prices and terms are separate from True home internet and mobile packages.",
        ),
      },
    ],
  },
};
