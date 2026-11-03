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
  /** Names of the arrows that move the row back and on, for screen readers. */
  arrows: { previous: string; next: string };
  /** Every row at once, each under its title (the Mirror editor). */
  stacked: boolean;
};

/** The row of cards in a tab's panel. */
const rowIn = (panel: HTMLElement | null | undefined) => panel?.querySelector<HTMLElement>("[data-rail-track]") ?? null;

/**
 * The recommended packages of the home page: a tab per category (WAI-ARIA
 * tabs: arrow keys, Home and End move between them) and, in the open tab, a
 * row of cards that is scrolled sideways on its own (docs/renovation/R12-RAIL-SWIPE.md):
 * a finger, a trackpad, Shift and the wheel, Tab through its links, or the
 * arrows under it. The page's scroll never moves it. The meter and the arrows
 * follow the row's own scroll. The server renders the first tab open; another
 * tab opens at its first card.
 */
export function RailTabs({ label, head, hint, tabs, children, more, note, arrows, stacked }: RailTabsProps) {
  const base = useId();
  const panels = Children.toArray(children);
  const [active, setActive] = useState(0);
  const [ends, setEnds] = useState({ start: true, end: false });
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const rows = useRef<(HTMLDivElement | null)[]>([]);
  const meter = useRef<HTMLSpanElement>(null);
  const opened = useRef(false);

  // The row lies in a section that is laid out only when it comes near the screen (landing.css), and measuring
  // the row from afar would lay it out there and then: while the page starts, that is before anything has been
  // shown. So nothing is measured until the browser says the section is near. Then each frame of the row's own
  // scroll is measured first and written after, on the meter that reads it.
  useEffect(() => {
    const row = rowIn(rows.current[active]);
    const bar = meter.current;
    if (stacked || !row || !bar) return;
    if (opened.current) row.scrollTo({ left: 0, behavior: "auto" });
    opened.current = true;

    let near = false;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!near) return;
      const width = row.clientWidth;
      const room = row.scrollWidth - width;
      const left = row.scrollLeft;
      if (width === 0) return;
      bar.style.setProperty("--rail-view", (width / (width + Math.max(0, room))).toFixed(4));
      bar.style.setProperty("--rail-at", (room > 0 ? Math.min(1, Math.max(0, left / room)) : 0).toFixed(4));
      const start = left <= 1;
      const end = left >= room - 1;
      setEnds((was) => (was.start === start && was.end === end ? was : { start, end }));
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const seen = new IntersectionObserver(
      ([entry]) => {
        near ||= entry.isIntersecting;
        request();
      },
      { rootMargin: "50% 0px" },
    );
    seen.observe(row.closest("section") ?? row);
    const resized = new ResizeObserver(request);
    resized.observe(row);
    row.addEventListener("scroll", request, { passive: true });
    return () => {
      seen.disconnect();
      resized.disconnect();
      row.removeEventListener("scroll", request);
      cancelAnimationFrame(frame);
    };
  }, [active, stacked]);

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

  /** A page of whole cards on or back: the card that peeks at the edge comes to the start. */
  const go = (direction: 1 | -1) => {
    const row = rowIn(rows.current[active]);
    const cards = row?.querySelectorAll<HTMLElement>(":scope > li");
    if (!row || !cards || cards.length < 2) return;
    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const gap = step - cards[0].offsetWidth;
    const room = row.clientWidth - 2 * (parseFloat(getComputedStyle(row).paddingLeft) || 0);
    const whole = Math.max(1, Math.floor((room + gap) / step));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * whole * step, behavior: calm ? "auto" : "smooth" });
  };

  const panelId = (index: number) => `${base}-panel-${tabs[index].id}`;

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
                  aria-controls={panelId(index)}
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
          ref={(element) => {
            rows.current[index] = element;
          }}
          role={tabs.length > 1 ? "tabpanel" : undefined}
          id={panelId(index)}
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
        {/* Where the row is, and on a wide screen the arrows that move it; both follow the open tab's row. */}
        <div className="rail-bar">
          <div className="meter rail-meter" aria-hidden="true">
            <span ref={meter} />
          </div>
          <div className="rail-arrows">
            <button
              type="button"
              className="rail-arrow"
              data-way="back"
              aria-label={arrows.previous}
              aria-controls={panelId(active)}
              aria-disabled={ends.start}
              onClick={() => (ends.start ? undefined : go(-1))}
            />
            <button
              type="button"
              className="rail-arrow"
              data-way="on"
              aria-label={arrows.next}
              aria-controls={panelId(active)}
              aria-disabled={ends.end}
              onClick={() => (ends.end ? undefined : go(1))}
            />
          </div>
        </div>
        <div className="rail-more">{more[active]}</div>
        {note}
      </div>
    </>
  );
}
