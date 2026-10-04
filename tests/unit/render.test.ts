import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { formatNumber, formatPhone, isCurrent, resolveLink, telHref } from "@/lib/content/render";

const site = content.site;

describe("public renderer helpers", () => {
  it("formats Thai phone numbers and builds international tel: links", () => {
    expect(formatPhone("0910192552")).toBe("091-019-2552");
    expect(formatPhone("021234567")).toBe("02-123-4567");
    expect(telHref("0910192552")).toBe("tel:+66910192552");
  });

  it("adds the language prefix to site links only", () => {
    expect(resolveLink({ kind: "page", path: "/monthy", hash: "game" }, "th", site)).toEqual({ href: "/monthy#game", external: false });
    expect(resolveLink({ kind: "page", path: "/monthy", hash: "game" }, "en", site)).toEqual({ href: "/en/monthy#game", external: false });
    expect(resolveLink({ kind: "page", path: "/" }, "en", site)).toEqual({ href: "/en", external: false });
    expect(resolveLink({ kind: "external", url: "https://www.telemartmanagement.com/" }, "en", site)).toEqual({
      href: "https://www.telemartmanagement.com/",
      external: true,
    });
  });

  it("resolves contact channels from the site settings", () => {
    expect(resolveLink({ kind: "contact", channel: "line-sales" }, "th", site)).toEqual({ href: site.contact.lineSales, external: true });
    expect(resolveLink({ kind: "contact", channel: "phone-sales" }, "en", site)).toEqual({ href: "tel:+66910192552", external: false });
    expect(resolveLink({ kind: "contact", channel: "email" }, "th", site).href).toBe(`mailto:${site.contact.email}`);
  });

  it("marks a link current only on its own page, not on its sections", () => {
    expect(isCurrent({ kind: "page", path: "/monthy" }, "/monthy")).toBe(true);
    expect(isCurrent({ kind: "page", path: "/monthy", hash: "game" }, "/monthy")).toBe(false);
    expect(isCurrent({ kind: "page", path: "/topup" }, "/monthy")).toBe(false);
    expect(isCurrent({ kind: "contact", channel: "line-sales" }, "/monthy")).toBe(false);
  });

  it("groups digits the same way in both languages", () => {
    expect(formatNumber(1199, "th")).toBe("1,199");
    expect(formatNumber(1199, "en")).toBe("1,199");
    expect(formatNumber(1.5, "th")).toBe("1.5");
    expect(formatNumber(115000, "en")).toBe("115,000");
  });
});
