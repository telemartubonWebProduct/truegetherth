// The visitor's cookie choices (PDPA), kept in a first-party cookie for 180
// days. Analytics (GA4) and advertising (Google Ads, Meta Pixel) load only when the
// visitor agreed to them; a choice made under an older policy
// version counts as no choice, so changing site.consent.policyVersion asks
// everyone again. The cookie is only ever read in the browser.

export const CONSENT_COOKIE = "tm_consent";
/** Dispatched on window with the new choice after the visitor saves one. */
export const CONSENT_CHANGE_EVENT = "tm:consent-change";
/** Dispatched on window to open the cookie settings (the footer's "Cookie settings"). */
export const CONSENT_OPEN_EVENT = "tm:consent-open";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type ConsentChoice = { analytics: boolean; ads: boolean };
export type StoredConsent = ConsentChoice & { version: string; at: number };

export const allGranted: ConsentChoice = { analytics: true, ads: true };
export const noneGranted: ConsentChoice = { analytics: false, ads: false };

const bit = (value: boolean) => (value ? "1" : "0");

/** "2026-10-23.10.1761190000": policy version, analytics/ads, and when (Unix seconds). */
export function serializeConsent(consent: StoredConsent): string {
  return `${consent.version}.${bit(consent.analytics)}${bit(consent.ads)}.${consent.at}`;
}

export function parseConsent(value: string | undefined, version: string): StoredConsent | null {
  // A third digit is the live chat the site had until October 2026: such a choice still stands for the other two.
  const match = /^(\d{4}-\d{2}-\d{2})\.([01])([01])[01]?\.(\d{1,12})$/.exec(value ?? "");
  if (!match || match[1] !== version) return null;
  return { version, analytics: match[2] === "1", ads: match[3] === "1", at: Number(match[4]) };
}

/** The choice in a Cookie header or document.cookie, if it is for this policy version. */
export function consentFromCookies(cookies: string, version: string): StoredConsent | null {
  for (const part of cookies.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CONSENT_COOKIE) return parseConsent(decodeURIComponent(rest.join("=")), version);
  }
  return null;
}

export function readConsent(version: string): StoredConsent | null {
  return consentFromCookies(document.cookie, version);
}

export function writeConsent(choice: ConsentChoice, version: string): StoredConsent {
  const stored: StoredConsent = { ...choice, version, at: Math.floor(Date.now() / 1000) };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(stored)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent<StoredConsent>(CONSENT_CHANGE_EVENT, { detail: stored }));
  return stored;
}

/** True when a category the visitor had agreed to is now refused. */
export function withdrawsConsent(previous: ConsentChoice | null, next: ConsentChoice): boolean {
  if (!previous) return false;
  return (previous.analytics && !next.analytics) || (previous.ads && !next.ads);
}

/** Removes Google's and Meta's measurement cookies from this site and its parent domains. */
export function clearTrackingCookies(): void {
  const names = document.cookie
    .split(";")
    .map((part) => part.trim().split("=")[0])
    .filter((name) => /^(_ga|_gid|_gat|_gcl_|_gac_|_fbp$|_fbc$)/.test(name));
  const labels = location.hostname.split(".");
  const domains = [undefined, ...labels.slice(0, -1).map((_, index) => labels.slice(index).join("."))];
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ""}`;
    }
  }
}
