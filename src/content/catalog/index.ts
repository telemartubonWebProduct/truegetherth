import type { CatalogPackage } from "@/lib/content/schema";

import { broadbandExisting, broadbandNew } from "./broadband";
import { withCardPictures } from "./featured";
import { mobileMonthly, mobilePrepaid } from "./mobile";
import { solarPackages } from "./solar";

export const catalog: CatalogPackage[] = withCardPictures([
  ...broadbandNew,
  ...broadbandExisting,
  ...mobileMonthly,
  ...mobilePrepaid,
  ...solarPackages,
]);
