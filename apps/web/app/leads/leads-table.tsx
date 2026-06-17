"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column, type BadgeTone } from "@xentral/ui";
import type { LeadRow, LeadStage } from "@xentral/module-crm";

const STAGE_TONE: Record<LeadStage, BadgeTone> = {
  new: "info",
  working: "warning",
  qualified: "positive",
  unqualified: "neutral",
};

function scoreTone(score: number): BadgeTone {
  if (score >= 75) return "positive";
  if (score >= 50) return "warning";
  return "neutral";
}

const COLUMNS: Column<LeadRow>[] = [
  { key: "name", header: "Lead", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "company", header: "Company", render: (r) => <span style={{ color: color.ink.mid }}>{r.company}</span> },
  { key: "source", header: "Source", width: 140, render: (r) => r.source },
  { key: "score", header: "Score", width: 90, render: (r) => <StatusBadge tone={scoreTone(r.score)} label={String(r.score)} /> },
  { key: "stage", header: "Stage", width: 130, render: (r) => <StatusBadge tone={STAGE_TONE[r.stage]} label={r.stage} /> },
  { key: "owner", header: "Owner", width: 100, render: (r) => (r.owner ? <StatusBadge tone="info" label={r.owner} /> : null) },
];

export function LeadsTable({ rows: all }: { rows: LeadRow[] }) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = all.filter((r) => (r.name + r.company + r.source).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search lead, company, source…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No leads" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
