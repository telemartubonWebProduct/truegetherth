import { z } from "zod";

import { theme, tone } from "./theme";

// Content model of the public site (docs/renovation/ARCHITECTURE.md §3, §5).
// Pages are fixed templates: documents fill named slots, and each repeatable
// item has a stable id so the Mirror editor (M3) can bind fields as
// pageId + slot + itemId + field. In M2 the published documents live in
// src/content; M3 moves drafts and releases into Supabase with this schema.

/** Text shown to visitors, in both site languages. Neither may be empty. */
export const localizedText = z.strictObject({
  th: z.string().trim().min(1),
  en: z.string().trim().min(1),
});
export type LocalizedText = z.infer<typeof localizedText>;

/** Lowercase kebab-case id: stable across label edits. */
const stableIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const stableId = z.string().regex(stableIdPattern, "ใช้ตัวพิมพ์เล็ก a-z ตัวเลข และขีดกลางคั่นคำ");

// References to other documents. Separate schema objects so the Mirror editor
// can recognise them (by identity) and offer a picker instead of a text box.
export const mediaRef = z.string().regex(stableIdPattern, "รหัสรูปไม่ถูกต้อง");
export const benefitRef = z.string().regex(stableIdPattern, "รหัสสิทธิประโยชน์ไม่ถูกต้อง");
export const packageRef = z.string().regex(stableIdPattern, "รหัสแพ็กเกจไม่ถูกต้อง");

/** A calendar day in Thailand, such as 2026-10-31. */
export const isoDate = z.iso.date("ใช้วันที่แบบ ปปปป-ดด-วว เช่น 2026-10-31");

/** In-page anchor; some legacy anchors are camelCase (#socialInternet). */
export const anchorId = z.string().regex(/^[A-Za-z][A-Za-z0-9-]*$/, "ชื่อหมวดในหน้าใช้ a-z ตัวเลข และขีดกลาง");

/** Links opened from the site: https only, so no script or data URL can reach an href. */
export const httpsUrl = z.url({ protocol: /^https$/, hostname: z.regexes.domain, error: "ใช้ลิงก์ที่ขึ้นต้นด้วย https://" });

// Media -----------------------------------------------------------------------

export const mediaKind = z.enum([
  "product", // genuine product or device image
  "brand", // logo of truegetherth, True, W&W Energy or a partner
  "photo", // genuine photograph (installation sites, rooftops)
  "promo", // campaign artwork with text baked in
  "generated", // AI-generated supporting image, never a product stand-in
  "illustration", // drawn for this site
]);

/**
 * Where a picture lives: a file of this site ("/…"), or one uploaded from the
 * editor to the Supabase Storage bucket `media` (https; plain http only on the
 * local test stack).
 */
export const mediaSrc = z
  .string()
  .regex(
    /^(\/(?!\/).*|https:\/\/[a-z0-9.-]+\/storage\/v1\/object\/public\/media\/[A-Za-z0-9/._-]+|http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/storage\/v1\/object\/public\/media\/[A-Za-z0-9/._-]+)$/,
    "ที่อยู่ไฟล์รูปต้องเป็นไฟล์ของเว็บ หรือไฟล์ที่อัปโหลดในคลังสื่อ",
  );

export const mediaAsset = z.strictObject({
  src: mediaSrc,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: localizedText,
  kind: mediaKind,
  /** Where the file came from, for rights and provenance review. */
  source: z.string().min(1),
});
export type MediaAsset = z.infer<typeof mediaAsset>;

// Links and calls to action -----------------------------------------------------

export const contactChannel = z.enum(["line-sales", "line-service", "phone-sales", "email", "facebook"]);
export type ContactChannel = z.infer<typeof contactChannel>;

export const linkTarget = z.discriminatedUnion("kind", [
  /** A page of this site; the renderer adds the language prefix. */
  z.strictObject({
    kind: z.literal("page"),
    path: z.string().regex(/^\/[A-Za-z0-9/-]*$/, "ที่อยู่หน้าในเว็บต้องขึ้นต้นด้วย /"),
    hash: anchorId.optional(),
  }),
  z.strictObject({
    kind: z.literal("external"),
    url: httpsUrl,
  }),
  /** One of the contact channels managed once in site settings. */
  z.strictObject({ kind: z.literal("contact"), channel: contactChannel }),
]);
export type LinkTarget = z.infer<typeof linkTarget>;

export const cta = z.strictObject({
  /** Stable tracking id: analytics keeps it when the label changes. */
  id: stableId,
  label: localizedText,
  target: linkTarget,
  style: z.enum(["primary", "secondary"]),
});
export type Cta = z.infer<typeof cta>;

