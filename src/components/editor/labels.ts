import { decodeBinding, getAt } from "@/lib/content/paths";
import type { DocumentId, PageDocumentId } from "@/lib/content/documents";
import { readDocument } from "@/lib/content/documents";
import type { LocalizedText, SiteContent } from "@/lib/content/schema";

// Thai names for what Admins see in the Mirror editor. A field without a name
// here falls back to its key, so a new schema field is still editable.

export const pageLabels: Record<PageDocumentId, string> = {
  home: "หน้าแรก",
  "broadband-new": "เน็ตบ้าน ลูกค้าใหม่",
  "broadband-existing": "เน็ตบ้าน ลูกค้าเดิม",
  "mobile-monthly": "มือถือรายเดือน",
  "mobile-prepaid": "มือถือเติมเงิน",
  solar: "โซลาร์เซลล์",
  contact: "ติดต่อเรา",
  "apply-with-agent": "สมัครผ่านตัวแทน",
  terms: "ข้อตกลงและนโยบาย",
};

const labels: Record<string, string> = {
  heading: "หัวเรื่อง",
  description: "คำอธิบาย",
  title: "ชื่อ",
  name: "ชื่อ",
  note: "ข้อความเล็กใต้ปุ่ม",
  notes: "หมายเหตุท้ายหมวด",
  label: "ข้อความ",
  target: "ปลายทาง",
  style: "รูปแบบปุ่ม",
  tone: "พื้นหลังของส่วนนี้",
  image: "รูป",
  images: "รูปประกอบ",
  visual: "ภาพหลัก",
  visualNote: "คำบรรยายใต้ภาพ",
  primaryCta: "ปุ่มหลัก",
  secondaryCta: "ปุ่มรอง",
  cta: "ปุ่ม",
  packageCta: "ปุ่มของแต่ละแพ็กเกจ",
  viewAll: "ปุ่มดูทั้งหมด",
  headerCta: "ปุ่มมุมขวาของแถบเมนู",
  items: "รายการ",
  question: "คำถาม",
  answer: "คำตอบ",
  provider: "ผู้ให้บริการ",
  icon: "ไอคอน",
  audience: "เหมาะกับ",
  speed: "ความเร็ว",
  download: "ดาวน์โหลด",
  upload: "อัปโหลด",
  value: "ค่า",
  unit: "หน่วย",
  allowance: "การใช้งาน",
  validity: "ระยะเวลา",
  contract: "สัญญา",
  price: "ราคา",
  amount: "ราคาเสนอ (บาท)",
  regularAmount: "ราคาปกติ (บาท)",
  per: "คิดราคา",
  vat: "VAT",
  benefits: "สิทธิประโยชน์",
  hiddenBenefits: "สิทธิประโยชน์ที่ซ่อนไว้",
  details: "รายละเอียด",
  conditions: "เงื่อนไข",
  dialCode: "รหัสกดสมัคร",
  review: "การตรวจข้อมูลโดยธุรกิจ",
  status: "สถานะ",
  alt: "คำอธิบายรูป (alt)",
  seo: "การค้นหาและการแชร์ (SEO)",
  noindex: "ไม่ให้ search engine แสดงหน้านี้",
  body: "เนื้อหา",
  paragraphs: "ย่อหน้า",
  list: "รายการย่อย",
  disclaimer: "หมายเหตุฉบับแปล",
  intro: "คำนำ",
  sections: "หมวด",
  groups: "กลุ่มแพ็กเกจ",
  packageIds: "แพ็กเกจที่แสดง",
  columns: "คอลัมน์",
  links: "ลิงก์",
  overview: "ลิงก์ดูทั้งหมด",
  children: "เมนูย่อย",
  navigation: "เมนู",
  brand: "แบรนด์",
  legalName: "ชื่อนิติบุคคล",
  logo: "โลโก้",
  contact: "ช่องทางติดต่อ",
  lineSales: "ลิงก์ LINE ฝ่ายขาย",
  lineService: "ลิงก์ LINE ฝ่ายบริการ",
  lineId: "ไลน์ไอดี",
  lineQr: "รูป QR ของ LINE",
  phones: "เบอร์โทร",
  number: "เบอร์",
  email: "อีเมล",
  facebook: "ลิงก์เฟซบุ๊ก",
  office: "ที่ตั้งสำนักงานใหญ่",
  mapUrl: "ลิงก์แผนที่สำนักงาน",
  hours: "เวลาทำการ",
  footer: "ส่วนท้ายของเว็บ",
  about: "ข้อความแนะนำ",
  copyright: "ลิขสิทธิ์",
  contactBand: "แถบติดต่อท้ายหน้า",
  ui: "ข้อความของระบบ",
  theme: "สีของเว็บ",
  accent: "สีเน้น (ราคา ขีดบอกความคืบหน้า)",
  ink: "สีตัวอักษรและปุ่มหลัก",
  muted: "สีตัวอักษรรอง",
  surface: "สีพื้นเทา",
  line: "สีเส้นขอบ",
  glow: "สีเข้มรอง (จุดเน้นใต้ตัวอักษรขาว)",
  siteName: "ชื่อเว็บไซต์",
  hero: "ส่วนเปิดหน้า",
  eyebrow: "ข้อความเล็กเหนือหัวเรื่อง",
  tags: "ป้ายลิงก์ข้างหัวเรื่อง",
  manifesto: "ประโยคเด่น (ระบายสีตามการเลื่อน)",
  sentence: "ประโยค",
  slip: "ใบรับเรื่อง (ภาพประกอบขั้นตอน)",
  caption: "คำกำกับบนใบ",
  waiting: "ข้อความขณะรอ",
  done: "ข้อความเมื่อเสร็จ",
  booking: "บรรทัด นัดติดตั้ง",
  statusLabel: "คำว่า สถานะ",
  statuses: "สถานะทีละขั้น (5 ข้อความ)",
  tear: "ข้อความบนรอยปรุ",
  prices: "ตารางราคา",
  points: "จุดเด่น",
  services: "เลือกบริการ",
  promos: "โปรแนะนำ",
  tabs: "แท็บหมวด",
  packageId: "แพ็กเกจ",
  remark: "หมายเหตุใต้การ์ด",
  order: "ลำดับแพ็กเกจ",
  featured: "โปรแนะนำหน้าแรก",
  showFrom: "เริ่มแสดงวันที่",
  showUntil: "แสดงถึงวันที่",
  mobile: "แพ็กเสริมมือถือ",
  steps: "ขั้นตอน",
  solar: "โซลาร์เซลล์",
  faq: "คำถามที่พบบ่อย",
  stats: "ผลงาน",
  process: "ขั้นตอนติดตั้ง",
  packages: "แพ็กเกจ",
  bundle: "โปรร่วม",
  knowledge: "ความรู้พื้นฐาน",
  articles: "บทความ",
  channels: "ช่องทางติดต่อ",
  channel: "ช่องทาง",
  callback: "แถบขอให้ติดต่อกลับ",
  kind: "ชนิด",
  hash: "หมวดในหน้า",
  url: "ลิงก์",
  integrations: "การเชื่อมต่อ (Google Ads, แชต)",
  googleAdsId: "Google Ads ID ของแท็ก",
  ga4MeasurementId: "Google Analytics 4 (Measurement ID)",
  googleAdsLeadConversion: "Google Ads conversion เมื่อลูกค้าส่งฟอร์มหรือกดติดต่อ (send_to)",
  source: "ที่มาของข้อมูล",
  category: "หมวดสินค้า",
  group: "กลุ่ม",
  layout: "รูปแบบการ์ด",
  src: "ไฟล์",
  width: "กว้าง (px)",
  height: "สูง (px)",
  path: "ที่อยู่หน้า",
  id: "รหัส",
  leadForm: "แบบฟอร์มขอให้ติดต่อกลับ",
  phoneHint: "คำอธิบายใต้ช่องเบอร์โทร",
  province: "ป้ายช่อง จังหวัด",
  provincePlaceholder: "ตัวเลือกแรกของช่องจังหวัด",
  area: "ป้ายช่อง พื้นที่",
  areaHint: "คำอธิบายใต้ช่องพื้นที่",
  service: "หัวข้อ บริการที่สนใจ",
  broadband: "เน็ตบ้าน",
  other: "อื่นๆ",
  package: "ป้าย แพ็กเกจที่สนใจ",
  packageRemove: "ปุ่มเอาแพ็กเกจออก",
  time: "หัวข้อ ช่วงเวลาที่สะดวก",
  times: "ช่วงเวลาให้เลือก",
  anytime: "เวลาใดก็ได้",
  morning: "ช่วงเช้า",
  afternoon: "ช่วงบ่าย",
  evening: "ช่วงเย็น",
  message: "ป้ายช่อง รายละเอียดเพิ่มเติม",
  optional: "คำว่า ไม่บังคับ",
  submit: "ปุ่มส่ง",
  sending: "ปุ่มส่งขณะกำลังส่ง",
  successHeading: "หัวเรื่องเมื่อส่งสำเร็จ",
  successBody: "ข้อความเมื่อส่งสำเร็จ",
  another: "ปุ่มส่งคำขออีกครั้ง",
  errors: "ข้อความเมื่อผิดพลาด",
  required: "เมื่อไม่ได้กรอกช่องที่ต้องกรอก",
  tooLong: "เมื่อข้อความยาวเกิน",
  rateLimited: "เมื่อส่งบ่อยเกินไป",
  failed: "เมื่อส่งไม่สำเร็จ",
  unavailable: "เมื่อยังเปิดรับทางเว็บไม่ได้",
  preview: "ข้อความในตัวอย่างของหน้าแก้ไข",
  policyVersion: "รุ่นของนโยบาย (เปลี่ยนวันที่เมื่อแก้นโยบาย ผู้ชมทุกคนจะถูกถามใหม่)",
  acceptAll: "ปุ่มยอมรับทั้งหมด",
  rejectAll: "ปุ่มใช้เฉพาะที่จำเป็น",
  customize: "ปุ่มเลือกเอง",
  save: "ปุ่มบันทึกที่เลือก",
  necessaryTitle: "ชื่อกลุ่ม จำเป็น",
  necessaryBody: "คำอธิบายกลุ่ม จำเป็น",
  alwaysOn: "คำว่า เปิดเสมอ",
  analyticsTitle: "ชื่อกลุ่ม วิเคราะห์การใช้งาน",
  analyticsBody: "คำอธิบายกลุ่ม วิเคราะห์การใช้งาน",
  adsTitle: "ชื่อกลุ่ม โฆษณา",
  adsBody: "คำอธิบายกลุ่ม โฆษณา",
  settingsLink: "ลิงก์ตั้งค่าคุกกี้ ท้ายหน้าเว็บ",
};

