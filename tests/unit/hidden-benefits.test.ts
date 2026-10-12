import { describe, expect, it } from "vitest";

import { content } from "@/lib/content";
import { parseDocument } from "@/lib/content/draft-model";
import { benefitOptions, packageFacts, shownBenefits } from "@/lib/content/package-facts";

// A benefit can be hidden on one package: it stays in the package's list, for the back office to show
// again, and visitors do not see it. Everything public reads shownBenefits.

const withBenefits = content.catalog.find((item) => item.benefits.length >= 2)!;
const [first, second] = withBenefits.benefits;

describe("a benefit hidden on a package", () => {
  it("is left out of what visitors see, and the rest keep their order", () => {
    expect(shownBenefits(withBenefits)).toEqual(withBenefits.benefits);
    expect(shownBenefits({ ...withBenefits, hiddenBenefits: [] })).toEqual(withBenefits.benefits);
    expect(shownBenefits({ ...withBenefits, hiddenBenefits: [first] })).toEqual(withBenefits.benefits.slice(1));
    expect(shownBenefits({ ...withBenefits, hiddenBenefits: withBenefits.benefits })).toEqual([]);
  });

  it("stays in the package, so it can be shown again", () => {
    const hidden = { ...withBenefits, hiddenBenefits: [second] };
    expect(hidden.benefits).toContain(second);
    expect(shownBenefits({ ...hidden, hiddenBenefits: [] })).toContain(second);
  });

  it("is not something to filter or compare by", () => {
    const hidden = { ...withBenefits, hiddenBenefits: [first] };
    expect(packageFacts(hidden).benefits).not.toContain(first);
    const other = { ...withBenefits, id: "other", benefits: withBenefits.benefits.filter((id) => id !== first) };
    // Hidden on the one and absent from the other: no visitor can tell them apart by it.
    expect(benefitOptions([hidden, other])).not.toContain(first);
    expect(benefitOptions([withBenefits, other])).toContain(first);
  });

  it("is part of the package's document, and a package without the setting still reads", () => {
    expect(parseDocument(`package:${withBenefits.id}`, { ...withBenefits, hiddenBenefits: [first] }).ok).toBe(true);
    expect(parseDocument(`package:${withBenefits.id}`, withBenefits).ok).toBe(true);
    expect(parseDocument(`package:${withBenefits.id}`, { ...withBenefits, hiddenBenefits: ["Not An Id"] }).ok).toBe(false);
  });
});