export const link = z.strictObject({ id: stableId, label: localizedText, target: linkTarget });
export type Link = z.infer<typeof link>;

export const seo = z.strictObject({
  title: localizedText,
  description: localizedText,
  image: mediaRef.optional(),
  noindex: z.boolean().optional(),
});
export type Seo = z.infer<typeof seo>;

// Catalog ------------------------------------------------------------------------

export const categoryId = z.enum([
  "broadband-new",
  "broadband-existing",
  "mobile-monthly",
  "mobile-prepaid",
  "solar",
]);
export type CategoryId = z.infer<typeof categoryId>;

const speed = z.strictObject({ value: z.number().positive(), unit: z.enum(["Mbps", "Gbps"]) });

export const price = z.strictObject({
  amount: z.number().nonnegative(),
  /** Regular price when the offer shows a discount. */
  regularAmount: z.number().positive().optional(),
  per: z.enum(["month", "package", "once"]),
  /** "unknown" where the source never said; the page then shows no VAT line. */
  vat: z.enum(["included", "excluded", "unknown"]),
});
export type Price = z.infer<typeof price>;

export const benefit = z.strictObject({
  label: localizedText,
  icon: mediaRef,
});
export type Benefit = z.infer<typeof benefit>;

export const reviewStatus = z.enum([
  "verified", // confirmed by the business
  "unverified", // imported from the old site; shown until the business confirms it
  "hidden", // imported but inconsistent or duplicated; not shown until fixed
]);

export const catalogPackage = z.strictObject({
  id: stableId,
  category: categoryId,
  group: stableId,
  name: localizedText,
  audience: localizedText.optional(),
  speed: z.strictObject({ download: speed, upload: speed }).optional(),
  /** Data, calls or app usage that the package gives. */
  allowance: localizedText.optional(),
  validity: localizedText.optional(),
  contract: localizedText.optional(),
  price,
  benefits: z.array(benefitRef),
  details: z.array(localizedText),
  conditions: z.array(localizedText),
  /** USSD code to subscribe from the phone, such as *900*7129#. */
  dialCode: z
    .string()
    .regex(/^\*[0-9*]+#$/, "รหัสกดขึ้นต้นด้วย * และลงท้ายด้วย # เช่น *900*7129#")
    .optional(),
  /** Its picture: on its own page, and on its card when it is recommended on the home page. */
  image: mediaRef.optional(),
  /** Shown to visitors only from this day, and only until this day (both included); either may be left out. */
  showFrom: isoDate.optional(),
  showUntil: isoDate.optional(),
  /** Legacy record this package was imported from. */
  source: z.strictObject({ file: z.string().min(1), entry: z.string().min(1) }),
  review: z.strictObject({ status: reviewStatus, notes: z.array(z.string().min(1)) }),
});
export type CatalogPackage = z.infer<typeof catalogPackage>;

// Site settings --------------------------------------------------------------------

/** Interface copy that visitors read (labels, units, empty states). */
export const uiKeys = [
  "skipToContent",
  "menu",
  "mainNavigation",
  "languageSwitch",
  "speed",
  "audience",
  "allowance",
  "validity",
  "contract",
  "benefits",
  "details",
  "conditions",
  "dialCode",
  "perMonth",
  "baht",
  "vatExcluded",
  "vatIncluded",
  "regularPrice",
  "offerPrice",
  "emptyGroup",
  "jumpTo",
  "contents",
  "call",
  "email",
  "chatOnLine",
  "lineId",
  "facebook",
  "opensInNewTab",
  "footerContact",
  "packageDetails",
  "recommended",
  "findPackage",
  "filterSpeed",
  "filterPrice",
  "filterBenefit",
  "filterAny",
  "sortBy",
  "sortRecommended",
  "sortPriceLow",
  "sortPriceHigh",
  "sortSpeed",
  "resultCount",
  "clearFilters",
  "noMatches",
  "compareAdd",
  "compareChosen",
  "compareOpen",
  "compareMore",
  "compareLimit",
  "compareClear",
  "close",
  "breadcrumb",
  "homeLink",
  "unverifiedNote",
  "packageContactNote",
  "callSales",
  "requestCallback",
] as const;
export type UiKey = (typeof uiKeys)[number];

const ui = z.strictObject(Object.fromEntries(uiKeys.map((key) => [key, localizedText])) as Record<UiKey, typeof localizedText>);

/** Google Ads `send_to`: the account (AW-…) and the conversion's label. */
const adsConversionPattern = /^(AW-[0-9]+)\/[A-Za-z0-9_-]+$/;

/** Copy of the call-back form (M5); the fields themselves are fixed. */
export const leadFormCopy = z.strictObject({
  name: localizedText,
  phone: localizedText,
  phoneHint: localizedText,
  province: localizedText,
  provincePlaceholder: localizedText,
  area: localizedText,
  areaHint: localizedText,
  service: localizedText,
  services: z.strictObject({ broadband: localizedText, mobile: localizedText, solar: localizedText, other: localizedText }),
  package: localizedText,
  packageRemove: localizedText,
  time: localizedText,
  times: z.strictObject({ anytime: localizedText, morning: localizedText, afternoon: localizedText, evening: localizedText }),
  message: localizedText,
  optional: localizedText,
  consent: localizedText,
  policyLink: localizedText,
  submit: localizedText,
  sending: localizedText,
  successHeading: localizedText,
  successBody: localizedText,
  another: localizedText,
  errors: z.strictObject({
    required: localizedText,
    phone: localizedText,
    consent: localizedText,
    tooLong: localizedText,
    rateLimited: localizedText,
    failed: localizedText,
    unavailable: localizedText,
    preview: localizedText,
  }),
});
export type LeadFormCopy = z.infer<typeof leadFormCopy>;

/** The cookie banner (PDPA). Changing policyVersion asks every visitor again. */
export const consentCopy = z.strictObject({
  policyVersion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "ใช้วันที่ เช่น 2026-10-02"),
  heading: localizedText,
  body: localizedText,
  policyLink: localizedText,
  acceptAll: localizedText,
  rejectAll: localizedText,
  customize: localizedText,
  save: localizedText,
  necessaryTitle: localizedText,
  necessaryBody: localizedText,
  alwaysOn: localizedText,
  analyticsTitle: localizedText,
  analyticsBody: localizedText,
  adsTitle: localizedText,
  adsBody: localizedText,
  settingsLink: localizedText,
});
export type ConsentCopy = z.infer<typeof consentCopy>;