// The same key means something else in these places.
const contextLabels: Record<string, string> = {
  "seo.title": "ชื่อหน้า (title)",
  "seo.description": "คำอธิบายหน้า (description)",
  "seo.image": "รูปเมื่อแชร์ลิงก์",
  "brand.name": "ชื่อแบรนด์",
  "ui.skipToContent": "ลิงก์ข้ามไปเนื้อหา (ใช้กับคีย์บอร์ด)",
  "ui.menu": "ปุ่มเปิดเมนู",
  "ui.mainNavigation": "ชื่อเมนูหลัก (โปรแกรมอ่านหน้าจอ)",
  "ui.languageSwitch": "ชื่อตัวเลือกภาษา",
  "ui.speed": "หัวข้อ ความเร็ว",
  "ui.audience": "หัวข้อ เหมาะกับ",
  "ui.allowance": "หัวข้อ การใช้งาน",
  "ui.validity": "หัวข้อ ระยะเวลา",
  "ui.contract": "หัวข้อ สัญญา",
  "ui.benefits": "หัวข้อ สิทธิประโยชน์",
  "ui.details": "หัวข้อ รายละเอียด",
  "ui.conditions": "หัวข้อ เงื่อนไข",
  "ui.dialCode": "หัวข้อ รหัสกดสมัคร",
  "ui.perMonth": "หน่วย ต่อเดือน",
  "ui.baht": "หน่วย บาท",
  "ui.vatExcluded": "ข้อความ ไม่รวม VAT",
  "ui.vatIncluded": "ข้อความ รวม VAT",
  "ui.regularPrice": "ข้อความ ราคาปกติ",
  "ui.offerPrice": "ข้อความ ราคาเสนอ",
  "ui.emptyGroup": "ข้อความเมื่อหมวดไม่มีแพ็กเกจ",
  "ui.jumpTo": "ข้อความ ไปยังหมวด",
  "ui.contents": "หัวข้อ สารบัญ",
  "ui.call": "ปุ่ม โทร",
  "ui.email": "คำว่า อีเมล",
  "ui.chatOnLine": "ปุ่ม แชต LINE",
  "ui.lineId": "คำว่า ไลน์ไอดี",
  "ui.facebook": "คำว่า เฟซบุ๊ก",
  "ui.opensInNewTab": "คำบอกว่าเปิดแท็บใหม่ (โปรแกรมอ่านหน้าจอ)",
  "ui.footerContact": "หัวข้อ ติดต่อ ในส่วนท้าย",
  "ui.packageDetails": "ลิงก์ ดูรายละเอียด บนการ์ดโปร",
  "ui.recommended": "ป้าย แนะนำ บนการ์ดของแพ็กเกจที่แนะนำในหน้าแรก",
  "hero.heading": "หัวเรื่อง (ทีละบรรทัด)",
  "slip.title": "ชื่อบนใบ",
  "slip.service": "บรรทัด บริการ",
  "slip.area": "บรรทัด พื้นที่",
  "columns.package": "หัวคอลัมน์ แพ็กเกจ",
  "columns.price": "หัวคอลัมน์ ราคา",
  "ui.findPackage": "หัวข้อ ค้นหาแพ็กเกจ (กล่องตัวกรอง)",
  "ui.filterSpeed": "ตัวกรอง ความเร็ว",
  "ui.filterPrice": "ตัวกรอง ราคาไม่เกิน",
  "ui.filterBenefit": "ตัวกรอง สิทธิประโยชน์",
  "ui.filterAny": "ตัวเลือก ทั้งหมด (ไม่กรอง)",
  "ui.sortBy": "ตัวเลือก เรียงตาม",
  "ui.sortRecommended": "เรียง แนะนำ (ลำดับในหน้า)",
  "ui.sortPriceLow": "เรียง ราคาต่ำไปสูง",
  "ui.sortPriceHigh": "เรียง ราคาสูงไปต่ำ",
  "ui.sortSpeed": "เรียง เร็วที่สุดก่อน",
  "ui.resultCount": "จำนวนผลลัพธ์ ({shown} และ {total} คือจำนวน)",
  "ui.clearFilters": "ปุ่มล้างตัวกรอง",
  "ui.noMatches": "ข้อความเมื่อหมวดไม่มีแพ็กเกจตรงตัวกรอง",
  "ui.compareAdd": "ช่องเลือกเปรียบเทียบบนการ์ด",
  "ui.compareChosen": "แถบเปรียบเทียบ ({count} คือจำนวนที่เลือก)",
  "ui.compareOpen": "ปุ่มเปิดตารางเปรียบเทียบ",
  "ui.compareMore": "ข้อความเมื่อเลือกเปรียบเทียบเพียง 1 แพ็กเกจ",
  "ui.compareLimit": "ข้อความเมื่อเลือกครบ 3 แพ็กเกจ",
  "ui.compareClear": "ปุ่มล้างแพ็กเกจที่เลือกเปรียบเทียบ",
  "ui.close": "ปุ่มปิด",
  "ui.breadcrumb": "ชื่อแถบตำแหน่งหน้า (โปรแกรมอ่านหน้าจอ)",
  "ui.homeLink": "ลิงก์ หน้าแรก ในแถบตำแหน่งหน้า",
  "ui.unverifiedNote": "หมายเหตุแพ็กเกจที่ราคายังไม่ยืนยัน",
  "ui.packageContactNote": "ข้อความเหนือปุ่มติดต่อในหน้ารายละเอียดแพ็กเกจ",
  "ui.callSales": "ปุ่มโทรหาฝ่ายขาย ในหน้ารายละเอียดแพ็กเกจ",
  "ui.requestCallback": "ปุ่มขอให้โทรกลับ ในหน้ารายละเอียดแพ็กเกจ",
  "leadForm.name": "ป้ายช่อง ชื่อ",
  "leadForm.phone": "ป้ายช่อง เบอร์โทร",
  "leadForm.services": "บริการให้เลือก",
  "leadForm.consent": "ข้อความยินยอม (ตามด้วยลิงก์นโยบาย)",
  "leadForm.policyLink": "ลิงก์นโยบายความเป็นส่วนตัว",
  "services.mobile": "เน็ตมือถือ",
  "services.solar": "โซลาร์เซลล์",
  "errors.phone": "เมื่อเบอร์โทรไม่ถูกต้อง",
  "errors.consent": "เมื่อไม่ได้ติ๊กยินยอม",
  "site.consent": "แถบขอความยินยอมคุกกี้",
  "consent.heading": "หัวเรื่องของแถบคุกกี้",
  "consent.body": "ข้อความของแถบคุกกี้",
  "consent.policyLink": "ลิงก์นโยบายความเป็นส่วนตัว",
  "callback.heading": "หัวเรื่อง",
  "callback.description": "คำอธิบาย",
  "review.notes": "บันทึกการตรวจ (ไม่แสดงบนเว็บ)",
  "speed.download": "ดาวน์โหลด",
  "hero.note": "ข้อความเล็กใต้ปุ่ม",
  "about.body": "ย่อหน้า",
  "bundle.items": "รายการในโปร",
  "stats.items": "ตัวเลข",
};

