"use client";

import { Children, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

type Tab = { id: string; title: string; bind: { "data-edit"?: string } };

type RailTabsProps = {
  /** Name of the tab list for screen readers (the section heading). */
  label: string;
  /** The section's label and heading. */
  head: ReactNode;
  /** Beside the heading: how to move along the row. */
  hint: ReactNode;
  tabs: Tab[];
  /** One row of cards per tab, in the same order. */
  children: ReactNode;
  /** Under each row: the tab's remark and its "see all" button, in the same order. */
  more: ReactNode[];
  /** The line under everything, such as the note on unconfirmed prices. */
  note: ReactNode;
  /** Every row at once, each under its title (the Mirror editor). */
  stacked: boolean;
};

/**
 * The recommended packages of the home page: a tab per category (WAI-ARIA
 * tabs: arrow keys, Home and End move between them) and, in the open tab, a
 * row of cards that the page's scroll walks along. The server renders the
 * first tab open. ScrollDriver measures whichever row is showing, so it is
 * told when the tab changes.
 */
export function RailTabs({ label, head, hint, tabs, children, more, note, stacked }: RailTabsProps) {
  const base = useId();
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.dispatchEvent(new Event("resize"));
  }, [active]);

  const meter = (
    <div className="meter" aria-hidden="true">
      <span />
    </div>
  );

  if (stacked) {
    return (
      <>
        <header className="rail-head">
          <div>{head}</div>
          {hint}
        </header>
        <div className="rail-stack">
          {panels.map((panel, index) => (
            <div key={tabs[index].id} className="rail-panel" data-rail-panel="">
              <p className="rail-panel-title" {...tabs[index].bind}>
                {tabs[index].title}
              </p>
              {panel}
              <div className="rail-more">{more[index]}</div>
            </div>
          ))}
        </div>
        <div className="rail-foot">{note}</div>
      </>
    );
  }

  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: active === last ? 0 : active + 1, ArrowLeft: active === 0 ? last : active - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    buttons.current[next]?.focus();
  };

  return (
    <>
      <header className="rail-head">
        <div>{head}</div>
        <div className="rail-controls">
          {tabs.length > 1 ? (
            <div role="tablist" aria-label={label} className="rail-tabs">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(element) => {
                    buttons.current[index] = element;
                  }}
                  type="button"
                  role="tab"
                  id={`${base}-tab-${tab.id}`}
                  aria-selected={index === active}
                  aria-controls={`${base}-panel-${tab.id}`}
                  tabIndex={index === active ? 0 : -1}
                  className="rail-tab"
                  onClick={() => setActive(index)}
                  onKeyDown={move}
                >
                  {tab.title}
                </button>
              ))}
            </div>
          ) : null}
          {hint}
        </div>
      </header>
      {panels.map((panel, index) => (
        <div
          key={tabs[index].id}
          role={tabs.length > 1 ? "tabpanel" : undefined}
          id={`${base}-panel-${tabs[index].id}`}
          aria-labelledby={tabs.length > 1 ? `${base}-tab-${tabs[index].id}` : undefined}
          hidden={index !== active}
          className="rail-panel"
          data-rail-panel=""
        >
          {/* Shown only where scripts are off and the tabs cannot switch (landing.css). */}
          {tabs.length > 1 ? <p className="rail-panel-title">{tabs[index].title}</p> : null}
          {panel}
        </div>
      ))}
      <div className="rail-foot">
        {meter}
        <div className="rail-more">{more[active]}</div>
        {note}
      </div>
    </>
  );
}
