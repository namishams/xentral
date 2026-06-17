"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";

// TODO(frontend-agent): replace these seed rows with a module contract, e.g.
//   import { listThings } from "@xentral/module-XXX";  const ROWS = listThings();
type Row = { id: string; name: string; status: string };
const ROWS: Row[] = [
  { id: "1", name: "Example A", status: "active" },
  { id: "2", name: "Example B", status: "draft" },
  { id: "3", name: "Example C", status: "active" },
];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Name", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone="info" label={r.status} /> },
];

export default function ReportsPage() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = ROWS.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="reports">
      <PageTitleRow title="Reports" subtitle={`${ROWS.length} items`} actions={<Button variant="primary">+ New</Button>} />
      <FilterBar>
        <Input placeholder="Search…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 240 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No results" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Scaffolded with `pnpm gen:page` · locked components only · reports</p>
    </AppShell>
  );
}
