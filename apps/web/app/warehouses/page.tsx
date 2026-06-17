"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listWarehouses, type WarehouseRow } from "@xentral/module-erp";

const ALL = listWarehouses();
function capTone(pct: number): BadgeTone {
  if (pct >= 90) return "critical";
  if (pct >= 75) return "warning";
  return "positive";
}
function Box() {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">▦</span>;
}

const COLUMNS: Column<WarehouseRow>[] = [
  { key: "name", header: "Warehouse", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Box /><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span></span> },
  { key: "location", header: "Location", render: (r) => <span style={{ color: color.ink.mid }}>{r.location}</span> },
  { key: "items", header: "Items", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.items.toLocaleString()}</span> },
  { key: "capacity", header: "Capacity", width: 120, render: (r) => <StatusBadge tone={capTone(r.capacityPct)} label={`${r.capacityPct}%`} /> },
];

export default function WarehousesPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.name + r.location).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="warehouses">
      <PageTitleRow title="Warehouses" subtitle={`${ALL.length} locations`} actions={<Button variant="primary">+ New warehouse</Button>} />
      <FilterBar>
        <Input placeholder="Search warehouse or location…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No warehouses" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Storage locations · @xentral/module-erp · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
