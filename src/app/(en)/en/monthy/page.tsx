import { pageRoute } from "../../../_site/page-route";

// Written by scripts/routes/generate.mjs.
const route = pageRoute("mobile-monthly", "en");

export const generateMetadata = route.generateMetadata;
export default route.Page;
