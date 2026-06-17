"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, EmptyState, type Column } from "@xentral/ui";
import { listWarehouses, type WarehouseRow } from "@xentral/module-erp";

const ALL = listWarehouses();
function capColor(pct: number): string {
  return pct >= 90 ? color.status.negative : pct >= 75 ? color.status.critical : color.status.positive;
}
function CapMeter({ pct }: { pct: number }) {
  const c = capColor(pct);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, minWidth: 130 }}>
      <span style={{ position: "relative", flex: 1, height: 6, borderRadius: 3, background: color.surface.sunken, overflow: "hidden" }}>
        <span style={{ position: "absolute", inset: 0, width: `${pct}%`, background: c, borderRadius: 3 }} />
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: c, minWidth: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
    </span>
  );
}
function Box() {
  return <span style={{ display: "inline-flex", width: 28, height: 28, borderRadius: 8, background: color.brand.primaryTint, color: color.brand.primary, fontSize: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">▦</span>;
}

const COLUMNS: Column<WarehouseRow>[] = [
  { key: "name", header: "Warehouse", render: (r) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <Box />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontWeight: 600, color: color.ink.DEFAULT, lineHeight: "16px" }}>{r.name}</span>
        <span style={{ display: "block", fontSize: 11.5, color: color.ink.soft, lineHeight: "15px" }}>{r.location}</span>
      </span>
    </span>
  ) },
  { key: "items", header: "Items", width: 110, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.items.toLocaleString()}</span> },
  { key: "capacity", header: "Capacity", width: 200, render: (r) => <CapMeter pct={r.capacityPct} /> },
];

export default function WarehousesPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.name + r.location).toLowerCase().includes(q.toLowerCase()));
  const totalItems = ALL.reduce((s, r) => s + r.items, 0);
  const avgCap = ALL.length ? Math.round(ALL.reduce((s, r) => s + r.capacityPct, 0) / ALL.length) : 0;
  const nearFull = ALL.filter((r) => r.capacityPct >= 90).length;
  const healthy = ALL.filter((r) => r.capacityPct < 75).length;

  return (
    <AppShell active="warehouses">
      <PageTitleRow title="Warehouses" subtitle={`${ALL.length} locations · ${totalItems.toLocaleString()} items`} actions={<Button variant="primary">+ New warehouse</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="Warehouses" value={String(ALL.length)} note="locations" noteTone={color.brand.primary} />
        <KPICard label="Items stored" value={totalItems.toLocaleString()} note="across sites" noteTone={color.ink.soft} />
        <KPICard label="Avg capacity" value={`${avgCap}%`} note="utilisation" noteTone={avgCap >= 85 ? color.status.critical : color.status.positive} />
        <KPICard label="Near full" value={String(nearFull)} note="90%+ used" noteTone={color.status.negative} />
        <KPICard label="Healthy" value={String(healthy)} note="under 75%" noteTone={color.status.positive} />
        <KPICard label="Cities" value={String(new Set(ALL.map((r) => r.location.split(",").pop()?.trim())).size)} note="coverage" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <Input placeholder="Search warehouse or location…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No warehouses match your search" hint="Try a different name or location." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <DataTable columns={COLUMNS} rows={rows} getKey={(r) => r.id} rowHref={(r) => `/warehouses/${r.id}`} />
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · capacity meter · locked DataTable · tokens-only, theme-aware</p>
    </AppShell>
  );
}
