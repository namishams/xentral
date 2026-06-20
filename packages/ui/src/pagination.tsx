"use client";

import * as React from "react";
import { uiConstants, color, radius } from "@xentral/config";

/**
 * Pagination — locked table pager. Page-size options (25/50/100) and default
 * come from ui-constants.table. Fixed height; accessible controls.
 */
export type PaginationProps = {
  page: number;          // 1-based
  pageCount: number;
  pageSize: number;
  total?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
};

export function Pagination({ page, pageCount, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const opts = uiConstants.table.pageSizeOptions;
  const canPrev = page > 1;
  const canNext = page < pageCount;
  const btn = (disabled: boolean): React.CSSProperties => ({
    height: 32, minWidth: 32, padding: "0 10px", borderRadius: radius.md,
    border: `1px solid ${color.line.strong}`, background: color.surface.card,
    color: disabled ? color.ink.soft : color.ink.DEFAULT,
    fontSize: 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
  });

  return (
    <div className="flex items-center justify-between gap-4" style={{ paddingTop: 12 }}>
      <div style={{ color: color.ink.mid, fontSize: 13 }}>
        {typeof total === "number"
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
          : `Page ${page} of ${pageCount}`}
      </div>
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5" style={{ color: color.ink.mid, fontSize: 13 }}>
            Rows
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{ height: 32, borderRadius: radius.md, border: `1px solid ${color.line.strong}`, fontSize: 13, padding: "0 6px" }}
            >
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
        <button onClick={() => canPrev && onPageChange(page - 1)} disabled={!canPrev} aria-label="Previous page" style={btn(!canPrev)}>‹</button>
        <button onClick={() => canNext && onPageChange(page + 1)} disabled={!canNext} aria-label="Next page" style={btn(!canNext)}>›</button>
      </div>
    </div>
  );
}

export default Pagination;
