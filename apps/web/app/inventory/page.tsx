"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, PageTitleRow, FilterBar, Input, Button, DataTable, StatusBadge, EmptyState, type Column, type BadgeTone } from "@xentral/ui";
import { listInventory, type InventoryRow } from "@xentral/module-erp";

const ALL = listInventory();
const avail = (r: InventoryRow) => r.onHand - r.reserved;
function stockTone(onHand: number): BadgeTone {
  if (onHand === 0) return "critical";
  if (onHand < 10) return "warning";
  return "positive";
}

const COLUMNS: Column<InventoryRow>[] = [
  { key: "sku", header: "SKU", width: 130, render: (r) => <span style={{ fontWeight: 600, color: color.brand.primary }}>{r.sku}</span> },
  { key: "name", header: "Item", render: (r) => <span style={{ color: color.ink.DEFAULT }}>{r.name}</span> },
  { key: "warehouse", header: "Warehouse", width: 160, render: (r) => <span style={{ color: color.ink.mid }}>{r.warehouse}</span> },
  { key: "onHand", header: "On hand", width: 110, render: (r) => <StatusBadge tone={stockTone(r.onHand)} label={String(r.onHand)} /> },
  { key: "reserved", header: "Reserved", width: 90, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.reserved}</span> },
  { key: "avail", header: "Available", width: 90, align: "right", render: (r) => <span style={{ fontWeight: 600 }}>{avail(r)}</span> },
];

const GROUPS: { id: string; title: string; accent: string; match: (r: InventoryRow) => boolean }[] = [
  { id: "out", title: "Out of stock", accent: color.status.negative, match: (r) => r.onHand === 0 },
  { id: "low", title: "Low stock", accent: color.status.critical, match: (r) => r.onHand > 0 && r.onHand < 10 },
  { id: "ok", title: "In stock", accent: color.status.positive, match: (r) => r.onHand >= 10 },
];

export default function InventoryPage() {
  const [q, setQ] = React.useState("");
  const rows = ALL.filter((r) => (r.sku + r.name + r.warehouse).toLowerCase().includes(q.toLowerCase()));
  const attention = ALL.filter((r) => r.onHand < 10).length;
  const visibleGroups = GROUPS.map((g) => ({ g, gr: rows.filter((r) => g.match(r)) })).filter((x) => x.gr.length > 0);

  return (
    <AppShell active="inventory">
      <PageTitleRow title="Inventory" subtitle={`${ALL.length} stock lines · ${attention} need attention`} actions={<Button variant="primary">+ Stock movement</Button>} />
      <FilterBar>
        <Input placeholder="Search SKU, item, warehouse…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 300 }} />
        <Button>Warehouse</Button>
      </FilterBar>

      {visibleGroups.length === 0 ? (
        <EmptyState title="No stock lines match your search" hint="Try a different SKU or warehouse." action={<Button variant="primary" onClick={() => setQ("")}>Clear search</Button>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 8 }}>
          {visibleGroups.map(({ g, gr }) => (
            <div key={g.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 3, height: 16, borderRadius: 2, background: g.accent }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: g.accent }}>{g.title}</span>
                <span style={{ fontSize: 12, color: color.ink.soft }}>{gr.length}</span>
              </div>
              <DataTable columns={COLUMNS} rows={gr} getKey={(r) => r.id} />
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Stock levels · @xentral/module-erp · locked DataTable + StatusBadge</p>
    </AppShell>
  );
}
