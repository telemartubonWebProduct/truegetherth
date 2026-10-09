import type { CatalogPackage } from "@/lib/content/schema";

import type { MediaId } from "../media";

// The packages recommended on the home page, in the order of their cards, each
// with the picture its card shows. These are the cards the home page had when
// its tabs listed them one by one; the back office (Packages and promos) now
// adds, removes and orders them, and the picture is the package's own.
const cards: [packageId: string, image: MediaId][] = [
  // Home internet
  ["fiber-500-499", "flow-s2-work-from-home"],
  ["fiber-700-599", "flow-s1-family-streaming"],
  ["fiber-1g-799", "flow-s3-gamer"],
  ["fiber-500-650-cctv", "flow-s6-technician"],
  ["fiber-500-999-netflix", "flow-s5-friends-phone"],
  ["fiber-1500-1199", "flow-s8-fibre"],
  // Postpaid mobile
  ["m-boost-60gb", "flow-s4-mobile-city"],
  ["m-unlimited-7d", "flow-s8-fibre"],
  ["m-social-4-apps", "flow-s5-friends-phone"],
  ["m-asian-combo-179", "flow-s1-family-streaming"],
  ["m-up2u-true-coffee", "flow-s2-work-from-home"],
  ["m-call-200", "flow-s7-support"],
  // Prepaid
  ["p-net-20mbps", "flow-s4-mobile-city"],
  ["p-net-10mbps", "flow-s8-fibre"],
  ["p-net-call-6mbps", "flow-s5-friends-phone"],
  ["p-call-200", "flow-s7-support"],
  ["p-game-prohub", "flow-s3-gamer"],
  // Solar
  ["solar-3kwp", "solar-rooftop"],
  ["solar-5kwp", "solar-aerial"],
  ["solar-10kwp", "solar-rooftop"],
];

export const featured: string[] = cards.map(([packageId]) => packageId);

const pictures = new Map<string, MediaId>(cards);

/** Each recommended package with the picture of its card; a package that has a picture of its own keeps it. */
export function withCardPictures(catalog: CatalogPackage[]): CatalogPackage[] {
  return catalog.map((item) => {
    const image = pictures.get(item.id);
    return image && item.image === undefined ? { ...item, image } : item;
  });
}
