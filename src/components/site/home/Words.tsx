import type { CSSProperties, ElementType } from "react";

import type { Locale } from "@/lib/i18n/locales";

type WordsProps = {
  text: string;
  locale: Locale;
  as?: ElementType;
  className?: string;
  id?: string;
  /** Marks the element as the view of one content field in the Mirror editor. */
  bind?: { "data-edit"?: string };
};

/**
 * A line of text split into words that rise one after another when it comes
 * into view (ScrollDriver adds `is-in`). Thai has no spaces between words, so
 * the split uses the language's own word boundaries (Intl.Segmenter), which
 * also gives the browser sensible places to wrap. Spaces and punctuation stay
 * plain text, so the sentence reads the same to assistive technology.
 */
export function Words({ text, locale, as: Tag = "span", className = "", id, bind }: WordsProps) {
  const segments = [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)];
  let index = 0;
  return (
    <Tag className={`words ${className}`.trim()} id={id} data-words="" {...bind}>
      {segments.map((part, key) =>
        part.isWordLike ? (
          <span key={key} className="w" style={{ "--i": index++ } as CSSProperties}>
            {part.segment}
          </span>
        ) : (
          part.segment
        ),
      )}
    </Tag>
  );
}
