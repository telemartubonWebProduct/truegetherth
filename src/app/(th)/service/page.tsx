import { pageRoute } from "../../_site/page-route";

// Written by scripts/routes/generate.mjs.
const route = pageRoute("contact", "th");

export const generateMetadata = route.generateMetadata;
export default route.Page;
