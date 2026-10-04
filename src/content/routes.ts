// Public pages and their document ids. The paths are the old site's URLs and
// must keep working (tests/e2e/public-routes.spec.ts); English adds /en.
export const publicPages = [
  { path: "/", page: "home" },
  { path: "/broadband", page: "broadband-new" },
  { path: "/broadband-old", page: "broadband-existing" },
  { path: "/monthy", page: "mobile-monthly" },
  { path: "/topup", page: "mobile-prepaid" },
  { path: "/wEnergy", page: "solar" },
  { path: "/service", page: "contact" },
  { path: "/wifiService", page: "apply-with-agent" },
  { path: "/termsAndPrivacy", page: "terms" },
] as const;

export type PublicPath = (typeof publicPages)[number]["path"];
