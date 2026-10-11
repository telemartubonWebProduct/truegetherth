import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";
import { breadcrumbData, faqData, jsonLd, organizationData, websiteData } from "@/lib/seo/structured-data";

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
