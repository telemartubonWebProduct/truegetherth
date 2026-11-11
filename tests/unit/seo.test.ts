import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { detailPackagesIn, packageIn } from "@/lib/content/lookup";
import { formatPhone } from "@/lib/content/render";
import { shownBenefits } from "@/lib/content/package-facts";
import { llmsText } from "@/lib/seo/llms";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";
import { nameGivesSpeed, packageSeo, speedLabel } from "@/lib/seo/package-seo";
import { breadcrumbData, faqData, jsonLd, organizationData, websiteData } from "@/lib/seo/structured-data";

const today = "2026-11-03";

// What the site tells search engines about itself (docs/renovation/R9-SEO-PERFORMANCE.md):
// its one domain, who runs it, and where a page sits. No price is among it.

describe("the site's address", () => {
  it("is truegetherth.com unless the environment says otherwise", () => {
    expect(process.env.NEXT_PUBLIC_SITE_URL ?? "").toBe("");
    expect(siteUrl().origin).toBe("https://www.truegetherth.com");
  });

  it("gives each page a canonical address and one for each language", () => {
    const page = content.pages.packages[0];
    const metadata = pageMetadata({ locale: "en", path: page.path, seo: page.seo, content });
    expect(metadata.alternates).toEqual({ canonical: `/en${page.path}`, languages: { th: page.path, en: `/en${page.path}`, "x-default": page.path } });
  });
});

describe("structured data", () => {
  const organization = organizationData(content, "th");

  it("says who runs the site: the company, an appointed dealer and not True itself", () => {
    expect(organization).toMatchObject({
      "@type": "Organization",
      name: content.site.brand.name.th,
      legalName: "บริษัท เทเลมาร์ท คอมมิวนิเคชั่น จำกัด",
      url: "https://www.truegetherth.com/",
      email: content.site.contact.email,
    });
    expect(organization.description).toContain("Authorized Dealer");
    expect(organization.description).toContain("ไม่ใช่เว็บไซต์หลักของบริษัท ทรู คอร์ปอเรชั่น");
    expect(organizationData(content, "en").description).toContain("not the main website of True Corporation");
  });

  it("gives the phone numbers in international form, with the head office and the hours", () => {
    const points = organization.contactPoint as { telephone: string; description: string }[];
    expect(points.map((point) => point.telephone)).toEqual(content.site.contact.phones.map((phone) => `+66${phone.number.slice(1)}`));
    expect(points[0].description).toBe(content.site.contact.hours.th);
    expect(organization.address).toMatchObject({ addressLocality: content.site.contact.office.th, addressCountry: "TH" });
    expect(String(organization.logo)).toMatch(/^https:\/\/www\.truegetherth\.com\//);
  });

  it("puts a page under the home page with full addresses, in the page's language", () => {
    const trail = breadcrumbData(
      [
        { name: "Home", path: "/" },
        { name: "Broadband", path: "/broadband" },
      ],
      "en",
    );
    expect(trail.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.truegetherth.com/en" },
      { "@type": "ListItem", position: 2, name: "Broadband", item: "https://www.truegetherth.com/en/broadband" },
    ]);
  });

  it("states no price, and cannot close the script element it sits in", () => {
    const { faq } = content.pages.home;
    const document = jsonLd([organization, websiteData(content, "th"), faqData(faq.items.map((item) => ({ question: item.question.th, answer: `${item.answer.th} </script>` })))]);
    expect(document).not.toContain("</script>");
    expect(document).not.toMatch(/"(price|offers|priceCurrency)"/);
    expect(JSON.parse(document)["@graph"]).toHaveLength(3);
  });
});

// What search results and assistants read about each package, and the site in one file (R13).