/** Name of the field `key`; `parent` is the key of the object that holds it. */
export function fieldLabel(key: string, parent?: string): string {
  return (parent && contextLabels[`${parent}.${key}`]) ?? labels[key] ?? key;
}

const valueLabels: Record<string, string> = {
  canvas: "ขาว",
  surface: "เทาอ่อน",
  wash: "สีแบรนด์อ่อน",
  ink: "ดำ",
  primary: "ปุ่มหลัก (สีแบรนด์)",
  secondary: "ปุ่มรอง (เส้นขอบ)",
  month: "ต่อเดือน",
  package: "ต่อแพ็กเกจ",
  once: "จ่ายครั้งเดียว",
  included: "รวม VAT แล้ว",
  excluded: "ไม่รวม VAT",
  unknown: "ไม่ระบุ (ไม่แสดงบรรทัด VAT)",
  verified: "ธุรกิจยืนยันแล้ว",
  unverified: "ยังไม่ยืนยัน (แสดงบนเว็บ)",
  hidden: "ซ่อนจากหน้าเว็บ",
  page: "หน้าในเว็บนี้",
  external: "เว็บอื่น (https)",
  contact: "ช่องทางติดต่อ",
  "line-sales": "LINE ฝ่ายขาย",
  "line-service": "LINE ฝ่ายบริการ",
  "phone-sales": "โทรหาฝ่ายขาย",
  email: "อีเมล",
  facebook: "เฟซบุ๊ก",
  router: "เราเตอร์",
  "router-upgrade": "เราเตอร์ + ลูกศรเพิ่มสปีด",
  phone: "มือถือ",
  solar: "แผงโซลาร์",
  compare: "เทียบกันเป็นแถว",
  compact: "การ์ดกะทัดรัด",
  product: "รูปสินค้า",
  brand: "โลโก้",
  photo: "ภาพถ่าย",
  promo: "ภาพโปรโมชัน",
  generated: "ภาพประกอบ (AI)",
  illustration: "ภาพวาด",
  start: "ชิดซ้าย",
  center: "กึ่งกลาง",
  end: "ชิดขวา",
  dark: "สีเข้ม (บนภาพสว่าง)",
  light: "สีขาว (บนภาพมืด)",
};

