"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listOrders, type OrderRow, type OrderStatus } from "@xentral/module-erp";

const ALL = listOrders();
const aed = (n: number) => `AED ${n.toLocaleString()}`;
const aedShort = (n: number) => n >= 1000 ? `AED ${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `AED ${n}`;
const TONE: Record<OrderStatus, BadgeTone> = { open: "info", processing: "warning", fulfilled: "positive", cancelled: "neutral" };

const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
function Logo({ name }: { name: string }) {
  return <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: 7, background: color.surface.sunken, color: color.ink.mid, fontSize: 11, fontWeight: 600, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">{initials(name)}</span>;
}

const COLUMNS: Column<OrderRow>[] = [
  { key: "number", header: "Order", width: 110, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.number}</span> },
  { key: "customer", header: "Customer", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><Logo name={r.customer} /><span style={{ color: color.ink.DEFAULT }}>{r.customer}</span></span> },
  { key: "items", header: "Items", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.items}</span> },
  { key: "status", header: "Status", width: 130, render: (r) => <StatusBadge tone={TONE[r.status]} label={r.status} /> },
  { key: "total", header: "Total", width: 120, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{aed(r.total)}</span> },
  { key: "date", header: "Date", width: 80, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.date}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (s: OrderStatus) => boolean }[] = [
  { id: "active", title: "Active orders", accent: color.status.info, match: (s) => s === "open" || s === "processing" },
  { id: "fulfilled", title: "Fulfilled", accent: color.status.positive, match: (s) => s === "fulfilled" },
  { id: "cancelled", title: "Cancelled", accent: color.ink.soft, match: (s) => s === "cancelled" },
];

const FILTERS: { id: string; label: string; match: (s: OrderStatus) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "active", label: "Active", match: (s) => s === "open" || s === "processing" },
  { id: "fulfilled", label: "Fulfilled", match: (s) => s === "fulfilled" },
  { id: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
];

export default function OrdersPage() {
  const [q, setQ] = React.useState("");
  const [filt, setFilt] = React.useState("all");
  const active = FILTERS.find((f) => f.id === filt) ?? FILTERS[0]!;
  const rows = ALL.filter((r) => active.match(r.status)).filter((r) => (r.number + r.customer).toLowerCase().includes(q.toLowerCase()));
  const openValue = ALL.filter((r) => r.status === "open" || r.status === "processing").reduce((s, r) => s + r.total, 0);
  const fulfilledValue = ALL.filter((r) => r.status === "fulfilled").reduce((s, r) => s + r.total, 0);
  const openCount = ALL.filter((r) => r.status === "open" || r.status === "processing").length;
  const avg = ALL.length ? Math.round(ALL.reduce((s, r) => s + r.total, 0) / ALL.length) : 0;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r.status)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="orders">
      <PageTitleRow title="Orders" subtitle={`${ALL.length} orders · ${aed(openValue)} in progress`} actions={<Button variant="primary">+ New order</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Orders" value={String(ALL.length)} note="total" noteTone={color.brand.primary} />
        <KPICard label="In progress" value={aedShort(openValue)} note={`${openCount} active`} noteTone={color.status.info} />
        <KPICard label="Fulfilled" value={aedShort(fulfilledValue)} note="delivered" noteTone={color.status.positive} />
        <KPICard label="Open" value={String(openCount)} note="to fulfil" noteTone={color.status.critical} />
        <KPICard label="Avg order" value={aedShort(avg)} note="per order" noteTone={color.ink.soft} />
        <KPICard label="Customers" value={String(new Set(ALL.map((r) => r.customer)).size)} note="ordering" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search order or customer…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 280 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map((f) => {
          const on = filt === f.id;
          return (
            <button key={f.id} onClick={() => setFilt(f.id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {f.label}{f.id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ALL.filter((r) => f.match(r.status)).length}</span> : null}
            </button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No orders match your filters" hint="Try a different order, customer or status." action={<Button variant="primary" onClick={() => { setQ(""); setFilt("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 4 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
                <span style={{ fontSize: 12, color: color.ink.soft, marginLeft: "auto" }}>{aed(gr.reduce((s, r) => s + r.total, 0))}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/orders/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · grouped by status · locked DataTable + StatusBadge · tokens-only</p>
    </AppShell>
  );
}