describe("a package's page in search results", () => {
  const value = packageIn(content, "fiber-500-499");

  it("names the speed when the package's name does not, and the page that lists it", () => {
    const seo = packageSeo(content, value);
    expect(seo.title.th).toBe(`${value.name.th} 500/500 Mbps – ${content.pages.packages[0].hero.heading.th}`);
    expect(seo.title.en).toBe(`${value.name.en} 500/500 Mbps – ${content.pages.packages[0].hero.heading.en}`);
  });

  it("does not repeat a speed the name already gives", () => {
    const gigabit = packageIn(content, "fiber-1g-799");
    expect(nameGivesSpeed(gigabit.name.th, gigabit.speed!)).toBe(true);
    expect(packageSeo(content, gigabit).title.th.match(/Gbps/gi)).toHaveLength(1);
    expect(nameGivesSpeed("แพ็กเกจเพิ่มสปีด 1000/500 Mbps", { download: { value: 1000, unit: "Mbps" }, upload: { value: 500, unit: "Mbps" } })).toBe(true);
    expect(nameGivesSpeed(value.name.th, value.speed!)).toBe(false);
    expect(speedLabel({ download: { value: 1, unit: "Gbps" }, upload: { value: 500, unit: "Mbps" } }, "en")).toBe("1 Gbps/500 Mbps");
  });

  it("gives its price with the term, the first benefits and the line that the team confirms", () => {
    const { description } = packageSeo(content, value);
    expect(description.th).toContain("499 บาท/เดือน (ไม่รวม VAT)");
    expect(description.th).toContain(`สัญญา ${value.contract!.th}`);
    expect(description.th).toContain(content.benefits[value.benefits[0]].label.th);
    expect(description.th.endsWith(content.site.ui.packageContactNote.th)).toBe(true);
    expect(description.en.endsWith(content.site.ui.packageContactNote.en)).toBe(true);
  });

  it("shows the code to dial for a package that has one, and its own picture when shared", () => {
    const dialled = detailPackagesIn(content, today).find((item) => item.dialCode)!;
    expect(packageSeo(content, dialled).description.th).toContain(`กดสมัคร ${dialled.dialCode}`);
    const pictured = detailPackagesIn(content, today).find((item) => item.image)!;
    expect(packageSeo(content, pictured).image).toBe(pictured.image);
    expect(packageSeo(content, value).image).toBe(value.image);
  });

  it("qualifies broadband benefit choices before naming the visible options in both languages", () => {
    const hidden = value.benefits[0];
    const item = { ...value, hiddenBenefits: [hidden] };
    for (const locale of ["th", "en"] as const) {
      const description = packageSeo(content, item).description[locale];
      const condition = item.conditions[0][locale];
      expect(description.split(condition)).toHaveLength(2);
      expect(description.indexOf(condition)).toBeLessThan(description.indexOf(`${content.site.ui.benefits[locale]}:`));
      expect(description).not.toContain(content.benefits[hidden].label[locale]);
      for (const id of shownBenefits(item)) expect(description).toContain(content.benefits[id].label[locale]);
      expect(description).toContain(content.site.ui.vatExcluded[locale]);
      expect(description.endsWith(content.site.ui.packageContactNote[locale])).toBe(true);
    }
  });

  it("does not advertise a benefit choice when all benefits are hidden", () => {
    const item = { ...value, hiddenBenefits: [...value.benefits] };
    for (const locale of ["th", "en"] as const) {
      const description = packageSeo(content, item).description[locale];
      expect(description).not.toContain(item.conditions[0][locale]);
      expect(description).not.toContain(`${content.site.ui.benefits[locale]}:`);
    }
  });
});

describe("the site for AI assistants (llms.txt)", () => {
  const text = llmsText(content, today);

  it("opens with who runs the site: Telemart, a partner of True Online, not True itself", () => {
    expect(text.startsWith(`# ${content.site.brand.name.th}\n\n> ${content.site.footer.about.th}`)).toBe(true);
    expect(text).toContain(content.site.footer.about.en);
    expect(content.site.footer.about.th).toContain("พาร์ทเนอร์ที่ได้รับการแต่งตั้งอย่างเป็นทางการของทรู ออนไลน์");
    expect(content.site.footer.about.en).toContain("Authorized Partner of True Online");
  });

  it("links every package visitors may see, with its price beside the line that the team confirms", () => {
    const shown = detailPackagesIn(content, today);
    for (const item of shown) expect(text).toContain(`[${item.name.th}](https://www.truegetherth.com/packages/${item.id}): `);
    expect(text).toContain(content.site.ui.unverifiedNote.th);
    expect(text.indexOf(content.site.ui.unverifiedNote.th)).toBeLessThan(text.indexOf("/packages/"));
  });

  it("leaves out a package past its last day", () => {
    const ended = structuredClone(content);
    const gone = ended.catalog.find((item) => item.id === "fiber-500-499")!;
    gone.showUntil = "2026-11-02";
    expect(llmsText(ended, today)).not.toContain("/packages/fiber-500-499");
  });

  it("answers the home page's questions and says how to reach the team", () => {
    for (const item of content.pages.home.faq.items) expect(text).toContain(`### ${item.question.th}\n\n${item.answer.th}`);
    for (const phone of content.site.contact.phones) expect(text).toContain(formatPhone(phone.number));
    expect(text).toContain(content.site.contact.lineId);
    expect(text).toContain(content.site.contact.hours.th);
    expect(text).not.toMatch(/\/(admin|auth|api)\b/);
  });
});

describe("the partner's badge", () => {
  it("is True Online's own mark, the owner's file, with the owner's words under it", () => {
    const { partnerLogo, partnerLabel } = content.site.brand;
    expect(partnerLogo).toBe("true-online-logo");
    expect(content.media[partnerLogo!].src).toBe("/assets/wEnergy/trueonline.png");
    expect(partnerLabel).toEqual({ th: "Authorized Partner by Telemart", en: "Authorized Partner by Telemart" });
  });
});
