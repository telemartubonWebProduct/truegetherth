import { detailPackagesIn } from "@/lib/content/lookup";
import type { CatalogPackage, SiteContent } from "@/lib/content/schema";

import type { LeadService } from "./form";

/** Packages a request may name: the ones with a page of their own on `today` (a day in Thailand). */
export function requestablePackages(content: SiteContent, today: string): CatalogPackage[] {
  return detailPackagesIn(content, today);
}

export function serviceOf(item: CatalogPackage): LeadService {
  if (item.category.startsWith("broadband")) return "broadband";
  if (item.category.startsWith("mobile")) return "mobile";
  return "solar";
}
