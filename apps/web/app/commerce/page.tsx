"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Button, StatusBadge, DataTable, EmptyState, type Column } from "@xentral/ui";

type Order = { id: string; number: string; customer: string; total: number; currency: string; status: string; fulfilment: string; date: string };
type Data = { currency: string; kpis: { count: number; gmv: number; avgOrder: number; unfulfilled: number }; byStatus: { status: string; count: number }[]; rows: Order[] };
const sTone = (s: string): "neutral" | "info" | "positive" | "warning" | "critical" =>
  ["PAID", "COMPLETED", "FULFILLED", "DELIVERED"].includes(s) ? "positive" : ["PENDING", "PROCESSING", "OPEN"].includes(s) ? "info" : ["CANCELLED", "REFUNDED", "FAILED"].includes(s) ? "critical" : "neutral";

export default function CommercePage() {
  const [d, setD] = React.useState<Data | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/erp/commerce").then((r) => r.json()).then((j) => { setD(j.error ? { currency: "AED", kpis: { count: 0, gmv: 0, avgOrder: 0, unfulfilled: 0 }, byStatus: [], rows: [] } : j); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const cur = d?.currency || "AED";
  const aed = (n: number) => `${cur} ${Math.round(Number(n) || 0).toLocaleString()}`;
  const aedShort = (n: number) => { n = Number(n) || 0; return n >= 1000 ? `${cur} ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${cur} ${Math.round(n)}`; };

  const COLS: Column<Order>[] = [
    { key: "number", header: "Order", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.number}</span> },
    { key: "customer", header: "Customer", render: (r) => <span style={{ color: color.ink.mid }}>{r.customer}</span> },
    { key: "status", header: "Status", width: 120, render: (r) => <StatusBadge tone={sTone(r.status)} label={(r.status || "—").toLowerCase()} /> },
    { key: "fulfilment", header: "Fulfilment", width: 130, render: (r) => r.fulfilment ? <StatusBadge tone={sTone(r.fulfilment)} label={r.fulfilment.toLowerCase()} /> : <span style={{ color: color.ink.soft }}>—</span> },
    { key: "date", header: "Placed", width: 130, render: (r) => <span style={{ color: color.ink.mid }}>{r.date}</span> },
    { key: "total", header: "Total", width: 130, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{aed(r.total)}</span> },
  ];

  return (
    <AppShell active="commerce">
      <PageTitleRow title="Commerce" subtitle="Online orders across your sales channels"
        actions={<a href="/settings/integrations" style={{ textDecoration: "none" }}><Button>Channels</Button></a>} />
      {loading ? <div style={{ padding: 40, textAlign: "center", color: color.ink.soft }}>Loading…</div>
        : !d || d.rows.length === 0 ? <EmptyState title="No commerce orders yet" hint="Connect WooCommerce or Shopify under Integrations — online orders sync here with status, fulfilment and revenue." action={<a href="/settings/integrations" style={{ textDecoration: "none" }}><Button variant="primary">Connect a channel</Button></a>} />
          : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                <KPICard label="Orders" value={String(d.kpis.count)} note="all channels" noteTone={color.brand.primary} />
                <KPICard label="GMV" value={aedShort(d.kpis.gmv)} note="gross merch. value" noteTone={color.status.info} />
                <KPICard label="Avg order" value={aedShort(d.kpis.avgOrder)} note="per order" noteTone={color.ink.soft} />
                <KPICard label="Unfulfilled" value={String(d.kpis.unfulfilled)} note="need shipping" noteTone={d.kpis.unfulfilled > 0 ? color.status.critical : color.status.positive} />
              </div>
              <DataTable columns={COLS} rows={d.rows} getKey={(r) => r.id} searchable searchPlaceholder="Search orders…" title="Recent orders" />
            </>
          )}
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Commerce · live from connected channels · tenant-scoped</p>
    </AppShell>
  );
}
