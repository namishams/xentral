"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";

type Row = { id: string; sku: string; name: string; uom: string; price: number; cost: number; reorder: number; status: string; onhand: number };
const aed = (n: number) => `AED ${Math.round(Number(n) || 0).toLocaleString()}`;
const num = (n: number) => (Number(n) || 0).toLocaleString();

export default function InventoryPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  React.useEffect(() => { fetch("/api/erp/inventory").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const rows = all.filter((r) => ((r.name || "") + (r.sku || "")).toLowerCase().includes(q.toLowerCase()));
  const low = all.filter((r) => (Number(r.onhand) || 0) <= (Number(r.reorder) || 0)).length;
  const stockValue = all.reduce((s, r) => s + (Number(r.onhand) || 0) * (Number(r.cost) || 0), 0);

  const COLS: Column<Row>[] = [
    { key: "name", header: "Item", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span>{r.sku ? <span style={{ color: color.ink.soft, fontSize: 12, marginLeft: 8 }}>{r.sku}</span> : null}</span> },
    { key: "onhand", header: "On hand", width: 110, align: "right", render: (r) => { const lowItem = (Number(r.onhand) || 0) <= (Number(r.reorder) || 0); return <span style={{ fontWeight: 600, color: lowItem ? color.status.critical : color.ink.DEFAULT }}>{num(r.onhand)} {r.uom}</span>; } },
    { key: "reorder", header: "Reorder at", width: 100, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{num(r.reorder)}</span> },
    { key: "cost", header: "Cost", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{aed(r.cost)}</span> },
    { key: "price", header: "Price", width: 110, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.price)}</span> },
    { key: "status", header: "Status", width: 100, render: (r) => <StatusBadge tone={(r.status || "").toUpperCase() === "ACTIVE" ? "positive" : "neutral"} label={(r.status || "").toLowerCase() || "—"} /> },
  ];

  return (
    <AppShell active="inventory">
      <PageTitleRow title="Inventory" subtitle={`${all.length} stock items`} actions={<Button variant="primary">+ New item</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Items" value={String(all.length)} note="tracked" noteTone={color.brand.primary} />
        <KPICard label="Low stock" value={String(low)} note="at/below reorder" noteTone={low > 0 ? color.status.critical : color.status.positive} />
        <KPICard label="Stock value" value={aed(stockValue)} note="at cost" noteTone={color.ink.soft} />
        <KPICard label="Active" value={String(all.filter((r) => (r.status || "").toUpperCase() === "ACTIVE").length)} note="items" noteTone={color.status.positive} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search item or SKU…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No stock items" hint="Inventory for your workspace appears here." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Inventory · live via API · tenant-scoped</p>
    </AppShell>
  );
}
