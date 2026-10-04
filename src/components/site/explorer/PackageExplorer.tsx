"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type LiHTMLAttributes, type ReactNode } from "react";

import { matches, ranks, type Filters, type PackageFacts, type SortKey } from "@/lib/content/package-facts";

// Filters, sorting and comparison over the packages of one page
// (docs/renovation/R3-PACKAGE-PAGES.md). The server renders every package;
// the cards, groups and sections below hide or reorder themselves from this
// context, so anchors, search engines and visitors without JavaScript still
// get the whole page (the toolbar and compare boxes hide under scripting: none).

export type Option<T> = { value: T; label: string };

export type CompareEntry = {
  id: string;
  name: string;
  href: string;
  price: string;
  unit: string;
  regular?: string;
  vat?: string;
  speed?: string;
  term?: { label: string; value: string };
  allowance?: string;
  benefits: string[];
  conditions: string[];
  dialCode?: string;
  cta: { id: string; label: string; href: string; external: boolean };
  unverified: boolean;
};

export type ExplorerLabels = {
  findPackage: string;
  speed: string;
  price: string;
  benefit: string;
  any: string;
  sortBy: string;
  sorts: Record<SortKey, string>;
  resultCount: string;
  clearFilters: string;
  noMatches: string;
  compareAdd: string;
  compareChosen: string;
  compareOpen: string;
  compareMore: string;
  compareLimit: string;
  compareClear: string;
  close: string;
  details: string;
  rows: { price: string; speed: string; allowance: string; benefits: string; conditions: string; dialCode: string; regular: string };
  unverifiedNote: string;
  opensInNewTab: string;
};

const MAX_COMPARE = 3;

type ExplorerState = {
  visible: (id: string) => boolean;
  order: (id: string) => number | undefined;
  chosen: string[];
  toggle: (id: string) => void;
  labels: ExplorerLabels;
};

const ExplorerContext = createContext<ExplorerState | null>(null);

const fill = (template: string, values: Record<string, number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));

type PackageExplorerProps = {
  facts: PackageFacts[];
  speeds: Option<number>[];
  prices: Option<number>[];
  benefits: Option<string>[];
  compare: CompareEntry[];
  labels: ExplorerLabels;
  children: ReactNode;
};

