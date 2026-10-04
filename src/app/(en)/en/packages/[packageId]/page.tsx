import { packageRoute } from "../../../../_site/package-route";

// Written by scripts/routes/generate.mjs.
const route = packageRoute("en");

// A package published after the build renders on its first visit.
export const dynamicParams = true;
export const generateStaticParams = route.generateStaticParams;
export const generateMetadata = route.generateMetadata;
export default route.Page;
