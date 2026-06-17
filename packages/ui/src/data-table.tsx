import * as React from "react";
import { color, uiConstants } from "@xentral/config";

export type Column<T> = {
  key: string;
  header: string;
  width?: number;                 // px; omit for a flexible column
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
};

/** DataTable — locked table. Header 44px, rows 48px, one-line truncation, sticky-ready. */
export function DataTable<T>({ columns, rows, rowHref, getKey }: {
  columns: Column<T>[];
  rows: T[];
  rowHref?: (row: T) => string;
  getKey: (row: T) => string;
}) {
  const cell = (col: Column<T>): React.CSSProperties =>
    col.width
      ? { width: col.width, textAlign: col.align ?? "left", flexShrink: 0 }
      : { flex: 1, textAlign: col.align ?? "left", minWidth: 0 };

  const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", height: uiConstants.table.rowHeight.default, padding: "0 16px", borderBottom: `1px solid ${color.line.DEFAULT}`, fontSize: 12.5, color: color.ink.DEFAULT, textDecoration: "none" };

  return (
    <div style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", height: uiConstants.table.headerHeight, padding: "0 16px", borderBottom: `1px solid ${color.line.strong}`, fontSize: 11, fontWeight: 600, color: color.ink.mid, background: color.surface.page }}>
        {columns.map((col) => <span key={col.key} style={cell(col)}>{col.header}</span>)}
      </div>
      {rows.map((row) => {
        const inner = columns.map((col) => (
          <span key={col.key} style={{ ...cell(col), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{col.render(row)}</span>
        ));
        const href = rowHref?.(row);
        return href
          ? <a key={getKey(row)} href={href} style={rowStyle}>{inner}</a>
          : <div key={getKey(row)} style={rowStyle}>{inner}</div>;
      })}
    </div>
  );
}
