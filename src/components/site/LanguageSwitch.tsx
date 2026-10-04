import { localizePath, locales, type Locale } from "@/lib/i18n/locales";

const names: Record<Locale, string> = { th: "ไทย", en: "English" };

type LanguageSwitchProps = {
  locale: Locale;
  /** Unprefixed path of the current page, such as "/monthy". */
  path: string;
  label: string;
  tone?: "canvas" | "ink";
};

/**
 * Links to the same page in each language. Plain anchors on purpose: the two
 * languages are separate root layouts, so a client-side transition (and a
 * next/link prefetch) cannot cross between them.
 */
export function LanguageSwitch({ locale, path, label, tone = "canvas" }: LanguageSwitchProps) {
  const idle = tone === "ink" ? "text-tm-on-ink-muted hover:text-tm-on-ink" : "text-tm-muted hover:text-tm-ink";
  const active = tone === "ink" ? "text-tm-on-ink" : "text-tm-ink";
  return (
    <nav aria-label={label}>
      <ul className="flex items-center text-tm-small">
        {locales.map((entry, index) => (
          <li key={entry} className="flex items-center">
            {index > 0 ? (
              <span aria-hidden="true" className={tone === "ink" ? "text-tm-muted" : "text-tm-line"}>
                /
              </span>
            ) : null}
            <a
              href={localizePath(path, entry)}
              hrefLang={entry}
              lang={entry}
              aria-current={entry === locale ? "true" : undefined}
              className={`inline-flex min-h-tm-control items-center px-2 font-medium ${entry === locale ? `${active} underline decoration-tm-red decoration-2 underline-offset-[0.4em]` : idle}`}
            >
              {names[entry]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
