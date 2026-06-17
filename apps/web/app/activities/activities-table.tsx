"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column, type BadgeTone } from "@xentral/ui";
import type { ActivityRow } from "@xentral/module-crm";

function typeTone(type: string): BadgeTone {
  const t = type.toLowerCase();
  if (t === "call") return "info";
  if (t === "email") return "positive";
  if (t === "meeting") return "warning";
  if (t === "whatsapp") return "positive";
  return "neutral";
}

const COLUMNS: Column<ActivityRow>[] = [
  { key: "type", header: "Type", width: 110, render: (r) => <StatusBadge tone={typeTone(r.type)} label={r.type} /> },
  { key: "summary", header: "Activity", render: (r) => <span style={{ color: color.ink.DEFAULT }}>{r.summary}</span> },
  { key: "when", header: "When", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.when}</span> },
  { key: "by", header: "By", width: 100, render: (r) => (r.by ? <StatusBadge tone="info" label={r.by} /> : null) },
];

export function ActivitiesTable({ rows: all }: { rows: ActivityRow[] }) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = all.filter((r) => (r.summary + r.type + r.by).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search activities…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No activities" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
