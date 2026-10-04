import { pageRoute } from "../../_site/page-route";

// Written by scripts/routes/generate.mjs.
const route = pageRoute("terms", "th");

export const generateMetadata = route.generateMetadata;
export default route.Page;
