import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { benefitOptions, downloadMbps, matches, packageFacts, priceLimits, ranks, speedOptions } from "@/lib/content/package-facts";
import { publicPackagesIn } from "@/lib/content/lookup";

const broadband = publicPackagesIn(content, "broadband-new", "new-customer");
const byId = (id: string) => content.catalog.find((item) => item.id === id)!;

describe("package facts", () => {
  it("compares speeds in Mbps across units", () => {
    expect(downloadMbps(byId("fiber-1g-799"))).toBe(1000);
    expect(downloadMbps(byId("fiber-1500-1199"))).toBe(1500);
    expect(downloadMbps(byId("m-boost-60gb"))).toBeNull();
    expect(speedOptions(broadband)).toEqual([500, 700, 1000, 1500]);
  });

  it("offers only price limits that change what shows", () => {
    const limits = priceLimits(broadband);
    const prices = broadband.map((item) => item.price.amount);
    const counts = limits.map((limit) => prices.filter((price) => price <= limit).length);
    expect(counts.length).toBeGreaterThan(1);
    for (let index = 1; index < counts.length; index++) expect(counts[index]).toBeGreaterThan(counts[index - 1]);
    expect(counts.at(-1)).toBeLessThan(prices.length);
  });

  it("offers benefits some packages have and others lack", () => {
    const options = benefitOptions(broadband);
    expect(options.length).toBeGreaterThan(1);
    for (const id of options) {
      expect(broadband.some((item) => item.benefits.includes(id))).toBe(true);
      expect(broadband.every((item) => item.benefits.includes(id))).toBe(false);
    }
  });

  it("filters on every chosen condition and sorts with ties in page order", () => {
    const facts = broadband.map(packageFacts);
    const none = { speed: null, maxPrice: null, benefit: null };
    expect(facts.filter((entry) => matches(entry, none))).toHaveLength(facts.length);
    expect(facts.filter((entry) => matches(entry, { ...none, speed: 500 })).every((entry) => entry.speed === 500)).toBe(true);
    expect(facts.filter((entry) => matches(entry, { ...none, maxPrice: 600 })).every((entry) => entry.price <= 600)).toBe(true);

    const cheapest = [...ranks(facts, "price-low")].sort((a, b) => a[1] - b[1]).map(([id]) => id);
    expect(cheapest.map((id) => byId(id).price.amount)).toEqual([...facts.map((entry) => entry.price)].sort((a, b) => a - b));
    const recommended = [...ranks(facts, "recommended")].sort((a, b) => a[1] - b[1]).map(([id]) => id);
    expect(recommended).toEqual(facts.map((entry) => entry.id));
    // Three 500 Mbps packages tie on speed and keep their page order.
    const fastest = [...ranks(facts, "speed")].sort((a, b) => a[1] - b[1]).map(([id]) => id);
    expect(fastest[0]).toBe("fiber-1500-1199");
    const slow = facts.filter((entry) => entry.speed === 500).map((entry) => entry.id);
    expect(fastest.filter((id) => slow.includes(id))).toEqual(slow);
  });
});