export function valueLabel(value: string): string {
  return valueLabels[value] ?? value;
}

function isLocalized(value: unknown): value is LocalizedText {
  return typeof value === "object" && value !== null && typeof (value as LocalizedText).th === "string";
}

function shorten(text: string, max = 48): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/** A short name for one item of a list, from its own text. */
export function itemLabel(item: unknown, index: number): string {
  if (isLocalized(item)) return shorten(item.th) || `รายการที่ ${index + 1}`;
  if (typeof item === "string") return shorten(item) || `รายการที่ ${index + 1}`;
  if (typeof item === "object" && item !== null) {
    const record = item as Record<string, unknown>;
    for (const key of ["title", "question", "heading", "label", "name"]) {
      const value = record[key];
      if (isLocalized(value) && value.th.trim()) return shorten(value.th);
    }
    if (typeof record.number === "string") return record.number;
    if (typeof record.value === "string") return record.value;
    if (typeof record.category === "string" && typeof record.group === "string") return `${record.category} / ${record.group}`;
    if (typeof record.id === "string") return record.id;
  }
  return `รายการที่ ${index + 1}`;
}

/** Name of a whole document, such as "หน้าแรก" or "แพ็กเกจ True Gigatex 1Gbps". */
export function documentLabel(content: SiteContent, documentId: DocumentId): string {
  if (documentId === "site") return "ตั้งค่าทั้งเว็บ";
  if (documentId === "catalog") return "แพ็กเกจและสิทธิประโยชน์";
  const [kind, key] = documentId.split(":") as [string, string];
  const body = readDocument(content, documentId) as Record<string, unknown> | undefined;
  switch (kind) {
    case "page":
      return pageLabels[key as PageDocumentId] ?? key;
    case "package":
      return `แพ็กเกจ ${isLocalized(body?.name) ? shorten(body.name.th) : key}`;
    case "media":
      return `รูป ${isLocalized(body?.alt) ? shorten(body.alt.th, 36) : key}`;
    case "benefit":
      return `สิทธิประโยชน์ ${isLocalized(body?.label) ? shorten(body.label.th) : key}`;
    default:
      return documentId;
  }
}

