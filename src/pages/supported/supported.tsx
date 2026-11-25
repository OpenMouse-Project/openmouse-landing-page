import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Check, ChevronDown, ChevronRight, Search, X } from "lucide-preact";
import "../../shared/site.css";
import "./supported.css";
import { mountOfflineBanner } from "../../platform/offline-banner";
import { registerServiceWorker } from "../../platform/register-sw";
import { SiteFooter, SiteNav } from "../../shared/site-chrome";
import { usePageLocale } from "../../shared/page-locale";
import { t, tp, type I18nKey } from "../../i18n/index";
import type { InterfaceLocale } from "../../shared/interface-preferences";
import { MICE, STATUS, type Mouse, type Status } from "../../data/supported-mice";
import { withRegistryMice } from "../../data/supported-registry";
import { KEYBOARDS } from "../../data/supported-keyboards";
import { mouseMatchesQuery } from "../../data/mouse-search";

const MICE_ALL: readonly Mouse[] = withRegistryMice(MICE);
const DATASETS = { mice: MICE_ALL, keyboards: KEYBOARDS as readonly Mouse[] } as const;
type Kind = keyof typeof DATASETS;

const STATUS_KEYS: readonly Status[] = ["supported", "pr", "quickwin", "likely", "driver", "unknown", "bridge", "pending"];

const STATUS_LABEL: Record<Status, I18nKey> = {
  supported: "supp.stSupported",
  pr: "supp.stPr",
  quickwin: "supp.stQuickwin",
  likely: "supp.stLikely",
  driver: "supp.stDriver",
  unknown: "supp.stUnknown",
  bridge: "supp.stBridge",
  pending: "supp.stPending",
};

const LEGEND_DESC: Record<Status, I18nKey> = {
  supported: "supp.legSupported",
  pr: "supp.legPr",
  quickwin: "supp.legQuickwin",
  likely: "supp.legLikely",
  driver: "supp.legDriver",
  unknown: "supp.legUnknown",
  bridge: "supp.legBridge",
  pending: "supp.legPending",
};

const PAGE = 10;
const COLLAPSED_KEY = "openmouse.collapsedBrands";

function readCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeCollapsed(brands: Set<string>): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...brands]));
  } catch {
  }
}

