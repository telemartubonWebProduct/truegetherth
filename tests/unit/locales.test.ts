import { describe, expect, it } from "vitest";

import { defaultLocale, isLocale, localizePath, locales, splitLocale } from "@/lib/i18n/locales";

describe("site languages", () => {
  it("serves Thai by default and English as the second language", () => {
    expect(defaultLocale).toBe("th");
    expect(locales).toEqual(["th", "en"]);
    expect(isLocale("th")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("keeps the existing Thai URLs and prefixes English with /en", () => {
    expect(localizePath("/", "th")).toBe("/");
    expect(localizePath("/broadband", "th")).toBe("/broadband");
    expect(localizePath("/broadband-old#cctv", "th")).toBe("/broadband-old#cctv");
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/#contact", "en")).toBe("/en#contact");
    expect(localizePath("/monthy#game", "en")).toBe("/en/monthy#game");
    expect(() => localizePath("broadband", "en")).toThrow(/start with/);
  });

  it("splits a public pathname into its language and site path", () => {
    expect(splitLocale("/")).toEqual({ locale: "th", path: "/" });
    expect(splitLocale("/topup")).toEqual({ locale: "th", path: "/topup" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/en/topup")).toEqual({ locale: "en", path: "/topup" });
    // Only a whole "en" segment is a language prefix.
    expect(splitLocale("/energy")).toEqual({ locale: "th", path: "/energy" });
    expect(splitLocale("/en-us/x")).toEqual({ locale: "th", path: "/en-us/x" });
  });

  it("round-trips every language", () => {
    for (const locale of locales) {
      for (const path of ["/", "/broadband", "/wEnergy"]) {
        expect(splitLocale(localizePath(path, locale))).toEqual({ locale, path });
      }
    }
  });
});
