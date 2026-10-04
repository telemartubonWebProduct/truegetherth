import type { CatalogPackage } from "@/lib/content/schema";

import { broadbandExisting, broadbandNew } from "./broadband";
import { mobileMonthly, mobilePrepaid } from "./mobile";
import { solarPackages } from "./solar";

export const catalog: CatalogPackage[] = [
  ...broadbandNew,
  ...broadbandExisting,
  ...mobileMonthly,
  ...mobilePrepaid,
  ...solarPackages,
];