function brandSlug(brand: string): string {
  return brand.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function BrandPicker({
  locale,
  value,
  onChange,
  totals,
  total,
}: {
  locale: InterfaceLocale;
  value: string | null;
  onChange: (brand: string | null) => void;
  totals: ReadonlyArray<{ brand: string; count: number }>;
  total: number;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const away = (event: MouseEvent): void => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const shown = totals.filter(({ brand }) => !q || brand.toLowerCase().includes(q));
  const pick = (brand: string | null): void => {
    onChange(brand);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="sp-picker" ref={root}>
      <button
        type="button"
        className={`sp-picker-trigger${value ? " is-set" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{value ?? t(locale, "supp.allBrands")}</span>
        <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
      </button>
      {open ? (
        <div className="sp-picker-pop">
          <label className="sp-picker-search">
            <Search size={14} strokeWidth={2} aria-hidden="true" />
            <input
              ref={input}
              type="search"
              value={query}
              placeholder={t(locale, "supp.searchBrands")}
              aria-label={t(locale, "supp.searchBrands")}
              autoComplete="off"
              spellcheck={false}
              onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <div className="sp-picker-list" role="listbox" aria-label={t(locale, "supp.filterBrand")}>
            <button type="button" role="option" aria-selected={value === null} className={value === null ? "is-on" : ""} onClick={() => pick(null)}>
              <span>{t(locale, "supp.allBrands")}</span>
              <span className="sp-count">{total}</span>
            </button>
            {shown.map(({ brand, count }) => (
              <button key={brand} type="button" role="option" aria-selected={value === brand} className={value === brand ? "is-on" : ""} onClick={() => pick(brand)}>
                <span>{brand}</span>
                <span className="sp-count">{count}</span>
              </button>
            ))}
            {shown.length === 0 ? <p className="sp-picker-empty">{t(locale, "supp.noBrands")}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SupportedPage(): ReactNode {
  const [locale, setLocale] = usePageLocale();
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get("q")?.slice(0, 80) ?? "");
  const [kind, setKind] = useState<Kind>(() => (new URLSearchParams(window.location.search).get("type") === "keyboards" ? "keyboards" : "mice"));
  const ALL = DATASETS[kind];
  const [brand, setBrand] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<ReadonlySet<Status>>(new Set());
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(readCollapsed);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [kind, query, brand, statuses]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(STATUS_KEYS.map((key) => [key, 0])) as Record<Status, number>;
    for (const mouse of ALL) result[mouse.status] += 1;
    return result;
  }, [ALL]);

  const brandTotals = useMemo(() => {
    const totals = new Map<string, number>();
    for (const mouse of ALL) totals.set(mouse.brand, (totals.get(mouse.brand) ?? 0) + 1);
    return [...totals.entries()]
      .map(([name, count]) => ({ brand: name, count }))
      .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
  }, [ALL]);

  const visible = useMemo(() => {
    return ALL.filter((mouse) =>
      (statuses.size === 0 || statuses.has(mouse.status))
      && (brand === null || mouse.brand === brand)
      && mouseMatchesQuery(mouse, query));
  }, [ALL, query, brand, statuses]);

  const groups = useMemo(() => {
    const byBrand = new Map<string, Mouse[]>();
    for (const mouse of visible) {
      const list = byBrand.get(mouse.brand) ?? [];
      list.push(mouse);
      byBrand.set(mouse.brand, list);
    }
    const requests = (list: Mouse[]): number => list.reduce((sum, mouse) => sum + mouse.req, 0);
    return [...byBrand.entries()]
      .sort((a, b) => requests(b[1]) - requests(a[1]) || a[0].localeCompare(b[0]))
      .map(([name, list]) => ({
        brand: name,
        requests: requests(list),
        items: [...list].sort((a, b) => STATUS[a.status].order - STATUS[b.status].order || b.req - a.req),
      }));
  }, [visible]);

  const toggleStatus = (key: Status): void => {
    setStatuses((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleGroup = (name: string): void => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      writeCollapsed(next);
      return next;
    });
  };
  const switchKind = (next: Kind): void => {
    setKind(next);
    setBrand(null);
    setStatuses(new Set());
    const url = new URL(window.location.href);
    if (next === "mice") url.searchParams.delete("type");
    else url.searchParams.set("type", next);
    window.history.replaceState(null, "", url);
  };
  const clearAll = (): void => {
    setQuery("");
    setBrand(null);
    setStatuses(new Set());
  };
  const filtered = query.trim() !== "" || brand !== null || statuses.size > 0;

  return (
    <div className="land-shell sp">
      <SiteNav locale={locale} onLocale={setLocale} />
      <main className="sp-main">
        <header className="sp-head">
          <p className="sp-kicker">{t(locale, "supp.kicker")}</p>
          <h1>{t(locale, "supp.title")}</h1>
          <p className="sp-sub">{t(locale, "supp.sub")}</p>
          <p className="sp-totals">
            <span><b>{counts.supported.toLocaleString(locale)}</b> {t(locale, "supp.supportedWord")}</span>
            <span className="sp-sep" aria-hidden="true">·</span>
            <span><b>{ALL.length.toLocaleString(locale)}</b> {t(locale, "supp.totalWord")}</span>
          </p>
        </header>

        <div className="sp-kinds" role="tablist">
          {(["mice", "keyboards"] as const).map((key) => (
            <button key={key} type="button" role="tab" aria-selected={kind === key} className={`sp-chip${kind === key ? " is-on" : ""}`} onClick={() => switchKind(key)}>
              {t(locale, key === "mice" ? "supp.kindMice" : "supp.kindKeyboards")}
              <span className="sp-count">{DATASETS[key].length}</span>
            </button>
          ))}
        </div>

        <div className="sp-toolbar">
          <label className="sp-search">
            <Search size={16} strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder={t(locale, "supp.search")}
              aria-label={t(locale, "supp.search")}
              autoComplete="off"
              spellcheck={false}
              autoFocus={query !== ""}
              onInput={(event) => setQuery((event.currentTarget as HTMLInputElement).value)}
            />
          </label>
          <BrandPicker locale={locale} value={brand} onChange={setBrand} totals={brandTotals} total={ALL.length} />
          <span className="sp-result" aria-live="polite">
            {visible.length === 1 ? tp(locale, "supp.oneDevice", { n: visible.length }) : tp(locale, "supp.manyDevices", { n: visible.length.toLocaleString(locale) })}
          </span>
          {filtered ? (
            <button type="button" className="sp-clear" onClick={clearAll} aria-label={t(locale, "supp.clearFilters")} title={t(locale, "supp.clearFilters")}>
              <X size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="sp-status" role="group" aria-label={t(locale, "supp.filterTag")}>
          <button type="button" className={`sp-chip${statuses.size === 0 ? " is-on" : ""}`} aria-pressed={statuses.size === 0} onClick={() => setStatuses(new Set())}>
            {t(locale, "supp.tabAll")}
            <span className="sp-count">{ALL.length}</span>
          </button>
          {STATUS_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`sp-chip st-${key}${statuses.has(key) ? " is-on" : ""}`}
              aria-pressed={statuses.has(key)}
              title={t(locale, LEGEND_DESC[key])}
              onClick={() => toggleStatus(key)}
            >
              <span className="sp-dot" aria-hidden="true" />
              {t(locale, STATUS_LABEL[key])}
              <span className="sp-count">{counts[key]}</span>
            </button>
          ))}
        </div>

        <details className="sp-legend">
          <summary>
            <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
            {t(locale, "supp.legendTitle")}
          </summary>
          <dl>
            {STATUS_KEYS.map((key) => (
              <div key={key}>
                <dt><span className={`sp-badge st-${key}`}>{t(locale, STATUS_LABEL[key])}</span></dt>
                <dd>{t(locale, LEGEND_DESC[key])}</dd>
              </div>
            ))}
          </dl>
        </details>

        {groups.length === 0 ? (
          <div className="sp-empty">
            <p>{t(locale, "supp.noFilters")}</p>
            <button type="button" className="lp-btn" onClick={clearAll}>{t(locale, "supp.clearFilters")}</button>
          </div>
        ) : (
          <div className="sp-groups">
            {groups.slice(0, shown).map(({ brand: name, items, requests }) => {
              const isCollapsed = collapsed.has(name);
              return (
                <section key={name} className={`sp-group${isCollapsed ? " is-collapsed" : ""}`} id={`brand-${brandSlug(name)}`}>
                  <button type="button" className="sp-group-head" aria-expanded={!isCollapsed} onClick={() => toggleGroup(name)}>
                    <ChevronDown className="sp-chev" size={15} strokeWidth={2.2} aria-hidden="true" />
                    <h2>{name}</h2>
                    <span className="sp-count">{items.length}</span>
                    {requests > 0 ? (
                      <span className="sp-reqs">{requests === 1 ? tp(locale, "supp.oneRequest", { n: requests }) : tp(locale, "supp.manyRequests", { n: requests })}</span>
                    ) : null}
                  </button>
                  {isCollapsed ? null : (
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th>{t(locale, "supp.thModel")}</th>
                          <th>{t(locale, "supp.thStatus")}</th>
                          <th>{t(locale, "supp.thNotes")}</th>
                          <th className="is-num">{t(locale, "supp.thVotes")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((mouse) => (
                          <tr key={`${mouse.brand}|${mouse.model}|${mouse.status}`}>
                            <td className="sp-model">{mouse.model}</td>
                            <td>
                              <span className={`sp-badge st-${mouse.status}`}>
                                {mouse.status === "supported" ? <Check size={11} strokeWidth={2.6} aria-hidden="true" /> : null}
                                {t(locale, STATUS_LABEL[mouse.status])}
                              </span>
                            </td>
                            <td className="sp-note">{mouse.note || "-"}</td>
                            <td className={`is-num sp-votes${mouse.req >= 3 ? " is-hot" : ""}`}>{mouse.req > 0 ? mouse.req : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              );
            })}
            {groups.length > shown ? (
              <button type="button" className="sp-more" onClick={() => setShown(shown + PAGE)}>{t(locale, "supp.loadMore")} ({groups.length - shown})</button>
            ) : null}
          </div>
        )}
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Root element missing");
createRoot(root).render(<SupportedPage />);

registerServiceWorker();
mountOfflineBanner();
