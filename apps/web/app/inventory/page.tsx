"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, KPICard, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listInventory, type InventoryRow } from "@xentral/module-erp";

const ALL = listInventory();
const avail = (r: InventoryRow) => r.onHand - r.reserved;
function availBadge(r: InventoryRow): { tone: BadgeTone; label: string } {
  const a = avail(r);
  if (r.onHand === 0) return { tone: "critical", label: "out of stock" };
  if (a <= 5) return { tone: "warning", label: `low · ${a}` };
  return { tone: "positive", label: `${a} available` };
}

const COLUMNS: Column<InventoryRow>[] = [
  { key: "sku", header: "SKU", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.sku}</span> },
  { key: "name", header: "Item", render: (r) => <span style={{ color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "warehouse", header: "Warehouse", width: 160, render: (r) => <span style={{ color: color.ink.mid }}>{r.warehouse}</span> },
  { key: "onHand", header: "On hand", width: 90, align: "right", render: (r) => <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{r.onHand}</span> },
  { key: "reserved", header: "Reserved", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid, fontVariantNumeric: "tabular-nums" }}>{r.reserved}</span> },
  { key: "available", header: "Available", width: 140, render: (r) => { const b = availBadge(r); return <StatusBadge tone={b.tone} label={b.label} />; } },
];

const GROUPS: { id: string; title: string; accent: string; match: (r: InventoryRow) => boolean }[] = [
  { id: "attention", title: "Needs attention", accent: color.status.critical, match: (r) => avail(r) <= 5 },
  { id: "ok", title: "In stock", accent: color.status.positive, match: (r) => avail(r) > 5 },
];

export default function InventoryPage() {
  const [q, setQ] = React.useState("");
  const [wh, setWh] = React.useState("all");
  const warehouses = React.useMemo(() => Array.from(new Set(ALL.map((r) => r.warehouse))), []);
  const rows = ALL.filter((r) => wh === "all" || r.warehouse === wh).filter((r) => (r.sku + r.name + r.warehouse).toLowerCase().includes(q.toLowerCase()));
  const onHand = ALL.reduce((s, r) => s + r.onHand, 0);
  const reserved = ALL.reduce((s, r) => s + r.reserved, 0);
  const available = onHand - reserved;
  const outOfStock = ALL.filter((r) => r.onHand === 0).length;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="inventory">
      <PageTitleRow title="Inventory" subtitle={`${ALL.length} SKUs · ${available} available`} actions={<Button variant="primary">+ Stock adjustment</Button>} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
        <KPICard label="SKUs" value={String(ALL.length)} note="tracked" noteTone={color.brand.primary} />
        <KPICard label="On hand" value={String(onHand)} note="total units" noteTone={color.ink.soft} />
        <KPICard label="Reserved" value={String(reserved)} note="allocated" noteTone={color.status.critical} />
        <KPICard label="Available" value={String(available)} note="sellable" noteTone={color.status.positive} />
        <KPICard label="Out of stock" value={String(outOfStock)} note="zero on hand" noteTone={color.status.negative} />
        <KPICard label="Warehouses" value={String(warehouses.length)} note="locations" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <Input placeholder="Search SKU, item, warehouse…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
      </div>

      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {[["all", "All warehouses"] as [string, string], ...warehouses.map((w) => [w, w] as [string, string])].map(([id, lab]) => {
          const on = wh === id;
          return (
            <button key={id} onClick={() => setWh(id)} style={{ fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${on ? color.ink.DEFAULT : color.line.strong}`, background: on ? color.ink.DEFAULT : color.surface.card, color: on ? color.surface.card : color.ink.mid }}>
              {lab}{id !== "all" ? <span style={{ opacity: 0.6, marginLeft: 5 }}>{ALL.filter((r) => r.warehouse === id).length}</span> : null}
            </button>
          );
        })}
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No stock matches your filters" hint="Try a different SKU, item or warehouse." action={<Button variant="primary" onClick={() => { setQ(""); setWh("all"); }}>Clear filters</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 4 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} rowHref={(r) => `/inventory/${r.id}`} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Command center · available = on hand − reserved · locked DataTable · tokens-only</p>
    </AppShell>
  );
}