export function PackageExplorer({ facts, speeds, prices, benefits, compare, labels, children }: PackageExplorerProps) {
  const base = useId();
  const [filters, setFilters] = useState<Filters>({ speed: null, maxPrice: null, benefit: null });
  const [sort, setSort] = useState<SortKey>("recommended");
  const [chosen, setChosen] = useState<string[]>([]);
  const dialog = useRef<HTMLDialogElement>(null);

  const shown = useMemo(() => new Set(facts.filter((entry) => matches(entry, filters)).map((entry) => entry.id)), [facts, filters]);
  const rank = useMemo(() => (sort === "recommended" ? null : ranks(facts, sort)), [facts, sort]);
  const filtered = filters.speed !== null || filters.maxPrice !== null || filters.benefit !== null;

  const state = useMemo<ExplorerState>(
    () => ({
      visible: (id) => shown.has(id),
      order: (id) => rank?.get(id),
      chosen,
      toggle: (id) =>
        setChosen((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : current.length < MAX_COMPARE ? [...current, id] : current)),
      labels,
    }),
    [shown, rank, chosen, labels],
  );

  // A comparison needs two packages; close it when the choice drops below that.
  useEffect(() => {
    if (chosen.length < 2 && dialog.current?.open) dialog.current.close();
  }, [chosen.length]);

  const sorts: SortKey[] = speeds.length > 0 ? ["recommended", "price-low", "price-high", "speed"] : ["recommended", "price-low", "price-high"];
  const entries = chosen.map((id) => compare.find((entry) => entry.id === id)).filter((entry): entry is CompareEntry => entry !== undefined);

  return (
    <ExplorerContext.Provider value={state}>
      <section aria-labelledby={`${base}-find`} className="tm-explorer border-b border-tm-line">
        <div className="tm-container py-6">
          <h2 id={`${base}-find`} className="text-tm-h4 font-semibold">
            {labels.findPackage}
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-4">
            {speeds.length > 0 ? (
              <div role="group" aria-labelledby={`${base}-speed`}>
                <p id={`${base}-speed`} className="tm-explorer-label">
                  {labels.speed}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[{ value: null, label: labels.any }, ...speeds].map((option) => (
                    <button
                      key={option.value ?? "any"}
                      type="button"
                      aria-pressed={filters.speed === option.value}
                      onClick={() => setFilters((current) => ({ ...current, speed: option.value }))}
                      className="tm-chip"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {prices.length > 0 ? (
              <label className="grid gap-1.5">
                <span className="tm-explorer-label">{labels.price}</span>
                <select
                  value={filters.maxPrice ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value ? Number(event.target.value) : null }))}
                  className="tm-select"
                >
                  <option value="">{labels.any}</option>
                  {prices.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {benefits.length > 0 ? (
              <label className="grid gap-1.5">
                <span className="tm-explorer-label">{labels.benefit}</span>
                <select
                  value={filters.benefit ?? ""}
                  onChange={(event) => setFilters((current) => ({ ...current, benefit: event.target.value || null }))}
                  className="tm-select"
                >
                  <option value="">{labels.any}</option>
                  {benefits.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="grid gap-1.5">
              <span className="tm-explorer-label">{labels.sortBy}</span>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="tm-select">
                {sorts.map((key) => (
                  <option key={key} value={key}>
                    {labels.sorts[key]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-tm-small text-tm-muted" role="status" data-result-count="">
              {fill(labels.resultCount, { shown: shown.size, total: facts.length })}
            </p>
            {filtered ? (
              <button type="button" className="tm-link text-tm-small font-semibold" onClick={() => setFilters({ speed: null, maxPrice: null, benefit: null })}>
                {labels.clearFilters}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {children}

      {/* Room at the foot of the page, so the bar never covers its end. */}
      {chosen.length > 0 ? <div aria-hidden="true" className="h-36 sm:h-28" /> : null}
      {chosen.length > 0 ? (
        <div className="tm-compare-bar" role="region" aria-label={labels.compareOpen}>
          <div className="min-w-0">
            <p className="font-semibold">{fill(labels.compareChosen, { count: chosen.length })}</p>
            {/* The names of what is chosen; phones keep the bar short and show only the count. */}
            <p className={`text-tm-small text-tm-on-ink-muted ${chosen.length === 2 ? "max-sm:sr-only" : ""}`} role="status">
              {chosen.length === 1 ? labels.compareMore : chosen.length === MAX_COMPARE ? labels.compareLimit : entries.map((entry) => entry.name).join(", ")}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="tm-button tm-button-primary" disabled={chosen.length < 2} onClick={() => dialog.current?.showModal()}>
              {labels.compareOpen}
            </button>
            <button type="button" className="tm-button tm-button-secondary" onClick={() => setChosen([])}>
              {labels.compareClear}
            </button>
          </div>
        </div>
      ) : null}

      <dialog ref={dialog} aria-labelledby={`${base}-compare`} className="tm-compare-dialog">
        <div className="flex items-center justify-between gap-4 border-b border-tm-line px-5 py-4">
          <h2 id={`${base}-compare`} className="text-tm-h4 font-semibold">
            {labels.compareOpen}
          </h2>
          <button type="button" className="tm-button tm-button-secondary" onClick={() => dialog.current?.close()}>
            {labels.close}
          </button>
        </div>
        <div className="overflow-x-auto px-3 py-4 sm:px-5">
          <CompareTable entries={entries} labels={labels} />
          {entries.some((entry) => entry.unverified) ? <p className="mt-4 max-w-[48rem] text-tm-small text-tm-muted">{labels.unverifiedNote}</p> : null}
        </div>
      </dialog>
    </ExplorerContext.Provider>
  );
}

function CompareTable({ entries, labels }: { entries: CompareEntry[]; labels: ExplorerLabels }) {
  const rows: { label: string; cell: (entry: CompareEntry) => ReactNode }[] = [
    {
      label: labels.rows.price,
      cell: (entry) => (
        <>
          {entry.regular ? (
            <span className="block text-tm-small text-tm-muted">
              {labels.rows.regular} <s>{entry.regular}</s>
            </span>
          ) : null}
          <span className="tm-num text-tm-h3 font-light text-tm-red">{entry.price}</span> <span className="text-tm-small">{entry.unit}</span>
          {entry.vat ? <span className="block text-tm-caption text-tm-muted">{entry.vat}</span> : null}
        </>
      ),
    },
  ];
  if (entries.some((entry) => entry.speed)) rows.push({ label: labels.rows.speed, cell: (entry) => <span className="tm-num font-semibold">{entry.speed}</span> });
  const termLabel = entries.find((entry) => entry.term)?.term?.label;
  if (termLabel !== undefined) {
    // Contract or validity: the row says which, unless the packages differ.
    rows.push({ label: termLabel, cell: (entry) => (entry.term ? (entry.term.label === termLabel ? entry.term.value : `${entry.term.label} ${entry.term.value}`) : null) });
  }
  if (entries.some((entry) => entry.allowance)) rows.push({ label: labels.rows.allowance, cell: (entry) => entry.allowance });
  if (entries.some((entry) => entry.benefits.length > 0)) rows.push({ label: labels.rows.benefits, cell: (entry) => <List items={entry.benefits} /> });
  if (entries.some((entry) => entry.conditions.length > 0)) rows.push({ label: labels.rows.conditions, cell: (entry) => <List items={entry.conditions} /> });
  if (entries.some((entry) => entry.dialCode)) rows.push({ label: labels.rows.dialCode, cell: (entry) => <span className="tm-num">{entry.dialCode}</span> });

  return (
    <table className="tm-compare-table" style={{ "--cols": entries.length } as CSSProperties}>
      <thead>
        <tr>
          <td />
          {entries.map((entry) => (
            <th key={entry.id} scope="col" className="text-tm-body font-semibold">
              {entry.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className="text-tm-small font-medium text-tm-muted">
              {row.label}
            </th>
            {entries.map((entry) => (
              <td key={entry.id}>{row.cell(entry)}</td>
            ))}
          </tr>
        ))}
        <tr>
          <td />
          {entries.map((entry) => (
            <td key={entry.id}>
              <div className="grid gap-2">
                <a
                  href={entry.cta.href}
                  data-cta={entry.cta.id}
                  className="tm-button tm-button-primary"
                  {...(entry.cta.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {entry.cta.label}
                  <span className="sr-only">
                    : {entry.name}
                    {entry.cta.external ? ` (${labels.opensInNewTab})` : ""}
                  </span>
                </a>
                <a href={entry.href} className="tm-link justify-self-center text-tm-small font-semibold">
                  {labels.details}
                  <span className="sr-only">: {entry.name}</span>
                </a>
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="grid list-disc gap-1 pl-4 text-tm-small">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** A package card that hides when the filters leave it out and moves when sorted. */
export function ExplorableCard({ packageId, style, children, ...rest }: LiHTMLAttributes<HTMLLIElement> & { packageId: string }) {
  const explorer = useContext(ExplorerContext);
  const order = explorer?.order(packageId);
  return (
    <li {...rest} hidden={explorer ? !explorer.visible(packageId) : undefined} style={order === undefined ? style : ({ ...style, order } as CSSProperties)}>
      {children}
    </li>
  );
}

/** A group of cards that hides when none of its packages is left. */
export function ExplorableGroup({ packageIds, children, ...rest }: { packageIds: string[]; children: ReactNode; "data-edit"?: string }) {
  const explorer = useContext(ExplorerContext);
  const hidden = explorer !== null && packageIds.length > 0 && !packageIds.some(explorer.visible);
  return (
    <div {...rest} hidden={hidden || undefined}>
      {children}
    </div>
  );
}

/** Says so when the filters leave nothing in a section; the section itself stays, so its anchor works. */
export function NoMatches({ packageIds }: { packageIds: string[] }) {
  const explorer = useContext(ExplorerContext);
  if (!explorer || packageIds.length === 0 || packageIds.some(explorer.visible)) return null;
  return <p className="rounded-tm-panel bg-tm-surface px-5 py-6 text-tm-muted">{explorer.labels.noMatches}</p>;
}

/** The "compare" box on a card; nothing outside a package page. */
export function ComparePick({ packageId, name }: { packageId: string; name: string }) {
  const explorer = useContext(ExplorerContext);
  if (!explorer) return null;
  const checked = explorer.chosen.includes(packageId);
  return (
    <label className="tm-compare-pick">
      <input type="checkbox" checked={checked} disabled={!checked && explorer.chosen.length >= MAX_COMPARE} onChange={() => explorer.toggle(packageId)} />
      <span>
        {explorer.labels.compareAdd}
        <span className="sr-only">: {name}</span>
      </span>
    </label>
  );
}
