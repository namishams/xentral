"use client";

import * as React from "react";
import { color, uiConstants } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, Pagination, type Column, type BadgeTone } from "@xentral/ui";
import { listDeals, type DealRow, type DealStage } from "@xentral/module-crm";

const ALL = listDeals();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const TONE: Record<DealStage, BadgeTone> = { new: "neutral", qualified: "info", proposal: "warning", won: "positive", lost: "critical" };

const COLUMNS: Column<DealRow>[] = [
  { key: "name", header: "Deal", render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.name}</span> },
  { key: "account", header: "Account", render: (r) => r.account },
  { key: "stage", header: "Stage", width: 120, render: (r) => <StatusBadge tone={TONE[r.stage]} label={r.stage} /> },
  { key: "value", header: "Value", width: 130, align: "right", render: (r) => aed(r.value) },
  { key: "owner", header: "Owner", width: 90, render: (r) => <span style={{ color: color.ink.mid }}>{r.owner}</span> },
];

export default function DealsPage() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(uiConstants.table.pageSizeDefault);

  const rows = ALL.filter((r) => (r.name + r.account + r.owner).toLowerCase().includes(q.toLowerCase()));
  const pipeline = ALL.filter((r) => r.stage !== "won" && r.stage !== "lost").reduce((s, r) => s + r.value, 0);

  return (
    <AppShell active="deals">
      <PageTitleRow
        title="Deals"
        subtitle={`${ALL.length} deals · ${aed(pipeline)} open pipeline`}
        actions={<Button variant="primary">+ New deal</Button>}
      />
      <FilterBar>
        <Input placeholder="Search deals…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 240 }} />
        <Button>Stage</Button>
        <Button>Owner</Button>
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState title="No deals match your search" hint="Try a different name, account or owner." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={() => "/dashboard"} />
          <Pagination page={page} pageCount={Math.max(1, Math.ceil(rows.length / pageSize))} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
        </>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 14 }}>Rows from @xentral/module-crm · locked FilterBar + Input + Button + DataTable + StatusBadge + EmptyState + Pagination</p>
    </AppShell>
  );
}
