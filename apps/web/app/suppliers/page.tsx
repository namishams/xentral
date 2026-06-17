"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";
import { listSuppliers, type SupplierRow } from "@xentral/module-erp";

const ALL = listSuppliers();
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<SupplierRow>[] = [
  { key: "name", header: "Supplier", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.name} /><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span></span> },
  { key: "category", header: "Category", width: 140, render: (r) => <span style={{ color: color.ink.mid }}>{r.category}</span> },
  { key: "country", header: "Country", width: 120, render: (r) => r.country },
  { key: "openOrders", header: "Open POs", width: 110, render: (r) => <StatusBadge tone={r.openOrders > 0 ? "info" : "neutral"} label={String(r.openOrders)} /> },
];

export default function SuppliersPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.name + r.category + r.country).toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell active="suppliers">
      <PageTitleRow title="Suppliers" subtitle={`${ALL.length} vendors`} actions={<Button variant="primary">+ New supplier</Button>} />
      <FilterBar>
        <Input placeholder="Search supplier, category, country…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <Button>Category</Button>
      </FilterBar>
      {rows.length === 0 ? (
        <EmptyState title="No suppliers" hint="Try a different search." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ marginTop: 8 }}>
          <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} />
        </div>
      )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Vendor directory · @xentral/module-erp · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
