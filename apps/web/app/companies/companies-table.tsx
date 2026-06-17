"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column } from "@xentral/ui";
import type { CompanyRow } from "@xentral/module-crm";

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return (
    <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>
  );
}

const COLUMNS: Column<CompanyRow>[] = [
  { key: "name", header: "Company", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.name} /><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span></span> },
  { key: "industry", header: "Industry", render: (r) => <span style={{ color: color.ink.mid }}>{r.industry}</span> },
  { key: "city", header: "City", width: 140, render: (r) => r.city },
  { key: "openDeals", header: "Open deals", width: 120, render: (r) => <StatusBadge tone={r.openDeals > 0 ? "positive" : "neutral"} label={String(r.openDeals)} /> },
  { key: "owner", header: "Owner", width: 100, render: (r) => (r.owner ? <StatusBadge tone="info" label={r.owner} /> : null) },
];

export function CompaniesTable({ rows: all }: { rows: CompanyRow[] }) {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);
  const rows = all.filter((r) => (r.name + r.industry + r.city).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <FilterBar>
        <Input placeholder="Search company, industry, city…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No companies" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/companies/${r.id}`} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}
    </>
  );
}
