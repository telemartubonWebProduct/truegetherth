import type { LinkTarget, SiteSettings } from "@/lib/content/schema";
import { defaultTheme } from "@/lib/content/theme";

import { t } from "./catalog/helpers";

const page = (path: string, hash?: string): LinkTarget => (hash ? { kind: "page", path, hash } : { kind: "page", path });

// Contact details come from the old footer, service page and package buttons.
// The old site used two LINE links: package buttons opened lineSales and the
// service page opened lineService. Which account is @341tmfte is unconfirmed.
export const site: SiteSettings = {
  brand: {
    name: t("truegetherth", "truegetherth"),
    legalName: t("บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด", "Telemart Communication Co., Ltd."),
    logo: "truegetherth-logo",
  },
  contact: {
    lineSales: "https://lin.ee/blqnOJow",
    lineService: "https://lin.ee/eMhqQpj",
    lineId: "@341tmfte",
    lineQr: "line-qr",
    phones: [
      { number: "0910192552", label: t("ฝ่ายขาย", "Sales") },
      { number: "0902518964", label: t("ฝ่ายขาย", "Sales") },
      { number: "0841041506", label: t("ฝ่ายขาย", "Sales") },
    ],
    email: "Truetelemart@hotmail.com",
    facebook: "https://www.facebook.com/profile.php?id=61571963492436",
  },
  navigation: [
    {
      id: "home-internet",
      label: t("เน็ตบ้าน", "Home internet"),
      children: [
        { id: "broadband-new", label: t("ลูกค้าใหม่", "New customers"), target: page("/broadband") },
        { id: "broadband-existing", label: t("ลูกค้าปัจจุบัน", "Current customers"), target: page("/broadband-old") },
        { id: "apply-with-agent", label: t("สมัครผ่านเจ้าหน้าที่", "Apply through our team"), target: page("/wifiService") },
      ],
    },
    {
      id: "mobile",
      label: t("เน็ตมือถือ", "Mobile"),
      children: [
        { id: "mobile-monthly", label: t("รายเดือน", "Postpaid"), target: page("/monthy") },
        { id: "mobile-prepaid", label: t("เติมเงิน", "Prepaid"), target: page("/topup") },
      ],
    },
    { id: "solar", label: t("โซลาร์เซลล์", "Solar"), target: page("/wEnergy") },
    { id: "contact", label: t("ติดต่อเรา", "Contact"), target: page("/service") },
  ],
  headerCta: {
    id: "header-contact",
    label: t("ติดต่อเจ้าหน้าที่", "Talk to our team"),
    target: page("/service"),
    style: "primary",
  },
  footer: {
    // Who runs the site, as the owner states it (2026-10-11): an official True partner, not True itself.
    about: t(
      "truegetherth ดำเนินงานโดย บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด (Telemart) พาร์ทเนอร์อย่างเป็นทางการของทรู รับสมัครและประสานงานติดตั้งเน็ตบ้านทรูจากทุกจังหวัด เราไม่ใช่ทรู และไม่ใช่ผู้ให้บริการเครือข่าย",
      "truegetherth is run by Telemart Communication Co., Ltd. (Telemart), an official True partner. We take applications for True home internet and arrange installation, wherever you are in Thailand. We are not True and not the network operator.",
    ),
    groups: [
      {
        id: "services",
        heading: t("บริการ", "Services"),
        links: [
          { id: "footer-broadband-new", label: t("เน็ตบ้านลูกค้าใหม่", "Home internet for new customers"), target: page("/broadband") },
          { id: "footer-broadband-existing", label: t("เน็ตบ้านลูกค้าปัจจุบัน", "Home internet for current customers"), target: page("/broadband-old") },
          { id: "footer-mobile-monthly", label: t("เน็ตมือถือรายเดือน", "Postpaid mobile"), target: page("/monthy") },
          { id: "footer-mobile-prepaid", label: t("เน็ตมือถือเติมเงิน", "Prepaid mobile"), target: page("/topup") },
          { id: "footer-solar", label: t("โซลาร์เซลล์ W&W Energy", "W&W Energy solar"), target: page("/wEnergy") },
        ],
      },
      {
        id: "help",
        heading: t("ช่วยเหลือ", "Help"),
        links: [
          { id: "footer-contact", label: t("ติดต่อเรา", "Contact us"), target: page("/service") },
          { id: "footer-apply-with-agent", label: t("สมัครผ่านเจ้าหน้าที่", "Apply through our team"), target: page("/wifiService") },
          { id: "footer-terms", label: t("ข้อตกลงและนโยบายความเป็นส่วนตัว", "Terms and privacy policy"), target: page("/termsAndPrivacy") },
          {
            id: "footer-staff-system",
            label: t("ระบบจัดการสำหรับเจ้าหน้าที่", "Staff management system"),
            target: { kind: "external", url: "https://www.telemartmanagement.com/" },
          },
        ],
      },
    ],
    copyright: t("บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด สงวนลิขสิทธิ์", "Telemart Communication Co., Ltd. All rights reserved."),
  },
  contactBand: {
    heading: t("คุยกับเจ้าหน้าที่", "Talk to our team"),
    description: t(
      "ถามเรื่องแพ็กเกจหรือให้ช่วยเลือกได้ทาง LINE และโทรศัพท์ รับเรื่องจากทุกจังหวัด เจ้าหน้าที่ตรวจพื้นที่ติดตั้งตามที่อยู่ของคุณก่อนยืนยัน",
      "Ask about packages or get help choosing on LINE or by phone. We take requests from every province and check installation at your address before confirming.",
    ),
    tone: "ink",
  },
  // The call-back form (M5). Its fields, the provinces and the request's
  // statuses are fixed; only the words change.
  leadForm: {
    name: t("ชื่อ", "Name"),
    phone: t("เบอร์โทร", "Phone number"),
    phoneHint: t("เจ้าหน้าที่จะโทรกลับที่เบอร์นี้", "We call you back on this number."),
    province: t("จังหวัด", "Province"),
    provincePlaceholder: t("เลือกจังหวัด", "Choose a province"),
    area: t("อำเภอหรือรหัสไปรษณีย์", "District or postcode"),
    areaHint: t("เช่น วารินชำราบ หรือ 34190 ช่วยให้ตรวจพื้นที่ติดตั้งได้เร็วขึ้น", "Such as Warin Chamrap or 34190. Helps us check installation in your area sooner."),
    service: t("สนใจบริการ", "Interested in"),
    services: {
      broadband: t("เน็ตบ้าน", "Home internet"),
      mobile: t("เน็ตมือถือ", "Mobile"),
      solar: t("โซลาร์เซลล์", "Solar"),
      other: t("อื่นๆ หรือยังไม่แน่ใจ", "Something else, or not sure"),
    },
    package: t("แพ็กเกจที่สนใจ", "Package"),
    packageRemove: t("ไม่ระบุแพ็กเกจ", "Remove the package"),
    time: t("ช่วงเวลาที่สะดวกให้โทรกลับ", "Best time to call you"),
    times: {
      anytime: t("เวลาใดก็ได้", "Any time"),
      morning: t("ช่วงเช้า", "Morning"),
      afternoon: t("ช่วงบ่าย", "Afternoon"),
      evening: t("ช่วงเย็น", "Evening"),
    },
    message: t("รายละเอียดเพิ่มเติม", "Anything else we should know"),
    optional: t("ไม่บังคับ", "optional"),
    consent: t(
      "ฉันยินยอมให้ truegetherth เก็บและใช้ข้อมูลนี้เพื่อติดต่อกลับเรื่องที่ขอ ตาม",
      "I agree that truegetherth may keep and use these details to call me back about this request, under its",
    ),
    policyLink: t("นโยบายความเป็นส่วนตัว", "privacy policy"),
    submit: t("ขอให้เจ้าหน้าที่ติดต่อกลับ", "Ask us to call you back"),
    sending: t("กำลังส่ง…", "Sending…"),
    successHeading: t("ได้รับคำขอแล้ว", "We have your request"),
    successBody: t(
      "เจ้าหน้าที่จะโทรกลับในช่วงเวลาที่คุณสะดวก เพื่อตรวจพื้นที่และแนะนำแพ็กเกจที่เหมาะ ถ้าอยากคุยเร็วกว่านั้น ทัก LINE หรือโทรหาเราได้เลย",
      "Our team will call you at the time you chose to check your area and suggest a package. To talk sooner, message us on LINE or call.",
    ),
    another: t("ส่งคำขออีกครั้ง", "Send another request"),
    errors: {
      required: t("กรุณากรอกหรือเลือกข้อมูลนี้", "Please fill in or choose this."),
      phone: t("กรอกเบอร์โทร 9–10 หลัก ขึ้นต้นด้วย 0 เช่น 0812345678", "Enter a 9–10 digit Thai number starting with 0, such as 0812345678."),
      consent: t("กรุณายินยอม เพื่อให้เจ้าหน้าที่ติดต่อกลับได้", "Please agree, so we can call you back."),
      tooLong: t("ข้อความยาวเกินไป", "This is too long."),
      rateLimited: t(
        "ส่งคำขอบ่อยเกินไป กรุณาลองใหม่ในอีกสักครู่ หรือทัก LINE หรือโทรหาเรา",
        "Too many requests from here. Please try again in a few minutes, or message us on LINE or call.",
      ),
      failed: t("ส่งไม่สำเร็จ กรุณาลองอีกครั้ง หรือทัก LINE หรือโทรหาเรา", "Your request did not go through. Please try again, or message us on LINE or call."),
      unavailable: t(
        "ตอนนี้ยังส่งคำขอทางเว็บไม่ได้ ทัก LINE หรือโทรหาเรา แล้วเจ้าหน้าที่จะติดต่อกลับ",
        "Requests through the website are not available right now. Message us on LINE or call, and we will get back to you.",
      ),
      preview: t("ตัวอย่างในหน้าแก้ไข: แบบฟอร์มนี้ไม่ส่งจริง", "Editor preview: this form does not send."),
    },
  },
  // Cookie banner (PDPA): analytics and advertising load only after the
  // visitor agrees. policyVersion is also recorded with each call-back request.
  consent: {
    policyVersion: "2026-10-02",
    heading: t("เว็บไซต์นี้ใช้คุกกี้", "This website uses cookies"),
    body: t(
      "เราใช้คุกกี้ที่จำเป็นเพื่อให้เว็บทำงาน และขอความยินยอมก่อนใช้คุกกี้วิเคราะห์การใช้งานและโฆษณา เปลี่ยนใจได้ทุกเมื่อที่ “ตั้งค่าคุกกี้” ท้ายหน้าเว็บ",
      "We use necessary cookies to run the site, and ask before using cookies for analytics and advertising. You can change your mind any time under “Cookie settings” at the bottom of each page.",
    ),
    policyLink: t("อ่านนโยบายความเป็นส่วนตัว", "Read our privacy policy"),
    acceptAll: t("ยอมรับทั้งหมด", "Accept all"),
    rejectAll: t("ใช้เฉพาะที่จำเป็น", "Necessary only"),
    customize: t("เลือกเอง", "Choose"),
    save: t("บันทึกที่เลือก", "Save my choices"),
    necessaryTitle: t("จำเป็น", "Necessary"),
    necessaryBody: t("ให้เว็บทำงาน และจำการเลือกนี้ไว้", "Keep the site working and remember these choices."),
    alwaysOn: t("เปิดเสมอ", "Always on"),
    analyticsTitle: t("วิเคราะห์การใช้งาน", "Analytics"),
    analyticsBody: t("นับผู้เข้าชมและหน้าที่ดูด้วย Google Analytics เพื่อปรับปรุงเว็บ", "Count visits and pages viewed with Google Analytics, to improve the site."),
    adsTitle: t("โฆษณา", "Advertising"),
    adsBody: t("วัดผลโฆษณาของเราบน Google ด้วย Google Ads", "Measure our ads on Google with Google Ads."),
    settingsLink: t("ตั้งค่าคุกกี้", "Cookie settings"),
  },
  ui: {
    skipToContent: t("ข้ามไปยังเนื้อหา", "Skip to content"),
    menu: t("เมนู", "Menu"),
    mainNavigation: t("เมนูหลัก", "Main"),
    languageSwitch: t("เปลี่ยนภาษา", "Change language"),
    speed: t("ความเร็ว ดาวน์โหลด/อัปโหลด", "Speed, download/upload"),
    audience: t("เหมาะกับ", "For"),
    allowance: t("การใช้งาน", "Includes"),
    validity: t("ระยะเวลา", "Valid for"),
    contract: t("สัญญา", "Contract"),
    benefits: t("สิทธิประโยชน์", "Benefits"),
    details: t("รายละเอียด", "Details"),
    conditions: t("เงื่อนไข", "Conditions"),
    dialCode: t("กดสมัคร", "Dial to subscribe"),
    perMonth: t("บาท/เดือน", "THB a month"),
    baht: t("บาท", "THB"),
    vatExcluded: t("ไม่รวม VAT", "Excludes VAT"),
    vatIncluded: t("รวม VAT แล้ว", "Includes VAT"),
    regularPrice: t("ราคาปกติ", "Regular price"),
    offerPrice: t("ราคาเสนอ", "Offer price"),
    emptyGroup: t(
      "หมวดนี้ยังไม่มีแพ็กเกจที่ตรวจข้อมูลแล้ว สอบถามแพ็กเกจล่าสุดกับเจ้าหน้าที่ได้",
      "No checked packages in this category yet. Ask our team for the latest offers.",
    ),
    jumpTo: t("ไปยังหมวด", "Jump to"),
    contents: t("หัวข้อในหน้านี้", "On this page"),
    call: t("โทร", "Call"),
    email: t("อีเมล", "Email"),
    chatOnLine: t("แชตทาง LINE", "Chat on LINE"),
    lineId: t("ไลน์ไอดี", "LINE ID"),
    facebook: t("เฟซบุ๊ก", "Facebook"),
    opensInNewTab: t("เปิดในแท็บใหม่", "opens in a new tab"),
    footerContact: t("ติดต่อ", "Contact"),
    packageDetails: t("ดูรายละเอียด", "See details"),
    recommended: t("แนะนำ", "Recommended"),
    findPackage: t("ค้นหาแพ็กเกจ", "Find a package"),
    filterSpeed: t("ความเร็ว", "Speed"),
    filterPrice: t("ราคาไม่เกิน", "Price up to"),
    filterBenefit: t("มีสิทธิประโยชน์", "With"),
    filterAny: t("ทั้งหมด", "Any"),
    sortBy: t("เรียงตาม", "Sort by"),
    sortRecommended: t("แนะนำ", "Recommended"),
    sortPriceLow: t("ราคาต่ำไปสูง", "Price, low to high"),
    sortPriceHigh: t("ราคาสูงไปต่ำ", "Price, high to low"),
    sortSpeed: t("เร็วที่สุดก่อน", "Fastest first"),
    resultCount: t("แสดง {shown} จาก {total} แพ็กเกจ", "Showing {shown} of {total} packages"),
    clearFilters: t("ล้างตัวกรอง", "Clear filters"),
    noMatches: t("ไม่มีแพ็กเกจในหมวดนี้ที่ตรงกับตัวกรอง", "No package in this section matches your filters."),
    compareAdd: t("เปรียบเทียบ", "Compare"),
    compareChosen: t("เลือกเปรียบเทียบ {count} จาก 3", "{count} of 3 chosen to compare"),
    compareOpen: t("เปรียบเทียบแพ็กเกจ", "Compare packages"),
    compareMore: t("เลือกอีกอย่างน้อย 1 แพ็กเกจเพื่อเปรียบเทียบ", "Choose at least one more package to compare"),
    compareLimit: t("เปรียบเทียบได้ครั้งละไม่เกิน 3 แพ็กเกจ", "You can compare up to 3 packages at a time"),
    compareClear: t("ล้างที่เลือก", "Clear"),
    close: t("ปิด", "Close"),
    breadcrumb: t("ตำแหน่งของหน้านี้", "You are here"),
    homeLink: t("หน้าแรก", "Home"),
    unverifiedNote: t("ราคาและเงื่อนไขมาจากข้อมูลเดิมของร้าน อาจไม่ใช่ข้อมูลล่าสุด กรุณายืนยันกับเจ้าหน้าที่ก่อนสมัคร", "This price and these terms come from our earlier listings and may not be current. Please confirm with our team before you sign up."),
    packageContactNote: t("ทัก LINE หรือโทรหาเรา เจ้าหน้าที่จะตรวจพื้นที่และติดต่อกลับเพื่อยืนยันการสมัคร", "Message us on LINE or call. We check your area and get back to you to confirm."),
    callSales: t("โทรหาฝ่ายขาย", "Call our sales team"),
    requestCallback: t("ขอให้เจ้าหน้าที่โทรกลับ", "Ask us to call you back"),
  },
  seo: {
    siteName: t("truegetherth", "truegetherth"),
    description: t(
      "แพ็กเกจเน็ตบ้านทรู เน็ตมือถือ และโซลาร์เซลล์ W&W Energy คุยกับเจ้าหน้าที่ทาง LINE หรือโทรได้จากทุกจังหวัด",
      "True home internet, mobile packages and W&W Energy solar. Talk to our team on LINE or by phone from any province in Thailand.",
    ),
    // Shown when a page is shared on LINE or Facebook; pages can set their own.
    image: "og-image",
  },
  theme: defaultTheme,
  integrations: {
    googleAdsId: "AW-18007307609",
    // The owner's GA4 property (web stream tag sent 2 Oct 2026).
    ga4MeasurementId: "G-DQGCC5J4YM",
    googleAdsHomeConversion: "AW-18007307609/51JQCLqnuIYcENnqxopD",
  },
};
