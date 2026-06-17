"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";

type Row = { id: string; number: string; status: string; customer: string; total: number; currency: string; fulfilment: string; placed: string | null };
const aed = (n: number) => `AED ${Math.round(Number(n) || 0).toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${Math.round(n)}`;
const TONE: Record<string, BadgeTone> = { new: "info", paid: "positive", fulfilled: "positive", cancelled: "neutral", refunded: "critical", pending: "warning" };

export default function OrdersPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  React.useEffect(() => { fetch("/api/erp/orders").then((r) => r.json()).then((d) => { setAll(d.rows ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const rows = all.filter((r) => ((r.number || "") + (r.customer || "")).toLowerCase().includes(q.toLowerCase()));
  const revenue = all.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const unfulfilled = all.filter((r) => (r.fulfilment || "").toLowerCase() !== "fulfilled").length;

  const COLS: Column<Row>[] = [
    { key: "number", header: "Order", width: 140, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number || r.id.slice(0, 8)}</span> },
    { key: "customer", header: "Customer", render: (r) => <span style={{ color: color.ink.DEFAULT }}>{r.customer || "—"}</span> },
    { key: "status", header: "Status", width: 110, render: (r) => <StatusBadge tone={TONE[(r.status || "").toLowerCase()] ?? "neutral"} label={(r.status || "").toLowerCase() || "—"} /> },
    { key: "fulfilment", header: "Fulfilment", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.fulfilment || "—"}</span> },
    { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
    { key: "placed", header: "Placed", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.placed || "—"}</span> },
  ];

  return (
    <AppShell active="orders">
      <PageTitleRow title="Orders" subtitle={`${all.length} orders · ${aed(revenue)}`} actions={<Button variant="primary">+ New order</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Orders" value={String(all.length)} note="total" noteTone={color.brand.primary} />
        <KPICard label="Revenue" value={aedShort(revenue)} note="all orders" noteTone={color.status.positive} />
        <KPICard label="Unfulfilled" value={String(unfulfilled)} note="to ship" noteTone={unfulfilled > 0 ? "#9a5800" : color.status.positive} />
        <KPICard label="Avg order" value={aedShort(all.length ? revenue / all.length : 0)} note="value" noteTone={color.ink.soft} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search order or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No orders" hint="Orders from your sales channels appear here." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Orders · live via API · tenant-scoped</p>
    </AppShell>
  );
}