const navItem = z.strictObject({
  id: stableId,
  label: localizedText,
  target: linkTarget.optional(),
  children: z.array(link).optional(),
});

export const siteSettings = z.strictObject({
  brand: z.strictObject({ name: localizedText, legalName: localizedText, logo: mediaRef }),
  contact: z.strictObject({
    lineSales: httpsUrl,
    lineService: httpsUrl,
    lineId: z.string().regex(/^@[a-z0-9]+$/, "ไลน์ไอดีขึ้นต้นด้วย @ ตามด้วยตัวพิมพ์เล็กหรือตัวเลข"),
    lineQr: mediaRef,
    phones: z.array(
      z.strictObject({
        number: z.string().regex(/^0[0-9]{8,9}$/, "เบอร์โทร 9–10 หลัก ขึ้นต้นด้วย 0 ไม่มีขีด"),
        label: localizedText,
      }),
    ),
    email: z.email(),
    facebook: httpsUrl,
    /** Where the company's head office is, in a few words (no street address is published). */
    office: localizedText,
    /** A map of the head office. */
    mapUrl: httpsUrl,
    /** When the team answers. */
    hours: localizedText,
  }),
  navigation: z.array(navItem),
  headerCta: cta,
  footer: z.strictObject({
    about: localizedText,
    groups: z.array(z.strictObject({ id: stableId, heading: localizedText, links: z.array(link) })),
    copyright: localizedText,
  }),
  contactBand: z.strictObject({ heading: localizedText, description: localizedText, tone }),
  leadForm: leadFormCopy,
  consent: consentCopy,
  ui,
  seo: z.strictObject({ siteName: localizedText, description: localizedText, image: mediaRef }),
  /** Brand colours; every text/background pair must keep 4.5:1. */
  theme,
  /** Third-party tags. The editor shows only the lead conversion as editable (src/components/editor/schema-walk.ts). */
  integrations: z
    .strictObject({
      googleAdsId: z.string().regex(/^AW-[0-9]+$/),
      /** Google Analytics 4 web stream; reports count the production domain only. */
      ga4MeasurementId: z.string().regex(/^G-[A-Z0-9]+$/).optional(),
      /** Google Ads `send_to` of the conversion counted when a visitor asks to be contacted: a sent call-back form, or a click on LINE or a phone number. */
      googleAdsLeadConversion: z.string().regex(adsConversionPattern, "ใช้รูปแบบ AW-ตัวเลข/รหัส conversion เช่น AW-123456789/AbC-12_x"),
    })
    .superRefine((value, context) => {
      // The tag only configures googleAdsId, so a conversion of another account would go nowhere.
      // Zod runs this after field errors too; a malformed value already has its message.
      const account = adsConversionPattern.exec(String(value.googleAdsLeadConversion))?.[1];
      if (account === undefined || account === value.googleAdsId) return;
      context.addIssue({ code: "custom", path: ["googleAdsLeadConversion"], message: `ต้องเป็นบัญชี Google Ads เดียวกับแท็กของเว็บ (${value.googleAdsId}/…)` });
    }),
});
export type SiteSettings = z.infer<typeof siteSettings>;

