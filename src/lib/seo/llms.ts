import { publicPages } from "@/content/routes";
import { readDocument } from "@/lib/content/documents";
import { detailPackagesIn, packageHomeIn } from "@/lib/content/lookup";
import { packageDetailPath } from "@/lib/content/package-facts";
import { formatPhone } from "@/lib/content/render";
import type { CatalogPackage, Seo, SiteContent } from "@/lib/content/schema";
import { localizePath } from "@/lib/i18n/locales";

import { siteUrl } from "./metadata";
import { packageFactLines } from "./package-seo";

// The site in one plain Markdown file for AI assistants and answer engines
// (/llms.txt, the convention of llmstxt.org): who runs it, what it offers, every
// page and package with its address, how to apply, the questions people ask,
// and how to reach the team. Built from the published content, like the
// sitemap, so it says what the pages say; in Thai, the site's language, with
// the English addresses beside. Prices stand with the line that the team
// confirms them, as on the pages (docs/renovation/R13-SEARCH-AND-PARTNER.md).

const absolute = (path: string) => new URL(path, siteUrl()).href;

/** One line of Markdown: no line breaks inside, and no characters that would start a link or a heading. */
const plain = (text: string) => text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();

function pageLine(seo: Seo, path: string): string {
  return `- [${plain(seo.title.th)}](${absolute(localizePath(path, "th"))}): ${plain(seo.description.th)} (English: ${absolute(localizePath(path, "en"))})`;
}

export function llmsText(content: SiteContent, today: string): string {
  const { site } = content;
  const { contact, ui } = site;
  const pages = publicPages.map((entry) => ({ path: entry.path, page: entry.page, seo: (readDocument(content, `page:${entry.page}`) as { seo: Seo }).seo }));
  const home = pages.find((entry) => entry.page === "home")!;

  // Packages under the page that lists them, in the order the site lists those pages.
  const groups = new Map<string, { title: string; path: string; items: CatalogPackage[] }>();
  for (const item of detailPackagesIn(content, today)) {
    const where = packageHomeIn(content, item)!;
    const group = groups.get(where.path) ?? { title: where.pageTitle.th, path: where.path, items: [] };
    group.items.push(item);
    groups.set(where.path, group);
  }
  const ordered = pages.flatMap((entry) => (groups.has(entry.path) ? [groups.get(entry.path)!] : []));
  const unconfirmed = [...groups.values()].some((group) => group.items.some((item) => item.review.status !== "verified"));

  const lines = [
    `# ${plain(site.brand.name.th)}`,
    "",
    `> ${plain(site.footer.about.th)}`,
    ">",
    `> ${plain(site.footer.about.en)}`,
    "",
    plain(home.seo.description.th),
    "",
    "## หน้าหลักของเว็บไซต์",
    "",
    ...pages.filter((entry) => entry.page !== "terms").map((entry) => pageLine(entry.seo, entry.path)),
    "",
    "## แพ็กเกจ",
    "",
    ...(unconfirmed ? [plain(ui.unverifiedNote.th), ""] : []),
    ...ordered.flatMap((group) => [
      `### ${plain(group.title)} (${absolute(localizePath(group.path, "th"))})`,
      "",
      ...group.items.map((item) => `- [${plain(item.name.th)}](${absolute(packageDetailPath(item.id))}): ${plain(packageFactLines(content, item, "th").join(" · "))}`),
      "",
    ]),
    "## คำถามที่พบบ่อย",
    "",
    ...content.pages.home.faq.items.flatMap((item) => [`### ${plain(item.question.th)}`, "", plain(item.answer.th), ""]),
    "## ติดต่อ",
    "",
    `- LINE: ${contact.lineId} (${contact.lineService})`,
    `- ${plain(ui.call.th)}: ${contact.phones.map((phone) => formatPhone(phone.number)).join(", ")}`,
    `- ${plain(ui.email.th)}: ${contact.email}`,
    `- ${plain(ui.facebook.th)}: ${contact.facebook}`,
    `- ${plain(contact.office.th)}: ${contact.mapUrl}`,
    `- ${plain(contact.hours.th)}`,
    `- ${plain(site.ui.requestCallback.th)}: ${absolute(`${localizePath("/service", "th")}#callback`)}`,
    "",
    "## Optional",
    "",
    ...pages.filter((entry) => entry.page === "terms").map((entry) => pageLine(entry.seo, entry.path)),
    `- [English version of the site](${absolute(localizePath("/", "en"))})`,
    "",
  ];
  return lines.join("\n");
}
