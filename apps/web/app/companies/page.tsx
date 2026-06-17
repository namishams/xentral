"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import { listCompanies, type CompanyRow } from "@xentral/module-crm";

const ALL = listCompanies();

const COLUMNS: Column<CompanyRow>[] = [
  { key: "name", header: "Company", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "industry", header: "Industry", render: (r) => <span style={{ color: color.ink.mid }}>{r.industry}</span> },
  { key: "city", header: "City", width: 140, render: (r) => r.city },
  { key: "openDeals", header: "Open deals", width: 120, render: (r) => <StatusBadge tone={r.openDeals > 0 ? "positive" : "neutral"} label={String(r.openDeals)} /> },
  { key: "owner", header: "Owner", width: 100, render: (r) => <StatusBadge tone="info" label={r.owner} /> },
];

export default function CompaniesPage() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = ALL.filter((r) => (r.name + r.industry + r.city).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="companies">
      <PageTitleRow title="Companies" subtitle={`${ALL.length} accounts`} actions={<Button variant="primary">+ New company</Button>} />
      <FilterBar>
        <Input placeholder="Search company, industry, city…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No companies" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Live data via @xentral/module-crm · locked components only</p>
    </AppShell>
  );
}