/** Short name of the field a binding points at, for the highlight in the preview. */
export function bindingLabel(content: SiteContent, binding: string): string {
  const decoded = decodeBinding(binding);
  if (!decoded) return "";
  const { documentId, path } = decoded;
  if (path.length === 0) return documentLabel(content, documentId);
  const body = readDocument(content, documentId);
  for (let index = path.length - 1; index >= 0; index -= 1) {
    const key = path[index];
    const parent = getAt(body, path.slice(0, index));
    if (Array.isArray(parent)) {
      const item = getAt(body, path.slice(0, index + 1));
      const position = parent.indexOf(item);
      return itemLabel(item, position === -1 ? 0 : position);
    }
    if (key in labels || `${path[index - 1]}.${key}` in contextLabels) return fieldLabel(key, path[index - 1]);
  }
  return documentLabel(content, documentId);
}

/** Readable name of a path inside a document, such as "คำถามที่พบบ่อย › สมัครได้ไหม › คำตอบ › English". */
export function pathLabel(body: unknown, path: readonly string[]): string {
  const parts: string[] = [];
  path.forEach((segment, index) => {
    const parent = getAt(body, path.slice(0, index));
    if (Array.isArray(parent)) {
      const item = getAt(body, path.slice(0, index + 1));
      parts.push(itemLabel(item, Math.max(parent.indexOf(item), 0)));
    } else if (segment === "th" || segment === "en") {
      parts.push(segment === "th" ? "ไทย" : "English");
    } else {
      parts.push(fieldLabel(segment, path[index - 1]));
    }
  });
  return parts.join(" › ");
}
