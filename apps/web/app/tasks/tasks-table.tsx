"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column, type BadgeTone } from "@xentral/ui";
import type { TaskRow, TaskPriority } from "@xentral/module-crm";

const PRIORITY_TONE: Record<TaskPriority, BadgeTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
};

const COLUMNS: Column<TaskRow>[] = [
  { key: "title", header: "Task", render: (r) => <span style={{ fontWeight: 600, color: r.done ? color.ink.soft : color.ink.DEFAULT, textDecoration: r.done ? "line-through" : "none" }}>{r.title}</span> },
  { key: "due", header: "Due", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.due}</span> },
  { key: "priority", header: "Priority", width: 110, render: (r) => <StatusBadge tone={PRIORITY_TONE[r.priority]} label={r.priority} /> },
  { key: "done", header: "Status", width: 110, render: (r) => <StatusBadge tone={r.done ? "positive" : "neutral"} label={r.done ? "done" : "open"} /> },
  { key: "owner", header: "Owner", width: 100, render: (r) => (r.owner ? <StatusBadge tone="info" label={r.owner} /> : null) },
];

export function TasksTable({ rows: all }: { rows: TaskRow[] }) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = all.filter((r) => (r.title + r.owner).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search tasks…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No tasks" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
