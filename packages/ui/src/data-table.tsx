import * as React from "react";
import { color, uiConstants, shadow } from "@xentral/config";

export type Column<T> = {
  key: string;
  header: string;
  width?: number;                 // px; omit for a flexible column
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
  /** Enterprise: provide to make this column sortable. */
  sort?: (row: T) => string | number;
  /** Enterprise: text used by the quick filter (falls back to primitive render output). */
  filterText?: (row: T) => string;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

const primitiveText = <T,>(col: Column<T>, row: T): string => {
  if (col.filterText) return col.filterText(row);
  if (col.sort) return String(col.sort(row));
  const v = col.render(row);
  return typeof v === "string" || typeof v === "number" ? String(v) : "";
};

/**
 * DataTable — enterprise data grid for large datasets.
 * Defaults: sticky header, zebra rows, one-line truncation.
 * Opt-in: `searchable` (quick filter), sortable columns (provide `column.sort`),
 * `maxHeight` (scroll body with sticky header), `dense` (compact rows), `title`.
 */
export function DataTable<T>({
  columns, rows, rowHref, getKey,
  title, searchable = false, maxHeight, dense = false, zebra = true, stickyHeader = true,
  toolbarRight, initialSort, searchPlaceholder = "Filter…",
}: {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  getKey: (row: T) => string;
  title?: string;
  searchable?: boolean;
  maxHeight?: number;
  dense?: boolean;
  zebra?: boolean;
  stickyHeader?: boolean;
  toolbarRight?: React.ReactNode;
  initialSort?: { key: string; dir?: "asc" | "desc" };
  searchPlaceholder?: string;
}) {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(initialSort ? { key: initialSort.key, dir: initialSort.dir ?? "asc" } : null);

  const rowH = dense ? 38 : uiConstants.table.rowHeight.default;

  const cell = (col: Column<T>): React.CSSProperties =>
    col.width
      ? { width: col.width, textAlign: col.align ?? "left", flexShrink: 0 }
      : { flex: 1, textAlign: col.align ?? "left", minWidth: 0 };

  const filtered = React.useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => columns.some((c) => primitiveText(c, r).toLowerCase().includes(needle)));
  }, [q, rows, columns]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sort) return filtered;
    const acc = col.sort;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = acc(a), vb = acc(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), undefined, { numeric: true }) * dir;
    });
  }, [filtered, sort, columns]);

  const toggleSort = (col: Column<T>) => {
    if (!col.sort) return;
    setSort((s) => (s && s.key === col.key ? (s.dir === "asc" ? { key: col.key, dir: "desc" } : null) : { key: col.key, dir: "asc" }));
  };

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", height: rowH, padding: "0 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 12.5, color: color.ink.DEFAULT, textDecoration: "none" };
  const headStyle: React.CSSProperties = { display: "flex", alignItems: "center", height: uiConstants.table.headerHeight, padding: "0 16px", borderBottom: `1px solid ${color.line.strong}`, fontSize: 11, fontWeight: 600, color: color.ink.mid, background: color.surface.page, ...(stickyHeader ? { position: "sticky", top: 0, zIndex: 2 } : {}) };

  const showToolbar = !!title || searchable || !!toolbarRight;

  return (
    <div style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, boxShadow: shadow.none, overflow: "hidden" }}>
      {showToolbar && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${color.line.DEFAULT}`, background: color.surface.card }}>
          {title ? <span style={{ fontSize: 13.5, fontWeight: 700, color: color.ink.DEFAULT }}>{title}</span> : null}
          <span style={{ fontSize: 11.5, color: color.ink.soft }}>{sorted.length === rows.length ? `${rows.length}` : `${sorted.length} of ${rows.length}`} {rows.length === 1 ? "row" : "rows"}</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {searchable && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 10px", borderRadius: 8, border: `1px solid ${color.line.strong}`, background: color.surface.page }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color.ink.soft} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchPlaceholder} style={{ width: 180, border: 0, outline: "none", background: "transparent", fontSize: 12.5, color: color.ink.DEFAULT, fontFamily: "inherit" }} />
              </div>
            )}
            {toolbarRight}
          </div>
        </div>
      )}

      <div style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}>
        <div style={headStyle}>
          {columns.map((col) => {
            const active = sort?.key === col.key;
            return (
              <span key={col.key} onClick={() => toggleSort(col)}
                style={{ ...cell(col), display: "inline-flex", alignItems: "center", gap: 4, justifyContent: col.align === "right" ? "flex-end" : "flex-start", cursor: col.sort ? "pointer" : "default", userSelect: "none", color: active ? color.brand.primary : color.ink.mid }}>
                {col.header}
                {col.sort ? <span style={{ fontSize: 9, opacity: active ? 1 : 0.35 }}>{active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}</span> : null}
              </span>
            );
          })}
          {rowHref ? <span style={{ width: 24, flexShrink: 0 }} /> : null}
        </div>
        {sorted.map((row, i) => {
          const bg = zebra && i % 2 === 1 ? color.surface.page : color.surface.card;
          const inner = columns.map((col) => (
            <span key={col.key} style={{ ...cell(col), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.render(row)}</span>
          ));
          const href = rowHref?.(row);
          if (href) inner.push(<span key="__chev" aria-hidden="true" style={{ width: 24, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "flex-end", color: color.ink.soft }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></span>);
          return href
            ? <a key={getKey(row)} href={href} className="xui-row-link" style={{ ...rowStyle, background: bg }}>{inner}</a>
            : <div key={getKey(row)} className="xui-row-link" style={{ ...rowStyle, background: bg }}>{inner}</div>;
        })}
        {sorted.length === 0 && (
          <div style={{ padding: 28, textAlign: "center", fontSize: 12.5, color: color.ink.soft }}>{q ? "No rows match your filter." : "No data."}</div>
        )}
      </div>
    </div>
  );
}
