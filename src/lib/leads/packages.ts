import { detailPackagesIn } from "@/lib/content/lookup";
import type { CatalogPackage, SiteContent } from "@/lib/content/schema";

import type { LeadService } from "./form";

/** Packages a request may name: the ones with a page of their own. */
export function requestablePackages(content: SiteContent): CatalogPackage[] {
  return detailPackagesIn(content);
}

export function serviceOf(item: CatalogPackage): LeadService {
  if (item.category.startsWith("broadband")) return "broadband";
  if (item.category.startsWith("mobile")) return "mobile";
  return "solar";
}
