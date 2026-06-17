"use client";

import * as React from "react";
import { color, shadow } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, type BadgeTone } from "@xentral/ui";
import { listInventory } from "@xentral/module-erp";

function stockState(avail: number): { label: string; tone: BadgeTone } {
  if (avail <= 0) return { label: "Out of stock", tone: "critical" };
  if (avail < 5) return { label: "Low stock", tone: "warning" };
  return { label: "In stock", tone: "positive" };
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: color.surface.card, border: `1px solid ${color.line.DEFAULT}`, borderRadius: 12, padding: "16px 18px", boxShadow: shadow.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: 13, color: color.ink.soft }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function InventoryRecordPage({ params }: { params: { id: string } }) {
  const items = listInventory();
  const it = items.find((x) => x.id === params.id) ?? items[0];
  if (!it) return <AppShell active="inventory"><p style={{ fontSize: 13, color: color.ink.soft }}>Item not found.</p></AppShell>;
  const available = it.onHand - it.reserved;
  const ss = stockState(available);

  return (
    <AppShell active="inventory">
      <a href="/inventory" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Inventory</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{it.name}</h1>
            <StatusBadge tone={ss.tone} label={ss.label} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>SKU {it.sku} · {it.warehouse}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Adjust</Button>
          <Button>Transfer</Button>
          <Button variant="primary">Reorder</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="On hand" value={String(it.onHand)} note="physical units" noteTone={color.ink.soft} />
        <KPICard label="Reserved" value={String(it.reserved)} note="allocated to orders" noteTone={color.ink.soft} />
        <KPICard label="Available" value={String(available)} note={ss.label} noteTone={ss.tone === "positive" ? color.status.positive : ss.tone === "warning" ? color.status.critical : color.status.negative} />
        <KPICard label="Warehouse" value={it.warehouse.split(" ")[0] ?? it.warehouse} note={it.warehouse} noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Stock levels">
            <SumRow label="On hand">{it.onHand}</SumRow>
            <SumRow label="Reserved">{it.reserved}</SumRow>
            <SumRow label="Available">{available}</SumRow>
          </Panel>
          <Panel title="Recent movement">
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>{available <= 0 ? "No stock available — reorder to fulfil open orders." : "No recent movements recorded."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="SKU">{it.sku}</SumRow>
            <SumRow label="Warehouse"><a href="/warehouses" style={{ color: color.brand.primary, textDecoration: "none" }}>{it.warehouse}</a></SumRow>
            <SumRow label="Status"><StatusBadge tone={ss.tone} label={ss.label} /></SumRow>
          </Panel>
          <Panel title="Linked product" action={<a href="/products" style={{ fontSize: 12.5, color: color.brand.primary, textDecoration: "none" }}>Open ↗</a>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>Catalog item {it.sku}.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (inventory) · locked AppShell + KPICard + StatusBadge + Button · tokens only</p>
    </AppShell>
  );
}