// Pages ----------------------------------------------------------------------------

const packageGroup = z.strictObject({
  id: stableId,
  heading: localizedText.optional(),
  description: localizedText.optional(),
  category: categoryId,
  group: stableId,
});

const packageSection = z.strictObject({
  /** Also the in-page anchor; legacy anchors are kept verbatim. */
  id: anchorId,
  heading: localizedText,
  description: localizedText.optional(),
  groups: z.array(packageGroup).min(1),
  notes: z.array(localizedText),
  tone,
});

export const packagePage = z.strictObject({
  id: stableId,
  path: z.string().startsWith("/"),
  seo,
  hero: z.strictObject({ heading: localizedText, description: localizedText, tone }),
  /** Card layout: "compare" lines fields up across cards, "compact" suits long lists. */
  layout: z.enum(["compare", "compact"]),
  packageCta: cta,
  sections: z.array(packageSection).min(1),
});
export type PackagePage = z.infer<typeof packagePage>;

/**
 * A tab of the home page's recommended packages. Its cards are the packages
 * recommended in the catalog (siteContent.featured) that belong to these
 * categories; price, speed, terms and picture come from each package as it is.
 */
const promoTab = z.strictObject({
  id: stableId,
  title: localizedText,
  categories: z.array(categoryId).min(1),
  /** Under the cards, such as who provides the service. */
  remark: localizedText.optional(),
  packageCta: cta,
  viewAll: cta,
});

/** A step of "how it works". */
const homeStep = z.strictObject({ id: stableId, title: localizedText, description: localizedText });

export const homePage = z.strictObject({
  id: z.literal("home"),
  path: z.literal("/"),
  seo,
  /** The opening screen: an oil painting in layers, a goddess lifting the router among figures that drift a little. */
  hero: z.strictObject({
    /** Small line over the heading. */
    eyebrow: localizedText,
    /** The page's main heading, one entry for each line. */
    heading: z.array(localizedText).min(1).max(3),
    primaryCta: cta,
    secondaryCta: cta,
    /** Pills beside the heading: what the business offers, each a link. */
    tags: z.array(link).max(4),
    /** The painting's sky; the page lays the figures over it. Its description is of the whole picture. */
    visual: mediaRef,
    /** Visible line by the picture, such as "AI-generated illustration, not a photograph". */
    visualNote: localizedText,
  }),
  /** One sentence that fills with ink as visitors scroll. */
  manifesto: z.strictObject({ label: localizedText, sentence: localizedText }),
  /** Recommended packages: one tab per category, and in each a row of picture cards the scroll walks along. */
  promos: z.strictObject({
    label: localizedText,
    heading: localizedText,
    /** Beside the heading, such as how to move along the row. */
    description: localizedText,
    tabs: z.array(promoTab).min(1).max(4),
  }),
  /** How it works: four steps that light up in turn, beside a slip that fills itself in. */
  steps: z.strictObject({
    label: localizedText,
    heading: localizedText,
    description: localizedText,
    items: z.array(homeStep).length(4),
    /** The slip is an illustration of a request, not a document: its lines appear as the steps are reached. */
    slip: z.strictObject({
      title: localizedText,
      /** Beside the brand's name at its top, such as "example". */
      caption: localizedText,
      /** Filled in at the first step. */
      service: z.strictObject({ label: localizedText, value: localizedText }),
      /** Waiting at the second step, done at the third. */
      area: z.strictObject({ label: localizedText, waiting: localizedText, done: localizedText }),
      /** Waiting at the third step, done at the fourth. */
      booking: z.strictObject({ label: localizedText, waiting: localizedText, done: localizedText }),
      statusLabel: localizedText,
      /** The status line before any step and after each of the four. */
      statuses: z.array(localizedText).length(5),
      /** Along the perforation the stub tears off at. */
      tear: localizedText,
    }),
  }),
  /** What the business offers, as chapters that take turns while visitors scroll. */
  services: z.strictObject({
    label: localizedText,
    heading: localizedText,
    items: z
      .array(z.strictObject({ id: stableId, title: localizedText, description: localizedText, provider: localizedText.optional(), target: linkTarget }))
      .min(3)
      .max(4),
  }),
  /** A plain table of one group of packages from the catalog. */
  prices: z.strictObject({
    label: localizedText,
    heading: localizedText,
    /** Headings of the name and price columns; speed and contract use the interface words. */
    columns: z.strictObject({ package: localizedText, price: localizedText }),
    category: categoryId,
    group: stableId,
    viewAll: cta,
  }),
  faq: z.strictObject({
    label: localizedText,
    heading: localizedText,
    items: z.array(z.strictObject({ id: stableId, question: localizedText, answer: localizedText })).min(1),
  }),
});
export type HomePage = z.infer<typeof homePage>;

