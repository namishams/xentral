"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, DataTable, type Column, type BadgeTone } from "@xentral/ui";
import { listOrders, type OrderStatus } from "@xentral/module-erp";

const aed = (n: number) => `AED ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "info" },
  processing: { label: "Processing", tone: "warning" },
  fulfilled: { label: "Fulfilled", tone: "positive" },
  cancelled: { label: "Cancelled", tone: "critical" },
};

type Line = { n: number; description: string; qty: number; unit: number; amount: number };

function Panel({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div><h2 style={{ fontSize: 14, fontWeight: 600, color: color.ink.DEFAULT, margin: 0 }}>{title}</h2>{sub ? <div style={{ fontSize: 12.5, color: color.ink.soft, marginTop: 2 }}>{sub}</div> : null}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
function SumRow({ label, children, strong }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${color.line.DEFAULT}` }}>
      <span style={{ fontSize: strong ? 14 : 13, fontWeight: strong ? 600 : 400, color: strong ? color.ink.DEFAULT : color.ink.soft }}>{label}</span>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 700 : 500, color: color.ink.DEFAULT }}>{children}</span>
    </div>
  );
}

export default function OrderRecordPage({ params }: { params: { id: string } }) {
  const orders = listOrders();
  const o = orders.find((x) => x.id === params.id) ?? orders[0];
  if (!o) return <AppShell active="orders"><p style={{ fontSize: 13, color: color.ink.soft }}>Order not found.</p></AppShell>;
  const st = STATUS[o.status];
  const share = Math.round((o.total / o.items) * 100) / 100;
  const lines: Line[] = Array.from({ length: o.items }, (_, k) => ({ n: k + 1, description: `Line item ${k + 1}`, qty: 1, unit: share, amount: share }));

  const COLUMNS: Column<Line>[] = [
    { key: "n", header: "#", width: 40, render: (r) => <span style={{ color: color.ink.soft }}>{r.n}</span> },
    { key: "description", header: "Description", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{r.description}</span> },
    { key: "qty", header: "Qty", width: 70, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{r.qty}</span> },
    { key: "unit", header: "Unit", width: 140, align: "right", render: (r) => <span style={{ color: color.ink.mid }}>{aed(r.unit)}</span> },
    { key: "amount", header: "Amount", width: 150, align: "right", render: (r) => <span style={{ fontWeight: 600, color: color.ink.DEFAULT }}>{aed(r.amount)}</span> },
  ];

  return (
    <AppShell active="orders">
      <a href="/orders" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Orders</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0, letterSpacing: "0.02em" }}>{o.number}</h1>
            <StatusBadge tone={st.tone} label={st.label} />
          </div>
          <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{o.customer} · ordered {o.date} · {o.items} items</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>PDF</Button>
          <Button>Edit</Button>
          <Button>Duplicate</Button>
          <Button>Create invoice</Button>
          <Button variant="primary">Mark fulfilled</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Order total" value={aed(o.total)} note={o.currency} noteTone={color.ink.soft} />
        <KPICard label="Items" value={String(o.items)} note="lines" noteTone={color.ink.soft} />
        <KPICard label="Status" value={st.label} note="fulfilment" noteTone={color.ink.soft} />
        <KPICard label="Order date" value={o.date} note="2026" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Line items"><DataTable columns={COLUMNS} rows={lines} getKey={(r) => String(r.n)} /></Panel>
          <Panel title="Fulfilment" sub="Picking, packing and delivery status">
            <div style={{ marginBottom: 8 }}><StatusBadge tone={st.tone} label={st.label} /></div>
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>{o.status === "fulfilled" ? "All items delivered." : o.status === "cancelled" ? "Order cancelled." : "Awaiting fulfilment — convert to a delivery note when picked."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Summary">
            <SumRow label="Customer"><a href="/companies" style={{ color: color.brand.primary, textDecoration: "none" }}>{o.customer}</a></SumRow>
            <SumRow label="Items">{o.items}</SumRow>
            <SumRow label="Total" strong>{aed(o.total)}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — LPO, delivery notes.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (order) · locked AppShell + KPICard + DataTable + Button · tokens only</p>
    </AppShell>
  );
}
