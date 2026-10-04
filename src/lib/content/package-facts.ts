import type { CatalogPackage } from "./schema";

// What the package pages filter, sort and compare on (docs/renovation/R3-PACKAGE-PAGES.md).
// Pure functions of the catalog, shared by the pages and the unit tests.

/** Address of a package's own page, before the language prefix. */
export function packageDetailPath(id: string): string {
  return `/packages/${id}`;
}

/** Download speed in Mbps, so 500 Mbps and 1 Gbps compare. */
export function downloadMbps(item: CatalogPackage): number | null {
  const speed = item.speed?.download;
  if (!speed) return null;
  return speed.unit === "Gbps" ? Math.round(speed.value * 1000) : speed.value;
}

/** Download speeds to filter by, slowest first; none when the packages do not differ. */
export function speedOptions(items: readonly CatalogPackage[]): number[] {
  const speeds = Array.from(new Set(items.map(downloadMbps).filter((value): value is number => value !== null))).sort((a, b) => a - b);
  return speeds.length > 1 ? speeds : [];
}

/** Round "at most" prices offered as limits. */
const PRICE_STEPS = [20, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 1000, 1500, 2000, 5000, 10_000, 50_000, 100_000, 150_000, 200_000, 300_000];

/** Price limits worth offering: each lets through more packages than the one before, and none lets through all. */
export function priceLimits(items: readonly CatalogPackage[]): number[] {
  const prices = items.map((item) => item.price.amount);
  const limits: number[] = [];
  let shown = 0;
  for (const step of PRICE_STEPS) {
    const count = prices.filter((price) => price <= step).length;
    if (count === prices.length) break;
    if (count > shown) {
      limits.push(step);
      shown = count;
    }
  }
  return limits;
}

/** Benefits to filter by: those some packages have and others do not, in the order they first appear. */
export function benefitOptions(items: readonly CatalogPackage[]): string[] {
  const seen: string[] = [];
  for (const item of items) for (const id of item.benefits) if (!seen.includes(id)) seen.push(id);
  return seen.filter((id) => !items.every((item) => item.benefits.includes(id)));
}

/** What the client needs to filter and sort one package. */
export type PackageFacts = { id: string; speed: number | null; price: number; benefits: string[] };

export function packageFacts(item: CatalogPackage): PackageFacts {
  return { id: item.id, speed: downloadMbps(item), price: item.price.amount, benefits: item.benefits };
}

export type Filters = { speed: number | null; maxPrice: number | null; benefit: string | null };
export type SortKey = "recommended" | "price-low" | "price-high" | "speed";

export function matches(facts: PackageFacts, filters: Filters): boolean {
  if (filters.speed !== null && facts.speed !== filters.speed) return false;
  if (filters.maxPrice !== null && facts.price > filters.maxPrice) return false;
  if (filters.benefit !== null && !facts.benefits.includes(filters.benefit)) return false;
  return true;
}

/** Rank of each package (0 first) under a sort; ties keep the page's order. */
export function ranks(all: readonly PackageFacts[], sort: SortKey): Map<string, number> {
  const order = all.map((facts, index) => ({ facts, index }));
  const key = ({ facts }: { facts: PackageFacts }) => {
    switch (sort) {
      case "price-low":
        return facts.price;
      case "price-high":
        return -facts.price;
      case "speed":
        return -(facts.speed ?? 0);
      default:
        return 0;
    }
  };
  order.sort((a, b) => key(a) - key(b) || a.index - b.index);
  return new Map(order.map(({ facts }, rank) => [facts.id, rank]));
}