export const solarPage = z.strictObject({
  id: z.literal("solar"),
  path: z.literal("/wEnergy"),
  seo,
  hero: z.strictObject({
    heading: localizedText,
    description: localizedText,
    provider: localizedText,
    image: mediaRef,
    cta,
    tone,
  }),
  about: z.strictObject({ heading: localizedText, body: z.array(localizedText), image: mediaRef, tone }),
  stats: z.strictObject({
    heading: localizedText,
    items: z.array(z.strictObject({ id: stableId, value: z.string().min(1), label: localizedText })),
  }),
  process: z.strictObject({
    heading: localizedText,
    description: localizedText,
    image: mediaRef,
    steps: z.array(z.strictObject({ id: stableId, title: localizedText, description: localizedText })),
    tone,
  }),
  packages: z.strictObject({
    id: anchorId,
    heading: localizedText,
    group: stableId,
    packageCta: cta,
    notes: z.array(localizedText),
    tone,
  }),
  bundle: z.strictObject({
    heading: localizedText,
    description: localizedText,
    items: z.array(localizedText),
    image: mediaRef,
    tone,
  }),
  knowledge: z.strictObject({
    heading: localizedText,
    articles: z.array(
      z.strictObject({
        id: stableId,
        title: localizedText,
        body: z.array(localizedText),
        list: z.array(localizedText),
        images: z.array(mediaRef),
      }),
    ),
    tone,
  }),
});
export type SolarPage = z.infer<typeof solarPage>;

export const contactPage = z.strictObject({
  id: z.literal("contact"),
  path: z.literal("/service"),
  seo,
  hero: z.strictObject({ heading: localizedText, description: localizedText, tone }),
  channels: z.strictObject({
    heading: localizedText,
    /** Contact channels in display order; addresses come from site settings. */
    items: z
      .array(
        z.strictObject({
          id: stableId,
          channel: contactChannel,
          title: localizedText,
          description: localizedText,
        }),
      )
      .min(1),
    tone,
  }),
  /** The call-back request form under the channels (M5); its copy is site.leadForm. */
  callback: z.strictObject({ heading: localizedText, description: localizedText, tone }),
});
export type ContactPage = z.infer<typeof contactPage>;

export const agentPage = z.strictObject({
  id: z.literal("apply-with-agent"),
  path: z.literal("/wifiService"),
  seo,
  hero: z.strictObject({
    heading: localizedText,
    description: localizedText,
    image: mediaRef,
    primaryCta: cta,
    secondaryCta: cta,
    tone,
  }),
  steps: z.strictObject({
    heading: localizedText,
    items: z.array(z.strictObject({ id: stableId, title: localizedText, description: localizedText })).length(3),
    tone,
  }),
});
export type AgentPage = z.infer<typeof agentPage>;

export const legalPage = z.strictObject({
  id: z.literal("terms"),
  path: z.literal("/termsAndPrivacy"),
  seo,
  heading: localizedText,
  intro: localizedText,
  sections: z.array(
    z.strictObject({
      id: stableId,
      heading: localizedText,
      paragraphs: z.array(localizedText),
      list: z.array(localizedText),
    }),
  ),
  disclaimer: localizedText,
});
export type LegalPage = z.infer<typeof legalPage>;

// Whole site ----------------------------------------------------------------------

/** Everything the public site renders. Published content and a draft share this shape. */
export const siteContent = z.strictObject({
  site: siteSettings,
  media: z.record(stableId, mediaAsset),
  benefits: z.record(stableId, benefit),
  catalog: z.array(catalogPackage),
  /** Packages recommended on the home page, in the order of their cards (ids no longer in the catalog are passed over). */
  featured: z.array(packageRef),
  pages: z.strictObject({
    home: homePage,
    packages: z.array(packagePage),
    solar: solarPage,
    contact: contactPage,
    agent: agentPage,
    terms: legalPage,
  }),
});
export type SiteContent = z.infer<typeof siteContent>;
