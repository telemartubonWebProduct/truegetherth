import { CONSENT_COOKIE, serializeConsent, type ConsentChoice } from "../../../src/lib/analytics/consent";
import { content } from "../../../src/lib/content";
import { siteUrl } from "../../../src/lib/seo/metadata";

// The cookie banner (M5) appears until the visitor chooses. Every suite starts
// with a choice already made (playwright.config.ts: necessary cookies only),
// so the banner stays out of the way; the consent suite starts without one,
// and suites that check Google tags agree to them.

export const necessaryOnly: ConsentChoice = { analytics: false, ads: false, chat: false };
export const everything: ConsentChoice = { analytics: true, ads: true, chat: true };

/** Hosts the suites open: the server under test and the production domain served by serveAt(). */
const hosts = ["127.0.0.1", "localhost", siteUrl().hostname];

export function consentState(choice: ConsentChoice) {
  const value = serializeConsent({ ...choice, version: content.site.consent.policyVersion, at: Math.floor(Date.now() / 1000) });
  return {
    cookies: hosts.map((domain) => ({ name: CONSENT_COOKIE, value, domain, path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" as const })),
    origins: [],
  };
}

/** A visitor who has not chosen yet. */
export const noChoice = { cookies: [], origins: [] };
