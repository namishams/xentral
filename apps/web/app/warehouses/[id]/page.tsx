"use client";

import * as React from "react";
import { color, shadow } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge } from "@xentral/ui";
import { listWarehouses, listInventory } from "@xentral/module-erp";

function capTone(pct: number): string { return pct >= 85 ? color.status.negative : pct >= 60 ? color.status.critical : color.status.positive; }

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

export default function WarehouseRecordPage({ params }: { params: { id: string } }) {
  const warehouses = listWarehouses();
  const w = warehouses.find((x) => x.id === params.id) ?? warehouses[0];
  if (!w) return <AppShell active="warehouses"><p style={{ fontSize: 13, color: color.ink.soft }}>Warehouse not found.</p></AppShell>;
  const stock = listInventory().filter((i) => i.warehouse === w.name);
  const tone = capTone(w.capacityPct);

  return (
    <AppShell active="warehouses">
      <a href="/warehouses" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Warehouses</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{w.name}</h1>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{w.location}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>Transfer stock</Button>
          <Button variant="primary">+ Add item</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Items stored" value={w.items.toLocaleString()} note="distinct SKUs & units" noteTone={color.ink.soft} />
        <KPICard label="Capacity" value={`${w.capacityPct}%`} note={w.capacityPct >= 85 ? "near full" : w.capacityPct >= 60 ? "filling up" : "healthy"} noteTone={tone} />
        <KPICard label="Location" value={w.location.split(",")[0] ?? w.location} note="emirate" noteTone={color.ink.soft} />
        <KPICard label="Status" value="Operational" note="open" noteTone={color.status.positive} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Capacity">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ flex: 1, height: 8, borderRadius: 4, background: color.surface.sunken, overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${w.capacityPct}%`, background: tone }} /></span>
              <span style={{ fontSize: 14, fontWeight: 700, color: color.ink.DEFAULT, width: 44, textAlign: "right" }}>{w.capacityPct}%</span>
            </div>
          </Panel>
          <Panel title="Stock at this location" action={<a href="/inventory" style={{ fontSize: 12.5, color: color.brand.primary, textDecoration: "none" }}>Open inventory ↗</a>}>
            {stock.length === 0 ? <div style={{ fontSize: 12.5, color: color.ink.soft }}>No tracked stock here.</div> :
              stock.map((i) => (
                <a key={i.id} href={`/inventory/${i.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
                  <span><span style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT, display: "block" }}>{i.name}</span><span style={{ fontSize: 12, color: color.ink.soft }}>{i.sku}</span></span>
                  <span style={{ fontSize: 13, color: color.ink.mid }}>{i.onHand} on hand · {i.reserved} reserved</span>
                </a>
              ))}
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Location">{w.location}</SumRow>
            <SumRow label="Items">{w.items.toLocaleString()}</SumRow>
            <SumRow label="Capacity"><StatusBadge tone={w.capacityPct >= 85 ? "critical" : w.capacityPct >= 60 ? "warning" : "positive"} label={`${w.capacityPct}%`} /></SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — layout, lease.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (warehouse) · locked AppShell + KPICard + StatusBadge + Button · tokens only</p>
    </AppShell>
  );
}
