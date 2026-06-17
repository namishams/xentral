"use client";

import * as React from "react";
import { color } from "@xentral/config";
import { AppShell, KPICard, Button, StatusBadge, type BadgeTone } from "@xentral/ui";
import { listSuppliers, listBills, type BillStatus } from "@xentral/module-erp";

const aed = (n: number) => `AED ${n.toLocaleString()}`;
const initials = (name: string) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const BILL_TONE: Record<BillStatus, BadgeTone> = { open: "info", approved: "warning", overdue: "critical", paid: "positive" };

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ background: "#fff", border: `1px solid ${color.line.DEFAULT}`, borderRadius: 10, padding: "16px 18px" }}>
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

export default function SupplierRecordPage({ params }: { params: { id: string } }) {
  const suppliers = listSuppliers();
  const v = suppliers.find((x) => x.id === params.id) ?? suppliers[0];
  if (!v) return <AppShell active="suppliers"><p style={{ fontSize: 13, color: color.ink.soft }}>Supplier not found.</p></AppShell>;
  const bills = listBills().filter((b) => b.supplier === v.name);
  const outstanding = bills.filter((b) => b.status !== "paid").reduce((s, b) => s + b.amount, 0);

  return (
    <AppShell active="suppliers">
      <a href="/suppliers" style={{ fontSize: 13, color: color.ink.mid, textDecoration: "none" }}>← Suppliers</a>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, margin: "8px 0 18px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: 11, background: color.surface.sunken, color: color.ink.mid, fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{initials(v.name)}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: color.ink.DEFAULT, margin: 0 }}>{v.name}</h1>
              <StatusBadge tone="info" label={v.category} />
            </div>
            <div style={{ fontSize: 13, color: color.ink.mid, marginTop: 4 }}>{v.country} · {v.openOrders} open orders</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Button>Edit</Button>
          <Button>+ Bill</Button>
          <Button variant="primary">+ Purchase order</Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <KPICard label="Open orders" value={String(v.openOrders)} note="purchasing" noteTone={color.ink.soft} />
        <KPICard label="Bills outstanding" value={aed(outstanding)} note={`${bills.length} bills`} noteTone={outstanding > 0 ? color.status.critical : color.status.positive} />
        <KPICard label="Category" value={v.category} note="vendor type" noteTone={color.ink.soft} />
        <KPICard label="Country" value={v.country} note="origin" noteTone={color.ink.soft} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 16, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Bills (accounts payable)" action={<Button>+ New bill</Button>}>
            {bills.length === 0 ? <div style={{ fontSize: 12.5, color: color.ink.soft }}>No bills recorded.</div> :
              bills.map((b) => (
                <a key={b.id} href={`/payables/${b.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${color.line.DEFAULT}`, textDecoration: "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 13.5, fontWeight: 600, color: color.ink.DEFAULT }}>{b.number}</span><StatusBadge tone={BILL_TONE[b.status]} label={b.status} /></span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: color.ink.DEFAULT }}>{aed(b.amount)} · due {b.dueDate}</span>
                </a>
              ))}
          </Panel>
          <Panel title="Purchasing">
            <div style={{ fontSize: 12.5, color: color.ink.soft }}>{v.openOrders > 0 ? `${v.openOrders} open purchase order(s) with this supplier.` : "No open purchase orders."}</div>
          </Panel>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel title="Details">
            <SumRow label="Category">{v.category}</SumRow>
            <SumRow label="Country">{v.country}</SumRow>
            <SumRow label="Open orders">{v.openOrders}</SumRow>
            <SumRow label="Outstanding">{aed(outstanding)}</SumRow>
          </Panel>
          <Panel title="Attachments" action={<Button>Upload</Button>}>
            <div style={{ fontSize: 12.5, color: color.ink.soft, padding: "4px 0" }}>No files yet — trade licence, agreements.</div>
          </Panel>
        </div>
      </div>
      <p style={{ fontSize: 11, color: color.ink.soft, textAlign: "center", marginTop: 18 }}>Record template (supplier) · locked AppShell + KPICard + StatusBadge + Button · tokens only</p>
    </AppShell>
  );
}
