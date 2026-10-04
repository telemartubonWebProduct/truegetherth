import { publicPages } from "@/content/routes";

import type { CategoryId, LinkTarget, SiteContent } from "./schema";

// Checks that the schema alone cannot express: references between documents,
// in-page anchors, and prices. Used when the published content loads (a
// problem fails the build) and before a draft is saved from the Mirror editor.

/** Cross-reference problems in parsed content, in Thai for the editor; empty when everything resolves. */
export function contentProblems(content: SiteContent): string[] {
  const problems: string[] = [];
  const { site, media, benefits, catalog, pages } = content;
  const mediaIds = new Set(Object.keys(media));
  const needMedia = (id: string | undefined, where: string) => {
    if (id && !mediaIds.has(id)) problems.push(`${where}: ไม่มีรูป "${id}" ในคลังสื่อ`);
  };

  // Catalog
  const seen = new Set<string>();
  for (const item of catalog) {
    if (seen.has(item.id)) problems.push(`แพ็กเกจ: รหัส "${item.id}" ซ้ำกัน`);
    seen.add(item.id);
    for (const id of item.benefits) if (!(id in benefits)) problems.push(`แพ็กเกจ ${item.id}: ไม่มีสิทธิประโยชน์ "${id}"`);
    needMedia(item.image, `แพ็กเกจ ${item.id}`);
    if (item.review.status !== "hidden" && item.price.amount <= 0) problems.push(`แพ็กเกจ ${item.id}: แพ็กเกจที่แสดงบนเว็บต้องมีราคา (ตอนนี้เป็น 0)`);
    if (item.price.regularAmount !== undefined && item.price.regularAmount <= item.price.amount) {
      problems.push(`แพ็กเกจ ${item.id}: ราคาปกติต้องสูงกว่าราคาเสนอ`);
    }
  }
  for (const [id, entry] of Object.entries(benefits)) needMedia(entry.icon, `สิทธิประโยชน์ ${id}`);

  // Pages and the anchors each page provides
  const anchors = new Map<string, Set<string>>();
  const pagePaths = new Set<string>(publicPages.map((entry) => entry.path));
  const groupExists = (category: CategoryId, group: string) =>
    catalog.some((item) => item.category === category && item.group === group);

  for (const doc of pages.packages) {
    const ids = new Set<string>();
    for (const section of doc.sections) {
      if (ids.has(section.id)) problems.push(`หน้า ${doc.id}: หมวด "${section.id}" ซ้ำกัน`);
      ids.add(section.id);
      for (const group of section.groups) {
        if (!groupExists(group.category, group.group)) {
          problems.push(`หน้า ${doc.id}#${section.id}: ไม่มีแพ็กเกจในกลุ่ม ${group.category}/${group.group}`);
        }
      }
    }
    anchors.set(doc.path, ids);
  }
  anchors.set(pages.solar.path, new Set([pages.solar.packages.id]));
  if (!groupExists("solar", pages.solar.packages.group)) problems.push(`หน้าโซลาร์: ไม่มีแพ็กเกจในกลุ่ม solar/${pages.solar.packages.group}`);

  const tabIds = new Set<string>();
  for (const tab of pages.home.promos.tabs) {
    if (tabIds.has(tab.id)) problems.push(`หน้าแรก โปรแนะนำ: แท็บ "${tab.id}" ซ้ำกัน`);
    tabIds.add(tab.id);
    const cardIds = new Set<string>();
    for (const card of tab.items) {
      const where = `หน้าแรก โปรแนะนำ ${tab.id}`;
      if (cardIds.has(card.id)) problems.push(`${where}: การ์ด "${card.id}" ซ้ำกัน`);
      cardIds.add(card.id);
      const item = catalog.find((entry) => entry.id === card.packageId);
      if (!item) problems.push(`${where}: ไม่มีแพ็กเกจ "${card.packageId}"`);
      else if (item.review.status === "hidden") problems.push(`${where}: แพ็กเกจ "${card.packageId}" ถูกซ่อนจากหน้าเว็บ`);
      needMedia(card.image, `${where} การ์ด ${card.id}`);
    }
  }

  needMedia(site.brand.logo, "โลโก้");
  needMedia(site.contact.lineQr, "QR ของ LINE");
  needMedia(site.seo.image, "รูปสำหรับแชร์ของเว็บ");
  needMedia(pages.home.hero.visual, "หน้าแรก ภาพเปิดหน้า");
  if (!groupExists(pages.home.prices.category, pages.home.prices.group)) {
    problems.push(`หน้าแรก ตารางราคา: ไม่มีแพ็กเกจในกลุ่ม ${pages.home.prices.category}/${pages.home.prices.group}`);
  }
  needMedia(pages.solar.hero.image, "หน้าโซลาร์ ส่วนเปิดหน้า");
  needMedia(pages.solar.about.image, "หน้าโซลาร์ เกี่ยวกับ");
  needMedia(pages.solar.process.image, "หน้าโซลาร์ ขั้นตอนติดตั้ง");
  needMedia(pages.solar.bundle.image, "หน้าโซลาร์ โปรร่วม");
  for (const article of pages.solar.knowledge.articles) {
    for (const id of article.images) needMedia(id, `หน้าโซลาร์ บทความ ${article.id}`);
  }
  needMedia(pages.agent.hero.image, "หน้าสมัครผ่านตัวแทน");
  for (const page of [pages.home, pages.solar, pages.contact, pages.agent, pages.terms, ...pages.packages]) {
    needMedia(page.seo.image, `หน้า ${page.id} รูปสำหรับแชร์`);
  }

  // Internal links: known page, and a hash only where that page has the anchor.
  const checkLink = (target: LinkTarget, where: string) => {
    if (target.kind !== "page") return;
    if (!pagePaths.has(target.path)) problems.push(`${where}: ลิงก์ไปหน้าที่ไม่มีในเว็บ "${target.path}"`);
    if (target.hash && !anchors.get(target.path)?.has(target.hash)) {
      problems.push(`${where}: หน้า "${target.path}" ไม่มีหมวด #${target.hash}`);
    }
  };
  for (const item of site.navigation) {
    if (item.target) checkLink(item.target, `เมนู ${item.id}`);
    for (const child of item.children ?? []) checkLink(child.target, `เมนู ${child.id}`);
  }
  checkLink(site.headerCta.target, "ปุ่มใน header");
  for (const group of site.footer.groups) for (const entry of group.links) checkLink(entry.target, `ส่วนท้าย ${entry.id}`);
  const home = pages.home;
  for (const cta of [home.hero.primaryCta, home.hero.secondaryCta, home.prices.viewAll, ...home.promos.tabs.flatMap((tab) => [tab.packageCta, tab.viewAll])]) {
    checkLink(cta.target, `หน้าแรก ปุ่ม ${cta.id}`);
  }
  for (const tag of home.hero.tags) checkLink(tag.target, `หน้าแรก ป้าย ${tag.id}`);
  for (const item of home.services.items) checkLink(item.target, `หน้าแรก บริการ ${item.id}`);
  for (const cta of [pages.agent.hero.primaryCta, pages.agent.hero.secondaryCta, pages.solar.hero.cta, pages.solar.packages.packageCta]) {
    checkLink(cta.target, `ปุ่ม ${cta.id}`);
  }

  return problems;
}
