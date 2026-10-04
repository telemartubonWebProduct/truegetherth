"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  allGranted,
  CONSENT_CHANGE_EVENT,
  CONSENT_COOKIE,
  CONSENT_OPEN_EVENT,
  clearGoogleCookies,
  noneGranted,
  parseConsent,
  withdrawsConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/analytics/consent";
import type { ConsentCopy } from "@/lib/content/schema";

/** The banner's words in the page's language. */
export type ConsentText = Record<Exclude<keyof ConsentCopy, "policyVersion">, string>;

type ConsentBannerProps = {
  text: ConsentText;
  policyHref: string;
  policyVersion: string;
};

const SERVER = "\u0000server";

function subscribe(onChange: () => void) {
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
}

/** The raw cookie value: a string, so React compares snapshots by value. */
function cookieValue(): string {
  for (const part of document.cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === CONSENT_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return "";
}

const categories = ["analytics", "ads", "chat"] as const;

/**
 * Cookie consent (PDPA). Shown until the visitor chooses, for this version of
 * the privacy policy; accepting and refusing are equally easy, and nothing
 * optional loads before a choice. "Cookie settings" in the footer opens it
 * again to change or withdraw consent; withdrawing reloads the page so the
 * tags already loaded are gone, and removes Google's cookies.
 */
export function ConsentBanner({ text, policyHref, policyVersion }: ConsentBannerProps) {
  const stored = useSyncExternalStore(subscribe, cookieValue, () => SERVER);
  const current = stored === SERVER ? null : parseConsent(stored, policyVersion);
  const needsChoice = stored !== SERVER && current === null;

  const [reopened, setReopened] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [choice, setChoice] = useState<ConsentChoice>(noneGranted);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onOpen = () => {
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setChoice(parseConsent(cookieValue(), policyVersion) ?? noneGranted);
      setCustomizing(true);
      setReopened(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, [policyVersion]);

  // Opened on purpose: take the visitor to it. Shown on arrival: do not steal focus.
  useEffect(() => {
    if (reopened) headingRef.current?.focus();
  }, [reopened]);

  if (!needsChoice && !reopened) return null;

  const save = (next: ConsentChoice) => {
    const previous = parseConsent(cookieValue(), policyVersion);
    writeConsent(next, policyVersion);
    setReopened(false);
    setCustomizing(false);
    if (withdrawsConsent(previous, next)) {
      clearGoogleCookies();
      location.reload();
      return;
    }
    returnFocus.current?.focus();
  };

  const titles = { analytics: text.analyticsTitle, ads: text.adsTitle, chat: text.chatTitle };
  const bodies = { analytics: text.analyticsBody, ads: text.adsBody, chat: text.chatBody };

  return (
    <section aria-labelledby="tm-consent-heading" className="tm-consent" data-consent-banner="">
      <h2 id="tm-consent-heading" ref={headingRef} tabIndex={-1} className="text-tm-lead font-semibold outline-none">
        {text.heading}
      </h2>
      <p className="mt-2 text-tm-small text-tm-muted">
        {text.body}{" "}
        <a href={policyHref} className="tm-link font-medium">
          {text.policyLink}
        </a>
      </p>

      {customizing ? (
        <ul className="mt-4 grid gap-3" aria-label={text.customize}>
          <li className="tm-consent-option">
            <span>
              <span className="block font-semibold">{text.necessaryTitle}</span>
              <span className="block text-tm-small text-tm-muted">{text.necessaryBody}</span>
            </span>
            <span className="shrink-0 text-tm-small font-semibold">{text.alwaysOn}</span>
          </li>
          {categories.map((category) => (
            <li key={category}>
              <label className="tm-consent-option cursor-pointer">
                <span>
                  <span className="block font-semibold">{titles[category]}</span>
                  <span className="block text-tm-small text-tm-muted">{bodies[category]}</span>
                </span>
                <input
                  type="checkbox"
                  name={category}
                  className="tm-consent-check"
                  checked={choice[category]}
                  onChange={(event) => setChoice({ ...choice, [category]: event.target.checked })}
                />
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {customizing ? (
          <>
            <button type="button" className="tm-button tm-button-primary" onClick={() => save(choice)}>
              {text.save}
            </button>
            <button type="button" className="tm-button tm-button-secondary" onClick={() => save(allGranted)}>
              {text.acceptAll}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="tm-button tm-button-primary" onClick={() => save(allGranted)}>
              {text.acceptAll}
            </button>
            <button type="button" className="tm-button tm-button-secondary" onClick={() => save(noneGranted)}>
              {text.rejectAll}
            </button>
            <button
              type="button"
              className="tm-link min-h-tm-control px-2 text-tm-small font-semibold"
              onClick={() => {
                setChoice(current ?? noneGranted);
                setCustomizing(true);
              }}
            >
              {text.customize}
            </button>
          </>
        )}
      </div>
    </section>
  );
}

/** The footer's "Cookie settings": opens the banner to change or withdraw consent. */
export function ConsentSettingsButton({ label, className, bind }: { label: string; className?: string; bind?: { "data-edit"?: string } }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} {...bind}>
      {label}
    </button>
  );
}
