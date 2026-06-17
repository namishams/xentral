"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column } from "@xentral/ui";

type ApiRow = { id: string; name: string; description: string; sku: string; category: string; unitPrice: number; vatRate: number; kind: string; active: boolean };
type Row = { id: string; name: string; sku: string; kind: string; price: number; vat: number; category: string; active: boolean };
const aed = (n: number) => `AED ${Math.round(Number(n) || 0).toLocaleString()}`;

export default function ProductsPage() {
  const [all, setAll] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    fetch("/api/books/items?all=1").then((r) => r.json()).then((d) => {
      setAll((d.rows ?? []).map((x: ApiRow) => ({ id: x.id, name: x.name, sku: x.sku, kind: x.kind, price: Number(x.unitPrice) || 0, vat: Number(x.vatRate) || 0, category: x.category, active: !!x.active })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const rows = all.filter((r) => ((r.name || "") + (r.sku || "") + (r.category || "")).toLowerCase().includes(q.toLowerCase()));
  const services = all.filter((r) => (r.kind || "").toUpperCase() === "SERVICE").length;

  const COLS: Column<Row>[] = [
    { key: "name", header: "Item", render: (r) => <span><span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.name}</span>{r.sku ? <span style={{ color: color.ink.soft, fontSize: 12, marginLeft: 8 }}>{r.sku}</span> : null}</span> },
    { key: "kind", header: "Type", width: 110, render: (r) => <StatusBadge tone={(r.kind || "").toUpperCase() === "SERVICE" ? "info" : "neutral"} label={(r.kind || "").toLowerCase() || "—"} /> },
    { key: "category", header: "Category", render: (r) => <span style={{ color: color.ink.mid }}>{r.category || "—"}</span> },
    { key: "vat", header: "VAT", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{Number(r.vat) || 0}%</span> },
    { key: "price", header: "Unit price", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.price)}</span> },
    { key: "active", header: "Status", width: 100, render: (r) => <StatusBadge tone={r.active ? "positive" : "neutral"} label={r.active ? "active" : "inactive"} /> },
  ];

  return (
    <AppShell active="products">
      <PageTitleRow title="Products" subtitle={`${all.length} catalog items`} actions={<Button variant="primary">+ New item</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Items" value={String(all.length)} note="in catalog" noteTone={color.brand.primary} />
        <KPICard label="Services" value={String(services)} note="service items" noteTone={color.status.info} />
        <KPICard label="Products" value={String(all.length - services)} note="goods" noteTone={color.ink.soft} />
        <KPICard label="Active" value={String(all.filter((r) => r.active).length)} note="sellable" noteTone={color.status.positive} />
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search item, SKU, category…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 320 }} />
      </div>
      {loading ? <div style={{ padding: 30, textAlign: "center", color: color.ink.soft, fontSize: 13 }}>Loading…</div>
        : rows.length === 0 ? <EmptyState title="No items" hint="Catalog items for your workspace appear here." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
          : <DataTable columns={COLS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/products/${r.id}`} />}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Products · live catalog · tenant-scoped</p>
    </AppShell>
  );
}
